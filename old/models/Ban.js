const mongoose = require('mongoose')

const banSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		reason: {
			type: String,
			required: true,
		},
		permanent: {
			type: Boolean,
			default: false,
			required: true,
		},
		expiresAt: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: true }
)

const Ban = mongoose.model('Ban', banSchema)

module.exports = Ban
