const crypto = require('crypto')
const chalk = require('chalk')
const { MD5Auth, TWNAuth, SSOAuth } = require('../utils/auth.util')

module.exports = async (socket, args) => {
	const transactionID = args[0]
	const scheme = args[1]
	const state = args[2]

	if (isNaN(transactionID)) {
		socket.destroy()
		return
	}

	if (scheme === 'SSO') {
		if (state === 'I') {
			socket.passport = args[3].split('@')[0] + '@remsgr.net'
			SSOAuth.login(socket, socket.version, state, transactionID, socket.passport)
		} else if (state === 'S') {
			SSOAuth.login(socket, socket.version, state, transactionID, socket.passport, args[3])
		}
	} else if (scheme === 'TWN') {
		if (state === 'I') {
			socket.passport = args[3].split('@')[0] + '@remsgr.net'
			TWNAuth.login(socket, socket.version, state, transactionID, socket.passport)
		} else if (state === 'S') {
			TWNAuth.login(socket, socket.version, state, transactionID, socket.passport, args[3])
		}
	} else if (scheme === 'SHA') {
		socket.write(`USR ${transactionID} OK ${socket.passport} 1 0\r\n`)
	} else if (scheme === 'MD5') {
		if (state === 'I') {
			socket.passport = args[3].split('@')[0] + '@remsgr.net'
			MD5Auth.login(socket, socket.version, state, transactionID, socket.passport)
		} else if (state === 'S') {
			MD5Auth.login(socket, socket.version, state, transactionID, socket.passport, args[3])
		}
	} else {
		socket.destroy()
	}
}
