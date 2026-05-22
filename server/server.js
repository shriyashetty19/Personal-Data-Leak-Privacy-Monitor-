import express from 'express'; 
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import monitorRoutes from './routes/monitor.js';
import subscriptionRoutes from './routes/subscription.js';
import organizationRoutes from './routes/organization.js';
import { handleStripeWebhook } from './controllers/subscriptionController.js';
import { initCronJobs } from './utils/cronJobs.js';
import rateLimit from 'express-rate-limit';
import { logAction } from './utils/auditLogger.js';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Initialize background cron jobs
initCronJobs();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// Security Middleware
app.use(helmet());
app.use(morgan('dev'));

// Stripe Webhook (MUST be before express.json())
app.post('/api/subscription/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/monitor', monitorRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/organization', organizationRoutes);

// Root route
app.get('/', (req, res) => {
    res.send('Personal Data Leak Monitor API is running...');
});

// Socket connection
io.on('connection', (socket) => {
    console.log('⚡ Client connected to socket');
    socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`👤 User joined room: ${userId}`);
    });
    socket.on('disconnect', () => {
        console.log('🔥 Client disconnected');
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5001;

httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready on port ${PORT}`);
    console.log(`📡 API endpoint: http://localhost:${PORT}`);
});

export { io };
