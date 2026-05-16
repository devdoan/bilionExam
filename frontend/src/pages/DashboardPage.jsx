import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

const DashboardPage = () => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user'));
    const isAdminOrTeacher = user?.role === 'Teacher' || user?.role === 'Super Admin';

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const response = await axiosClient.get('/exams');
                setExams(response.data);
            } catch (error) {
                console.error("Lỗi tải danh sách đề thi");
            } finally {
                setLoading(false);
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
            alert("❌ Lỗi khi xuất file Excel! Có thể chưa có ai làm bài.");
        }
    };

    // Bổ sung tính năng Xóa đề thi
    const handleDelete = async (examId) => {
        if (window.confirm("⚠️ Bạn có chắc chắn muốn xóa toàn bộ đề thi này không?")) {
            try {
                await axiosClient.delete(`/exams/${examId}`);
                alert("✅ Đã xóa đề thi thành công!");
                setExams(exams.filter(e => e._id !== examId)); // Vẽ lại bảng mà không cần F5
            } catch (error) {
                alert("❌ Lỗi khi xóa đề thi!");
            }
        }
    };

    if (loading) return <p style={{ padding: '20px' }}>⏳ Đang tải danh sách đề thi...</p>;

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <h1 style={{ color: '#4A90E2' }}>
                👋 Chào mừng {user?.role === 'Student' ? 'Học sinh' : 'Giáo viên'}: {user?.username}
            </h1>

            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>📚 Danh sách đề thi hiện có:</h3>
                {isAdminOrTeacher && (
                    <button
                        onClick={() => navigate('/create-exam')}
                        style={{ padding: '10px 20px', background: '#28A745', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '5px', fontWeight: 'bold' }}
                    >
                        ➕ Tạo đề thi mới
                    </button>
                )}
            </div>

            <table border="1" cellPadding="12" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <thead style={{ backgroundColor: '#f4f4f4' }}>
                <tr>
                    <th>Tên đề thi</th>
                    <th>Thời gian (phút)</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                </tr>
                </thead>
                <tbody>
                {exams.map((exam) => (
                    <tr key={exam._id}>
                        <td><strong>{exam.title}</strong></td>
                        <td>{exam.timeLimit}</td>
                        <td>
                            <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', background: exam.isPublished ? '#d4edda' : '#fff3cd', color: exam.isPublished ? '#155724' : '#856404' }}>
                                {exam.isPublished ? '✅ Đã đăng' : '🛠️ Đang soạn'}
                            </span>
                        </td>
                        <td>
                            <button
                                onClick={() => navigate(`/exam/${exam._id}`)}
                                style={{ margin: '2px', background: '#007bff', color: 'white', cursor: 'pointer', border: 'none', padding: '6px 10px', borderRadius: '4px' }}
                            >
                                ✍️ Làm bài
                            </button>

                            {isAdminOrTeacher && (
                                <>
                                    <button
                                        onClick={() => navigate(`/add-question/${exam._id}`)}
                                        style={{ margin: '2px', background: '#fd7e14', color: 'white', cursor: 'pointer', border: 'none', padding: '6px 10px', borderRadius: '4px' }}
                                    >
                                        Câu hỏi
                                    </button>

                                    <button
                                        onClick={() => navigate(`/exam-detail/${exam._id}`)}
                                        style={{ margin: '2px', background: '#6c757d', color: 'white', cursor: 'pointer', border: 'none', padding: '6px 10px', borderRadius: '4px' }}
                                    >
                                        Chi tiết
                                    </button>

                                    <button
                                        onClick={() => handleExport(exam._id, exam.title)}
                                        style={{ margin: '2px', background: '#28a745', color: 'white', cursor: 'pointer', border: 'none', padding: '6px 10px', borderRadius: '4px' }}
                                    >
                                        📊 Xuất Excel
                                    </button>

                                    <button
                                        onClick={() => handleDelete(exam._id)}
                                        style={{ margin: '2px', color: '#dc3545', cursor: 'pointer', background: 'none', border: '1px solid #dc3545', padding: '5px 10px', borderRadius: '4px' }}
                                    >
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