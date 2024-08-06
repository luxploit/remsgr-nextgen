const chalk = require('chalk');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../../config.json');
const { v4: uuidv4 } = require('uuid');
const { XMLParser } = require('fast-xml-parser');
const Handlebars = require('handlebars');
const moment = require('moment');
const parser = new XMLParser();
const crypto = require('crypto');

const User = require('../../models/User');
const { isPromise } = require('util/types');

exports.parseBodyMiddleware = (req, res, next) => {
    let body = "";
    req.on("data", (chunk) => {
        body += chunk.toString();
    });
    req.on("end", () => {
        req.body = parser.parse(body);
        next();
    });
}

exports.rst = async (req, res) => {
    let email, password;

    try {
        email = req.body["Envelope"]["Header"]["wsse:Security"]["wsse:UsernameToken"]["wsse:Username"];
        password = req.body["Envelope"]["Header"]["wsse:Security"]["wsse:UsernameToken"]["wsse:Password"];
    } catch (error) {
        console.log(`${chalk.yellow.bold('[RST.srf]')} No email or password provided.`);
        const invalid = fs.readFileSync('./services/authentication/templates/rst/InvalidRequest.xml', 'utf8');
        res.send(invalid);
        return;
    }

    const username = email.split('@')[0];
    const user = await User.findOne({ username: username });

    if (!user) {
        console.log(`${chalk.yellow.bold('[RST.srf]')} ${email} does not exist in the database.`);
        const template = fs.readFileSync('./services/authentication/templates/rst/FailedAuth.xml', 'utf8');
        const compiledTemplate = Handlebars.compile(template);
        const formattedTemplate = compiledTemplate({ DATE_Z: moment().utc().format('YYYY-MM-DDTHH:mm:ss[Z]') });
        res.send(formattedTemplate);
        return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
        console.log(`${chalk.yellow.bold('[RST.srf]')} ${email} provided an incorrect password.`);
        const template = fs.readFileSync('./services/authentication/templates/rst/FailedAuth.xml', 'utf8');
        const compiledTemplate = Handlebars.compile(template);
        const formattedTemplate = compiledTemplate({ DATE_Z: moment().utc().format('YYYY-MM-DDTHH:mm:ss[Z]') });
        res.send(formattedTemplate);
        return;
    }

    const token = jwt.sign({ id: user._id, uuid: user.uuid }, process.env.JWT_SECRET, { expiresIn: '1d' });

    const tokenTemplate = fs.readFileSync('./services/authentication/templates/rst/Token.xml', 'utf8');
    const finalTemplate = fs.readFileSync('./services/authentication/templates/rst/ValidAuth.xml', 'utf8');

    let requestedTokens = [];

    try {
        requestedTokens = req.body["Envelope"]["Body"]["ps:RequestMultipleSecurityTokens"]["wst:RequestSecurityToken"];
    } catch (error) {
        console.log(`${chalk.yellow.bold('[RST.srf]')} No tokens provided.`);
        const invalid = fs.readFileSync('./services/authentication/templates/rst/InvalidRequest.xml', 'utf8');
        res.send(invalid);
        return;
    }

    let tokenResponses = [];

    let index = 0;

    requestedTokens.forEach((tokenRequest) => {
        let address;
        try {
            address = tokenRequest["wsp:AppliesTo"]["wsa:EndpointReference"]["wsa:Address"];
        } catch (error) {
            console.log(`${chalk.yellow.bold('[RST.srf]')} No address provided.`);
            const invalid = fs.readFileSync('./services/authentication/templates/rst/InvalidRequest.xml', 'utf8');
            res.send(invalid);
            return;
        }

        if (address !== 'http://Passport.NET/tb') {
            index += 1;
            const compiledTemplate = Handlebars.compile(tokenTemplate);

            Handlebars.registerHelper('ifeq', function (a, b, options) {
                if (a == b) { return options.fn(this); }
                return options.inverse(this);
            });

            const formattedTemplate = compiledTemplate({
                domain: address,
                token: token,
                i: index,
                dateTodayZ: moment().utc().format('YYYY-MM-DDTHH:mm:ss[Z]'),
                dateTomorrowZ: moment().add(1, 'days').utc().format('YYYY-MM-DDTHH:mm:ss[Z]'),
                binarysecret: crypto.randomBytes(24).toString('base64')
            });

            tokenResponses.push(formattedTemplate);
        }
    });

    const allTokens = tokenResponses.join('\n');

    const compiledTemplate = Handlebars.compile(finalTemplate);

    const data = {
        DATE_Z: moment().utc().format('YYYY-MM-DDTHH:mm:ss[Z]'),
        TOMORROW_Z: moment().add(1, 'days').utc().format('YYYY-MM-DDTHH:mm:ss[Z]'),
        cid: user._id,
        email: email,
        ip: req.ip.replace('::ffff:', ''),
        tokens: allTokens
    }

    const formattedTemplate = compiledTemplate(data);

    res.send(formattedTemplate);
}
