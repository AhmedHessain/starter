const express = require('express');
const {
  getAllUsers,
  getUserById,
  updateActiveUser,
  deleteActiveUser,
  deleteUser,
} = require('../Controllers/usersController');
const { protect, restrictTo } = require('../Controllers/authController');

const usersRouter = express.Router();

usersRouter.route('/').get(getAllUsers);

usersRouter
  .route('/:id')
  .get(getUserById)
  .delete(protect, restrictTo('admin'), deleteUser);

usersRouter.route('/updateActiveUser').patch([protect, updateActiveUser]);

usersRouter.route('/deleteActiveUser').delete([protect, deleteActiveUser]);
module.exports = usersRouter;
