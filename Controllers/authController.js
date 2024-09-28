/* eslint-disable no-underscore-dangle */
const { promisify } = require('util');
const crypto = require('crypto');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const User = require('../Model/userModel');
const ResetToken = require('../Model/resetTokenModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { sendResetPasswordEmail } = require('../utils/email');
const startAsyncTransaction = require('../utils/startAsyncTransaction');

const getToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRATION_DATE,
  });
};

exports.signup = catchAsync(async (req, res) => {
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    photo: req.body.photo,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
  });

  const token = getToken(user);

  // it just makes sure that the password is not sent back in the response
  // but it is not saved as undefined in the database as we didn't make user.save()
  user.password = undefined;
  user.active = undefined;

  res.cookie('cookie?', token, {
    expires: new Date(
      Date.now() +
        parseInt(process.env.JWT_EXPIRATION_DATE) * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'development' ? false : true,
  });

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please provide email and password.', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.isPasswordMatch(user.password, password))) {
    return next(new AppError('email or password is invalid.', 401));
  }

  const token = getToken(user);

  res.cookie('cookie?', token, {
    expires: new Date(
      Date.now() +
        parseInt(process.env.JWT_EXPIRATION_DATE) * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'development' ? false : true,
  });

  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith('Bearer ')
  ) {
    return next(new AppError('Unauthorized route.', 401));
  }

  const token = req.headers.authorization.split(' ')[1];

  if (!token) {
    return next(new AppError('Missing token.', 401));
  }

  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_KEY,
  );

  const user = await User.findById(decoded.id).select('+passwordChangeDate');
  if (!user) {
    return next(new AppError('User is not found or deleted.', 401));
  }
  if (
    user.passwordChangeDate &&
    Math.floor(user.passwordChangeDate / 1000) > decoded.iat
  ) {
    return next(
      new AppError(
        'Invalid token. Password has been changed. Please login again.',
        401,
      ),
    );
  }

  req.currentUser = user;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.currentUser.role)) {
      return next(
        new AppError(`You don't have permission to perform this action`, 403),
      );
    }
    next();
  };
};

exports.forgetPassword = catchAsync(async (req, res, next) => {
  if (!req.body.email) {
    return next(new AppError('Email is required', 400));
  }

  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('No user found', 404));
  }

  await startAsyncTransaction(async function () {
    const resetTokenQuery = await ResetToken.findOne({
      _id: user._id,
    }).session(this.session);

    if (resetTokenQuery) {
      await resetTokenQuery.deleteOne().session(this.session);
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    const hashedResetToken = await argon2.hash(resetToken);

    await ResetToken.create(
      [
        {
          _id: user._id,
          resetToken: hashedResetToken,
        },
      ],
      { session: this.session },
    );

    const resetURL = `${req.protocol}://127.0.0.1:8000/api/v1/resetPassword/${user._id}/${resetToken}`;
    // Don't use url.get('host') to avoid host header injection attacks
    // Ensure that the reset password page adds the Referrer Policy tag with the noreferrer

    await sendResetPasswordEmail(user.email, resetURL);

    res.status(200).json({
      status: 'success',
      message: 'Email sent successfully',
    });
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { resetToken, userID } = req.params;
  const { password, confirmPassword } = req.body;

  const user = await User.findById(userID);

  if (!user) {
    return next(new AppError('User is not found or deleted', 404));
  }

  if (!resetToken) {
    return next(new AppError('Invalid or expired reset token', 401));
  }

  const hashedResetToken = await ResetToken.findById(userID);

  if (!hashedResetToken) {
    return next(new AppError('Invalid or expired reset token', 401));
  }

  if (!(await argon2.verify(hashedResetToken.resetToken, resetToken))) {
    return next(new AppError('Invalid or expired reset token', 401));
  }

  user.password = password;
  user.confirmPassword = confirmPassword;

  await startAsyncTransaction(async function () {
    await user.save({ session: this.session });
    await ResetToken.findByIdAndDelete(userID).session(this.session);
  });

  res.status(200).json({
    status: 'success',
    message: 'Password has been changed successfully. Please login.',
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.currentUser._id).select('+password');
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return next(
      new AppError(
        'currentPassword, newPassword and confirmNewPassword fields are required',
        400,
      ),
    );
  }
  if (!(await argon2.verify(user.password, currentPassword))) {
    return next(new AppError('Incorrect Password', 403));
  }
  user.password = newPassword;
  user.confirmPassword = confirmNewPassword;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Password has been changed successfully. Please login.',
  });
});
