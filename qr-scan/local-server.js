// local-server.js - Express server for local development and testing
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';

// Import API handlers
import scanHandler from './api/scan.js';
import testHandler from './api/test.js';
import helloHandler from './api/hello.js';

// Load environment variables
dotenv.config({ path: '.env.local' });
// Fallback to parent directory .env if local doesn't exist
if (!process.env.MONGODB_URI) {
    dotenv.config({ path: '../.env' });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes - Simulate Vercel's serverless function behavior
app.all('/api/scan', async (req, res) => {
    try {
        await scanHandler(req, res);
    } catch (error) {
        console.error('Error in scan handler:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

app.all('/api/test', async (req, res) => {
    try {
        await testHandler(req, res);
    } catch (error) {
        console.error('Error in test handler:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

app.all('/api/hello', async (req, res) => {
    try {
        await helloHandler(req, res);
    } catch (error) {
        console.error('Error in hello handler:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        server: 'Express Local Development',
        environment: process.env.NODE_ENV || 'development',
        endpoints: [
            '/api/scan',
            '/api/test', 
            '/api/hello',
            '/health'
        ]
    });
});

// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        title: 'SHAKTI QR Scanner API',
        version: '1.0.0',
        description: 'Local development server for QR code scanning and attendance tracking',
        endpoints: {
            'GET /api/hello': 'Basic test endpoint',
            'GET /api/test': 'Advanced test with environment check',
            'POST /api/scan': 'Process QR code and mark attendance',
            'GET /api/scan?action=stats': 'Get attendance statistics (requires admin secret)',
            'GET /health': 'Server health check',
            'GET /api': 'This documentation'
        },
        environment: {
            mongoUri: process.env.MONGODB_URI ? 'Configured ✅' : 'Missing ❌',
            adminSecret: process.env.ADMIN_SECRET ? 'Configured ✅' : 'Missing ❌',
            eventName: process.env.EVENT_NAME || 'SHAKTI',
            nodeEnv: process.env.NODE_ENV || 'development'
        }
    });
});

// Serve the main QR scanner page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        availableRoutes: [
            '/',
            '/api/scan',
            '/api/test',
            '/api/hello',
            '/health',
            '/api'
        ]
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log('\n🚀 SHAKTI QR Scanner Server Started!');
    console.log('=====================================');
    console.log(`📍 Server running at: http://localhost:${PORT}`);
    console.log(`🌐 QR Scanner: http://localhost:${PORT}`);
    console.log(`📡 API Docs: http://localhost:${PORT}/api`);
    console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
    console.log('=====================================');
    console.log('🔧 Environment Status:');
    console.log(`   MongoDB: ${process.env.MONGODB_URI ? '✅ Connected' : '❌ Not configured'}`);
    console.log(`   Admin Secret: ${process.env.ADMIN_SECRET ? '✅ Set' : '❌ Not set'}`);
    console.log(`   Event: ${process.env.EVENT_NAME || 'SHAKTI'}`);
    console.log('=====================================\n');
    
    // Test endpoints on startup
    console.log('🧪 Quick Test Commands:');
    console.log(`   curl http://localhost:${PORT}/api/hello`);
    console.log(`   curl http://localhost:${PORT}/api/test`);
    console.log(`   curl http://localhost:${PORT}/health`);
    console.log('=====================================\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down QR Scanner server...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Server terminated gracefully');
    process.exit(0);
});