const argon2 = require('argon2');
const { mongoose } = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    minLength: [4, 'User name should be at least 5 characters'],
    maxLength: [30, 'User name should not exceed 5 characters'],
    required: [true, 'User name is required'],
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'User email is required'],
    validate: [validator.isEmail, 'Enter A valid Email format'],
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'User password is required'],
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, 'User Confirm password is required'],
    validate: {
      validator(val) {
        return val === this.password;
      },
      message: 'Password and confirmPassword must be the same',
    },
  },
  passwordChangeDate: {
    type: Date,
    select: false,
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const hash = await argon2.hash(this.password);
    this.password = hash;
    this.confirmPassword = undefined;
  }
  if (this.isModified('password') && !this.$isNew) {
    this.passwordChangeDate = Date.now();
  }
  next();
});

userSchema.method({
  // we don't use this.password cause we made select false in this field by default
  async isPasswordMatch(userPassword, candidatePassword) {
    return argon2.verify(userPassword, candidatePassword);
  },
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.pre(/^find/, function (next) {
  const verifiedFields = Object.keys(userSchema.paths).filter(
    (path) =>
      !['__v', 'password', 'confirmPassword', 'passwordChangeDate'].includes(
        path,
      ),
  );
  const query = this.getQuery();
  Object.keys(query).forEach((key) => {
    if (!verifiedFields.includes(key)) {
      delete query[key];
    }
  });
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
