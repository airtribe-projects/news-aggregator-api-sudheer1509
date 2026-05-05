// In-memory user storage (replace with database in production)
const users = [];

class UserModel {
    // Find user by email
    static findByEmail(email) {
        return users.find(user => user.email === email);
    }

    // Find user by ID
    static findById(id) {
        return users.find(user => user.id === id);
    }

    // Create a new user
    static create(userData) {
        const newUser = {
            id: users.length + 1,
            name: userData.name,
            email: userData.email,
            password: userData.password, // This will be the hashed password
            preferences: userData.preferences || [],
            createdAt: new Date()
        };
        users.push(newUser);
        return newUser;
    }

    // Get all users (for testing purposes)
    static getAll() {
        return users;
    }

    // Update user preferences
    static updatePreferences(userId, preferences) {
        const user = this.findById(userId);
        if (user) {
            user.preferences = preferences;
            return user;
        }
        return null;
    }
}

module.exports = UserModel;
