import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

const DashboardPage = () => {
    const [exams, setExams] = useState([]);
    const navigate = useNavigate();

    // 1. Lấy thông tin user và xác định quyền hạn
    const user = JSON.parse(localStorage.getItem('user'));
    const isAdminOrTeacher = user?.role === 'Teacher' || user?.role === 'Super Admin';

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const response = await axiosClient.get('/exams');
                setExams(response.data);
            } catch (error) {
                console.error("Lỗi tải danh sách đề thi");
            }
        };
        fetchExams();
    }, []);

    const handleExport = async (examId, examTitle) => {
        try {
            const res = await axiosClient.get(`/exams/${examId}/all-results`);
            const dataToExport = res.data.map((item, index) => ({
                "STT": index + 1,
                "Tên học sinh": item.studentId?.username || "N/A",
                "Email": item.studentId?.email || "N/A",
                "Điểm số": item.score,
                "Thời gian nộp": new Date(item.createdAt).toLocaleString('vi-VN')
            }));

            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Bảng điểm");
            XLSX.writeFile(workbook, `Bang_Diem_${examTitle}.xlsx`);
            alert('✅ Xuất file Excel thành công!');
        } catch (error) {
            alert("❌ Lỗi khi xuất file Excel!");
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            {/* Hiển thị lời chào theo chức vụ */}
            <h1>👋 Chào mừng {user?.role === 'Student' ? 'Học sinh' : 'Giáo viên'}: {user?.username}</h1>

            <div style={{ marginBottom: '20px' }}>
                {/* 2. CHỈ HIỆN nút Tạo đề nếu là Giáo viên hoặc Admin */}
                {isAdminOrTeacher && (
                    <button
                        onClick={() => navigate('/create-exam')}
                        style={{ padding: '10px 20px', background: 'green', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '5px' }}
                    >
                        ➕ Tạo đề thi mới
                    </button>
                )}
            </div>

            <h3>📚 Danh sách đề thi:</h3>
            <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                <thead>
                <tr style={{ background: '#f2f2f2' }}>
                    <th>Tên đề thi</th>
                    <th>Thời gian (phút)</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                </tr>
                </thead>
                <tbody>
                {exams.map((exam) => (
                    <tr key={exam._id}>
                        <td>{exam.title}</td>
                        <td>{exam.timeLimit}</td>
                        <td>{exam.isPublished ? '✅ Đã đăng' : '🛠️ Đang soạn'}</td>
                        <td>
                            {/* 3. PHÂN QUYỀN TRONG HÀNH ĐỘNG */}

                            {/* Nút làm bài: Ai cũng thấy */}
                            <button
                                onClick={() => navigate(`/exam/${exam._id}`)}
                                style={{ marginRight: '5px', background: 'blue', color: 'white', cursor: 'pointer', border: 'none', padding: '5px 10px', borderRadius: '3px' }}
                            >
                                ✍️ Làm bài
                            </button>

                            {/* Các nút quản trị: Chỉ Giáo viên/Admin thấy */}
                            {isAdminOrTeacher && (
                                <>
                                    <button
                                        onClick={() => navigate(`/add-question/${exam._id}`)}
                                        style={{ marginRight: '5px', background: 'orange', color: 'white', cursor: 'pointer', border: 'none', padding: '5px 10px', borderRadius: '3px' }}
                                    >
                                        Thêm câu hỏi
                                    </button>

                                    <button
                                        onClick={() => navigate(`/exam-detail/${exam._id}`)}
                                        style={{ marginRight: '5px', cursor: 'pointer', padding: '5px 10px', borderRadius: '3px' }}
                                    >
                                        Xem chi tiết
                                    </button>

                                    <button
                                        onClick={() => handleExport(exam._id, exam.title)}
                                        style={{ marginRight: '5px', background: '#28A745', color: 'white', cursor: 'pointer', border: 'none', padding: '5px 10px', borderRadius: '3px' }}
                                    >
                                        📊 Xuất Excel
                                    </button>

                                    <button style={{ color: 'red', cursor: 'pointer', background: 'none', border: '1px solid red', padding: '5px 10px', borderRadius: '3px' }}>
                                        Xóa
                                    </button>
                                </>
                            )}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default DashboardPage;