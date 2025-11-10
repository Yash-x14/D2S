import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

export function verifyJwt(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
        return res.status(401).json({ error: 'Missing Authorization header' });
    }
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.auth = { userId: payload.sub, role: payload.role };
        return next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

// Optional JWT verification - doesn't fail if no token
export function optionalJwt(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (token) {
        try {
            const payload = jwt.verify(token, JWT_SECRET);
            req.auth = { userId: payload.sub, role: payload.role };
        } catch (err) {
            // Invalid token, but continue without auth
            req.auth = null;
        }
    } else {
        req.auth = null;
    }
    return next();
}