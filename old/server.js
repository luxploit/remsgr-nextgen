const express = require('express')
const { XMLParser } = require('fast-xml-parser')
const cookieParser = require('cookie-parser')
const fs = require('fs')
const https = require('https')
const http = require('http')
const cors = require('cors')
const mongoose = require('mongoose')

const net = require('net')
const notificationPORT = 1863
const switchboardPORT = 1864

const chalk = require('chalk')
const dotenv = require('dotenv')
const config = require('../config.json')
dotenv.config()

const options = {
	user: process.env.MONGO_USER,
	pass: process.env.MONGO_PASS,
}

mongoose
	.connect(process.env.MONGO_URI, options)
	.then(() =>
		console.log(
			`${chalk.magenta.bold('[MONGODB]')} Connected to ${chalk.green.bold('MongoDB')}\r\n-----------------------------------------`
		)
	)
	.catch((err) =>
		console.error(
			`${chalk.magenta.bold('[MONGODB]')} Error connecting to ${chalk.green.bold('MongoDB')}:`,
			err,
			`\r\n-----------------------------------------`
		)
	)

// Express
const app = express()

app.set('etag', false)

app.use(cookieParser())
app.use(cors())

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use('/static', express.static('public'))

const {
	pprdr,
	twnAuth,
	createAccount,
	createAccountPage,
	createUniqueCode,
} = require('./services/authentication/tweener')
const { parseBodyMiddleware, rst } = require('./services/authentication/rst')
const { rst2 } = require('./services/authentication/rst2')

// Tweener Auth
app.get('/rdr/pprdr.asp', pprdr)
app.get('/tweener/auth', twnAuth)
app.get('/login2.srf', twnAuth)
app.post('/create', createAccount)
app.get('/create', createAccountPage)
app.post('/createUniqueCode', createUniqueCode)

// RST Auth
app.post('/RST.srf', parseBodyMiddleware, rst)
app.post('/RST2.srf', parseBodyMiddleware, rst2)
app.get('/RST.srf', (req, res) => {
	res.status(405).send('Method Not Allowed')
})

// Config
// app.post('/Config/MsgrConfig.asmx', (req, res) => {
// 	const template = fs.readFileSync('./templates/MsgrConfig.asmx', 'utf8')
// 	const modified = template
// 		.replace(/{{ host }}/g, config.server.host)
// 		.replace(/{{ config_host }}/g, config.server.host)

// 	const final = fs.readFileSync('./templates/MsgrConfig_Template.asmx', 'utf8')
// 	const finalModified = final.replace(/{{ config }}/g, modified)
// 	res.set('Content-Type', 'text/xml')
// 	res.send(finalModified)
// })

// app.get('/Config/MsgrConfig.asmx', (req, res) => {
// 	const template = fs.readFileSync('./templates/MsgrConfig.asmx', 'utf8')
// 	const modified = template
// 		.replace(/{{ host }}/g, config.server.host)
// 		.replace(/{{ config_host }}/g, config.server.host)
// 	res.set('Content-Type', 'text/xml')
// 	res.send(modified)
// })

// app.post('/storageservice/SchematizedStore.asmx', (req, res) => {
// 	res.status(404).send()
// })

app.get('/games/list', (req, res) => {
	res.send('Games are not currently supported.')
})

app.get('/msn/bannersads', (req, res) => {
	if (config.ads.enabled) {
		const ad = config.ads.ad_list[Math.floor(Math.random() * config.ads.ad_list.length)]
		const template = fs.readFileSync('./templates/ads/MSNAd.html', 'utf8')
		const modified = template.replace(/{{ ad_url }}/g, ad.url).replace(/{{ ad_img }}/g, ad.image)
		res.send(modified)
	} else {
		res.send('')
	}
})

if (process.env.DEBUG === 'true') {
	// THIS SHOULD NOT BE MADE PUBLIC IN A PRODUCTION ENVIRONMENT, IT IS FOR DEBUGGING PURPOSES ONLY AND CAN CONTAINS SENSITIVE INFORMATION ABOUT USERS
	app.get('/sessions', (req, res) => {
		res.json({ sockets, switchboard_sockets })
	})

	app.get('/chats', (req, res) => {
		res.json(switchboard_chats)
	})

	app.get('/send', (req, res) => {
		const template = `MIME-Version: 1.0\r\nContent-Type: application/x-msmsgssystemmessage\r\n\r\nType: 1\r\nArg1: 10\r\n`
		const templateLength = Buffer.byteLength(template, 'utf8')
		for (const socket of sockets) {
			socket.write(`MSG Hotmail Hotmail ${templateLength}\r\n${template}`)
		}

		res.json({ success: true })
	})
}

app.get('/online', (req, res) => {
	res.json({ online: sockets.length, on_switchboard: switchboard_sockets.length })
})

