import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axiosClient.post('/auth/login', { email, password });
            // Lưu Token vào bộ nhớ trình duyệt
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            alert('✅ Đăng nhập thành công!');
            // Sau này sẽ chuyển hướng sang trang Admin hoặc Trang thi
            navigate('/dashboard');
        } catch (error) {
            alert('❌ Lỗi: ' + (error.response?.data?.message || 'Đăng nhập thất bại'));
        }
    };

    return (
        <div style={{ padding: '50px', textAlign: 'center' }}>
            <h2>🔑 ĐĂNG NHẬP HỆ THỐNG</h2>
            <form onSubmit={handleLogin} style={{ display: 'inline-block', textAlign: 'left' }}>
                <div>
                    <label>Email:</label><br />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <br />
                <div>
                    <label>Mật khẩu:</label><br />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <br />
                <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer' }}>Đăng nhập</button>
            </form>
        </div>
    );
};

export default LoginPage;