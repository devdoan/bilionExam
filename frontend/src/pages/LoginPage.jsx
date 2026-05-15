import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage = () => {
    // 1. Đổi email thành username để khớp với Backend
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // 2. Gửi username và password lên server
            const response = await axiosClient.post('/auth/login', { username, password });

            // Lưu Token và thông tin User (có chứa Role) vào máy học sinh/giáo viên
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            alert('✅ Đăng nhập thành công!');

            // Chuyển hướng về trang chủ
            navigate('/dashboard');
        } catch (error) {
            // Hiển thị lỗi chi tiết từ Server nếu có
            const message = error.response?.data?.message || 'Sai tên đăng nhập hoặc mật khẩu!';
            alert('❌ ' + message);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
            <form onSubmit={handleLogin} style={{ background: 'white', padding: '40px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '320px' }}>
                <h2 style={{ textAlign: 'center', color: '#1877f2', marginBottom: '20px' }}>ĐĂNG NHẬP</h2>

                <div style={{ marginBottom: '15px' }}>
                    <input
                        type="text"
                        placeholder="Tên đăng nhập hoặc Email"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={{ width: '100%', padding: '12px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <input
                        type="password"
                        placeholder="Mật khẩu"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '12px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                    />
                </div>

                <button type="submit" style={{ width: '100%', padding: '12px', background: '#1877f2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
                    ĐĂNG NHẬP
                </button>

                {/* 3. NÚT QUAN TRỌNG NHẤT: Dẫn sang trang đăng ký */}
                <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
                    Chưa có tài khoản? <Link to="/register" style={{ color: '#1877f2', textDecoration: 'none', fontWeight: 'bold' }}>Đăng ký ngay</Link>
                </div>
            </form>
        </div>
    );
};

export default LoginPage;