app.get('/maintenance', (req, res) => {
	if (req.query.secret !== config.server.secret) {
		res.status(401).send('Unauthorized')
		return
	}

	const minutes = parseInt(req.query.minutes) || 5

	const template = `MIME-Version: 1.0\r\nContent-Type: application/x-msmsgssystemmessage\r\n\r\nType: 1\r\nArg1: ${minutes}\r\n`
	const templateLength = Buffer.byteLength(template, 'utf8')
	for (const socket of sockets) {
		socket.write(`MSG Hotmail Hotmail ${templateLength}\r\n${template}`)
	}

	res.json({ success: true })
})

app.get('/alerts', (req, res) => {
	if (req.query.secret !== config.server.secret) {
		res.status(401).send('Unauthorized')
		return
	}

	for (const socket of sockets) {
		const message = Buffer.from(decodeURIComponent(req.query.message), 'utf8').toString('utf8')
		const link = Buffer.from(decodeURIComponent(req.query.link), 'utf8').toString('utf8')
		const template = `<NOTIFICATION ver="2" id="0000000000" siteid="000000000" siteurl="${link}"><TO pid="0x00000000:0x00000000" name="${socket.passport}"/><MSG pri="1" id="0000000000"><SUBSCR url=""/><ACTION url=""/><BODY lang="3076" icon=""><TEXT>${message}</TEXT></BODY></MSG></NOTIFICATION>`
		const templateLength = Buffer.byteLength(template, 'utf8')
		socket.write(`NOT ${templateLength}\r\n${template}`)
	}

	res.json({ success: true })
})

app.get('/onlineusers', (req, res) => {
	if (req.query.secret !== config.server.secret) {
		res.status(401).send('Unauthorized')
		return
	}

	const users = sockets.map((socket) => {
		const passport = socket.passport
		const friendly_name = socket.friendly_name
		const status = socket.status
		const customStatus = socket.customStatus
		return { passport, friendly_name, status, customStatus }
	})

	const decodedUsers = users.map((user) => {
		const friendly_name = decodeURIComponent(user.friendly_name)
		const status =
			user.status === 'NLN'
				? 'Online'
				: user.status === 'BSY'
					? 'Busy'
					: user.status === 'IDL'
						? 'Idle'
						: user.status === 'BRB'
							? 'Be Right Back'
							: user.status === 'AWY'
								? 'Away'
								: user.status === 'PHN'
									? 'On the Phone'
									: user.status === 'LUN'
										? 'Out to Lunch'
										: user.status === 'HDN'
											? 'Hidden'
											: user.status
		return { passport: user.passport, friendly_name, status, customStatus: user.customStatus }
	})

	res.json(decodedUsers)
})

