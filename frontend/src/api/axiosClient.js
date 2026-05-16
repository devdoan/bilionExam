import axios from 'axios';

const axiosClient = axios.create({
    // Thay link localhost bằng link Render của bạn (nhớ giữ lại đoạn /api ở cuối)
    baseURL: 'https://api.nathanli.site/api',
    headers: { 'Content-Type': 'application/json' },
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