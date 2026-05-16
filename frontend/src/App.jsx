import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// 1. Nhập các trang (Pages)
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CreateExamPage from './pages/CreateExamPage';
import AddQuestionPage from './pages/AddQuestionPage';
import ExamDetailPage from './pages/ExamDetailPage';
import ExamPage from './pages/ExamPage';
import ResultDetailPage from './pages/ResultDetailPage';
import RegisterPage from './pages/RegisterPage';

// 2. Nhập "Máy quét thẻ" ProtectedRoute
import ProtectedRoute from './components/ProtectedRoute';

function App() {
    return (
        <Router>
            <Routes>
                {/* --- NHÓM 1: CÔNG CỘNG (Ai cũng vào được) --- */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<Navigate to="/login" />} />

                {/* --- NHÓM 2: TRANG CHUNG (Phải đăng nhập mới vào được) --- */}
                <Route path="/dashboard" element={
                    <ProtectedRoute allowedRoles={['Student', 'Teacher', 'Super Admin']}>
                        <DashboardPage />
                    </ProtectedRoute>
                } />

                <Route path="/exam/:examId" element={
                    <ProtectedRoute allowedRoles={['Student', 'Teacher', 'Super Admin']}>
                        <ExamPage />
                    </ProtectedRoute>
                } />

                <Route path="/result/:resultId" element={
                    <ProtectedRoute allowedRoles={['Student', 'Teacher', 'Super Admin']}>
                        <ResultDetailPage />
                    </ProtectedRoute>
                } />

                {/* --- NHÓM 3: TRANG GIÁO VIÊN (Chỉ Teacher và Super Admin mới vào được) --- */}
                <Route path="/create-exam" element={
                    <ProtectedRoute allowedRoles={['Teacher', 'Super Admin']}>
                        <CreateExamPage />
                    </ProtectedRoute>
                } />

                <Route path="/add-question/:examId" element={
                    <ProtectedRoute allowedRoles={['Teacher', 'Super Admin']}>
                        <AddQuestionPage />
                    </ProtectedRoute>
                } />

                <Route path="/exam-detail/:examId" element={
                    <ProtectedRoute allowedRoles={['Teacher', 'Super Admin']}>
                        <ExamDetailPage />
                    </ProtectedRoute>
                } />

                {/* --- Mặc định nếu gõ sai đường dẫn sẽ về trang login --- */}
                <Route path="*" element={<Navigate to="/login" />} />

                <Route path="/register" element={<RegisterPage />} />

                <Route path="/admin" element={
                    <ProtectedRoute allowedRoles={['Super Admin']}>
                        <AdminUserPage />
                    </ProtectedRoute>
                } />

            </Routes>
        </Router>
    );
}

export default App;