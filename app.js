const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const AppError = require('./utils/appError');
const errorHandler = require('./Controllers/errorController');
const toursRouter = require('./Router/toursRouter');
const usersRouter = require('./Router/usersRouter');
const authRouter = require('./Router/authRouter');
const reviewRouter = require('./Router/reviewRouter');

const app = express();

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: {
    status: 'Fail',
    message: 'Too many requests. Please try again later.',
  },
});

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 20,
  delayMs: (hits) => Math.min(1000, hits * 50),
});

app.use(helmet());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/api', rateLimiter, speedLimiter);

app.use(express.json({ limit: '10kb' }));

app.use(mongoSanitize());

app.use(express.static(`${__dirname}/public`));
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});
app.use('/api/v1/tours', toursRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1', authRouter);
app.use('/api/v1/reviews', reviewRouter);
app.all('*', (req, res, next) => {
  next(new AppError(`The requested url ${req.originalUrl} is not found`, 404));
});

app.use(errorHandler);

module.exports = app;
