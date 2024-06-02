const express = require('express');
const { XMLParser } = require('fast-xml-parser');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const https = require('https');
const http = require('http');

const net = require('net');
const netPORT = 1863;

const chalk = require('chalk');
const dotenv = require('dotenv');
dotenv.config();

require('./db/connect');

// Express
const app = express();
const parser = new XMLParser();

app.set("etag", false);

app.use(cookieParser());

app.use(express.text({ type: 'application/xml' }));

app.use((req, res, next) => {
	let body = "";
	req.on("data", (chunk) => {
		body += chunk.toString();
	});
	req.on("end", () => {
		req.body = parser.parse(body);
		next();
	});
});

app.post("/RST2.srf", async (req, res) => {
    const username = req.body["s:Envelope"]["s:Header"]["wsse:Security"]["wsse:UsernameToken"]["wsse:Username"];
    const password = req.body["s:Envelope"]["s:Header"]["wsse:Security"]["wsse:UsernameToken"]["wsse:Password"];
    const getSortaISODate = () => { return new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') };

    console.log(`${chalk.cyan.bold('[RST2.SRF]')} "${username}" is trying to log in using password "${password}".`);

    if (username.endsWith("@hotmail.com") || password !== "password") {
		return res.status(200).send(`<?xml version="1.0" encoding="utf-8" ?>
<S:Envelope xmlns:S="http://www.w3.org/2003/05/soap-envelope" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" xmlns:wst="http://schemas.xmlsoap.org/ws/2005/02/trust" xmlns:psf="http://schemas.microsoft.com/Passport/SoapServices/SOAPFault">
	<S:Header>
		<psf:pp xmlns:psf="http://schemas.microsoft.com/Passport/SoapServices/SOAPFault">
			<psf:serverVersion>1</psf:serverVersion>
			<psf:authstate>0x80048800</psf:authstate>
			<psf:reqstatus>0x80048821</psf:reqstatus>
			<psf:serverInfo Path="Live1" RollingUpgradeState="ExclusiveNew" LocVersion="0" ServerTime="${getSortaISODate()}" BuildVersion="16.0.28426.6">XYZPPLOGN1A23 2017.09.28.12.44.07</psf:serverInfo>
			<psf:cookies/>
			<psf:response/>
		</psf:pp>
	</S:Header>
	<S:Body>
		<S:Fault>
			<S:Code>
				<S:Value>S:Sender</S:Value>
				<S:Subcode>
					<S:Value>wst:FailedAuthentication</S:Value>
				</S:Subcode>
			</S:Code>
			<S:Reason>
				<S:Text xml:lang="en-US">Authentication Failure</S:Text>
			</S:Reason>
			<S:Detail>
				<psf:error>
					<psf:value>0x80048821</psf:value>
					<psf:internalerror>
						<psf:code>0x80041012</psf:code>
						<psf:text>The entered and stored passwords do not match.&#x000D;&#x000A;</psf:text>
					</psf:internalerror>
				</psf:error>
			</S:Detail>
		</S:Fault>
	</S:Body>
</S:Envelope>`);
	} else {
		return res.status(200).send(`
<?xml version="1.0" encoding="utf-8" ?>
<S:Envelope xmlns:S="http://www.w3.org/2003/05/soap-envelope" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" xmlns:wsa="http://www.w3.org/2005/08/addressing">
	<S:Header>
		<wsa:Action xmlns:S="http://www.w3.org/2003/05/soap-envelope" xmlns:wsa="http://www.w3.org/2005/08/addressing" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" wsu:Id="Action" S:mustUnderstand="1">http://schemas.xmlsoap.org/ws/2005/02/trust/RSTR/Issue</wsa:Action>
		<wsa:To xmlns:S="http://www.w3.org/2003/05/soap-envelope" xmlns:wsa="http://www.w3.org/2005/08/addressing" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" wsu:Id="To" S:mustUnderstand="1">http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</wsa:To>
		<wsse:Security S:mustUnderstand="1">
			<wsu:Timestamp xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" wsu:Id="TS">
				<wsu:Created>2024-01-28T04:05:39Z</wsu:Created>
				<wsu:Expires>2024-01-28T04:10:39Z</wsu:Expires>
			</wsu:Timestamp>
		</wsse:Security>
		<psf:pp xmlns:psf="http://schemas.microsoft.com/Passport/SoapServices/SOAPFault">
			<psf:serverVersion>1</psf:serverVersion>
			<psf:PUID>AA1888D5EFAC2421</psf:PUID>
			<psf:configVersion>16.000.26889.00</psf:configVersion>
			<psf:uiVersion>3.100.2179.0</psf:uiVersion>
			<psf:mobileConfigVersion>16.000.26208.0</psf:mobileConfigVersion>
			<psf:appDataVersion>1</psf:appDataVersion>
			<psf:authstate>0x48803</psf:authstate>
			<psf:reqstatus>0x0</psf:reqstatus>
			<psf:serverInfo Path="Live1" RollingUpgradeState="ExclusiveNew" LocVersion="0" ServerTime="2024-01-28T04:05:39Z">XYZPPLOGN1A23 2017.09.28.12.44.07</psf:serverInfo>
			<psf:cookies/>
			<psf:browserCookies>
				<psf:browserCookie Name="MH" URL="http://www.msn.com">MSFT; path=/; domain=.msn.com; expires=Wed, 30-Dec-2037 16:00:00 GMT</psf:browserCookie>
				<psf:browserCookie Name="MHW" URL="http://www.msn.com">; path=/; domain=.msn.com; expires=Thu, 30-Oct-1980 16:00:00 GMT</psf:browserCookie>
				<psf:browserCookie Name="MH" URL="http://www.live.com">MSFT; path=/; domain=.live.com; expires=Wed, 30-Dec-2037 16:00:00 GMT</psf:browserCookie>
				<psf:browserCookie Name="MHW" URL="http://www.live.com">; path=/; domain=.live.com; expires=Thu, 30-Oct-1980 16:00:00 GMT</psf:browserCookie>
			</psf:browserCookies>
			<psf:credProperties>
				<psf:credProperty Name="MainBrandID">MSFT</psf:credProperty>
				<psf:credProperty Name="BrandIDList"></psf:credProperty>
				<psf:credProperty Name="IsWinLiveUser">true</psf:credProperty>
				<psf:credProperty Name="CID">0</psf:credProperty>
				<psf:credProperty Name="AuthMembername">test2@email.com</psf:credProperty>
				<psf:credProperty Name="Country">US</psf:credProperty>
				<psf:credProperty Name="Language">1033</psf:credProperty>
				<psf:credProperty Name="FirstName">John</psf:credProperty>
				<psf:credProperty Name="LastName">Doe</psf:credProperty>
				<psf:credProperty Name="ChildFlags">00000001</psf:credProperty>
				<psf:credProperty Name="Flags">40100643</psf:credProperty>
				<psf:credProperty Name="FlagsV2">00000000</psf:credProperty>
				<psf:credProperty Name="IP">127.0.0.1</psf:credProperty>
				<psf:credProperty Name="AssociatedForStrongAuth">0</psf:credProperty>
			</psf:credProperties>
			<psf:extProperties>
				<psf:extProperty Name="ANON" Expiry="Wed, 30-Dec-2037 16:00:00 GMT" Domains="bing.com;atdmt.com" IgnoreRememberMe="false">A=B97FB2EE7DB4CE0D0D5B8107FFFFFFFF&amp;E=1542&amp;W=1</psf:extProperty>
				<psf:extProperty Name="NAP" Expiry="Wed, 30-Dec-2037 16:00:00 GMT" Domains="bing.com;atdmt.com" IgnoreRememberMe="false">V=1.9&amp;E=14e8&amp;C=uT838e-8kV7Jbm-HqQel-ETkvE7QSUGh6ywMjZQ9JJyYtNKxtdfCBw&amp;W=1</psf:extProperty>
				<psf:extProperty Name="LastUsedCredType">1</psf:extProperty>
				<psf:extProperty Name="WebCredType">1</psf:extProperty>
				<psf:extProperty Name="CID">b2648d8befac2421</psf:extProperty>
			</psf:extProperties>
			<psf:response/>
		</psf:pp>
	</S:Header>
	<S:Body>
		<wst:RequestSecurityTokenResponseCollection xmlns:S="http://www.w3.org/2003/05/soap-envelope" xmlns:wst="http://schemas.xmlsoap.org/ws/2005/02/trust" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" xmlns:saml="urn:oasis:names:tc:SAML:1.0:assertion" xmlns:wsp="http://schemas.xmlsoap.org/ws/2004/09/policy" xmlns:psf="http://schemas.microsoft.com/Passport/SoapServices/SOAPFault">
			<wst:RequestSecurityTokenResponse>
				<wst:TokenType>urn:passport:legacy</wst:TokenType>
				<wsp:AppliesTo xmlns:wsa="http://www.w3.org/2005/08/addressing">
					<wsa:EndpointReference>
						<wsa:Address>http://Passport.NET/tb</wsa:Address>
					</wsa:EndpointReference>
				</wsp:AppliesTo>
				<wst:Lifetime>
					<wsu:Created>2024-01-28T04:05:39Z</wsu:Created>
					<wsu:Expires>2024-01-29T04:05:39Z</wsu:Expires>
				</wst:Lifetime>
				<wst:RequestedSecurityToken>
					<EncryptedData xmlns="http://www.w3.org/2001/04/xmlenc#" Id="BinaryDAToken0" Type="http://www.w3.org/2001/04/xmlenc#Element">
						<EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#tripledes-cbc"></EncryptionMethod>
						<ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
							<ds:KeyName>http://Passport.NET/STS</ds:KeyName>
						</ds:KeyInfo>
						<CipherData>
							<CipherValue>Cap26AQZrSyMm2SwwTyJKyqLR9/S+vQWQsaBc5Mv7PwtQDMzup/udOOMMvSu99R284pmiD3IepBXrEMLK5rLrXAf2A6vrP6vYuGA45GCqQdoxusHZcjt9P2B8WyCTVT2cM8jtGqGIfRlU/4WzOLxNrDJwDfOsmilduGAGZfvRPW7/jyXXrnGK7/PWkymX4YDD+ygJfMrPAfvAprvw/HVE6tutKVc9cViTVYy8oHjosQlb8MKn3vKDW1O2ZWQUc47JPl7DkjQaanfNBGe6CL7K1nr6Z/jy7Ay7MjV+KQehmvphSEmCzLrpB4WWn2PdpdTrOcDj+aJfWHeGL4sIPwEKgrKnTQg9QD8CCsm5wew9P/br39OuIfsC6/PFBEHmVThqj0aMxYLRD4K2GoRay6Ab7NftoIP5dnFnclfRxETAoNpTPE2F5Q669QySrdXxBpBSk8GLmdCDMlhiyzSiByrhFQaZRcH8n9i+i289otYuJQ7xPyP19KwT4CRyOiIlh3DSdlBfurMwihQGxN2spU7P4MwckrDKeOyYQhvNm/XWId/oXBqpHbo2yRPiOwL9p1J4AxA4RaJuh77vyhn2lFQaxPDqZd5A8RJjpb2NE2N3UncKLW7GAangdoLbRDMqt51VMZ0la+b/moL61fKvFXinKRHc7PybrG3MWzgXxO/VMKAuXOsB9XnOgl2A524cgiwyg==</CipherValue>
						</CipherData>
					</EncryptedData>
				</wst:RequestedSecurityToken>
				<wst:RequestedAttachedReference>
					<wsse:SecurityTokenReference>
						<wsse:Reference URI="2jmj7l5rSw0yVb/vlWAYkK/YBwk="></wsse:Reference>
					</wsse:SecurityTokenReference>
				</wst:RequestedAttachedReference>
				<wst:RequestedUnattachedReference>
					<wsse:SecurityTokenReference>
						<wsse:Reference URI="2jmj7l5rSw0yVb/vlWAYkK/YBwk="></wsse:Reference>
					</wsse:SecurityTokenReference>
				</wst:RequestedUnattachedReference>
				<wst:RequestedProofToken>
					<wst:BinarySecret>tgoPVK67sU36fQKlGLMgWgTXp7oiaQgE</wst:BinarySecret>
				</wst:RequestedProofToken>
			</wst:RequestSecurityTokenResponse>
			<wst:RequestSecurityTokenResponse>
				<wst:TokenType>urn:passport:compact</wst:TokenType>
				<wsp:AppliesTo xmlns:wsa="http://www.w3.org/2005/08/addressing">
					<wsa:EndpointReference>
						<wsa:Address>messengerclear.live.com</wsa:Address>
					</wsa:EndpointReference>
				</wsp:AppliesTo>
				<wst:Lifetime>
					<wsu:Created>2024-01-28T04:05:39Z</wsu:Created>
					<wsu:Expires>2024-01-29T04:05:39Z</wsu:Expires>
				</wst:Lifetime>
				<wst:RequestedSecurityToken>
					<wsse:BinarySecurityToken Id="Compact2">t=fergalicious</wsse:BinarySecurityToken>
				</wst:RequestedSecurityToken>
				<wst:RequestedAttachedReference>
					<wsse:SecurityTokenReference>
						<wsse:Reference URI="/DaESnwwMVTTpRTZEoNqUW/Md0k="></wsse:Reference>
					</wsse:SecurityTokenReference>
				</wst:RequestedAttachedReference>
				<wst:RequestedUnattachedReference>
					<wsse:SecurityTokenReference>
						<wsse:Reference URI="/DaESnwwMVTTpRTZEoNqUW/Md0k="></wsse:Reference>
					</wsse:SecurityTokenReference>
				</wst:RequestedUnattachedReference><wst:RequestedProofToken>
					<wst:BinarySecret>FbN+nzxKzW43nsq705pFStASTNpqUpb/</wst:BinarySecret>
				</wst:RequestedProofToken></wst:RequestSecurityTokenResponse>			<wst:RequestSecurityTokenResponse>
				<wst:TokenType>urn:passport:compact</wst:TokenType>
				<wsp:AppliesTo xmlns:wsa="http://www.w3.org/2005/08/addressing">
					<wsa:EndpointReference>
						<wsa:Address>messenger.msn.com</wsa:Address>
					</wsa:EndpointReference>
				</wsp:AppliesTo>
				<wst:Lifetime>
					<wsu:Created>2024-01-28T04:05:39Z</wsu:Created>
					<wsu:Expires>2024-01-29T04:05:39Z</wsu:Expires>
				</wst:Lifetime>
				<wst:RequestedSecurityToken>
					<wsse:BinarySecurityToken Id="Compact3">t=fergalicious</wsse:BinarySecurityToken>
				</wst:RequestedSecurityToken>
				<wst:RequestedAttachedReference>
					<wsse:SecurityTokenReference>
						<wsse:Reference URI="/DaESnwwMVTTpRTZEoNqUW/Md0k="></wsse:Reference>
					</wsse:SecurityTokenReference>
				</wst:RequestedAttachedReference>
				<wst:RequestedUnattachedReference>
					<wsse:SecurityTokenReference>
						<wsse:Reference URI="/DaESnwwMVTTpRTZEoNqUW/Md0k="></wsse:Reference>
					</wsse:SecurityTokenReference>
				</wst:RequestedUnattachedReference></wst:RequestSecurityTokenResponse>			<wst:RequestSecurityTokenResponse>
				<wst:TokenType>urn:passport:compact</wst:TokenType>
				<wsp:AppliesTo xmlns:wsa="http://www.w3.org/2005/08/addressing">
					<wsa:EndpointReference>
						<wsa:Address>messengersecure.live.com</wsa:Address>
					</wsa:EndpointReference>
				</wsp:AppliesTo>
				<wst:Lifetime>
					<wsu:Created>2024-01-28T04:05:39Z</wsu:Created>
					<wsu:Expires>2024-01-29T04:05:39Z</wsu:Expires>
				</wst:Lifetime>
				<wst:RequestedSecurityToken>
					<wsse:BinarySecurityToken Id="Compact4">t=fergalicious</wsse:BinarySecurityToken>
				</wst:RequestedSecurityToken>
				<wst:RequestedAttachedReference>
					<wsse:SecurityTokenReference>
						<wsse:Reference URI="/DaESnwwMVTTpRTZEoNqUW/Md0k="></wsse:Reference>
					</wsse:SecurityTokenReference>
				</wst:RequestedAttachedReference>
				<wst:RequestedUnattachedReference>
					<wsse:SecurityTokenReference>
						<wsse:Reference URI="/DaESnwwMVTTpRTZEoNqUW/Md0k="></wsse:Reference>
					</wsse:SecurityTokenReference>
				</wst:RequestedUnattachedReference></wst:RequestSecurityTokenResponse>			<wst:RequestSecurityTokenResponse>
				<wst:TokenType>urn:passport:compact</wst:TokenType>
				<wsp:AppliesTo xmlns:wsa="http://www.w3.org/2005/08/addressing">
					<wsa:EndpointReference>
						<wsa:Address>contacts.msn.com</wsa:Address>
					</wsa:EndpointReference>
				</wsp:AppliesTo>
				<wst:Lifetime>
					<wsu:Created>2024-01-28T04:05:39Z</wsu:Created>
					<wsu:Expires>2024-01-29T04:05:39Z</wsu:Expires>
				</wst:Lifetime>
				<wst:RequestedSecurityToken>
					<wsse:BinarySecurityToken Id="Compact5">t=fergalicious</wsse:BinarySecurityToken>
				</wst:RequestedSecurityToken>
				<wst:RequestedAttachedReference>
					<wsse:SecurityTokenReference>
						<wsse:Reference URI="/DaESnwwMVTTpRTZEoNqUW/Md0k="></wsse:Reference>
					</wsse:SecurityTokenReference>
				</wst:RequestedAttachedReference>
				<wst:RequestedUnattachedReference>
					<wsse:SecurityTokenReference>
						<wsse:Reference URI="/DaESnwwMVTTpRTZEoNqUW/Md0k="></wsse:Reference>
					</wsse:SecurityTokenReference>
				</wst:RequestedUnattachedReference></wst:RequestSecurityTokenResponse>			<wst:RequestSecurityTokenResponse>
				<wst:TokenType>urn:passport:compact</wst:TokenType>
				<wsp:AppliesTo xmlns:wsa="http://www.w3.org/2005/08/addressing">
					<wsa:EndpointReference>
						<wsa:Address>storage.msn.com</wsa:Address>
					</wsa:EndpointReference>
				</wsp:AppliesTo>
				<wst:Lifetime>
					<wsu:Created>2024-01-28T04:05:39Z</wsu:Created>
					<wsu:Expires>2024-01-29T04:05:39Z</wsu:Expires>
				</wst:Lifetime>
				<wst:RequestedSecurityToken>
					<wsse:BinarySecurityToken Id="Compact6">t=fergalicious</wsse:BinarySecurityToken>
				</wst:RequestedSecurityToken>
				<wst:RequestedAttachedReference>
					<wsse:SecurityTokenReference>
						<wsse:Reference URI="/DaESnwwMVTTpRTZEoNqUW/Md0k="></wsse:Reference>
					</wsse:SecurityTokenReference>
				</wst:RequestedAttachedReference>
				<wst:RequestedUnattachedReference>
					<wsse:SecurityTokenReference>
						<wsse:Reference URI="/DaESnwwMVTTpRTZEoNqUW/Md0k="></wsse:Reference>
					</wsse:SecurityTokenReference>
				</wst:RequestedUnattachedReference></wst:RequestSecurityTokenResponse>			<wst:RequestSecurityTokenResponse>
				<wst:TokenType>urn:passport:compact</wst:TokenType>
				<wsp:AppliesTo xmlns:wsa="http://www.w3.org/2005/08/addressing">
					<wsa:EndpointReference>
						<wsa:Address>sup.live.com</wsa:Address>
					</wsa:EndpointReference>
				</wsp:AppliesTo>
				<wst:Lifetime>
					<wsu:Created>2024-01-28T04:05:39Z</wsu:Created>
					<wsu:Expires>2024-01-29T04:05:39Z</wsu:Expires>
				</wst:Lifetime>
				<wst:RequestedSecurityToken>
					<wsse:BinarySecurityToken Id="Compact7">t=fergalicious</wsse:BinarySecurityToken>
				</wst:RequestedSecurityToken>
				<wst:RequestedAttachedReference>
					<wsse:SecurityTokenReference>
						<wsse:Reference URI="/DaESnwwMVTTpRTZEoNqUW/Md0k="></wsse:Reference>
					</wsse:SecurityTokenReference>
				</wst:RequestedAttachedReference>
				<wst:RequestedUnattachedReference>
					<wsse:SecurityTokenReference>
						<wsse:Reference URI="/DaESnwwMVTTpRTZEoNqUW/Md0k="></wsse:Reference>
					</wsse:SecurityTokenReference>
				</wst:RequestedUnattachedReference></wst:RequestSecurityTokenResponse>
		</wst:RequestSecurityTokenResponseCollection>
	</S:Body>
</S:Envelope>
		`);
	}
});

app.use("/abservice", require("./routes/abservice"));

const httpsServer = https.createServer({
    key: fs.readFileSync('./certs/key.pem'),
    cert: fs.readFileSync('./certs/cert.pem')
}, app);

httpsServer.listen(443, () => {
    console.log(`${chalk.magenta.bold('[HTTPS SERVER]')} Listening on port ${chalk.green.bold("443")}`);
});

const httpServer = http.createServer((req, res) => {
    res.writeHead(301, { Location: 'https://' + req.headers.host + req.url });
    res.end();
});

httpServer.listen(80, () => {
    console.log(`${chalk.magenta.bold('[HTTP SERVER]')} Listening on port ${chalk.green.bold("80")}`);
});


// Socket

const isCommand = (line) => line.match(/^[A-Z]{3}/);

const handleVER = require('./handlers/VER');
const handleCVR = require('./handlers/CVR');
const handleUSR = require('./handlers/USR');
const handlePNG = require('./handlers/PNG');
const handleADL = require('./handlers/ADL');
const handleINF = require('./handlers/INF');
const handleSYN = require('./handlers/SYN');
const handleCHG = require('./handlers/CHG');
const handleOUT = require('./handlers/OUT');

const server = net.createServer((socket) => {
    console.log(`${chalk.magenta.bold('[MSN SOCKET]')} New connection: ${socket.remoteAddress}:${socket.remotePort}`);

	let buffer = '';

    socket.on('data', (data) => {
        buffer += data.toString();

        const messages = buffer.trim().split('\r\n');
        buffer = '';

        let parsedCommands = [];
        let tempBuffer = '';

        for (const message of messages) {
            if (isCommand(message)) {
                if (tempBuffer) {
                    parsedCommands.push(tempBuffer);
                    tempBuffer = '';
                }
                tempBuffer = message;
            } else {
                if (tempBuffer) {
                    tempBuffer += `\r\n${message}`;
                } else {
                    console.log(`${chalk.red.bold('[MSN SOCKET]')} Received non-command message without a preceding command: ${message}`);
                }
            }
        }

        if (tempBuffer) {
            parsedCommands.push(tempBuffer);
        }

        if (buffer === '' || isCommand(messages[messages.length - 1])) {
            for (const command of parsedCommands) {
				// console.log(`${chalk.red.bold('[MSN SOCKET]')} Received command: ${command}`);
                const commandParts = command.toString().trim().split(' ');

                switch (commandParts[0]) {
                    case 'VER':
                        handleVER(socket, commandParts.slice(1), command);
                        break;
                    case 'CVR':
                        handleCVR(socket, commandParts.slice(1), command);
                        break;
                    case 'USR':
                        handleUSR(socket, commandParts.slice(1), command);
                        break;
					case 'PNG':
						handlePNG(socket);
						break;
					case 'ADL':
						handleADL(socket, commandParts.slice(1), command);
						break;
					case 'INF':
						handleINF(socket, commandParts.slice(1), command);
						break;
					case 'SYN':
						handleSYN(socket, commandParts.slice(1), command);
						break;
					case 'CHG':
						handleCHG(socket, commandParts.slice(1), command);
						break;
					case 'OUT':
						handleOUT(socket);
						break;
                    default:
                        console.log(`${chalk.red.bold('[MSN SOCKET]')} Unknown command: ${commandParts[0]}`);
					//	console.log(command);
                    //  socket.destroy();
                }
            }
            parsedCommands = [];
        }
    });

    socket.on('close', () => {
        console.log(`${chalk.magenta.bold('[MSN SOCKET]')} Connection closed: ${socket.remoteAddress}:${socket.remotePort}`);
    });

    socket.on('error', (err) => {
        console.error(err);
    });
});

server.listen(netPORT, () => {
    console.log(`${chalk.magenta.bold('[MSN SOCKET]')} Listening on port ${chalk.green.bold(netPORT)}`);
	console.log('-----------------------------------------');
});
