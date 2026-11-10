const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const morgan = require('morgan');
const mongoose = require('mongoose');

// ==========================================
// 1. LOAD ENVIRONMENT VARIABLES
// ==========================================

dotenv.config();

// Import database connection
const connectDB = require('./config/db');

// Create Express application
const app = express();

// Server instance
let server = null;

// ==========================================
// 2. ENVIRONMENT CONFIGURATION
// ==========================================

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ==========================================
// 3. REQUEST LOGGER
// ==========================================

if (NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// ==========================================
// 4. CORS CONFIGURATION
// ==========================================

const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    process.env.CLIENT_URL
].filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {

            // Allow requests from Postman, curl and mobile applications
            if (!origin) {
                return callback(null, true);
            }

            // Allow configured frontend origins
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            // Allow all origins during development
            if (NODE_ENV !== 'production') {
                return callback(null, true);
            }

            return callback(
                new Error('CORS policy: Access denied for this origin.')
            );
        },

        credentials: true,

        methods: [
            'GET',
            'POST',
            'PUT',
            'PATCH',
            'DELETE',
            'OPTIONS'
        ],

        allowedHeaders: [
            'Content-Type',
            'Authorization'
        ]
    })
);

// ==========================================
// 5. BODY PARSERS
// ==========================================

app.use(express.json({
    limit: '10mb'
}));

app.use(express.urlencoded({
    extended: true,
    limit: '10mb'
}));

// ==========================================
// 6. UPLOAD DIRECTORY
// ==========================================

const uploadDirectory = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, {
        recursive: true
    });
}

app.use(
    '/uploads',
    express.static(uploadDirectory)
);

// ==========================================
// 7. ROOT ROUTE
// ==========================================

app.get('/', (req, res) => {

    res.status(200).json({
        success: true,
        message: 'Welcome to Central Library Management System API',
        version: '1.0.0',
        healthCheck: '/api/health'
    });

});

// ==========================================
// 8. DATABASE HEALTH CHECK
// ==========================================

app.get('/api/health', (req, res) => {

    const dbStates = {
        0: 'Disconnected',
        1: 'Connected',
        2: 'Connecting',
        3: 'Disconnecting'
    };

    const databaseConnected =
        mongoose.connection.readyState === 1;

    res.status(databaseConnected ? 200 : 503).json({

        success: databaseConnected,

        status: databaseConnected
            ? 'Healthy'
            : 'Unhealthy',

        timestamp: new Date().toISOString(),

        uptimeSeconds: Math.floor(process.uptime()),

        database: {
            status:
                dbStates[mongoose.connection.readyState] ||
                'Unknown',

            host: mongoose.connection.host || 'N/A',

            name: mongoose.connection.name || 'N/A'
        },

        environment: NODE_ENV

    });

});

// ==========================================
// 9. API ROUTES
// ==========================================

// Authentication
app.use(
    '/api/auth',
    require('./routes/authRoutes')
);

// Users
app.use(
    '/api/users',
    require('./routes/userRoutes')
);

// Books
app.use(
    '/api/books',
    require('./routes/bookRoutes')
);

// Categories
app.use(
    '/api/categories',
    require('./routes/categoryRoutes')
);

// Transactions
app.use(
    '/api/transactions',
    require('./routes/transactionRoutes')
);

// Reservations
app.use(
    '/api/reservations',
    require('./routes/reservationRoutes')
);

// Notifications
app.use(
    '/api/notifications',
    require('./routes/notificationRoutes')
);

// Reports
app.use(
    '/api/reports',
    require('./routes/reportRoutes')
);

// Settings
app.use(
    '/api/settings',
    require('./routes/settingsRoutes')
);

// ==========================================
// 10. FRONTEND PRODUCTION BUILD
// ==========================================

const frontendDist = path.join(
    __dirname,
    '../frontend/dist'
);

if (fs.existsSync(frontendDist)) {

    app.use(express.static(frontendDist));

    // React Router fallback.
    // API and uploads routes are excluded.
    app.get(
        /^\/(?!api\/|uploads\/).*/,
        (req, res) => {

            res.sendFile(
                path.join(frontendDist, 'index.html')
            );

        }
    );

    console.log('[Frontend] Production build detected.');

} else {

    console.log(
        '[Frontend] Production build not found.'
    );

}

// ==========================================
// 11. ERROR HANDLING
// ==========================================

const {
    notFound,
    errorHandler
} = require('./middleware/errorMiddleware');

// Unknown routes
app.use(notFound);

// Application errors
app.use(errorHandler);

// ==========================================
// 12. START SERVER
// ==========================================

const startServer = async () => {

    try {

        console.log('================================================');
        console.log('[Library Backend] Starting server...');
        console.log('================================================');

        // Connect MongoDB before starting the server
        await connectDB();

        // Verify MongoDB connection
        if (mongoose.connection.readyState !== 1) {

            throw new Error(
                'MongoDB connection was not established.'
            );

        }

        console.log('[Database] MongoDB connected successfully.');

        // Initialize cron jobs after database connection
        const initCronJobs = require('./jobs/cronJobs');

        if (typeof initCronJobs === 'function') {

            initCronJobs();

            console.log('[Cron Jobs] Initialized successfully.');

        }

        // Start Express server
        server = app.listen(PORT, () => {

            console.log('================================================');
            console.log('[Library Backend] Server started successfully');
            console.log(`[Port] ${PORT}`);
            console.log(`[Mode] ${NODE_ENV}`);
            console.log(`[API] http://localhost:${PORT}`);
            console.log(`[Health] http://localhost:${PORT}/api/health`);
            console.log('================================================');

        });

        return server;

    } catch (error) {

        console.error('================================================');
        console.error('[Server Startup Failed]');
        console.error(error.message);
        console.error('================================================');

        process.exitCode = 1;

        return null;
    }

};

// ==========================================
// 13. GRACEFUL SHUTDOWN
// ==========================================

let isShuttingDown = false;

const shutdownServer = async (signal) => {

    if (isShuttingDown) {
        return;
    }

    isShuttingDown = true;

    console.log(`\n[Server] ${signal} received.`);
    console.log('[Server] Shutting down...');

    try {

        if (server) {

            await new Promise((resolve, reject) => {

                server.close((error) => {

                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }

                });

            });

        }

        await mongoose.connection.close();

        console.log('[Server] HTTP server closed.');
        console.log('[Database] MongoDB connection closed.');

        process.exit(0);

    } catch (error) {

        console.error(
            '[Shutdown Error]:',
            error.message
        );

        process.exit(1);

    }

};

process.on('SIGINT', () => {
    shutdownServer('SIGINT');
});

process.on('SIGTERM', () => {
    shutdownServer('SIGTERM');
});

// ==========================================
// 14. UNHANDLED ERRORS
// ==========================================

process.on('unhandledRejection', (error) => {

    console.error(
        '[Unhandled Promise Rejection]:',
        error
    );

});

process.on('uncaughtException', (error) => {

    console.error(
        '[Uncaught Exception]:',
        error
    );

    process.exit(1);

});

// ==========================================
// 15. EXPORTS
// ==========================================

module.exports = {
    app,
    startServer,

    get server() {
        return server;
    }
};

// Start automatically when running node server.js
if (require.main === module) {
    startServer();
}