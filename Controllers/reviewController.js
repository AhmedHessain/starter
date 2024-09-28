const Review = require('../Model/reviewModel');
const factory = require('./controllerFactory');

exports.createReview = factory.addDoc(Review, (req) => ({
  review: req.body.review,
  rating: req.body.rating,
  user: req.currentUser._id,
  tour: req.params.tourId,
  createdAt: undefined,
}));

exports.getAllReviews = factory.getAllDocs(Review, (req) => {
  return req.params.tourId ? { tour: req.params.tourId } : {};
});

exports.deleteReview = factory.deleteDoc(Review);

exports.updateReview = factory.updatedoc(Review, [
  'user',
  'tour',
  '__v',
  'createdAt',
]);
