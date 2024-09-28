const Tour = require('../Model/toursModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./controllerFactory');

exports.getAllTours = factory.getAllDocs(Tour);

exports.getTourById = factory.getDocById(Tour, 'reviews');

exports.addTour = factory.addDoc(Tour, (req) => ({
  ...req.body,
  createdAt: undefined,
  ratingsAverage: undefined,
  ratingsQuantity: undefined,
}));

exports.updateTour = factory.updatedoc(Tour, ['__v', 'createdAt']);

exports.deleteTour = factory.deleteDoc(Tour);

exports.aliasGetTopFiveCheapestTours = (req, res, next) => {
  req.query = {
    sort: 'price,-ratingsAverage',
    limit: 5,
    fields: 'name,price,ratingsAverage,difficulty,summary',
  };
  next();
};

exports.getTourStats = catchAsync(async (req, res) => {
  const tourStats = await Tour.aggregate([
    { $match: { ratingsAverage: { $gte: 4.5 } } },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        total: { $sum: 1 },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    results: tourStats.length,
    requestTime: req.requestTime,
    data: tourStats,
  });
});

exports.getBusiestMonthOfYear = catchAsync(async (req, res) => {
  const wantedYear = req.params.year || new Date().getFullYear();
  const month = await Tour.aggregate([
    { $unwind: '$startDates' },
    {
      $match: {
        startDates: {
          $gte: new Date(`${wantedYear}-01-01`),
          $lte: new Date(`${wantedYear}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        count: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: 1,
    },
    {
      $project: {
        _id: 0,
        month: '$_id',
        count: 1,
        tours: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    results: month.length,
    requestTime: req.requestTime,
    data: month,
  });
});
// tours-within/:distanceInKM/from/:point
// tours-within/300/from/34.05176176730618, -118.23859173670753
exports.getToursWithInKM = catchAsync(async (req, res, next) => {
  const { distanceInKM, point } = req.params;

  if (typeof distanceInKM !== 'number') {
    new AppError('Distance must be a number');
  }

  const [lat, lng] = point.split(',').map((item) => item.trim());

  if (!lat || !lng) {
    new AppError('Point is required in the following format lat,lng');
  }

  const raduis = distanceInKM / 6378.1;

  const tours = await Tour.find({
    'startLocation.coordinates': {
      $geoWithin: {
        $centerSphere: [[lng * 1, lat * 1], raduis * 1],
      },
    },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: tours,
  });
});

exports.getToursDistanceFromPoint = catchAsync(async (req, res, next) => {
  const { point } = req.params;

  const [lat, lng] = point.split(',').map((item) => item.trim());

  if (!lat || !lng) {
    new AppError('Point is required in the following format lat,lng');
  }

  const tours = await Tour.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng * 1, lat * 1] },
        distanceField: 'distance',
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: tours,
  });
});
