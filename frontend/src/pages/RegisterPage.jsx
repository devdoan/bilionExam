// frontend/src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate, Link } from 'react-router-dom';

const RegisterPage = () => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '', adminSecret: '' });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axiosClient.post('/auth/register', formData);
            alert('🎉 Đăng ký thành công! Hãy đăng nhập để bắt đầu.');
            navigate('/login');
        } catch (error) {
            alert('❌ Lỗi: ' + (error.response?.data?.message || 'Không thể đăng ký'));
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
            <form onSubmit={handleSubmit} style={{ background: 'white', padding: '40px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '320px' }}>
                <h2 style={{ textAlign: 'center', color: '#28A745', marginBottom: '20px' }}>TẠO TÀI KHOẢN</h2>

                <div style={{ marginBottom: '15px' }}>
                    <input
                        type="text"
                        placeholder="Tên đăng nhập"
                        onChange={e => setFormData({...formData, username: e.target.value})}
                        required
                        style={{ width: '100%', padding: '12px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <input
                        type="email"
                        placeholder="Email"
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        required
                        style={{ width: '100%', padding: '12px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <input
                        type="password"
                        placeholder="Mật khẩu"
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        required
                        style={{ width: '100%', padding: '12px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                    />
                </div>

                {/* Ô nhập bí mật nhỏ, làm mờ đi một chút để tránh học sinh tò mò */}
                <div style={{ marginBottom: '20px' }}>
                    <input
                        type="password"
                        placeholder="Mã đặc quyền (Nếu có)"
                        onChange={e => setFormData({...formData, adminSecret: e.target.value})}
                        style={{ width: '100%', padding: '12px', borderRadius: '5px', border: '1px dashed #ccc', background: '#f9f9f9', boxSizing: 'border-box' }}
                    />
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '5px', textAlign: 'right' }}>
                        * Học sinh vui lòng bỏ trống ô này
                    </div>
                </div>

                <button type="submit" style={{ width: '100%', padding: '12px', background: '#28A745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
                    ĐĂNG KÝ
                </button>

                {/* Nút liên kết về trang Đăng nhập */}
                <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
                    Đã có tài khoản? <Link to="/login" style={{ color: '#1877f2', textDecoration: 'none', fontWeight: 'bold' }}>Đăng nhập ngay</Link>
                </div>
            </form>
        </div>
    );
};

export default RegisterPage;