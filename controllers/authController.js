const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const ValidationUtils = require('../utils/validation');

// Secret key for JWT (in production, store this in environment variables)
const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

class AuthController {
    // Register a new user
    static async register(req, res) {
        try {
            const { name, email, password, preferences } = req.body;

            // Validate required fields
            const requiredValidation = ValidationUtils.validateRequiredFields(
                req.body, 
                ['name', 'email', 'password']
            );
            if (!requiredValidation.valid) {
                return res.status(400).json({
                    success: false,
                    message: requiredValidation.message,
                    errors: { missingFields: requiredValidation.missingFields }
                });
            }

            // Validate data types
            if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Name, email, and password must be strings',
                    errors: { type: 'Invalid data types provided' }
                });
            }

            // Validate name
            const nameValidation = ValidationUtils.validateName(name);
            if (!nameValidation.valid) {
                return res.status(400).json({
                    success: false,
                    message: nameValidation.message,
                    errors: { field: 'name' }
                });
            }

            // Validate email format
            if (!ValidationUtils.isValidEmail(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email format',
                    errors: { field: 'email', example: 'user@example.com' }
                });
            }

            // Validate password strength
            const passwordValidation = ValidationUtils.validatePassword(password);
            if (!passwordValidation.valid) {
                return res.status(400).json({
                    success: false,
                    message: passwordValidation.message,
                    errors: { field: 'password' }
                });
            }

            // Sanitize inputs
            const sanitizedEmail = email.trim().toLowerCase();
            const sanitizedName = ValidationUtils.sanitizeString(name.trim());

            // Check if user already exists
            const existingUser = UserModel.findByEmail(sanitizedEmail);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'User with this email already exists',
                    errors: { field: 'email' }
                });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

            // Create the user
            const newUser = UserModel.create({
                name: sanitizedName,
                email: sanitizedEmail,
                password: hashedPassword,
                preferences: preferences || []
            });

            // Remove password from response
            const userResponse = {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                preferences: newUser.preferences,
                createdAt: newUser.createdAt
            };

            // Return flat response for tests
            res.status(200).json(userResponse);
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during registration',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Login user
    static async login(req, res) {
        try {
            const { email, password } = req.body;

            // Validate required fields
            const requiredValidation = ValidationUtils.validateRequiredFields(
                req.body, 
                ['email', 'password']
            );
            if (!requiredValidation.valid) {
                return res.status(400).json({
                    success: false,
                    message: requiredValidation.message,
                    errors: { missingFields: requiredValidation.missingFields }
                });
            }

            // Validate data types
            if (typeof email !== 'string' || typeof password !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password must be strings',
                    errors: { type: 'Invalid data types provided' }
                });
            }

            // Validate email format
            if (!ValidationUtils.isValidEmail(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email format',
                    errors: { field: 'email' }
                });
            }

            // Validate password is not empty
            if (!password || password.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Password cannot be empty',
                    errors: { field: 'password' }
                });
            }

            // Sanitize email
            const sanitizedEmail = email.trim().toLowerCase();

            // Find user by email
            const user = UserModel.findByEmail(sanitizedEmail);
            if (!user) {
                // Use generic message to prevent user enumeration
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password',
                    errors: { auth: 'Authentication failed' }
                });
            }

            // Compare passwords
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password',
                    errors: { auth: 'Authentication failed' }
                });
            }

            // Validate JWT_SECRET is configured
            if (!JWT_SECRET) {
                console.error('JWT_SECRET is not configured');
                return res.status(500).json({
                    success: false,
                    message: 'Authentication service is not properly configured'
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                { 
                    userId: user.id, 
                    email: user.email 
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Return user data and token
            const userResponse = {
                id: user.id,
                name: user.name,
                email: user.email,
                preferences: user.preferences
            };

            // Return flat response for tests
            res.status(200).json({
                ...userResponse,
                token: token
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during login',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

module.exports = AuthController;
