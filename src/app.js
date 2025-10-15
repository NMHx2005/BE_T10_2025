import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

import connectDB from './config/database.js';

const app = express();

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.json({
        message: 'Product Management API',
        status: 'OK',
        database: 'Connected'
    });
});

export default app;