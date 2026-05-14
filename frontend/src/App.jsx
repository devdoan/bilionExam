import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CreateExamPage from './pages/CreateExamPage';
import AddQuestionPage from './pages/AddQuestionPage';
import ExamDetailPage from './pages/ExamDetailPage';
import ExamPage from './pages/ExamPage';
import ResultDetailPage from './pages/ResultDetailPage';

function App() {
    return (
        <Router>
            <Routes>
                {/* Trang đăng nhập */}
                <Route path="/login" element={<LoginPage />} />

                {/* Trang quản trị (Dashboard) */}
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* Trang tạo đề thi mới */}
                <Route path="/create-exam" element={<CreateExamPage />} />

                {/* Mặc định nếu gõ sai sẽ về trang login */}
                <Route path="*" element={<Navigate to="/login" />} />
                <Route path="/add-question/:examId" element={<AddQuestionPage />} /> {/* :examId là tham số động */}
                <Route path="/exam-detail/:examId" element={<ExamDetailPage />} />
                <Route path="/exam/:examId" element={<ExamPage />} />
                <Route path="/result/:resultId" element={<ResultDetailPage />} />
            </Routes>
        </Router>
    );
}

export default App;