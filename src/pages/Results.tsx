import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { calculatePart1Score, getStrategyLevel, getLevelColor, getLevelDescription } from '../utils/scoring';
import { getRecommendations, type GroupedRecommendation } from '../utils/recommendations';
import part1Data from '../data/part1_quiz.json';
import { Download, Send, CheckCircle } from 'lucide-react';

export const Results: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [part1Score, setPart1Score] = useState<number>(0);
    const [part1Answers, setPart1Answers] = useState<Record<number, number>>({});
    const [recommendations, setRecommendations] = useState<GroupedRecommendation[]>([]);
    const [optIn, setOptIn] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Check for shareable link data first
        const urlScore = searchParams.get('score');
        const urlProblems = searchParams.get('problems');

        if (urlScore && urlProblems) {
            // Load from URL (Shareable Mode)
            const score = parseInt(urlScore, 10);
            const problems = urlProblems.split(','); // simple comma separated list

            setPart1Score(score);
            setRecommendations(getRecommendations(problems));
            // Note: We don't have part1Answers in share mode, so detailed Q1-Q6 won't be shown/scored re-calculated from answers
            // But we have the final score.
        } else {
            // Load from local storage (User taking the test)
            const p1AnswersStr = localStorage.getItem('part1Answers');
            const p2ProblemsStr = localStorage.getItem('part2Problems');

            if (p1AnswersStr) {
                const answers = JSON.parse(p1AnswersStr);
                setPart1Score(calculatePart1Score(answers));
                setPart1Answers(answers);
            }

            if (p2ProblemsStr) {
                const problems = JSON.parse(p2ProblemsStr);
                setRecommendations(getRecommendations(problems));
            }
        }
    }, [searchParams]);

    const level = getStrategyLevel(part1Score);
    const levelColor = getLevelColor(level);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const { title: levelTitle, description: levelDescription } = getLevelDescription(level);

        // Map answers to text
        const answersPayload: Record<string, string> = {};
        part1Data.part1.questions.forEach(q => {
            const score = part1Answers[q.id];
            const option = q.options.find(o => o.score === score);
            answersPayload[`q${q.id}`] = option ? option.text : "";
        });

        const payload = {
            ...formData,
            optIn,
            part1Score,
            level,
            levelTitle,
            levelDescription,
            answers: answersPayload,
            recommendations: recommendations.map(r => ({
                skill: r.skill,
                problem: r.problem,
                solutions: r.solutions,
                questionTypes: r.questionTypes
            })),
            studyPlanLink: `${window.location.origin}${import.meta.env.BASE_URL}results?score=${part1Score}&problems=${recommendations.map(r => r.problem).join(',')}` // Generate link
        };

        try {
            // Replace with your actual Web App URL after deployment
            // For production, this should likely be in an env variable: import.meta.env.VITE_API_URL
            // BUT for now, we leave a placeholder or a manual instruction comment.
            const API_URL = import.meta.env.VITE_API_URL || "https://script.google.com/macros/s/AKfycbxe7ihDA0LnFkjQ1_weWDFiziR0oeqU_IuCAHuY-UVSMG_7Q5cJH-Oko6rJijvTNbum/exec";

            if (!API_URL || API_URL === "YOUR_WEB_APP_URL_HERE") {
                console.warn("API URL not set. Data not sent to backend.");
                // Simulate success for demo
                await new Promise(resolve => setTimeout(resolve, 1500));
            } else {
                // Google Apps Script Web App typically requires no-cors for simple POST from browser
                // or we use content-type hack. 
                // standard fetch:
                await fetch(API_URL, {
                    method: 'POST',
                    body: JSON.stringify(payload),
                    mode: 'no-cors' // Important for opaque response from GAS
                });
            }

            setSubmitted(true);
        } catch (error) {
            console.error("Error submitting form:", error);
            alert("There was an error sending your results. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="max-w-xl mx-auto text-center py-12">
                <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Các bước hoàn tất!</h2>
                <p className="text-gray-600 mb-8">
                    Kết quả và tài liệu IELTS Cambridge Checklist đã được gửi đến email <strong>{formData.email}</strong>.
                </p>
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                    <p className="text-blue-800 font-medium mb-3">Tải xuống quà tặng ngay tại đây:</p>
                    <a
                        href="https://drive.google.com/file/d/1YlDC7x4VN71ooSc4sATSmHVfjzqWDKWm/view?usp=sharing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 underline"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Checklist_IELTS_Cambridge.pdf
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-12">
            {/* Part 1 Results */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <h2 className="text-gray-500 uppercase tracking-wide text-sm font-semibold mb-2">PHẦN 1 – CÁCH BẠN ĐANG HỌC IELTS LISTENING & READING</h2>
                <div className="text-5xl font-bold text-gray-900 mb-4">{part1Score} <span className="text-2xl text-gray-400 font-normal">/ 12</span></div>

                {(() => {
                    const { title, description } = getLevelDescription(level);
                    return (
                        <div className="mt-6">
                            <div className={`inline-block px-4 py-2 rounded-full bg-opacity-10 ${levelColor.replace('text-', 'bg-')} mb-4`}>
                                <h3 className={`text-xl font-bold ${levelColor}`}>{title}</h3>
                            </div>
                            <p className="text-gray-700 max-w-2xl mx-auto whitespace-pre-line leading-relaxed">
                                {description}
                            </p>
                        </div>
                    );
                })()}
            </section>

            {/* Part 2 Recommendations */}
            <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 uppercase">PHẦN 2 – ĐIỂM MẠNH & YẾU CỦA BẠN KHI HỌC IELTS LISTENING/READING</h2>
                <p className="text-gray-600 mb-6">Kết quả của bạn cho thấy:</p>

                {recommendations.length === 0 ? (
                    <p className="text-gray-500 italic">Không tìm thấy vấn đề cụ thể nào trong Phần 2.</p>
                ) : (
                    <div className="space-y-8">
                        {['Listening', 'Reading'].map(skill => {
                            const skillRecs = recommendations.filter(r => r.skill === skill);
                            if (skillRecs.length === 0) return null;

                            return (
                                <div key={skill} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Với kỹ năng {skill}:</h3>
                                    <div className="space-y-6">
                                        {skillRecs.map((item, idx) => (
                                            <div key={idx} className="pl-4 border-l-4 border-orange-100">
                                                <h4 className="font-bold text-lg text-red-600 mb-2">* Vấn đề: {item.problem}</h4>
                                                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-3">
                                                    {item.solutions.map((sol, sIdx) => (
                                                        <li key={sIdx}><span className="font-semibold">Giải pháp:</span> {sol}</li>
                                                    ))}
                                                </ul>
                                                <div className="pl-6">
                                                    <p className="font-semibold text-blue-700 mb-1">Dạng câu hỏi {skill} bạn nên luyện:</p>
                                                    <ul className="list-circle pl-5 text-gray-600 text-sm">
                                                        {item.questionTypes.map((qt, qIdx) => (
                                                            <li key={qIdx}>• {qt}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Next Steps Recommendation */}
            <section className="bg-orange-50 rounded-xl p-6 border border-orange-100">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Bước tiếp theo gợi ý cho bạn:</h3>
                <p className="text-gray-700 mb-2">Trong file <strong>Checklist IELTS Cambridge</strong>, bạn có thể:</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li>Tập trung giải các dạng bài còn yếu</li>
                    <li>Thực hành theo quy trình các bước <strong>TRƯỚC - TRONG - SAU</strong> khi giải đề để có quy trình ôn luyện hiệu quả</li>
                </ul>
            </section>

            {/* Lead Capture Form */}
            <section className="bg-indigo-50 rounded-2xl p-8 border border-indigo-100">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Nhận Báo cáo Đầy đủ</h2>
                    <p className="text-gray-600">
                        Nhập thông tin của bạn để nhận báo cáo chi tiết và tài liệu độc quyền:
                        <strong> Checklist IELTS Cambridge</strong> (file PDF).
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Họ và Tên</label>
                        <input
                            type="text"
                            id="name"
                            required
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ Email</label>
                        <input
                            type="email"
                            id="email"
                            required
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                        <input
                            type="tel"
                            id="phone"
                            required
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    <div className="pt-2">
                        <label className="flex items-start gap-3 p-4 bg-white rounded-lg border border-indigo-100 cursor-pointer hover:border-indigo-300 transition-colors">
                            <input
                                type="checkbox"
                                className="mt-1 h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                checked={optIn}
                                onChange={e => setOptIn(e.target.checked)}
                            />
                            <span className="text-sm text-gray-700">
                                <span className="font-bold text-indigo-700 block mb-1">Tôi muốn được tư vấn miễn phí về Khóa học IELTS Online</span>
                                Nhận lời khuyên từ chuyên gia để cải thiện điểm số dựa trên kết quả này.
                                <ul className="mt-2 space-y-1 text-gray-600 list-disc pl-4">
                                    <li>Được hướng dẫn chi tiết từng bước làm</li>
                                    <li>Được giáo viên đưa ra nhận xét và giải pháp học tập cá nhân hoá</li>
                                    <li>Không mất thêm thời gian loay hoay tìm giải pháp</li>
                                    <li>Có người đồng hành cùng bạn trên hành trình này</li>
                                </ul>
                            </span>
                        </label>
                    </div>

                    <Button type="submit" size="lg" className="w-full mt-4" isLoading={isSubmitting}>
                        Gửi Kết quả & Checklist
                        <Send className="ml-2 h-4 w-4" />
                    </Button>
                </form>
            </section>
        </div>
    );
};
