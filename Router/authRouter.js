const express = require('express');

const authRouter = express.Router();

const {
  signup,
  login,
  forgetPassword,
  resetPassword,
  protect,
  updatePassword,
} = require('../Controllers/authController');

authRouter.post('/signup', signup);

authRouter.post('/login', login);

authRouter.post('/forgetPassword', forgetPassword);

authRouter.patch('/resetPassword/:userID/:resetToken', resetPassword);

authRouter.patch('/updatePassword', [protect, updatePassword]);

module.exports = authRouter;
