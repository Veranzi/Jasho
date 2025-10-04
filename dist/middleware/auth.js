import { auth as firebaseAuth } from '../config/firebase.js';
export async function requireAuth(req, res, next) {
    try {
        const header = req.headers.authorization || '';
        const token = header.startsWith('Bearer ') ? header.slice(7) : undefined;
        if (!token)
            return res.status(401).json({ error: 'Missing token' });
        const decoded = await firebaseAuth.verifyIdToken(token);
        req.user = { uid: decoded.uid, email: decoded.email ?? null };
        next();
    }
    catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}
