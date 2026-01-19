import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';
dotenv.config();

import connectDB from './config/database.js';
import helmetConfig from './config/security.js';
import corsConfig from './config/cors.js';
import { apiLimiter, authLimiter, generalLimiter, uploadLimiter } from './config/rateLimit.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

connectDB();

// Security middleware (phải đặt trước)
// 1. Helmet để thiết lập các header bảo mật
app.use(helmetConfig);

// 2. CORS
app.use(corsConfig);

// 3. Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. logger middleware (nếu cần)

// 5. rate limiting middleware (nếu cần)
app.use(generalLimiter);

// ROUTES
// API routes với rate limiting riêng (nếu cần)
app.use('/api', apiLimiter);


// auth routes với rate limiting nghiêm ngặt
app.use("/api/auth/login", authLimiter)
app.use("/api/auth/register", authLimiter)
app.use("/api/auth/forgot-password", authLimiter)

// Upload routes với rate limiting riêng (nếu cần)
app.use('/api/upload', uploadLimiter);

// set Pug as template engine
app.set('view engine', 'pug');

// set views directory
app.set('views', path.join(__dirname, 'views'));

// static file public directory
app.use(express.static(path.join(__dirname, '../public')));


// app.get('/', (req, res) => {
//     res.render('pages/client/Home/index', { title: 'Home' });
// });

app.use('/', routes);

// Error handler middleware - Phải đặt sau tất cả routes
app.use(errorHandler);

export default app;