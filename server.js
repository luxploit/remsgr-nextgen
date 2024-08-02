const express = require('express');
const { XMLParser } = require('fast-xml-parser');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const https = require('https');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');

const net = require('net');
const notificationPORT = 1863;
const switchboardPORT = 1864;

const chalk = require('chalk');
const dotenv = require('dotenv');
const config = require('./config.json');
dotenv.config();

const options = {
	auth: {
		username: process.env.MONGO_USER,
		password: process.env.MONGO_PASS,
	},
};

mongoose
	.connect(process.env.MONGO_URI, options)
	.then(() => console.log(`${chalk.magenta.bold('[MONGODB]')} Connected to ${chalk.green.bold("MongoDB")}\r\n-----------------------------------------`))
	.catch((err) => console.error(`${chalk.magenta.bold('[MONGODB]')} Error connecting to ${chalk.green.bold("MongoDB")}:`, err, `\r\n-----------------------------------------`));

// Express
const app = express();
const parser = new XMLParser();

app.set("etag", false);

app.use(cookieParser());
app.use(cors());

app.use(express.text({ type: 'application/xml' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/static", express.static('public'));

// app.use((req, res, next) => {
// 	let body = "";
// 	req.on("data", (chunk) => {
// 		body += chunk.toString();
// 	});
// 	req.on("end", () => {
// 		req.body = parser.parse(body);
// 		next();
// 	});
// });

const { pprdr, twnAuth, createAccount } = require('./services/authentication/tweener');

// Tweener Auth
app.get('/rdr/pprdr.asp', pprdr);
app.get('/tweener/auth', twnAuth);
app.get('/login2.srf', twnAuth);
app.post('/create', createAccount);

// Config
app.post("/Config/MsgrConfig.asmx", (req, res) => {
	const template = fs.readFileSync('./templates/MsgrConfig.asmx', 'utf8');
	const modified = template.replace(/{{ host }}/g, config.server.host).replace(/{{ config_host }}/g, config.server.host);
	res.set('Content-Type', 'text/xml');
	res.send(modified);
});

app.get("/games/list", (req, res) => {
	res.send("Games are not currently supported.");
});

app.get("/msn/bannersads", (req, res) => {
	if (config.ads.enabled) {
		const ad = config.ads.ad_list[Math.floor(Math.random() * config.ads.ad_list.length)];
		const template = fs.readFileSync('./templates/ads/MSNAd.html', 'utf8');
		const modified = template.replace(/{{ ad_url }}/g, ad.url).replace(/{{ ad_img }}/g, ad.image);
		res.send(modified);
	} else {
		res.send("");
	}
});

app.post("/RST2.srf", (req, res, next) => {
	let body = "";
	req.on("data", (chunk) => {
		body += chunk.toString();
	});
	req.on("end", () => {
		req.body = parser.parse(body);
		next();
	});
}, async (req, res) => {
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

if (process.env.DEBUG === 'true') {
	// THIS SHOULD NOT BE MADE PUBLIC IN A PRODUCTION ENVIRONMENT, IT IS FOR DEBUGGING PURPOSES ONLY AND CAN CONTAINS SENSITIVE INFORMATION ABOUT USERS
	app.get("/sessions", (req, res) => {
		res.json({ sockets, switchboard_sockets });
	});

	app.get("/chats", (req, res) => {
		res.json(switchboard_chats);
	});

	app.get("/send", (req, res) => {
		const template = `MIME-Version: 1.0\r\nContent-Type: application/x-msmsgssystemmessage\r\n\r\nType: 1\r\nArg1: 10\r\n`
		const templateLength = Buffer.byteLength(template, 'utf8');
		for (const socket of sockets) {
			socket.write(`MSG Hotmail Hotmail ${templateLength}\r\n${template}`);
		}

		res.json({ success: true });
	});
}

app.get("/online", (req, res) => {
	res.json({ online: sockets.length, on_switchboard: switchboard_sockets.length });
});

app.use("/abservice", require("./routes/abservice"));

const httpsServer = https.createServer({
	key: fs.readFileSync('./certs/key.pem'),
	cert: fs.readFileSync('./certs/cert.pem')
}, app);

httpsServer.listen(443, () => {
	console.log(`${chalk.magenta.bold('[HTTPS SERVER]')} Listening on port ${chalk.green.bold("443")}`);
});

const httpServer = http.createServer(app);

httpServer.listen(80, () => {
	console.log(`${chalk.magenta.bold('[HTTP SERVER]')} Listening on port ${chalk.green.bold("80")}`);
});


// Socket

const { sockets, switchboard_sockets } = require('./utils/socket.util');
const { switchboard_chats, SB_logOut } = require('./utils/sb.util');
const { logOut } = require('./utils/auth.util');

const isCommand = (line) => line.match(/^[A-Z]{3}/);

const notification = net.createServer((socket) => {
	console.log(`${chalk.magenta.bold('[MSN NOTIFICATION]')} New connection: ${socket.remoteAddress}:${socket.remotePort}`);
	sockets.push(socket);

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
					if (process.env.DEBUG === 'true') {
						console.log(`${chalk.red.bold('[MSN NOTIFICATION]')} Received non-command message without a preceding command: ${message}`);
					}
				}
			}
		}

		if (tempBuffer) {
			parsedCommands.push(tempBuffer);
		}

		if (buffer === '' || isCommand(messages[messages.length - 1])) {
			for (const command of parsedCommands) {
				const commandParts = command.toString().trim().split(' ');

				const commandName = commandParts[0];
				if (process.env.DEBUG === 'true') {
					console.log(`${chalk.red.bold('[MSN NOTIFICATION]')} Received command: ${commandName}.`);
				}

				const handlerPath = `./handlers/${commandName}.js`;

				if (fs.existsSync(handlerPath)) {
					const handler = require(handlerPath);
					try {
						handler(socket, commandParts.slice(1), command);
					} catch (err) {
						console.log(command);
						console.error(err);
					}
				} else {
					console.log(`${chalk.red.bold('[MSN NOTIFICATION]')} No handler found for command: ${commandName}`);
					if (process.env.DEBUG === 'true') {
						console.log(`${chalk.red.bold('[MSN NOTIFICATION]')} Full command: ${command}`);
					}
					socket.write(`200 ${commandParts[1]}\r\n`);
				}

			}
			parsedCommands = [];
		}
	});

	socket.on('close', () => {
		logOut(socket);
		const index = sockets.indexOf(socket);
		if (index > -1) {
			sockets.splice(index, 1);
		}
		console.log(`${chalk.magenta.bold('[MSN NOTIFICATION]')} Connection closed: ${socket.remoteAddress}:${socket.remotePort}`);
	});

	socket.on('error', (err) => {
		console.error(err);
	});
});

