const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  userID: {
    type: mongoose.Schema.Types.ObjectId, ref: "User",
    required: true
  },
  contactID: {
    type: mongoose.Schema.Types.ObjectId, ref: "User",
    required: true
  },
  list: {
    type: String,
    enum: ['FL', 'AL', 'BL', 'RL'],
    required: true
  },
  groups: {
    type: Array,
    default: []
  }
}, { timestamps: true });

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;
