class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status =
      statusCode >= 400 && statusCode <= 500 ? 'Fail' : 'Internal Server Error';

    this.operational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
