const { mongoose } = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

const { Schema } = mongoose;

const toursSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxLength: [40, 'A Tour name should be less than or equal to 40'],
      minLength: [10, 'A Tour name should be more than or equal to 10'],
      // validate: [
      //   validator.isAlpha,
      //   'A tour name should contain only characters',
      // ],
    },
    duration: {
      type: Number,
      required: true,
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a groub size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'A tour difficulty can be either easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 0,
      max: [5, 'A tour rating should be less than or equal to 5'],
      min: [0, 'A tour rating should be more than or equal to 0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
      min: [0, 'A tour ratingQuantity should be more than or equal to 0'],
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        // This only works on creating new document (this is doc at this function context, but on update it is query)
        validator(val) {
          return val < this.price;
        },
        message: `Price discount can't be greater than price`,
      },
    },
    summary: {
      type: String,
      required: [true, 'A tour must have a summary'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    startDates: [Date],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    slug: String,
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
      description: {
        type: String,
      },
      address: {
        type: String,
      },
    },
    locations: [
      {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number],
          required: true,
        },
        description: {
          type: String,
        },
        address: {
          type: String,
        },
      },
    ],
    guides: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

toursSchema.index({ price: 1, ratingsAverage: -1 });
toursSchema.index({ slug: 1 });
toursSchema.index({ startLocation: '2dsphere' });

// Mongoose Virtuals [doesn't exist on the database the column is just calculated]
toursSchema.virtual('durationInWeeks').get(function () {
  return this.duration / 7;
});

toursSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// Mongoose Doc Middleware
toursSchema.pre('save', function (next) {
  this.slug = slugify(this.name);
  next();
});

toursSchema.post('save', async function () {
  await this.populate({ path: 'guides', select: '-__v' });
});
toursSchema.pre(/^find/, function (next) {
  this.populate({ path: 'guides', select: '-__v' });
  next();
});

// Mongoose Query Middleware
toursSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

// Make sure that query contains only vaild fields in schema
// (notice pre is done before execution not before the route handler call,
// you will notice this as the sort, fields, page and limit still being used but they don't exist in query)
toursSchema.pre(/^find/, function (next) {
  const verifiedFields = Object.keys(toursSchema.paths).filter(
    (path) => !['__v', 'createdAt'].includes(path),
  );
  const query = this.getQuery();
  Object.keys(query).forEach((key) => {
    if (!verifiedFields.includes(key)) {
      delete query[key];
    }
  });
  next();
});

toursSchema.post(/^find/, function () {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
});

// Mongoose Aggregate Middleware
toursSchema.pre('aggregate', function (next) {
  if (Object.keys(this.pipeline()[0])[0] !== '$geoNear') {
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  }
  next();
});

const Tour = mongoose.model('Tour', toursSchema);

module.exports = Tour;
