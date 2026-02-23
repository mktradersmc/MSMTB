const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// In a real production scenario, this secret should be loaded from env vars
// For this MVP, we use a fallback secret.
const JWT_SECRET = process.env.JWT_SECRET || 'trading-cockpit-secret-key-2026';
const JWT_EXPIRES_IN = '7d';

class AuthService {
    /**
     * @param {string} password 
     * @returns {string} Hashed password
     */
    static hashPassword(password) {
        return bcrypt.hashSync(password, 10);
    }

    /**
     * @param {string} password 
     * @param {string} hash 
     * @returns {boolean} True if password matches hash
     */
    static verifyPassword(password, hash) {
        return bcrypt.compareSync(password, hash);
    }

    /**
     * @param {Object} payload 
     * @returns {string} JWT Token
     */
    static generateToken(payload) {
        return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    }

    /**
     * @param {string} token 
     * @returns {Object|null} Decoded payload or null if invalid
     */
    static verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (e) {
            return null;
        }
    }

    /**
     * Express Middleware to protect routes
     */
    static authenticateJWT(req, res, next) {
        let token = null;

        // 1. Check Authorization Header (Bearer Token)
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        // 2. Fallback to Cookie (Useful for Next.js API Routes / Rewrites)
        else if (req.headers.cookie) {
            const cookies = req.headers.cookie.split(';');
            for (let cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === 'auth_token') {
                    token = value;
                    break;
                }
            }
        }

        if (token) {
            const user = AuthService.verifyToken(token);
            if (user) {
                req.user = user;
                next();
            } else {
                res.status(401).json({ error: 'Token is invalid or expired' });
            }
        } else {
            res.status(401).json({ error: 'Authorization header or cookie missing' });
        }
    }
}

module.exports = AuthService;
