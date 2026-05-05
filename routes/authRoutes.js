const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

// POST /users/signup - Register a new user (for tests)
router.post('/users/signup', AuthController.register);

// POST /users/login - Login user (for tests)
router.post('/users/login', AuthController.login);

// Legacy routes (for documentation)
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

module.exports = router;
