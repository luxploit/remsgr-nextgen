import mongoose from 'mongoose'

const schema = new mongoose.Schema(
	{
		userID: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		contactID: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		list: {
			type: String,
			enum: ['FL', 'AL', 'BL', 'RL'],
			required: true,
		},
		groups: {
			type: Array,
			default: [],
		},
	},
	{ timestamps: true }
)

export const BanModel = mongoose.model('Ban', schema)
