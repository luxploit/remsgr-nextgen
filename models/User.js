const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uuid: {
    type: String,
    unique: true,
    sparse: true,
    required: true
  },
  friendly_name: {
    type: String,
    maxlength: 387,
    required: true
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    required: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  legacy_pass: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'supporter', 'mod', 'admin', 'superuser'],
    default: 'user'
  },
  groups: {
    type: Array,
    default: [],
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  last_login: {
    type: Date,
    default: null
  }
});

userSchema.index({ uuid: 1 }, { unique: true, sparse: true });
userSchema.index({ username: 1 }, { unique: true, sparse: true });
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ groups: 1 });


const User = mongoose.model('User', userSchema);

module.exports = User;
