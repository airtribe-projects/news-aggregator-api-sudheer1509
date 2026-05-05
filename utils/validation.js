/**
 * Validation Utility Functions
 * Provides reusable validation functions for input validation
 */

class ValidationUtils {
    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} - True if valid
     */
    static isValidEmail(email) {
        if (!email || typeof email !== 'string') {
            return false;
        }
        // RFC 5322 compliant email regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    }

    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {Object} - {valid: boolean, message: string}
     */
    static validatePassword(password) {
        if (!password || typeof password !== 'string') {
            return { valid: false, message: 'Password is required' };
        }

        if (password.length < 8) {
            return { valid: false, message: 'Password must be at least 8 characters long' };
        }

        if (password.length > 128) {
            return { valid: false, message: 'Password must not exceed 128 characters' };
        }

        // Check for at least one letter and one number
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);

        if (!hasLetter || !hasNumber) {
            return { 
                valid: false, 
                message: 'Password must contain at least one letter and one number' 
            };
        }

        return { valid: true, message: 'Password is valid' };
    }

    /**
     * Validate name format
     * @param {string} name - Name to validate
     * @returns {Object} - {valid: boolean, message: string}
     */
    static validateName(name) {
        if (!name || typeof name !== 'string') {
            return { valid: false, message: 'Name is required' };
        }

        const trimmedName = name.trim();

        if (trimmedName.length < 2) {
            return { valid: false, message: 'Name must be at least 2 characters long' };
        }

        if (trimmedName.length > 100) {
            return { valid: false, message: 'Name must not exceed 100 characters' };
        }

        // Allow letters, spaces, hyphens, and apostrophes
        const nameRegex = /^[a-zA-Z\s\-']+$/;
        if (!nameRegex.test(trimmedName)) {
            return { 
                valid: false, 
                message: 'Name can only contain letters, spaces, hyphens, and apostrophes' 
            };
        }

        return { valid: true, message: 'Name is valid' };
    }

    /**
     * Validate preferences array
     * @param {Array} preferences - Preferences to validate
     * @returns {Object} - {valid: boolean, message: string, sanitized: Array}
     */
    static validatePreferences(preferences) {
        if (!preferences) {
            return { 
                valid: false, 
                message: 'Preferences are required',
                sanitized: [] 
            };
        }

        if (!Array.isArray(preferences)) {
            return { 
                valid: false, 
                message: 'Preferences must be an array',
                sanitized: [] 
            };
        }

        if (preferences.length === 0) {
            return { 
                valid: false, 
                message: 'Preferences array cannot be empty',
                sanitized: [] 
            };
        }

        if (preferences.length > 20) {
            return { 
                valid: false, 
                message: 'Maximum 20 preferences allowed',
                sanitized: [] 
            };
        }

        // Sanitize preferences - filter valid strings
        const sanitized = preferences
            .filter(pref => typeof pref === 'string' && pref.trim().length > 0)
            .map(pref => pref.trim().toLowerCase())
            .filter((pref, index, self) => self.indexOf(pref) === index); // Remove duplicates

        if (sanitized.length === 0) {
            return { 
                valid: false, 
                message: 'Preferences must contain valid strings',
                sanitized: [] 
            };
        }

        // Validate each preference
        const invalidPrefs = sanitized.filter(pref => {
            return pref.length > 50 || !/^[a-zA-Z0-9\s\-]+$/.test(pref);
        });

        if (invalidPrefs.length > 0) {
            return { 
                valid: false, 
                message: 'Preferences can only contain letters, numbers, spaces, and hyphens (max 50 chars each)',
                sanitized 
            };
        }

        return { valid: true, message: 'Preferences are valid', sanitized };
    }

    /**
     * Validate pagination parameters
     * @param {number} page - Page number
     * @param {number} pageSize - Page size
     * @returns {Object} - {valid: boolean, message: string, page: number, pageSize: number}
     */
    static validatePagination(page, pageSize) {
        const pageNum = parseInt(page);
        const pageSizeNum = parseInt(pageSize);

        if (isNaN(pageNum) || pageNum < 1) {
            return { 
                valid: false, 
                message: 'Page number must be a positive integer',
                page: 1,
                pageSize: 20
            };
        }

        if (pageNum > 100) {
            return { 
                valid: false, 
                message: 'Maximum page number is 100',
                page: 1,
                pageSize: 20
            };
        }

        if (isNaN(pageSizeNum) || pageSizeNum < 1) {
            return { 
                valid: false, 
                message: 'Page size must be a positive integer',
                page: pageNum,
                pageSize: 20
            };
        }

        if (pageSizeNum > 100) {
            return { 
                valid: false, 
                message: 'Maximum page size is 100',
                page: pageNum,
                pageSize: 20
            };
        }

        return { valid: true, message: 'Pagination is valid', page: pageNum, pageSize: pageSizeNum };
    }

    /**
     * Sanitize string input to prevent injection
     * @param {string} input - Input to sanitize
     * @returns {string} - Sanitized string
     */
    static sanitizeString(input) {
        if (typeof input !== 'string') {
            return '';
        }
        return input.trim().replace(/[<>]/g, '');
    }

    /**
     * Validate request body has required fields
     * @param {Object} body - Request body
     * @param {Array} requiredFields - Array of required field names
     * @returns {Object} - {valid: boolean, message: string, missingFields: Array}
     */
    static validateRequiredFields(body, requiredFields) {
        const missingFields = requiredFields.filter(field => !body[field]);

        if (missingFields.length > 0) {
            return {
                valid: false,
                message: `Missing required fields: ${missingFields.join(', ')}`,
                missingFields
            };
        }

        return { valid: true, message: 'All required fields present', missingFields: [] };
    }
}

module.exports = ValidationUtils;
