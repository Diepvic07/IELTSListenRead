import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { ArrowRight, BookOpen, CheckCircle } from 'lucide-react';

export const Welcome: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="max-w-2xl mx-auto text-center">
            <div className="mb-10 mt-6">
                <div className="mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                    <BookOpen className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Đánh giá chiến lược luyện IELTS
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                    Tìm ra những điểm yếu tiềm ẩn trong kỹ năng Nghe & Đọc.
                    Đánh giá độ hiệu quả của chiến lược ôn luyện hiện tại.
                    Nhận kế hoạch hành động cá nhân hóa chỉ trong vài phút.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-10 text-left">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-semibold text-lg mb-2 flex items-center">
                        <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">1</span>
                        Đánh giá chiến lược
                    </h3>
                    <p className="text-gray-600 text-sm">Đánh giá thói quen học tập và chiến lược làm bài thi hiện tại của bạn.</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-semibold text-lg mb-2 flex items-center">
                        <span className="bg-green-100 text-green-700 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">2</span>
                        Chẩn đoán vấn đề
                    </h3>
                    <p className="text-gray-600 text-sm">Xác định các thách thức cụ thể mà bạn gặp phải trong phần Nghe và Đọc.</p>
                </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl mb-10 text-sm text-gray-500">
                <p className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4" /> Chỉ tốn chưa đầy 5 phút
                </p>
            </div>

            <Button size="lg" onClick={() => navigate('/part1')} className="w-full md:w-auto text-lg px-8 py-4">
                Bắt đầu Bài đánh giá
                <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
        </div>
    );
};
