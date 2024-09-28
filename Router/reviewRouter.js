const express = require('express');
const {
  createReview,
  getAllReviews,
  deleteReview,
  updateReview,
} = require('../Controllers/reviewController');
const { protect } = require('../Controllers/authController');
const reviewRouter = express.Router({ mergeParams: true });

reviewRouter.route('/').post(protect, createReview).get(protect, getAllReviews);

reviewRouter.route('/:id').delete(deleteReview).patch(updateReview);

module.exports = reviewRouter;
