const mongoose = require('mongoose')

const codeSchema = new mongoose.Schema(
	{
		code: {
			type: String,
			required: true,
			unique: true,
		},
		used: {
			type: Boolean,
			default: false,
		},
		usedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
	},
	{ timestamps: true }
)

codeSchema.index({ code: 1 }, { unique: true })

const UniqueCode = mongoose.model('UniqueCode', codeSchema)

module.exports = UniqueCode
