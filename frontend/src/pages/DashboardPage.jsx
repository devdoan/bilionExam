import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx'; // Thư viện hỗ trợ xuất file Excel [cite: 2077, 2078]

const DashboardPage = () => {
    const [exams, setExams] = useState([]);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    // Tải danh sách đề thi khi trang web vừa mở [cite: 1902]
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

    // Hàm xử lý xuất bảng điểm ra file Excel [cite: 2078]
    const handleExport = async (examId, examTitle) => {
        try {
            // 1. Gọi API lấy dữ liệu bảng điểm của tất cả học sinh [cite: 2074, 2075]
            const res = await axiosClient.get(`/exams/${examId}/all-results`);

            // 2. Định dạng lại dữ liệu để đưa vào Excel [cite: 2078]
            const dataToExport = res.data.map((item, index) => ({
                "STT": index + 1,
                "Tên học sinh": item.studentId?.username || "N/A",
                "Email": item.studentId?.email || "N/A",
                "Điểm số": item.score,
                "Thời gian nộp": new Date(item.createdAt).toLocaleString('vi-VN')
            }));

            // 3. Sử dụng thư viện xlsx để tạo và tải file về máy [cite: 2078]
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
            <h1>👨‍🏫 Chào mừng giáo viên: {user?.username}</h1>
            <div style={{ marginBottom: '20px' }}>
                {/* Nút điều hướng sang trang tạo đề thi mới  */}
                <button
                    onClick={() => navigate('/create-exam')}
                    style={{ padding: '10px 20px', background: 'green', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '5px' }}
                >
                    ➕ Tạo đề thi mới
                </button>
            </div>

            <h3>📚 Danh sách đề thi của bạn:</h3>
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
                            {/* Nút thêm câu hỏi cho đề thi tương ứng [cite: 1966, 1978] */}
                            <button
                                onClick={() => navigate(`/add-question/${exam._id}`)}
                                style={{ marginRight: '5px', background: 'orange', color: 'white', cursor: 'pointer', border: 'none', padding: '5px 10px', borderRadius: '3px' }}
                            >
                                Thêm câu hỏi
                            </button>

                            {/* Nút xem chi tiết toàn bộ đề thi [cite: 1987, 1988] */}
                            <button
                                onClick={() => navigate(`/exam-detail/${exam._id}`)}
                                style={{ marginRight: '5px', cursor: 'pointer', padding: '5px 10px', borderRadius: '3px' }}
                            >
                                Xem chi tiết
                            </button>

                            {/* Nút làm bài thi (dành cho học sinh hoặc giáo viên test) [cite: 2053] */}
                            <button
                                onClick={() => navigate(`/exam/${exam._id}`)}
                                style={{ marginRight: '5px', background: 'blue', color: 'white', cursor: 'pointer', border: 'none', padding: '5px 10px', borderRadius: '3px' }}
                            >
                                ✍️ Làm bài
                            </button>

                            {/* Nút xuất bảng điểm ra Excel [cite: 2079, 2080] */}
                            <button
                                onClick={() => handleExport(exam._id, exam.title)}
                                style={{ marginRight: '5px', background: '#28A745', color: 'white', cursor: 'pointer', border: 'none', padding: '5px 10px', borderRadius: '3px' }}
                            >
                                📊 Xuất Excel
                            </button>

                            {/* Nút xóa đề thi (tạm thời chưa gắn logic xóa) [cite: 1978] */}
                            <button style={{ color: 'red', cursor: 'pointer', background: 'none', border: '1px solid red', padding: '5px 10px', borderRadius: '3px' }}>
                                Xóa
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default DashboardPage;