app.post('/abservice/abservice.asmx', parseBodyMiddleware, (req, res) => {
	try {
		const soapAction = req.headers.soapaction
		const action = soapAction.split('/').pop().replace(/"/g, '')
		const handlerPath = `./services/soap/abservice/${action}.js`

		if (fs.existsSync(handlerPath)) {
			const handler = require(handlerPath)
			handler(req, res)
		} else {
			console.log(`${chalk.red.bold('[SOAP]')} No handler found for action: ${action}`)
			res.status(404).send()
		}
	} catch (err) {
		console.log(err)
		res.status(500).send()
	}
})

app.post('/abservice/SharingService.asmx', parseBodyMiddleware, (req, res) => {
	try {
		const soapAction = req.headers.soapaction
		const action = soapAction.split('/').pop().replace(/"/g, '')
		const handlerPath = `./services/soap/sharingservice/${action}.js`

		if (fs.existsSync(handlerPath)) {
			const handler = require(handlerPath)
			handler(req, res)
		} else {
			console.log(`${chalk.red.bold('[SOAP]')} No handler found for action: ${action}`)
			res.status(404).send()
		}
	} catch (err) {
		res.status(500).send()
	}
})

if (process.env.DEBUG === 'true') {
	const httpsServer = https.createServer(
		{
			key: fs.readFileSync('./certs/key.pem'),
			cert: fs.readFileSync('./certs/cert.pem'),
		},
		app
	)

	httpsServer.listen(443, () => {
		console.log(
			`${chalk.magenta.bold('[HTTPS SERVER]')} Listening on port ${chalk.green.bold('443')}`
		)
	})

	const httpServer = http.createServer(app)

	httpServer.listen(80, () => {
		console.log(`${chalk.magenta.bold('[HTTP SERVER]')} Listening on port ${chalk.green.bold('80')}`)
	})
} else {
	app.listen(5787, () => {
		console.log(
			`${chalk.magenta.bold('[HTTP SERVER]')} Listening on port ${chalk.green.bold('5787')}`
		)
	})
}

// Socket

const { sockets, switchboard_sockets } = require('./utils/socket.util')
const { switchboard_chats, SB_logOut } = require('./utils/sb.util')
const { logOut } = require('./utils/auth.util')

const { decodeMSNP } = require('./utils/parsers.util')

const notification = net.createServer((socket) => {
	console.log(
		`${chalk.magenta.bold('[MSN NOTIFICATION]')} New connection: ${socket.remoteAddress}:${socket.remotePort}`
	)
	sockets.push(socket)

	let buffer = Buffer.alloc(0)

	socket.on('data', (data) => {
		buffer = Buffer.concat([buffer, data])

		while (true) {
			const result = decodeMSNP(buffer)
			if (!result) break

			const [commandParts, body, newBuffer] = result
			buffer = newBuffer

			const command = commandParts.join(' ')
			if (process.env.DEBUG === 'true') {
				console.log(`${chalk.red.bold('[MSN NOTIFICATION]')} Received command: ${command}`)
			}

			const commandName = commandParts[0]
			const handlerPath = `./handlers/${commandName}.js`

			if (fs.existsSync(handlerPath)) {
				const handler = require(handlerPath)
				try {
					handler(socket, commandParts.slice(1), body ? `${command}\r\n${body}` : command)
				} catch (err) {
					console.error(`Error handling command: ${command}`)
					console.error(err)
				}
			} else {
				console.log(
					`${chalk.red.bold('[MSN NOTIFICATION]')} No handler found for command: ${commandName}`
				)
				socket.write(`200 ${commandParts[1]}\r\n`)
			}
		}
	})

	socket.on('close', () => {
		logOut(socket)
		const index = sockets.indexOf(socket)
		if (index > -1) {
			sockets.splice(index, 1)
		}
		console.log(
			`${chalk.magenta.bold('[MSN NOTIFICATION]')} Connection closed: ${socket.remoteAddress}:${socket.remotePort}`
		)
	})

	socket.on('error', (err) => {
		if (err.code !== 'ECONNRESET') {
			console.error(err)
		}
	})
})

const switchboard = net.createServer((socket) => {
	console.log(
		`${chalk.magenta.bold('[MSN SWITCHBOARD]')} New connection: ${socket.remoteAddress}:${socket.remotePort}`
	)
	switchboard_sockets.push(socket)

	let buffer = Buffer.alloc(0)

	socket.on('data', (data) => {
		buffer = Buffer.concat([buffer, data])

		while (buffer.length > 0) {
			// Find the end of the command header
			const headerEndIndex = buffer.indexOf('\r\n')
			if (headerEndIndex === -1) break

			const header = buffer.slice(0, headerEndIndex).toString()
			const headerParts = header.split(' ')

			if (headerParts[0] === 'MSG' && headerParts.length >= 4) {
				// Handle MSG command with payload
				const payloadLength = parseInt(headerParts[3], 10)
				const totalLength = headerEndIndex + 2 + payloadLength

				if (buffer.length < totalLength) break // Wait for the full payload to be received

				const command = buffer.slice(0, headerEndIndex + 2).toString()
				const payload = buffer.slice(headerEndIndex + 2, totalLength)
				buffer = buffer.slice(totalLength) // Remove the processed command from the buffer

				const handlerPath = `./handlers/switchboard/${headerParts[0]}.js`
				if (fs.existsSync(handlerPath)) {
					const handler = require(handlerPath)
					try {
						handler(socket, headerParts.slice(1), command, payload)
					} catch (err) {
						console.log(command)
						console.error(err)
					}
				} else {
					console.log(
						`${chalk.red.bold('[MSN SWITCHBOARD]')} No handler found for command: ${headerParts[0]}`
					)
					socket.write(`200 ${headerParts[1]}\r\n`)
				}
			} else {
				// Handle other commands without payload or with different structures
				buffer = buffer.slice(headerEndIndex + 2) // Remove the processed command from the buffer

				const handlerPath = `./handlers/switchboard/${headerParts[0]}.js`
				if (fs.existsSync(handlerPath)) {
					const handler = require(handlerPath)
					try {
						handler(socket, headerParts.slice(1), header)
					} catch (err) {
						console.log(header)
						console.error(err)
					}
				} else {
					console.log(
						`${chalk.red.bold('[MSN SWITCHBOARD]')} No handler found for command: ${headerParts[0]}`
					)
					socket.write(`200 ${headerParts[1]}\r\n`)
				}
			}
		}
	})

	socket.on('close', () => {
		SB_logOut(socket)
		const index = switchboard_sockets.indexOf(socket)
		if (index > -1) {
			switchboard_sockets.splice(index, 1)
		}
		console.log(
			`${chalk.magenta.bold('[MSN SWITCHBOARD]')} Connection closed: ${socket.remoteAddress}:${socket.remotePort}`
		)
	})

	socket.on('error', (err) => {
		if (err.code !== 'ECONNRESET') {
			console.error(err)
		}
	})
})

notification.listen(notificationPORT, () => {
	console.log(
		`${chalk.magenta.bold('[MSN NOTIFICATION]')} Listening on port ${chalk.green.bold(notificationPORT)}`
	)
})

switchboard.listen(switchboardPORT, () => {
	console.log(
		`${chalk.magenta.bold('[MSN SWITCHBOARD]')} Listening on port ${chalk.green.bold(switchboardPORT)}`
	)
})
