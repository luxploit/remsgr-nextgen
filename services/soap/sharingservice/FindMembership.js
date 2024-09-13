const chalk = require('chalk');
const fs = require('fs');
const Handlebars = require('handlebars');
const moment = require('moment');
const xmlFormat = require('xml-formatter');
const crypto = require('crypto');
const config = require("../../../config");
const { verifyJWT } = require("../../../utils/auth.util");
const { v4: uuidv4, v4 } = require('uuid');
const { formatDecimalCID } = require('../../../utils/auth.util');
const { json2xml } = require('xml-js');
const User = require('../../../models/User');
const Contact = require('../../../models/Contact');

function tokenUrlSafe(size) {
    return crypto.randomBytes(size).toString('base64')
        .replace(/\+/g, '-')  // Replace '+' with '-'
        .replace(/\//g, '_')  // Replace '/' with '_'
        .replace(/=+$/, '');  // Remove any trailing '='
}

module.exports = async (req, res) => {
    let token;

    if (req.body["soap:Envelope"]["soap:Header"]["ABAuthHeader"]["TicketToken"]) {
        token = req.body["soap:Envelope"]["soap:Header"]["ABAuthHeader"]["TicketToken"];
    } else if (req.cookies.MSPAuth) {
        token = req.cookies.MSPAuth;
    } else {
        console.log(`${chalk.red.bold('[ABFindAll]')} No token provided.`);
        res.send(`OUT\r\n`).status(401);
        return;
    }

    const decoded = await verifyJWT(token);

    if (!decoded) {
        console.log(`${chalk.red.bold('[ABFindAll]')} ${req.ip} has an invalid token.`);
        res.send(`OUT\r\n`).status(401);
        return;
    }

    const user = await User.findById(decoded.id).exec();

    if (!user) {
        console.log(`${chalk.red.bold('[ABFindAll]')} User not found.`);
        res.send(`OUT\r\n`);
        return;
    }

    if (req.body["soap:Envelope"]["soap:Body"]["FindMembership"]["deltasOnly"] && req.body["soap:Envelope"]["soap:Body"]["FindMembership"]["deltasOnly"] === true) {
        const template = fs.readFileSync('./services/soap/templates/Delta.Disabled.xml', 'utf8');
        const compiledTemplate = Handlebars.compile(template);
        const formattedTemplate = compiledTemplate({
            soap_action: req.get('SOAPAction')
        });
        const formattedXML = xmlFormat.minify(formattedTemplate, { collapseContent: true });

        res.set('Content-Type', 'text/xml; charset=utf-8');
        res.send(formattedXML);
        return;
    }

    const allowContacts = await Contact.find({ userID: user._id, list: "AL" }).exec();
    const blockContacts = await Contact.find({ userID: user._id, list: "BL" }).exec();
    const reverseContacts = await Contact.find({ contactID: user._id, list: "FL" }).exec();

    const allowMembers = { "Member": [] };
    const blockMembers = { "Member": [] };
    const reverseMembers = { "Member": [] };

    for (const member of allowContacts) {
        const contact = await User.findById(member.contactID).exec();
        allowMembers["Member"].push({
            "_attributes": { "xsi:type": "PassportMember" },
            "MembershipId": "AL-" + contact.uuid,
            "Type": "Passport",
            "State": "Accepted",
            "Deleted": "false",
            "LastChanged": moment().utc().format('YYYY-MM-DDTHH:mm:ss[Z]'),
            "JoinedDate": moment(contact.created_at).utc().format('YYYY-MM-DDTHH:mm:ss[Z]'),
            "ExpirationDate": "0001-01-01T00:00:00",
            "Changes": "",
            "PassportName": contact.username + "@remsgr.net",
            "IsPassportNameHidden": "false",
            "PassportId": "0",
            "CID": formatDecimalCID(contact._id.toString()),
            "PassportChanges": "",
            "LookedupByCID": "false"
        });
    }

    for (const member of blockContacts) {
        const contact = await User.findById(member.contactID).exec();
        blockMembers["Member"].push({
            "_attributes": { "xsi:type": "PassportMember" },
            "MembershipId": "BL-" + contact.uuid,
            "Type": "Passport",
            "State": "Accepted",
            "Deleted": "false",
            "LastChanged": moment().utc().format('YYYY-MM-DDTHH:mm:ss[Z]'),
            "JoinedDate": moment(contact.created_at).utc().format('YYYY-MM-DDTHH:mm:ss[Z]'),
            "ExpirationDate": "0001-01-01T00:00:00",
            "Changes": "",
            "PassportName": contact.username + "@remsgr.net",
            "IsPassportNameHidden": "false",
            "PassportId": "0",
            "CID": formatDecimalCID(contact._id.toString()),
            "PassportChanges": "",
            "LookedupByCID": "false"
        });
    }

    for (const member of reverseContacts) {
        const contact = await User.findById(member.userID).exec();
        reverseMembers["Member"].push({
            "_attributes": { "xsi:type": "PassportMember" },
            "MembershipId": "RL-" + contact.uuid,
            "Type": "Passport",
            "State": "Accepted",
            "Deleted": "false",
            "LastChanged": moment().utc().format('YYYY-MM-DDTHH:mm:ss[Z]'),
            "JoinedDate": moment(contact.created_at).utc().format('YYYY-MM-DDTHH:mm:ss[Z]'),
            "ExpirationDate": "0001-01-01T00:00:00",
            "Changes": "",
            "PassportName": contact.username + "@remsgr.net",
            "IsPassportNameHidden": "false",
            "PassportId": "0",
            "CID": formatDecimalCID(contact._id.toString()),
            "PassportChanges": "",
            "LookedupByCID": "false"
        });
    }

    const memberships = {
        "Services": {
            "Service": {
                "Memberships": {
                    "Membership": []
                }
            }
        }
    };
    
    if (allowMembers.Member.length > 0) {
        memberships.Services.Service.Memberships.Membership.push({
            "MemberRole": "Allow",
            "Members": allowMembers,
            "MembershipIsComplete": true
        });
    }
    
    if (blockMembers.Member.length > 0) {
        memberships.Services.Service.Memberships.Membership.push({
            "MemberRole": "Block",
            "Members": blockMembers,
            "MembershipIsComplete": true
        });
    }
    
    if (reverseMembers.Member.length > 0) {
        memberships.Services.Service.Memberships.Membership.push({
            "MemberRole": "Reverse",
            "Members": reverseMembers,
            "MembershipIsComplete": true
        });
    }    

    const xmlMemberships = json2xml(memberships, { compact: true, ignoreComment: true, spaces: 4 });

    const template = fs.readFileSync('./services/soap/sharingservice/templates/FindMembershipResponse.xml', 'utf8');
    const compiledTemplate = Handlebars.compile(template);

    const formattedTemplate = compiledTemplate({
        sessionid: v4(),
        domain: config.server.host,
        key: tokenUrlSafe(172),
        now: moment().utc().format('YYYY-MM-DDTHH:mm:ss[Z]'),
        cid: formatDecimalCID(user._id.toString()),
        email: user.username + "@remsgr.net",
        memberships: xmlMemberships
    });

    const formattedXML = xmlFormat.minify(formattedTemplate, { collapseContent: true });

    res.set('Content-Type', 'text/xml; charset=utf-8');
    res.send(formattedXML);
};
