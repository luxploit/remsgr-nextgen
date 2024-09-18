const chalk = require('chalk')
const { verifyJWT } = require('../utils/auth.util')
const { v4: uuidv4 } = require('uuid')

const User = require('../models/User')

module.exports = async (socket, args) => {
	const transactionID = args[0]
	const groupName = args[1]

	if (isNaN(transactionID)) {
		socket.destroy()
		return
	}

	const decoded = await verifyJWT(socket.token)

	if (!decoded) {
		console.log(`${chalk.red.bold('[ADG]')} ${socket.remoteAddress} has an invalid token.`)
		socket.write(`OUT\r\n`)
		socket.destroy()
		return
	}

	const user = await User.findById(decoded.id).exec()

	if (!user) {
		console.log(`${chalk.red.bold('[ADG]')} User not found.`)
		socket.write(`OUT\r\n`)
		socket.destroy()
		return
	}

	if (user.groups === null) {
		user.groups = []
	}

	if (user.groups.length >= 30) {
		console.log(
			`${chalk.red.bold('[ADG]')} ${socket.passport} has attempted to create a group when they already have 30 groups.`
		)
		socket.write(`223 ${transactionID}\r\n`)
		return
	}

	if (Buffer.byteLength(groupName, 'utf8') > 61) {
		console.log(
			`${chalk.red.bold('[ADG]')} ${socket.passport} has attempted to create a group with a name that is too long.`
		)
		socket.write(`229 ${transactionID}\r\n`)
		return
	}

	for (const group of user.groups) {
		if (group.name === groupName) {
			console.log(
				`${chalk.red.bold('[ADG]')} ${socket.passport} has attempted to create a group with a name that already exists.`
			)
			socket.write(`229 ${transactionID}\r\n`)
			return
		}
	}

	const groupID = uuidv4()

	await User.updateOne(
		{ _id: decoded.id },
		{ $push: { groups: { id: groupID, name: groupName } } }
	).exec()

	const groupNumber = user.groups.length + 1

	console.log(
		`${chalk.green.bold('[ADG]')} ${socket.passport} has created a group named ${groupName}.`
	)
	socket.write(
		`ADG ${transactionID} 1 ${groupName} ${socket.version < 10 ? groupNumber : groupID} 0\r\n`
	)
}
