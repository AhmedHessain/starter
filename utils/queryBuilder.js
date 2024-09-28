class QueryBuilder {
  constructor(mongoQuery, reqQuery) {
    this.mongoQuery = mongoQuery;
    this.reqQuery = reqQuery;
  }

  filter() {
    let queryObj = { ...this.reqQuery };

    const excludedFields = ['fields', 'sort', 'limit', 'page'];
    excludedFields.forEach((field) => {
      delete queryObj[field];
    });

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    queryObj = JSON.parse(queryStr);

    this.mongoQuery = this.mongoQuery.find(queryObj);

    return this;
  }

  sort() {
    if (this.reqQuery.sort) {
      if (typeof this.reqQuery.sort === 'string')
        this.mongoQuery.sort(this.reqQuery.sort.split(',').join(' '));
      else {
        this.mongoQuery.sort(this.reqQuery.sort.join(' '));
      }
    } else {
      this.mongoQuery.sort('-createdAt _id');
    }
    return this;
  }

  project() {
    if (this.reqQuery.fields) {
      if (typeof this.reqQuery.fields === 'string')
        this.mongoQuery.select(this.reqQuery.fields.split(',').join(' '));
      else {
        this.mongoQuery.select(this.reqQuery.fields.join(' '));
      }
    } else {
      this.mongoQuery.select('-__v');
    }
  }

  paginate() {
    const page = Number(this.reqQuery.page) || 1;
    const limit = Number(this.reqQuery.limit) || 100;
    const skip = (page - 1) * limit;

    this.mongoQuery.skip(skip).limit(limit);

    return this;
  }
}

module.exports = QueryBuilder;
