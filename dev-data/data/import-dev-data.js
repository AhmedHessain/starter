const fs = require('fs');
require('dotenv').config();
const mongoose = require('mongoose');
const Tour = require('../../Model/toursModel');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose.connect(DB).then(() => {
  console.log('Database successfully connected!');
});

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`));

async function importData() {
  try {
    await Tour.create(tours);
    console.log('Data loaded successfully');
  } catch (err) {
    console.log(err);
  }
  process.exit();
}

async function deleteAllData() {
  try {
    await Tour.deleteMany();
    console.log('Data deleted successfully');
  } catch (err) {
    console.log(err);
  }
  process.exit();
}

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteAllData();
} else {
  const green = '\x1b[32m';
  const red = '\x1b[31m';
  const reset = '\x1b[0m';

  console.log(
    `Please use node {the path} and add ${green}--import${reset} to load the data into the database\nor add ${red}--delete${reset} to remove all the data from the database`,
  );
  process.exit();
}
