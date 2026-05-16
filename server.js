// Nhúng các thư viện cần thiết
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Giúp đọc các biến bảo mật từ file .env

// Khởi tạo app Express (khung server cơ bản)
const app = express();

// Cấu hình Middleware
app.use(cors({
    origin: 'https://nathanli.site', // Chỉ cho tên miền này gọi API
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
})); // Người gác cổng: Cho phép Frontend có quyền gửi yêu cầu đến Backend [cite: 272]
app.use(express.json()); // Cho phép Server đọc và xử lý dữ liệu dạng JSON

// Cấu hình cổng chạy và lấy chuỗi kết nối Database
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Thêm dòng này để kiểm tra xem file .env đang "nhả" ra cái gì:
console.log("👉 Chuỗi đang đọc được là:", MONGO_URI);

// Tương tác với MongoDB qua mongoose [cite: 271]
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ Kết nối Cơ sở dữ liệu MongoDB Atlas thành công!');

        // Chỉ khởi động lắng nghe yêu cầu khi đã kết nối Database thành công
        app.listen(PORT, () => {
            console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('❌ Lỗi kết nối Database:', error.message);
    });

// Gọi các API từ thư mục routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/exams', require('./routes/exam'));
app.use('/api/questions', require('./routes/question'));
app.use('/api/users', require('./routes/user'));

// Tạo một API test cơ bản để kiểm tra
app.get('/', (req, res) => {
    res.send('Hệ thống API Thi Trực Tuyến đang hoạt động rất tốt!');
});
