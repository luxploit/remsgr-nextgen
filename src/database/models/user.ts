import mongoose from 'mongoose'

const schema = new mongoose.Schema({
	uuid: {
		type: String,
		unique: true,
		sparse: true,
		required: true,
	},
	friendly_name: {
		type: String,
		maxlength: 387,
		required: true,
	},
	username: {
		type: String,
		unique: true,
		sparse: true,
		required: true,
	},
	email: {
		type: String,
		unique: true,
		sparse: true,
		required: true,
	},
	password: {
		type: String,
		required: true,
	},
	legacy_pass: {
		type: String,
		default: null,
	},
	role: {
		type: String,
		enum: ['user', 'supporter', 'mod', 'admin', 'superuser'],
		default: 'user',
	},
	groups: {
		type: Array,
		default: [],
		required: true,
	},
	created_at: {
		type: Date,
		default: Date.now,
	},
	last_login: {
		type: Date,
		default: null,
	},
	settings: {
		type: Object,
		default: { phone: {} },
	},
})

schema.index({ uuid: 1 }, { unique: true, sparse: true })
schema.index({ username: 1 }, { unique: true, sparse: true })
schema.index({ email: 1 }, { unique: true, sparse: true })
schema.index({ groups: 1 })

export const UserModel = mongoose.model('User', schema)
