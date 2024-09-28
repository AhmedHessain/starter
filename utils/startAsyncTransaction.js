const { mongoose } = require('mongoose');

const startAsyncTransaction = async function (asyncFunc) {
  this.session = await mongoose.startSession();
  this.session.startTransaction();
  try {
    await asyncFunc();
    await this.session.commitTransaction();
  } catch (err) {
    await this.session.abortTransaction();
    throw err;
  } finally {
    this.session.endSession();
  }
};

module.exports = startAsyncTransaction;
