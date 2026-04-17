// Phải chạy trước mọi import khác để ESM nạp biến môi trường trước khi connect DB.
import 'dotenv/config';
import app from './src/app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Environment: ${process.env.NODE_ENV}`);
});

process.on('SIGINT', () => {
    console.log("Shutting down server...");
    process.exit();
});