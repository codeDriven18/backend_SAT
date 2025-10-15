import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  TrendingUp,
  Eye,
  X,
  AlertCircle
} from 'lucide-react';
import { studentApi } from '../api/studentApi';

const TestResults = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  
  const [results, setResults] = useState(null);
  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState('All');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  function normalizeReview(data) {
    const flatQuestions = [];
    const sections = (data.sections || []).map((s) => ({ name: s.section_name }));
  
    (data.sections || []).forEach((s) => {
      (s.questions || []).forEach((q) => {
        const correctChoice = (q.choices || []).find(c => c.id === q.correct_choice_id);
        const studentChoice = (q.choices || []).find(c => c.id === q.student_choice_id);
  
        let correct_answer = null;
        let student_answer = null;
  
        if (q.question_type === 'mcq') {
          correct_answer = correctChoice ? correctChoice.choice_label : null;
          student_answer = studentChoice ? studentChoice.choice_label : null;
        } else if (q.question_type === 'math_free') {
          correct_answer = q.correct_answers?.join(', ') || null;
          student_answer = q.student_text_answer || null;
        }
  
        flatQuestions.push({
          id: q.id,
          section_name: s.section_name,
          question_text: q.question_text,
          passage_text: q.passage_text,
          image: q.image || null,
          question_type: q.question_type,
          choices: q.choices || [],
          correct_choice_id: q.correct_choice_id,
          student_choice_id: q.student_choice_id,
          correct_answer,
          student_answer,
          is_correct: q.is_correct ?? (student_answer && correct_answer && student_answer.trim().toLowerCase() === correct_answer.trim().toLowerCase()),
          marks: q.marks,
          marks_earned: q.marks_earned,
        });
      });
    });
  
    return {
      test_title: data.test_title,
      total_score: data.total_score,
      total_marks: data.total_marks,
      percentage: data.percentage,
      sections,
      questions: flatQuestions,
    };
  }

  useEffect(() => {
    loadTestResults();
    loadTestReview();
  }, [testId]);

  const loadTestResults = async () => {
    try {
      const data = await studentApi.getTestResults(parseInt(testId));
      setResults(data);
    } catch (error) {
      console.error('Failed to load test results:', error);
    }
  };

  const loadTestReview = async () => {
    try {
      const data = await studentApi.getTestReview(parseInt(testId));
      const normalized = normalizeReview(data);     setReviewData(normalized);
    } catch (error) {
      console.error('Failed to load test review:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'hard': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'easy': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getAnswerStatus = (question) => {
    if (!question.student_answer) return 'omitted';
    return question.is_correct ? 'correct' : 'incorrect';
  };

  const getAnswerStatusColor = (status) => {
    switch (status) {
      case 'correct': return 'bg-green-100 text-green-800';
      case 'incorrect': return 'bg-red-100 text-red-800';
      case 'omitted': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredQuestions = reviewData?.questions?.filter(q => 
    selectedSection === 'All' || q.section_name === selectedSection
  ) || [];

  const sections = reviewData?.sections || [];
  const totalQuestions = filteredQuestions.length;
  const correctAnswers = filteredQuestions.filter(q => getAnswerStatus(q) === 'correct').length;
  const incorrectAnswers = filteredQuestions.filter(q => getAnswerStatus(q) === 'incorrect').length;
  const omittedAnswers = filteredQuestions.filter(q => getAnswerStatus(q) === 'omitted').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Results - {results?.test_title || 'Test Results'}
                  </h1>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium">
                Results
              </button>
              <button className="text-gray-600 px-4 py-2 rounded-md text-sm font-medium hover:text-gray-900">
                Statistics
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-8 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total questions</h3>
              <p className="text-4xl font-bold text-gray-900">{totalQuestions}</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Correct answers</h3>
              <p className="text-4xl font-bold text-gray-900">{correctAnswers}</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 bg-red-50 rounded-lg flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Incorrect answers</h3>
              <p className="text-4xl font-bold text-gray-900">{incorrectAnswers}</p>
            </div>
          </div>
        </div>

        {/* Section Filters */}
        <div className="mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedSection('All')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedSection === 'All'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            {sections.map(section => (
              <button
                key={section.name}
                onClick={() => setSelectedSection(section.name)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedSection === section.name
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {section.name}
              </button>
            ))}
          </div>
        </div>

        {/* Current Section Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedSection === 'All' ? 'All Questions' : selectedSection}
          </h2>
        </div>

        {/* Questions Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Question
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Section
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Correct Answer
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Your Answer
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Complexity
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredQuestions.map((question, index) => {
                  const status = getAnswerStatus(question);
                  return (
                    <tr key={question.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {question.section_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-bold">
                        {question.correct_answer}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAnswerStatusColor(status)}`}>
                          {status === 'omitted' ? 'Omitted' : question.student_answer || 'Omitted'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`font-medium ${getDifficultyColor(question.difficulty)}`}>
                          {question.difficulty || 'Medium'} / {question.difficulty_percentage || '0'}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => {
                            setSelectedQuestion(question);
                            setShowQuestionModal(true);
                          }}
                          className="text-gray-600 hover:text-gray-900 font-medium"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Question Review Modal */}
      {showQuestionModal && selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                Question Review
              </h3>
              <button
                onClick={() => setShowQuestionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Question Text */}
              <div className="mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <span className="bg-blue-100 text-blue-800 text-sm font-bold px-2 py-1 rounded flex-shrink-0">
                    Q{filteredQuestions.findIndex(q => q.id === selectedQuestion.id) + 1}
                  </span>
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      {selectedQuestion.question_text}
                    </h4>
                    {selectedQuestion.passage_text && (
                      <div className="p-4 bg-gray-50 rounded-lg mb-4">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                          {selectedQuestion.passage_text}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* For math_free questions */}
              {selectedQuestion.question_type === 'math_free' && (
                <div className="mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700"><strong>Your Answer:</strong> {selectedQuestion.student_answer || 'Omitted'}</p>
                    <p className="text-gray-700"><strong>Correct Answer:</strong> {selectedQuestion.correct_answer || 'N/A'}</p>
                  </div>
                </div>
              )}
              {selectedQuestion.image && (
                <div className="mb-4 flex justify-center">
                  <img
                    src={selectedQuestion.image}
                    alt="Question Illustration"
                    className="max-h-[400px] w-auto object-contain rounded-lg border shadow-sm"
                    style={{ maxWidth: '100%' }}
                  />
                </div>
              )}


              {/* Answer Choices */}
              <div className="space-y-3 mb-6">
                {selectedQuestion.choices?.map((choice) => {
                  const isCorrect = choice.choice_label === selectedQuestion.correct_answer;
                  const isSelected = choice.choice_label === selectedQuestion.student_answer;
                  
                  let borderColor = 'border-gray-200';
                  let bgColor = 'bg-white';
                  
                  if (isCorrect) {
                    borderColor = 'border-green-500';
                    bgColor = 'bg-green-50';
                  } else if (isSelected && !isCorrect) {
                    borderColor = 'border-red-500';
                    bgColor = 'bg-red-50';
                  }

                  return (
                    <div
                      key={choice.id}
                      className={`p-4 rounded-lg border-2 ${borderColor} ${bgColor}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-2">
                          <span className="bg-gray-100 text-gray-700 text-sm font-bold px-2 py-1 rounded flex-shrink-0">
                            {choice.choice_label}
                          </span>
                          {isCorrect && <CheckCircle className="w-5 h-5 text-green-600" />}
                          {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-600" />}
                        </div>
                        <span className="text-gray-900">{choice.choice_text}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Answer Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Correct Answer:</span>
                    <span className="ml-2 font-bold text-green-600">
                      {selectedQuestion.correct_answer}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Your Answer:</span>
                    <span className={`ml-2 font-bold ${
                      selectedQuestion.student_answer
                        ? getAnswerStatus(selectedQuestion) === 'correct' ? 'text-green-600' : 'text-red-600'
                        : 'text-gray-500'
                    }`}>
                      {selectedQuestion.student_answer || 'Omitted'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Difficulty:</span>
                    <span className={`ml-2 font-bold ${getDifficultyColor(selectedQuestion.difficulty)}`}>
                      {selectedQuestion.difficulty || 'Medium'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Explanation (if available) */}
              {selectedQuestion.explanation && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h5 className="font-semibold text-blue-900 mb-2">Explanation</h5>
                  <p className="text-blue-800">{selectedQuestion.explanation}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestResults;