// frontend/src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '', adminSecret: '' });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axiosClient.post('/auth/register', formData);
            alert('🎉 Đăng ký thành công!');
            navigate('/login');
        } catch (error) {
            alert('❌ Lỗi: ' + error.response?.data?.message);
        }
    };

    return (
        <div style={{ padding: '50px', maxWidth: '400px', margin: '0 auto' }}>
            <h2>ĐĂNG KÝ TÀI KHOẢN</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Tên đăng nhập" onChange={e => setFormData({...formData, username: e.target.value})} required style={{width: '100%', marginBottom: '10px', padding: '10px'}} />
                <input type="email" placeholder="Email" onChange={e => setFormData({...formData, email: e.target.value})} required style={{width: '100%', marginBottom: '10px', padding: '10px'}} />
                <input type="password" placeholder="Mật khẩu" onChange={e => setFormData({...formData, password: e.target.value})} required style={{width: '100%', marginBottom: '10px', padding: '10px'}} />

                {/* Một ô nhập bí mật nhỏ, nếu không nhập thì mặc định là Student */}
                <input type="password" placeholder="Mã đặc biệt (Nếu có)" onChange={e => setFormData({...formData, adminSecret: e.target.value})} style={{width: '100%', marginBottom: '10px', padding: '10px', background: '#eee'}} />

                <button type="submit" style={{width: '100%', padding: '10px', background: '#007bff', color: 'white', border: 'none'}}>ĐĂNG KÝ</button>
            </form>
        </div>
    );
};
export default RegisterPage;