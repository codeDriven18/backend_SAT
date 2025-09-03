import React, { useState } from 'react';
import { Plus, Trash2, Save, FileText, Clock, Hash } from 'lucide-react';
import api from '../../services/api';

const TestCreator = () => {
  const [testData, setTestData] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    time_limit: 60,
    passing_marks: 60,
    questions: []
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const addQuestion = () => {
    const newQuestion = {
      question_text: '',
      passage_text: '',
      marks: 1,
      order: testData.questions.length + 1,
      choices: [
        { choice_text: '', choice_label: 'A', is_correct: false },
        { choice_text: '', choice_label: 'B', is_correct: false },
        { choice_text: '', choice_label: 'C', is_correct: false },
        { choice_text: '', choice_label: 'D', is_correct: false }
      ]
    };

    setTestData({
      ...testData,
      questions: [...testData.questions, newQuestion]
    });
  };

  const removeQuestion = (index) => {
    const updatedQuestions = testData.questions.filter((_, i) => i !== index);
    const reorderedQuestions = updatedQuestions.map((q, i) => ({
      ...q,
      order: i + 1
    }));
    
    setTestData({
      ...testData,
      questions: reorderedQuestions
    });
  };

  const updateQuestion = (questionIndex, field, value) => {
    const updatedQuestions = [...testData.questions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      [field]: value
    };
    
    setTestData({
      ...testData,
      questions: updatedQuestions
    });
  };

  const updateChoice = (questionIndex, choiceIndex, field, value) => {
    const updatedQuestions = [...testData.questions];
    updatedQuestions[questionIndex].choices[choiceIndex] = {
      ...updatedQuestions[questionIndex].choices[choiceIndex],
      [field]: value
    };

    if (field === 'is_correct' && value === true) {
      updatedQuestions[questionIndex].choices.forEach((choice, index) => {
        if (index !== choiceIndex) {
          choice.is_correct = false;
        }
      });
    }
    
    setTestData({
      ...testData,
      questions: updatedQuestions
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);

    try {
      const response = await api.post('/tests/', testData);
      setSuccess({
        message: 'Test group created successfully!',
        testCode: response.data.test_code,
        title: response.data.title
      });
      
      setTestData({
        title: '',
        description: '',
        difficulty: 'medium',
        time_limit: 60,
        passing_marks: 60,
        questions: []
      });
    } catch (error) {
      console.error('Error creating test:', error);
      setSuccess({
        error: error.response?.data?.detail || 'Failed to create test group'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
          <div className="flex items-center">
            <FileText className="w-8 h-8 mr-3" />
            <div>
              <h1 className="text-2xl font-bold">Create Test Group</h1>
              <p className="opacity-90">Upload questions for students to access via test code</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {success && !success.error && (
            <div className="mb-6 p-6 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              <div className="flex items-center mb-4">
                <Hash className="w-8 h-8 mr-3" />
                <div>
                  <h3 className="text-lg font-bold">✓ Test Group Created Successfully!</h3>
                  <p className="text-sm opacity-90">Share this code with students to access the test</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border-2 border-green-300">
                <div className="text-center">
                  <div className="text-sm font-medium text-green-600 mb-2">{success.title}</div>
                  <div className="text-3xl font-bold text-green-800 tracking-wider font-mono">
                    {success.testCode}
                  </div>
                  <div className="text-xs text-green-600 mt-2">6-Digit Test Access Code</div>
                </div>
              </div>
            </div>
          )}

          {success && success.error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {success.error}
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Test Group Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Test Group Title</label>
                <input
                  type="text"
                  value={testData.title}
                  onChange={(e) => setTestData({...testData, title: e.target.value})}
                  className="form-input"
                  placeholder="e.g., Mathematics Quiz - Chapter 5"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Difficulty Level</label>
                <select
                  value={testData.difficulty}
                  onChange={(e) => setTestData({...testData, difficulty: e.target.value})}
                  className="form-select"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Time Limit (minutes)</label>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-gray-400 mr-2" />
                  <input
                    type="number"
                    value={testData.time_limit}
                    onChange={(e) => setTestData({...testData, time_limit: parseInt(e.target.value)})}
                    className="form-input"
                    min="5"
                    max="180"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Passing Marks (%)</label>
                <input
                  type="number"
                  value={testData.passing_marks}
                  onChange={(e) => setTestData({...testData, passing_marks: parseInt(e.target.value)})}
                  className="form-input"
                  min="0"
                  max="100"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <textarea
                value={testData.description}
                onChange={(e) => setTestData({...testData, description: e.target.value})}
                className="form-textarea"
                rows="3"
                placeholder="Brief description of the test content..."
              />
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">Questions ({testData.questions.length})</h2>
                <p className="text-sm text-gray-600">Add 1-60 multiple choice questions</p>
              </div>
              <button
                type="button"
                onClick={addQuestion}
                className="btn btn-primary"
                disabled={testData.questions.length >= 60}
              >
                <Plus className="w-4 h-4" />
                Add Question
              </button>
            </div>

            {testData.questions.map((question, questionIndex) => (
              <div key={questionIndex} className="mb-8 p-6 border-2 border-gray-200 rounded-xl bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Question {questionIndex + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeQuestion(questionIndex)}
                    className="btn btn-danger"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="form-group mb-4">
                  <label className="form-label">Passage/Context (Optional)</label>
                  <textarea
                    value={question.passage_text}
                    onChange={(e) => updateQuestion(questionIndex, 'passage_text', e.target.value)}
                    className="form-textarea"
                    rows="3"
                    placeholder="Add reading passage or context if needed (like in your example)..."
                  />
                </div>

                <div className="form-group mb-4">
                  <label className="form-label">Question Text *</label>
                  <textarea
                    value={question.question_text}
                    onChange={(e) => updateQuestion(questionIndex, 'question_text', e.target.value)}
                    className="form-textarea"
                    rows="2"
                    placeholder="Enter your question here..."
                    required
                  />
                </div>

                <div className="form-group mb-6">
                  <label className="form-label">Marks</label>
                  <input
                    type="number"
                    value={question.marks}
                    onChange={(e) => updateQuestion(questionIndex, 'marks', parseInt(e.target.value))}
                    className="form-input w-24"
                    min="1"
                    max="10"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <label className="form-label">Answer Choices (Select the correct one)</label>
                  {question.choices.map((choice, choiceIndex) => (
                    <div key={choiceIndex} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name={`question-${questionIndex}`}
                          checked={choice.is_correct}
                          onChange={() => updateChoice(questionIndex, choiceIndex, 'is_correct', true)}
                          className="w-5 h-5 text-green-600"
                        />
                        <span className="ml-2 font-semibold text-lg text-gray-700">
                          {choice.choice_label}.
                        </span>
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={choice.choice_text}
                          onChange={(e) => updateChoice(questionIndex, choiceIndex, 'choice_text', e.target.value)}
                          className="form-input w-full resize-none"
                          rows="2"
                          placeholder={`Choice ${choice.choice_label}`}
                          required
                        />
                      </div>
                      <div className="text-sm">
                        {choice.is_correct ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                            ✓ Correct
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                            Incorrect
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {testData.questions.length === 0 && (
              <div className="text-center py-16 text-gray-500 border-2 border-dashed border-gray-300 rounded-xl">
                <FileText className="w-20 h-20 mx-auto mb-6 opacity-30" />
                <p className="text-xl mb-2">No questions added yet</p>
                <p className="text-sm mb-4">Click "Add Question" to start creating your test group</p>
                <p className="text-xs text-gray-400">You can add up to 60 questions per test group</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || testData.questions.length === 0}
              className="btn btn-primary px-8"
            >
              {loading ? (
                <div className="loading-spinner" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Test Group
                </>
              )}
            </button>
          </div>

          {testData.questions.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Summary:</strong> {testData.questions.length} questions, 
                Total marks: {testData.questions.reduce((sum, q) => sum + q.marks, 0)}, 
                Time limit: {testData.time_limit} minutes
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default TestCreator;