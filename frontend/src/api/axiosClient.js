import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:5000/api', // Đường dẫn đến Backend Node.js của bạn
    headers: {
        'Content-Type': 'application/json',
    },
});

// Tự động gắn Token vào mọi yêu cầu nếu đã đăng nhập
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default axiosClient;