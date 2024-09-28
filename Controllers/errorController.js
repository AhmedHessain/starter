/* eslint-disable no-param-reassign */
const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  return new AppError(`${err.value} is not a valid id.`, 400);
};

const handleValidationErrorDB = (err) => {
  const message = [];
  Object.keys(err.errors).forEach((field) => {
    message.push(`${err.errors[field].message}`);
  });
  return new AppError(message, 400);
};

const handleDuplicateKeyErrorDB = (err) => {
  const errors = [];
  Object.keys(err.keyValue).forEach((field) => {
    errors.push(`{ ${field}: ${err.keyValue[field]} }`);
  });
  const message = `Duplicate Field Values: ${errors.join(',')}.`;
  return new AppError(message, 400);
};

const handleJWTError = () => {
  return new AppError('Invalid or expired token.', 401);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    err,
  });
};

const sendErrorProd = (err, res) => {
  res.status(500).json({
    status: 'Internal Server Error',
    message: 'Error occured in server.',
  });
};

const sendError = (err, res) => {
  if (err.operational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    sendErrorProd(err, res);
  }
};
// Four params is default for Express error middleware
module.exports = (err, req, res, next) => {
  err.status = err.status || 'Internal Server Error';
  err.statusCode = err.statusCode || 500;
  if (err.name === 'CastError') {
    err = handleCastErrorDB(err);
  } else if (err.name === 'ValidationError') {
    err = handleValidationErrorDB(err);
  } else if (
    err.name === 'JsonWebTokenError' ||
    err.name === 'TokenExpiredError'
  ) {
    err = handleJWTError();
  } else if (err.code === 11000) {
    err = handleDuplicateKeyErrorDB(err);
  }
  sendError(err, res);
};
