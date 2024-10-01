import mongoose from 'mongoose'

const schema = new mongoose.Schema(
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

export const ContactModel = mongoose.model('Contact', schema)
