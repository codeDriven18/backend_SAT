import React, { useState, useEffect } from 'react';
import { X, BookOpen, Clock, Award, CheckCircle, Circle } from 'lucide-react';
import { teacherAPI } from '../../api/teacherApi';

const ViewTestModal = ({ testId, onClose }) => {
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTestDetails();
  }, [testId]);

  const fetchTestDetails = async () => {
    try {
      const response = await teacherAPI.getTest(testId);
      setTest(response.data);
    } catch (err) {
      setError('Failed to load test details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md">
          <p className="text-red-600 mb-4">{error || 'Test not found'}</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">{test.title}</h2>
              <p className="text-emerald-100 text-sm">{test.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-emerald-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Test Info */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Difficulty</p>
              <p className={`text-lg font-semibold ${
                test.difficulty === 'hard' ? 'text-red-600' :
                test.difficulty === 'medium' ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {test.difficulty}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Questions</p>
              <p className="text-lg font-semibold text-gray-900">{test.question_count || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Marks</p>
              <p className="text-lg font-semibold text-gray-900">{test.total_marks || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Passing Marks</p>
              <p className="text-lg font-semibold text-gray-900">{test.passing_marks || 0}</p>
            </div>
          </div>
        </div>

        {/* Sections and Questions */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {test.sections && test.sections.length > 0 ? (
            <div className="space-y-6">
              {test.sections.map((section, sectionIndex) => (
                <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-emerald-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{section.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {section.time_limit} min
                        </span>
                        <span>{section.questions?.length || 0} questions</span>
                      </div>
                    </div>
                    {section.description && (
                      <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                    )}
                  </div>

                  <div className="divide-y divide-gray-200">
                    {section.questions && section.questions.map((question, qIndex) => (
                      <div key={question.id} className="p-4">
                        <div className="flex items-start space-x-3">
                          <span className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-medium text-sm">
                            {qIndex + 1}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                question.question_type === 'mcq' 
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-purple-100 text-purple-700'
                              }`}>
                                {question.question_type === 'mcq' ? 'Multiple Choice' : 'Math Free Response'}
                              </span>
                              <span className="flex items-center text-sm text-gray-600">
                                <Award className="w-4 h-4 mr-1" />
                                {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                              </span>
                            </div>

                            <p className="text-gray-900 font-medium mb-2">{question.question_text}</p>

                            {question.passage_text && (
                              <div className="bg-gray-50 p-3 rounded-lg mb-3">
                                <p className="text-sm text-gray-700">{question.passage_text}</p>
                              </div>
                            )}

                            {question.image_url && (
                              <img 
                                src={question.image_url} 
                                alt="Question" 
                                className="max-w-md rounded-lg border border-gray-200 mb-3"
                              />
                            )}

                            {question.question_type === 'mcq' && question.choices && (
                              <div className="space-y-2 mt-3">
                                {question.choices.map((choice) => (
                                  <div 
                                    key={choice.id}
                                    className={`flex items-center space-x-2 p-2 rounded ${
                                      choice.is_correct 
                                        ? 'bg-green-50 border border-green-200' 
                                        : 'bg-gray-50 border border-gray-200'
                                    }`}
                                  >
                                    {choice.is_correct ? (
                                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    ) : (
                                      <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                    )}
                                    <span className="font-medium text-gray-700 mr-2">{choice.choice_label}.</span>
                                    <span className={choice.is_correct ? 'text-green-900 font-medium' : 'text-gray-700'}>
                                      {choice.choice_text}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {question.question_type === 'math_free' && question.correct_answers && (
                              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm font-medium text-green-900 mb-1">Correct Answer(s):</p>
                                <div className="flex flex-wrap gap-2">
                                  {(Array.isArray(question.correct_answers) 
                                    ? question.correct_answers 
                                    : JSON.parse(question.correct_answers || '[]')
                                  ).map((answer, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded font-mono text-sm">
                                      {answer}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No sections or questions found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewTestModal;
