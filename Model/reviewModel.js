const { mongoose } = require('mongoose');
const Tour = require('./toursModel');

const reviewSchema = new mongoose.Schema({
  review: {
    type: String,
    required: [true, 'A review is required'],
  },
  rating: {
    type: Number,
    max: [5, 'Rating should be less than or equal to 5'],
    min: [1, 'Rating should be more than or equal to 1'],
    required: [true, 'Rating is required'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    required: [true, 'Review must belong to a tour'],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Review must belong to a user'],
  },
});

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  const verifiedFields = Object.keys(reviewSchema.paths).filter(
    (path) => !['__v'].includes(path),
  );
  const query = this.getQuery();
  Object.keys(query).forEach((key) => {
    if (!verifiedFields.includes(key)) {
      delete query[key];
    }
  });
  next();
});

reviewSchema.pre(/^find/, function (next) {
  this.populate([{ path: 'user', select: 'name' }]);
  next();
});

reviewSchema.static('updateTourRatings', async function (tourID) {
  const data = await this.aggregate([
    {
      $match: { tour: tourID },
    },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  if (data.length > 0) {
    await Tour.findByIdAndUpdate(tourID, {
      ratingsQuantity: data[0].nRatings,
      ratingsAverage: data[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourID, {
      ratingsQuantity: 0,
      ratingsAverage: 0,
    });
  }
});

reviewSchema.post('save', async function () {
  await this.constructor.updateTourRatings(this.tour);
});

reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) await this.model.updateTourRatings(doc.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
