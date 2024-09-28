const express = require('express');
const {
  getAllTours,
  getTourById,
  addTour,
  updateTour,
  deleteTour,
  aliasGetTopFiveCheapestTours,
  getTourStats,
  getBusiestMonthOfYear,
  getToursWithInKM,
  getToursDistanceFromPoint,
} = require('../Controllers/toursController');

const { protect, restrictTo } = require('../Controllers/authController');
const reviewRouter = require('./reviewRouter');

const toursRouter = express.Router();

toursRouter.use('/:tourId/reviews', reviewRouter);
// toursRouter.param('id', checkID);
toursRouter
  .route('/top-5-cheapest')
  .get([aliasGetTopFiveCheapestTours, getAllTours]);

toursRouter.route('/busiest-month-of-year/:year').get(getBusiestMonthOfYear);
toursRouter.route('/tour-stats').get(getTourStats);
toursRouter.route('/').all(protect).get(getAllTours).post(addTour);

toursRouter
  .route('/:id')
  .get(getTourById)
  .patch(updateTour)
  .delete(protect, restrictTo('admin', 'lead=guide'), deleteTour);

toursRouter
  .route('/tours-within/:distanceInKM/from/:point')
  .get(getToursWithInKM);

toursRouter
  .route('/calculate-tours-distance-from/:point')
  .get(getToursDistanceFromPoint);

module.exports = toursRouter;
