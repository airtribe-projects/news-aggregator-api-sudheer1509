const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const UserModel = require('../models/userModel');
const ValidationUtils = require('../utils/validation');

// Get user profile (protected route)
router.get('/profile', verifyToken, (req, res) => {
    // req.user is available because of the verifyToken middleware
    res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: req.user
    });
});

// GET /preferences - Retrieve logged-in user's preferences
router.get('/preferences', verifyToken, (req, res) => {
    try {
        const user = UserModel.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Return flat response for tests
        res.status(200).json({
            preferences: user.preferences
        });
    } catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving preferences'
        });
    }
});

// PUT /preferences - Update user preferences (protected route)
router.put('/preferences', verifyToken, (req, res) => {
    try {
        const { preferences } = req.body;

        // Validate preferences using ValidationUtils
        const validation = ValidationUtils.validatePreferences(preferences);
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.message,
                errors: { field: 'preferences' }
            });
        }

        // Use sanitized preferences
        const sanitizedPreferences = validation.sanitized;

        // Update user preferences
        const updatedUser = UserModel.updatePreferences(req.user.id, sanitizedPreferences);

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                errors: { user: 'User does not exist' }
            });
        }

        res.status(200).json({
            success: true,
            message: 'Preferences updated successfully',
            data: {
                preferences: updatedUser.preferences
            }
        });
    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating preferences',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