const switchboard = net.createServer((socket) => {
	console.log(`${chalk.magenta.bold('[MSN SWITCHBOARD]')} New connection: ${socket.remoteAddress}:${socket.remotePort}`);
	switchboard_sockets.push(socket);

	let buffer = Buffer.alloc(0);

	socket.on('data', (data) => {
		buffer = Buffer.concat([buffer, data]);

		while (buffer.length > 0) {
			// Find the end of the command header
			const headerEndIndex = buffer.indexOf('\r\n');
			if (headerEndIndex === -1) break;

			const header = buffer.slice(0, headerEndIndex).toString();
			const headerParts = header.split(' ');

			if (headerParts[0] === 'MSG' && headerParts.length >= 4) {
				// Handle MSG command with payload
				const payloadLength = parseInt(headerParts[3], 10);
				const totalLength = headerEndIndex + 2 + payloadLength;

				if (buffer.length < totalLength) break; // Wait for the full payload to be received

				const command = buffer.slice(0, headerEndIndex + 2).toString();
				const payload = buffer.slice(headerEndIndex + 2, totalLength);
				buffer = buffer.slice(totalLength); // Remove the processed command from the buffer

				const handlerPath = `./handlers/switchboard/${headerParts[0]}.js`;
				if (fs.existsSync(handlerPath)) {
					const handler = require(handlerPath);
					try {
						handler(socket, headerParts.slice(1), command, payload);
					} catch (err) {
						console.log(command);
						console.error(err);
					}
				} else {
					console.log(`${chalk.red.bold('[MSN SWITCHBOARD]')} No handler found for command: ${headerParts[0]}`);
					socket.write(`200 ${headerParts[1]}\r\n`);
				}
			} else {
				// Handle other commands without payload or with different structures
				buffer = buffer.slice(headerEndIndex + 2); // Remove the processed command from the buffer

				const handlerPath = `./handlers/switchboard/${headerParts[0]}.js`;
				if (fs.existsSync(handlerPath)) {
					const handler = require(handlerPath);
					try {
						handler(socket, headerParts.slice(1), header);
					} catch (err) {
						console.log(header);
						console.error(err);
					}
				} else {
					console.log(`${chalk.red.bold('[MSN SWITCHBOARD]')} No handler found for command: ${headerParts[0]}`);
					socket.write(`200 ${headerParts[1]}\r\n`);
				}
			}
		}
	});

	socket.on('close', () => {
		SB_logOut(socket);
		const index = switchboard_sockets.indexOf(socket);
		if (index > -1) {
			switchboard_sockets.splice(index, 1);
		}
		console.log(`${chalk.magenta.bold('[MSN SWITCHBOARD]')} Connection closed: ${socket.remoteAddress}:${socket.remotePort}`);
	});

	socket.on('error', (err) => {
		console.error(err);
	});
});

notification.listen(notificationPORT, () => {
	console.log(`${chalk.magenta.bold('[MSN NOTIFICATION]')} Listening on port ${chalk.green.bold(notificationPORT)}`);
});

switchboard.listen(switchboardPORT, () => {
	console.log(`${chalk.magenta.bold('[MSN SWITCHBOARD]')} Listening on port ${chalk.green.bold(switchboardPORT)}`);
});