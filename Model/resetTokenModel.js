const { mongoose } = require('mongoose');

const resetTokenSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'User Id is Required'],
    ref: 'User',
  },
  resetToken: {
    type: String,
    required: [true, 'resetToken is required'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 1800,
  },
});

const ResetToken = mongoose.model('resetToken', resetTokenSchema);

module.exports = ResetToken;
