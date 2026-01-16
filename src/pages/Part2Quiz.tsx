import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { QuizData } from '../types/quiz';
import { QuestionCard } from '../components/QuestionCard';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { ArrowRight } from 'lucide-react';
import part2Data from '../data/part2_quiz.json';

// Type assertion
const quizData = part2Data as unknown as QuizData;

export const Part2Quiz: React.FC = () => {
    const navigate = useNavigate();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string[]>>({}); // questionId -> selected options array

    // Filter to ensure we only get valid questions if structure varies, 
    // but based on file, it's quizData.part2.questions
    const questions = quizData.part2.questions;
    const currentQuestion = questions[currentQuestionIndex];
    const totalQuestions = questions.length;

    const handleSelectAnswer = (questionId: string, value: string) => {
        setAnswers(prev => {
            const currentSelected = prev[questionId] || [];
            if (currentSelected.includes(value)) {
                // Deselect
                return {
                    ...prev,
                    [questionId]: currentSelected.filter(item => item !== value)
                };
            } else {
                // Select
                return {
                    ...prev,
                    [questionId]: [...currentSelected, value]
                };
            }
        });
    };

    const handleNext = () => {
        if (currentQuestionIndex < totalQuestions - 1) {
            window.scrollTo(0, 0);
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            // Finish Part 2
            // Save detailed answers map for accurate attribution to skills
            localStorage.setItem('part2Answers', JSON.stringify(answers));

            // Legacy support / flat list if needed elsewhere (optional, but good for safety)
            const allSelectedProblems = Object.values(answers).flat();
            localStorage.setItem('part2Problems', JSON.stringify(allSelectedProblems));

            navigate('/results');
        }
    };

    // Allow proceeding even if nothing selected? Usually yes for "check all that apply", but maybe warn?
    // Let's assume at least one selection is preferred but not strictly enforced unless required.
    // For now, enable button always.

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{quizData.part2.title}</h2>
                <p className="text-gray-600 mb-6">Part 2: Self Assessment ({currentQuestion.skill})</p>
                <ProgressBar current={currentQuestionIndex + 1} total={totalQuestions} />
            </div>

            <QuestionCard
                question={currentQuestion.question_text}
                type="multiple"
                options={currentQuestion.options.map(opt => ({
                    label: opt,
                    value: opt
                }))}
                selectedValues={answers[currentQuestion.id] || []}
                onSelect={(val) => handleSelectAnswer(currentQuestion.id, val)}
                className="mb-8"
            />

            <div className="flex justify-end">
                <Button
                    onClick={handleNext}
                    className="w-full sm:w-auto"
                >
                    {currentQuestionIndex < totalQuestions - 1 ? 'Câu tiếp theo' : 'Xem Kết Quả'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};
