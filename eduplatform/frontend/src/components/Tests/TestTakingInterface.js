import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  Hash,
  User
} from 'lucide-react';
import api from '../../services/api';

const TestTakingInterface = ({ testData, attemptId, onTestComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(testData.time_limit * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [startTime] = useState(new Date());

  const currentQuestion = testData.test.questions[currentQuestionIndex];
  const totalQuestions = testData.test.questions.length;

  useEffect(() => {
    if (timeRemaining <= 0) {
      handleSubmitTest(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (choiceId) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: choiceId
    });
  };

  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitTest = async (autoSubmit = false) => {
    setIsSubmitting(true);
    
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, choiceId]) => ({
        question_id: parseInt(questionId),
        choice_id: choiceId
      }));

      const timeUsed = (testData.time_limit * 60 - timeRemaining) / 60;

      const response = await api.post('/tests/submit-attempt/', {
        attempt_id: attemptId,
        answers: formattedAnswers,
        time_taken: Math.ceil(timeUsed)
      });

      onTestComplete(response.data);
    } catch (error) {
      console.error('Error submitting test:', error);
      alert('Failed to submit test. Please try again.');
      setIsSubmitting(false);
      setShowConfirmSubmit(false);
    }
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const isQuestionAnswered = (questionId) => {
    return answers.hasOwnProperty(questionId);
  };

  const getTimeWarningColor = () => {
    if (timeRemaining <= 300) return 'text-red-600';
    if (timeRemaining <= 600) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{testData.test.title}</h1>
              <div className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center text-sm">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span>{getAnsweredCount()}/{totalQuestions} answered</span>
              </div>
              
              <div className={`flex items-center font-mono text-lg font-semibold ${getTimeWarningColor()}`}>
                <Clock className="w-5 h-5 mr-2" />
                {formatTime(timeRemaining)}
              </div>
              
              <button
                onClick={() => setShowConfirmSubmit(true)}
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                Submit Test
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:order-2">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">Question Navigation</h3>
              
              <div className="grid grid-cols-5 gap-2 mb-4">
                {testData.test.questions.map((question, index) => (
                  <button
                    key={question.id}
                    onClick={() => goToQuestion(index)}
                    className={`
                      w-10 h-10 rounded text-sm font-semibold border transition-colors
                      ${index === currentQuestionIndex 
                        ? 'bg-blue-500 text-white border-blue-500' 
                        : isQuestionAnswered(question.id)
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                  <span>Answered ({getAnsweredCount()})</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-300 rounded mr-2"></div>
                  <span>Not answered ({totalQuestions - getAnsweredCount()})</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                  <span>Current question</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 lg:order-1">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Question {currentQuestionIndex + 1}
                    </h2>
                    <div className="text-sm text-gray-500">
                      {currentQuestion.marks} {currentQuestion.marks === 1 ? 'mark' : 'marks'}
                    </div>
                  </div>

                  {currentQuestion.passage_text && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-center mb-2">
                        <FileText className="w-4 h-4 text-blue-500 mr-2" />
                        <span className="text-sm font-medium text-blue-700">Reading Passage</span>
                      </div>
                      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {currentQuestion.passage_text}
                      </div>
                    </div>
                  )}

                  <div className="text-lg text-gray-900 leading-relaxed mb-6">
                    {currentQuestion.question_text}
                  </div>
                </div>

                <div className="space-y-3">
                  {currentQuestion.choices.map((choice) => (
                    <label
                      key={choice.id}
                      className={`
                        flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${answers[currentQuestion.id] === choice.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={choice.id}
                        checked={answers[currentQuestion.id] === choice.id}
                        onChange={() => handleAnswerSelect(choice.id)}
                        className="sr-only"
                      />
                      <div className="flex items-start w-full">
                        <div className={`
                          w-6 h-6 rounded-full border-2 mr-3 mt-0.5 flex items-center justify-center
                          ${answers[currentQuestion.id] === choice.id
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-400'
                          }
                        `}>
                          {answers[currentQuestion.id] === choice.id && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start">
                            <span className="font-semibold text-gray-700 mr-2 mt-0.5">
                              {choice.choice_label}.
                            </span>
                            <span className="text-gray-900 leading-relaxed">
                              {choice.choice_text}
                            </span>
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                <button
                  onClick={previousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="btn btn-secondary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>

                <div className="text-sm text-gray-600">
                  {currentQuestionIndex + 1} / {totalQuestions}
                </div>

                <button
                  onClick={nextQuestion}
                  disabled={currentQuestionIndex === totalQuestions - 1}
                  className="btn btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500 mr-2" />
              <h3 className="text-lg font-semibold">Submit Test?</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to submit your test? You cannot change your answers after submission.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Questions answered:</span>
                    <div className="font-semibold">{getAnsweredCount()} / {totalQuestions}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Time remaining:</span>
                    <div className={`font-semibold ${getTimeWarningColor()}`}>
                      {formatTime(timeRemaining)}
                    </div>
                  </div>
                </div>
              </div>

              {getAnsweredCount() < totalQuestions && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      You have {totalQuestions - getAnsweredCount()} unanswered questions. 
                      These will be marked as incorrect.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="btn btn-secondary flex-1"
                disabled={isSubmitting}
              >
                Continue Test
              </button>
              <button
                onClick={() => handleSubmitTest(false)}
                className="btn btn-primary flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="loading-spinner" />
                ) : (
                  'Submit Test'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestTakingInterface;