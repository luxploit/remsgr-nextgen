const chalk = require('chalk')
const config = require('../config')
const { verifyJWT } = require('../utils/auth.util')
const { getSocketByUserID } = require('../utils/socket.util')
const validator = require('email-validator')
const Contact = require('../models/Contact')
const User = require('../models/User')

module.exports = async (socket, args, command) => {
	const transactionID = args[0]
	const list = args[1]

	let identifier
	if (socket.version >= 10 && list === 'FL') {
		identifier = args[2] // Use UUID for FL in MSNP10+
	} else {
		identifier = args[2].split('@')[0] // Use email (or the username part of it) for other lists and versions
	}

	if (isNaN(transactionID)) {
		socket.destroy()
		return
	}

	if (socket.version >= 13) {
		socket.destroy()
		return
	}

	const decoded = await verifyJWT(socket.token)

	if (!decoded) {
		console.log(`${chalk.red.bold('[REM]')} ${socket.remoteAddress} has an invalid token.`)
		socket.destroy()
		return
	}

	if (args[3]) {
		const groupUUID = args[3]

		// Find the current user by ID
		const user = await User.findOne({ _id: decoded.id }).exec()
		const group = user.groups.find((g) => g.id === groupUUID)

		if (!group) {
			console.log(
				`${chalk.red.bold('[REM]')} ${socket.passport} attempted to remove a contact from a group that does not exist. (${groupUUID})`
			)
			socket.write(`REM ${transactionID} 0\r\n`)
			return
		}

		const contactUser = await User.findOne({ uuid: identifier }).exec()
		if (!contactUser) {
			console.log(
				`${chalk.red.bold('[REM]')} ${socket.passport} attempted to remove a non-existent contact. (${identifier})`
			)
			socket.write(`REM ${transactionID} 0\r\n`)
			return
		}

		const contact = await Contact.findOne({
			userID: decoded.id,
			contactID: contactUser._id,
			list: 'FL',
		}).exec()
		if (!contact) {
			console.log(
				`${chalk.red.bold('[REM]')} ${socket.passport} attempted to remove a contact from a group that is not in their FL list. (${identifier})`
			)
			socket.write(`REM ${transactionID} 0\r\n`)
			return
		}

		const groupIndex = contact.groups.indexOf(groupUUID)
		if (groupIndex === -1) {
			console.log(
				`${chalk.red.bold('[REM]')} ${socket.passport} attempted to remove a contact from a group they are not in. (${groupUUID})`
			)
			socket.write(`REM ${transactionID} 0\r\n`)
			return
		}

		// Use findOneAndUpdate to remove the group without version conflict
		await Contact.findOneAndUpdate(
			{ _id: contact._id },
			{ $pull: { groups: groupUUID } },
			{ new: true, useFindAndModify: false }
		).exec()

		console.log(
			`${chalk.green.bold('[REM]')} ${socket.passport} removed ${identifier} from group ${groupUUID}.`
		)
		if (socket.version >= 10) {
			socket.write(command + '\r\n')
		} else {
			socket.write(`REM ${transactionID} ${list} 1 ${identifier}@remsgr.net\r\n`)
		}
		return
	}

	if (['FL', 'BL', 'AL'].includes(list)) {
		const query =
			socket.version >= 10 && list === 'FL' ? { uuid: identifier } : { username: identifier }
		const user = await User.findOne(query).exec()

		if (!user) {
			console.log(
				`${chalk.red.bold('[REM]')} ${socket.passport} attempted to remove a contact that does not exist. (${identifier})`
			)
			socket.write(`REM ${transactionID} 0\r\n`)
			return
		}

		const contact = await Contact.findOne({
			userID: socket.userID,
			contactID: user._id,
			list,
		}).exec()

		if (!contact) {
			console.log(
				`${chalk.red.bold('[REM]')} ${socket.passport} attempted to remove a contact that is not in their list. (${identifier})`
			)
			socket.write(`REM ${transactionID} 0\r\n`)
			return
		}

		await Contact.deleteOne({ userID: socket.userID, contactID: user._id, list }).exec()

		const contactID = user._id.toString()
		const contactSocket = getSocketByUserID(contactID)

		console.log(
			`${chalk.green.bold('[REM]')} ${socket.passport} removed ${identifier} from their list.`
		)
		if (socket.version >= 10) {
			socket.write(command + '\r\n')
		} else {
			socket.write(`REM ${transactionID} ${list} 1 ${identifier}@remsgr.net\r\n`)
		}

		if (contactSocket && list === 'AL') {
			const contactContact = await Contact.findOne({
				userID: user._id,
				contactID: socket.userID,
				list: 'FL',
			}).exec()

			if (!contactContact) {
				return
			}

			contactSocket.write(`FLN ${socket.passport}${contactSocket.version >= 14 ? ' 1' : ''}\r\n`)
		}
	} else {
		console.log(
			`${chalk.red.bold('[REM]')} ${socket.passport} attempted to remove a contact from an invalid list. (${list})`
		)
		socket.destroy()
		return
	}
}
