import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { database } from './src/database';

// Load environment variables
dotenv.config({ path: '.env.development' });

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN 
    ? (process.env.CORS_ORIGIN as string).split(',')
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging middleware
if (NODE_ENV !== 'test') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  const dbHealth = await database.health();
  
  res.json({
    status: dbHealth.status === 'healthy' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    service: 'Health-System-Payment',
    version: '1.0.0',
    environment: NODE_ENV,
    database: dbHealth
  });
});

// API info endpoint
app.get('/api', (req: Request, res: Response) => {
  res.json({
    message: 'Health-System-Payment API v1.0.0',
    status: 'operational',
    endpoints: {
      health: '/api/health',
      dashboard: '/api/dashboard/stats',
      documentation: 'https://github.com/mohcc-zw/kudombela-data-trust'
    },
    features: {
      authentication: '',
      authorization: '',
      emailOTP: '',
      backupEmail: '',
      dataManagement: ''
    },
    
  });
});

// Dashboard stats endpoint
app.get('/api/dashboard/stats', (req: Request, res: Response) => {
  const stats = {
    timestamp: new Date().toISOString(),
    totalPayments: 125000,
    totalAmount: 2500000, 
    status: 'operational'
  };
  res.json(stats);
});

// Simple echo endpoint for testing
app.post('/api/test', (req: Request, res: Response) => {
  res.json({
    message: 'Echo test successful',
    receivedData: req.body,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  
  const status = err.status || 500;
  const message = NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;
  
  res.status(status).json({
    error: message,
    status: status,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method,
    availableEndpoints: {
      health: 'GET /api/health',
      api: 'GET /api',
      stats: 'GET /api/dashboard/stats',
      test: 'POST /api/test'
    }
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n================================================`);
  console.log(`Health-System-Payment API`);
  console.log(`Version: 1.0.0 | Environment: ${NODE_ENV}`);
  console.log(`================================================`);
  console.log(`✓ Server running on http://0.0.0.0:${PORT}`);
  console.log(`✓ Health Check: http://localhost:${PORT}/api/health`);
  console.log(`✓ API Info: http://localhost:${PORT}/api`);
  console.log(`✓ Dashboard Stats: http://localhost:${PORT}/api/dashboard/stats`);
  console.log(`================================================\n`);
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('\nShutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  
  // Force exit after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

export default app;
