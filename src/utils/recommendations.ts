import recommendationDataRaw from '../data/part2_recommendations.json';
import part2DataRaw from '../data/part2_quiz.json';
import type { RecommendationData, QuizData, Recommendation } from '../types/quiz';

const recommendationData = recommendationDataRaw as unknown as RecommendationData;
const quizData = part2DataRaw as unknown as QuizData;

export interface ProblemRecommendation {
    problem: string;
    recommendations: Recommendation[];
}

export interface GroupedRecommendation {
    problem: string;
    skill: string;
    solutions: string[];
    questionTypes: string[];
}

export interface SkillAnalysis {
    topProblems: string[];
    topSolutions: string[];
    topQuestionTypes: string[];
}

export interface Part2Analysis {
    listening: SkillAnalysis;
    reading: SkillAnalysis;
}

// Helper to count frequencies
const getTopK = (items: string[], k: number): string[] => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
        counts[item] = (counts[item] || 0) + 1;
    });
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1]) // sort by count desc
        .slice(0, k)
        .map(([item]) => item);
}

export const analyzePart2Results = (answers: Record<string, string[]>): Part2Analysis => {
    const analysis: Part2Analysis = {
        listening: { topProblems: [], topSolutions: [], topQuestionTypes: [] },
        reading: { topProblems: [], topSolutions: [], topQuestionTypes: [] }
    };

    // Temporary storage for aggregation
    const rawData = {
        Listening: { problems: [] as string[], solutions: [] as string[], questionTypes: [] as string[] },
        Reading: { problems: [] as string[], solutions: [] as string[], questionTypes: [] as string[] }
    };

    const questions = quizData.part2.questions;
    const { recommendations } = recommendationData;

    // Iterate through user answers
    Object.entries(answers).forEach(([questionId, selectedOptions]) => {
        // Find which skill this question belongs to
        const question = questions.find(q => q.id === questionId);
        if (!question) return;

        const skill = question.skill; // "Listening" or "Reading"
        if (skill !== 'Listening' && skill !== 'Reading') return;

        selectedOptions.forEach(problem => {
            // 1. Collect Problem (Reason implies problem in this context, but "problem" is the selected text)
            // The prompt says: "03 vấn đề chính... là: vốn từ vựng còn hạn chế..."
            // But looking at part2_recommendations.json, the KEYS are the "User Selected Problem" (e.g., "Không theo kịp tốc độ bài nói")
            // And the VALUES contain "reason" (e.g., "Vốn từ vựng còn hạn chế").
            // So we should aggregate the REASONS found in the recommendations.

            const recs = recommendations[skill]?.[problem];
            if (recs) {
                recs.forEach(rec => {
                    // Split reasons if they are comma separated? File content shows: "reason": "Chưa luyện nghe đủ nhiều, Vốn từ vựng còn hạn chế"
                    // So yes, we should split by comma.
                    const reasons = rec.reason.split(',').map(s => s.trim());
                    rawData[skill].problems.push(...reasons);

                    const solutions = rec.solution.split(',').map(s => s.trim());
                    rawData[skill].solutions.push(...solutions);

                    // question_type might not need splitting but let's check. ex: "Gap filling, Part 1" is one type.
                    // The requirement says: "03 dạng bài...: Multiple Choice, Matching Information..."
                    // Sometimes key is "Gap filling, Part 4".
                    rawData[skill].questionTypes.push(rec.question_type);
                });
            }
        });
    });

    // Process Top 3 for each
    (['Listening', 'Reading'] as const).forEach(skill => {
        const skillKey = skill === 'Listening' ? 'listening' : 'reading';
        analysis[skillKey].topProblems = getTopK(rawData[skill].problems, 3);
        analysis[skillKey].topSolutions = getTopK(rawData[skill].solutions, 3);
        analysis[skillKey].topQuestionTypes = getTopK(rawData[skill].questionTypes, 3);
    });

    return analysis;
};

// Legacy support
export const getRecommendations = (selectedProblems: string[]): GroupedRecommendation[] => {
    const result: GroupedRecommendation[] = [];
    const { recommendations } = recommendationData;

    selectedProblems.forEach(problem => {
        let found = false;
        let skill = '';
        let recs: Recommendation[] = [];

        // Check Listening
        if (recommendations.Listening && recommendations.Listening[problem]) {
            skill = 'Listening';
            recs = recommendations.Listening[problem];
            found = true;
        }
        // Check Reading
        else if (recommendations.Reading && recommendations.Reading[problem]) {
            skill = 'Reading';
            recs = recommendations.Reading[problem];
            found = true;
        }

        if (found) {
            // Aggregate unique solutions and question types
            const uniqueSolutions = [...new Set(recs.map(r => r.solution))];
            const uniqueQuestionTypes = [...new Set(recs.map(r => r.question_type))];

            result.push({
                problem,
                skill,
                solutions: uniqueSolutions,
                questionTypes: uniqueQuestionTypes
            });
        }
    });

    return result;
};
