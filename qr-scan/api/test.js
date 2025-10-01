export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    return res.status(200).json({
        success: true,
        message: 'QR Scanner API is working!',
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        env: {
            nodeEnv: process.env.NODE_ENV,
            mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not Set',
            adminSecret: process.env.ADMIN_SECRET ? 'Set' : 'Not Set'
        }
    });
}