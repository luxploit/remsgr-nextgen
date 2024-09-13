// http://www.msn.com/webservices/AddressBook/ABFindAll

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
    let token

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

    if (req.body["soap:Envelope"]["soap:Body"]["ABFindAll"]["deltasOnly"] && req.body["soap:Envelope"]["soap:Body"]["ABFindAll"]["deltasOnly"] === true) {
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

    const contacts = await Contact.find({ userID: user._id, list: "FL" }).exec();

    const jsonGroups = {
        "Group": []
    };

    const jsonContacts = {
        "Contact": []
    };

    for (const group of user.groups) {
        jsonGroups["Group"].push({
            "groupId": group.id,
            "groupInfo": {
                "annotations": {
                    "Annotation": {
                        "Name": "MSN.IM.Display",
                        "Value": "1"
                    }
                },
                "groupType": "c8529ce2-6ead-434d-881f-341e17db3ff8",
                "name": decodeURI(group.name),
                "IsNotMobileVisible": "false",
                "IsPrivate": "false",
                "IsFavorite": "true"
            },
            "propertiesChanged": "",
            "fDeleted": "false",
            "lastChange": moment().utc().format('YYYY-MM-DDTHH:mm:ss[Z]')
        });
    }

    for (const contact of contacts) {
        const contactUser = await User.findById(contact.contactID).exec();
        const contactGroups = contact.groups || [];
    
        const contactObject = {
            "contactId": contactUser.uuid,
            "contactInfo": {
                "contactType": "Regular",
                "quickName": decodeURI(contactUser.friendly_name),
                "passportName": contactUser.username + "@remsgr.net",
                "IsPassportNameHidden": "false",
                "displayName": decodeURI(contactUser.friendly_name),
                "puid": "0",
                ...(contactGroups.length > 0 ? {
                    "groupIds": contactGroups.map(group => ({ "guid": group }))
                } : {}),
                "CID": formatDecimalCID(contactUser._id.toString()),
                "IsNotMobileVisible": "false",
                "isMobileIMEnabled": "false",
                "isMessengerUser": "true",
                "isFavorite": "false",
                "isSmtp": "false",
                "hasSpace": "false",
                "spotWatchState": "NoDevice",
                "birthdate": "0001-01-01T00:00:00",
                "primaryEmailType": "ContactEmailPersonal",
                "PrimaryLocation": "ContactLocationPersonal",
                "PrimaryPhone": "ContactPhonePersonal",
                "IsPrivate": "false",
                "Gender": "Unspecified",
                "TimeZone": "None",
            },
            "propertiesChanged": "",
            "fDeleted": "false",
            "lastChange": moment().utc().format('YYYY-MM-DDTHH:mm:ss[Z]')
        };
    
        jsonContacts["Contact"].push(contactObject);
    }    

    jsonContacts["Contact"].push({
        "contactId": user.uuid,
        "contactInfo": {
            "annotations": {
                "Annotation": [
                    {
                        "Name": "MSN.IM.MBEA",
                        "Value": "0"
                    },
                    {
                        "Name": "MSN.IM.GTC",
                        "Value": "0"
                    },
                    {
                        "Name": "MSN.IM.BLP",
                        "Value": "0"
                    }
                ]
            },
            "contactType": "Me",
            "quickName": decodeURI(user.friendly_name),
            "passportName": user.username + "@remsgr.net",
            "IsPassportNameHidden": "false",
            "displayName": decodeURI(user.friendly_name),
            "puid": "0",
            "CID": formatDecimalCID(user._id.toString()),
            "IsNotMobileVisible": "false",
            "isMobileIMEnabled": "false",
            "isMessengerUser": "false",
            "isFavorite": "false",
            "isSmtp": "false",
            "hasSpace": "false",
            "spotWatchState": "NoDevice",
            "birthdate": "0001-01-01T00:00:00",
            "primaryEmailType": "ContactEmailPersonal",
            "PrimaryLocation": "ContactLocationPersonal",
            "PrimaryPhone": "ContactPhonePersonal",
            "IsPrivate": "false",
            "Gender": "Unspecified",
            "TimeZone": "None"
        },
        "propertiesChanged": "",
        "fDeleted": "false",
        "lastChange": moment().utc().format('YYYY-MM-DDTHH:mm:ss[Z]')
    });

    const xmlContacts = json2xml(jsonContacts, { compact: true, ignoreComment: true, spaces: 4 });
    const xmlGroups = json2xml(jsonGroups, { compact: true, ignoreComment: true, spaces: 4 });

    const template = fs.readFileSync('./services/soap/abservice/templates/ABFindAllResponse.xml', 'utf8');

    const compiledTemplate = Handlebars.compile(template);

    const formattedTemplate = compiledTemplate({
        sessionid: v4(),
        domain: config.server.host,
        key: tokenUrlSafe(172),
        now: moment().utc().format('YYYY-MM-DDTHH:mm:ss[Z]'),
        created: moment(user.created_at).utc().format('YYYY-MM-DDTHH:mm:ss[Z]'),
        cid: formatDecimalCID(user._id.toString()),
        email: user.username + "@remsgr.net",
        contacts: xmlContacts,
        groups: xmlGroups
    });

    const formattedXML = xmlFormat.minify(formattedTemplate, { collapseContent: true });

    res.set('Content-Type', 'text/xml; charset=utf-8');
    res.send(formattedXML);
}