import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { calculatePart1Score, getStrategyLevel, getLevelColor, getLevelDescription } from '../utils/scoring';
import { getRecommendations, analyzePart2Results, type GroupedRecommendation, type Part2Analysis } from '../utils/recommendations';
import part1Data from '../data/part1_quiz.json';
import part2Data from '../data/part2_quiz.json';
import { Download, Send, CheckCircle } from 'lucide-react';

export const Results: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [part1Score, setPart1Score] = useState<number>(0);
    const [part1Answers, setPart1Answers] = useState<Record<number, number>>({});
    const [recommendations, setRecommendations] = useState<GroupedRecommendation[]>([]);

    // New state for Part 2 detailed analysis and raw answers
    const [part2AnswersRaw, setPart2AnswersRaw] = useState<Record<string, string[]>>({});
    const [part2Analysis, setPart2Analysis] = useState<Part2Analysis>({
        listening: { topProblems: [], topSolutions: [], topQuestionTypes: [] },
        reading: { topProblems: [], topSolutions: [], topQuestionTypes: [] }
    });

    const [optIn, setOptIn] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Check for shareable link data first
        const urlScore = searchParams.get('score');
        const urlProblems = searchParams.get('problems'); // Legacy or simple share
        // Note: Shareable link update for full analysis is tricky without a large payload or robust backend.
        // For now, we keep supporting partial restore for shareable mode via 'problems' param if we can't fully restore answers map.
        // Or we update generating link to include something smarter.
        // Given current robust backend absence, we might accept that Shared link shows "approximate" analysis if we only pass prob list.
        // But the prompt implies we want this format for the User Result.

        if (urlScore && urlProblems) {
            // Load from URL (Shareable Mode)
            const score = parseInt(urlScore, 10);
            const problems = urlProblems.split(',');

            setPart1Score(score);
            setRecommendations(getRecommendations(problems));

            // Reconstruct a dummy 'part2AnswersRaw' from problems list? 
            // It's hard to map back to QID without ambiguity if options text are same.
            // But for analysis (Top 3), we don't strictly need QID, just the skill.
            // However `analyzePart2Results` expects QID map to verify Skill.
            // We can try to reverse match problems to Questions to build a fake map for analysis.
            const reconstructedAnswers: Record<string, string[]> = {};
            part2Data.part2.questions.forEach(q => {
                const matched = q.options.filter(opt => problems.includes(opt));
                if (matched.length > 0) {
                    reconstructedAnswers[q.id] = matched;
                }
            });
            setPart2AnswersRaw(reconstructedAnswers);
            setPart2Analysis(analyzePart2Results(reconstructedAnswers));

        } else {
            // Load from local storage (User taking the test)
            const p1AnswersStr = localStorage.getItem('part1Answers');
            const p2AnswersMapStr = localStorage.getItem('part2Answers');
            const p2ProblemsStr = localStorage.getItem('part2Problems'); // Fallback

            if (p1AnswersStr) {
                const answers = JSON.parse(p1AnswersStr);
                setPart1Score(calculatePart1Score(answers));
                setPart1Answers(answers);
            }

            if (p2AnswersMapStr) {
                const answersMap = JSON.parse(p2AnswersMapStr);
                setPart2AnswersRaw(answersMap);
                setPart2Analysis(analyzePart2Results(answersMap));
                const allProblems = Object.values(answersMap).flat() as string[];
                setRecommendations(getRecommendations(allProblems));
            } else if (p2ProblemsStr) {
                // Legacy fallback
                const problems = JSON.parse(p2ProblemsStr);
                setRecommendations(getRecommendations(problems));

                // Attempt reconstruction for analysis
                const reconstructedAnswers: Record<string, string[]> = {};
                part2Data.part2.questions.forEach(q => {
                    const matched = q.options.filter(opt => problems.includes(opt));
                    if (matched.length > 0) {
                        reconstructedAnswers[q.id] = matched;
                    }
                });
                setPart2AnswersRaw(reconstructedAnswers);
                setPart2Analysis(analyzePart2Results(reconstructedAnswers));
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

        // Generate summary of problems for teacher email fallback
        const problemsSummary = [
            ...part2Analysis.listening.topProblems,
            ...part2Analysis.reading.topProblems
        ].join(', ');

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
            // Send the pre-calculated analysis to backend
            part2Analysis: {
                listening: part2Analysis.listening,
                reading: part2Analysis.reading
            },
            problems: problemsSummary, // Explicitly send for teacher alert
            studyPlanLink: `${window.location.origin}${import.meta.env.BASE_URL}results?score=${part1Score}&problems=${recommendations.map(r => r.problem).join(',')}`
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

            {/* Part 2: User Selections & Analysis */}
            <section>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4">PHẦN 2 – LỰA CHỌN CỦA BẠN</h2>
                    <p className="text-gray-600 mb-4">Một bạn A chọn các phương án như sau:</p>

                    <div className="space-y-6">
                        {part2Data.part2.questions.map((q) => {
                            // Find selected answers for this question
                            // If user is viewing shared link, we might not have detailed answers, only aggregated problems.
                            // In that case, we iterate options and check if option text is in the problem list.
                            // BUT, "problem" might be effectively same across skills, so this is an approximation for shared mode.
                            const selectedForQ = part2AnswersRaw[q.id] || [];

                            // Fallback for share mode where we only have flat list of recommendations/problems
                            // We check if the option text is included in the list of problems derived from recommendations?
                            // Actually recommendations list has 'problem' key.
                            const isSelected = (optText: string) => {
                                if (part2AnswersRaw && Object.keys(part2AnswersRaw).length > 0) {
                                    return selectedForQ.includes(optText);
                                }
                                // Share mode fallback: check if this text appears in our recommendations list
                                return recommendations.some(r => r.problem === optText);
                            };

                            return (
                                <div key={q.id}>
                                    <h3 className="font-semibold text-gray-900 mb-2">{q.question_text}</h3>
                                    <div className="space-y-2">
                                        {q.options.map((opt, i) => {
                                            const selected = isSelected(opt);
                                            return (
                                                <div key={i} className={`flex items-start gap-2 ${selected ? 'text-indigo-700 font-medium' : 'text-gray-500'}`}>
                                                    <span className="mt-1">
                                                        {selected ? '☑' : '⬜'}
                                                    </span>
                                                    <span>{opt}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 uppercase border-b pb-4">KẾT QUẢ PHÂN TÍCH CHI TIẾT</h2>
                    <p className="text-gray-600 mb-6">Kết quả của bạn cho thấy:</p>

                    {(!part2Analysis.listening.topProblems.length && !part2Analysis.reading.topProblems.length) ? (
                        <p className="text-gray-500 italic text-center py-4">Chưa có dữ liệu phân tích chi tiết cho phần này.</p>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Listening Analysis */}
                            {part2Analysis.listening.topProblems.length > 0 && (
                                <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 h-full">
                                    <h3 className="text-xl font-bold text-indigo-800 mb-6 flex items-center">
                                        <span className="bg-indigo-100 text-indigo-600 p-2 rounded-lg mr-3">🎧</span>
                                        Với kỹ năng Listening:
                                    </h3>

                                    <div className="space-y-6">
                                        <div>
                                            <p className="font-bold text-gray-800 mb-2">03 vấn đề chính của bạn với kỹ năng Listening là:</p>
                                            <ul className="space-y-1 pl-1">
                                                {part2Analysis.listening.topProblems.map((item, idx) => (
                                                    <li key={idx} className="flex items-start text-gray-700">
                                                        <span className="text-indigo-500 mr-2 font-bold">+</span>
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div>
                                            <p className="font-bold text-gray-800 mb-2">03 giải pháp chính cho kỹ năng Listening:</p>
                                            <ul className="space-y-1 pl-1">
                                                {part2Analysis.listening.topSolutions.map((item, idx) => (
                                                    <li key={idx} className="flex items-start text-gray-700">
                                                        <span className="text-green-500 mr-2 font-bold">+</span>
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div>
                                            <p className="font-bold text-gray-800 mb-2">03 dạng bài Listening bạn cần tập trung nhiều nhất:</p>
                                            <ul className="space-y-1 pl-1">
                                                {part2Analysis.listening.topQuestionTypes.map((item, idx) => (
                                                    <li key={idx} className="flex items-start text-gray-700">
                                                        <span className="text-orange-500 mr-2 font-bold">+</span>
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Reading Analysis */}
                            {part2Analysis.reading.topProblems.length > 0 && (
                                <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 h-full">
                                    <h3 className="text-xl font-bold text-emerald-800 mb-6 flex items-center">
                                        <span className="bg-emerald-100 text-emerald-600 p-2 rounded-lg mr-3">📖</span>
                                        Với kỹ năng Reading:
                                    </h3>

                                    <div className="space-y-6">
                                        <div>
                                            <p className="font-bold text-gray-800 mb-2">03 vấn đề chính của bạn với kỹ năng Reading là:</p>
                                            <ul className="space-y-1 pl-1">
                                                {part2Analysis.reading.topProblems.map((item, idx) => (
                                                    <li key={idx} className="flex items-start text-gray-700">
                                                        <span className="text-emerald-500 mr-2 font-bold">+</span>
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div>
                                            <p className="font-bold text-gray-800 mb-2">03 giải pháp cho kỹ năng Reading:</p>
                                            <ul className="space-y-1 pl-1">
                                                {part2Analysis.reading.topSolutions.map((item, idx) => (
                                                    <li key={idx} className="flex items-start text-gray-700">
                                                        <span className="text-blue-500 mr-2 font-bold">+</span>
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div>
                                            <p className="font-bold text-gray-800 mb-2">03 dạng bài Reading bạn cần tập trung nhiều nhất:</p>
                                            <ul className="space-y-1 pl-1">
                                                {part2Analysis.reading.topQuestionTypes.map((item, idx) => (
                                                    <li key={idx} className="flex items-start text-gray-700">
                                                        <span className="text-orange-500 mr-2 font-bold">+</span>
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
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
