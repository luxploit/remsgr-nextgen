import mongoose from 'mongoose'

const schema = new mongoose.Schema(
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

export const UniqueCodeModel = mongoose.model('UniqueCode', schema)
