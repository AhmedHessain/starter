require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  process.exit(1);
});

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
// eslint-disable-next-line no-unused-vars
mongoose.connect(DB).then((con) => {
  // console.log(con);
  console.log('Database successfully connected!');
});

const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`started listenning at port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
