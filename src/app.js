import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';
dotenv.config();

import connectDB from './config/database.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



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

export default app;