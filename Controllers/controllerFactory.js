const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const QueryBuilder = require('../utils/queryBuilder');

exports.deleteDoc = (model) =>
  catchAsync(async (req, res, next) => {
    const doc = await model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document found.', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.getAllDocs = (model, fn) =>
  catchAsync(async (req, res) => {
    const filter = (fn && fn(req)) || {};
    const queryBuilder = new QueryBuilder(model.find(filter), req.query);
    queryBuilder.filter().sort().paginate().project();
    const docs = await queryBuilder.mongoQuery;

    res.status(200).json({
      status: 'success',
      results: docs.length,
      requestTime: req.requestTime,
      data: docs,
    });
  });

exports.getDocById = (model, populate = '') =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const doc = await model.findById(id).populate(populate);

    if (!doc) {
      return next(new AppError('No document found.', 404));
    }

    res.status(200).json({
      status: 'success',
      requestTime: req.requestTime,
      data: doc,
    });
  });

exports.addDoc = function (model, fn) {
  return catchAsync(async (req, res) => {
    const data = (fn && fn(req)) || { ...req.body };
    const doc = await model.create(data);
    res.status(201).json({
      status: 'success',
      data: doc,
    });
  });
};

exports.updatedoc = (model, excludedFields = []) =>
  catchAsync(async (req, res, next) => {
    const doc = await model.findOne({ _id: req.params.id });
    if (!doc) {
      return next(new AppError('No document found.', 404));
    }
    const verifiedFields = Object.keys(model.schema.paths).filter(
      (path) => !excludedFields.includes(path),
    );
    const clonedDoc = doc.$clone();
    Object.keys(req.body).forEach((key) => {
      if (verifiedFields.includes(key)) clonedDoc[key] = req.body[key];
    });
    const updatedDoc = await clonedDoc.save();
    res.status(200).json({
      status: 'success',
      data: updatedDoc,
    });
  });
