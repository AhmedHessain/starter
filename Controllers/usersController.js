const User = require('../Model/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./controllerFactory');

exports.getAllUsers = factory.getAllDocs(User);

exports.getUserById = factory.getDocById(User);

exports.deleteUser = factory.deleteDoc(User);

exports.updateActiveUser = catchAsync(async (req, res, next) => {
  const { password, confirmPassword } = req.body;

  if (password || confirmPassword) {
    return next(new AppError(`Password can't be changed in this route`, 400));
  }

  const data = {};
  Object.keys(req.body).forEach((key) => {
    if (['name', 'email'].includes(key)) data[key] = req.body[key];
  });

  const user = req.currentUser;
  const updatedUser = await User.findByIdAndUpdate(user._id, data, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: updatedUser,
  });
});

exports.deleteActiveUser = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.currentUser._id, { active: false });

  res.status(204).json({
    status: 'success',
    data: {},
  });
});
