import React, { useState } from 'react';
import { Plus, Trash2, Save, FileText } from 'lucide-react';
import api from '../../services/api';

const TestCreator = () => {
  const [testData, setTestData] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    time_limit: 60,
    total_marks: 100,
    passing_marks: 60,
    questions: []
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const addQuestion = () => {
    const newQuestion = {
      question_text: '',
      question_type: 'multiple_choice',
      marks: 1,
      order: testData.questions.length + 1,
      choices: [
        { choice_text: '', is_correct: true },
        { choice_text: '', is_correct: false },
        { choice_text: '', is_correct: false },
        { choice_text: '', is_correct: false }
      ]
    };

    setTestData({
      ...testData,
      questions: [...testData.questions, newQuestion]
    });
  };

  const removeQuestion = (index) => {
    const updatedQuestions = testData.questions.filter((_, i) => i !== index);
    // Re-order questions
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

    // If this choice is marked as correct, mark others as incorrect
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
    setSuccess(false);

    try {
      // Calculate total marks
      const totalMarks = testData.questions.reduce((sum, q) => sum + q.marks, 0);
      const testToSubmit = {
        ...testData,
        total_marks: totalMarks
      };

      await api.post('/tests/', testToSubmit);
      setSuccess(true);
      
      // Reset form
      setTestData({
        title: '',
        description: '',
        difficulty: 'medium',
        time_limit: 60,
        total_marks: 100,
        passing_marks: 60,
        questions: []
      });
    } catch (error) {
      console.error('Error creating test:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
          <div className="flex items-center">
            <FileText className="w-8 h-8 mr-3" />
            <div>
              <h1 className="text-2xl font-bold">Create New Test</h1>
              <p className="opacity-90">Design and configure your test</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {success && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              ✓ Test created successfully!
            </div>
          )}

          {/* Basic Test Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Test Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Test Title</label>
                <input
                  type="text"
                  value={testData.title}
                  onChange={(e) => setTestData({...testData, title: e.target.value})}
                  className="form-input"
                  placeholder="e.g., Mathematics Quiz 1"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Difficulty</label>
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
                <input
                  type="number"
                  value={testData.time_limit}
                  onChange={(e) => setTestData({...testData, time_limit: parseInt(e.target.value)})}
                  className="form-input"
                  min="1"
                  required
                />
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
              <label className="form-label">Description</label>
              <textarea
                value={testData.description}
                onChange={(e) => setTestData({...testData, description: e.target.value})}
                className="form-textarea"
                rows="3"
                placeholder="Brief description of the test..."
              />
            </div>
          </div>

          {/* Questions Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Questions ({testData.questions.length})</h2>
              <button
                type="button"
                onClick={addQuestion}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4" />
                Add Question
              </button>
            </div>

            {testData.questions.map((question, questionIndex) => (
              <div key={questionIndex} className="mb-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Question {questionIndex + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeQuestion(questionIndex)}
                    className="btn btn-danger"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="md:col-span-2 form-group">
                    <label className="form-label">Question Text</label>
                    <textarea
                      value={question.question_text}
                      onChange={(e) => updateQuestion(questionIndex, 'question_text', e.target.value)}
                      className="form-textarea"
                      rows="2"
                      placeholder="Enter your question here..."
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Marks</label>
                    <input
                      type="number"
                      value={question.marks}
                      onChange={(e) => updateQuestion(questionIndex, 'marks', parseInt(e.target.value))}
                      className="form-input"
                      min="1"
                      required
                    />
                  </div>
                </div>

                {/* Choices */}
                <div className="space-y-2">
                  <label className="form-label">Answer Choices</label>
                  {question.choices.map((choice, choiceIndex) => (
                    <div key={choiceIndex} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name={`question-${questionIndex}`}
                        checked={choice.is_correct}
                        onChange={() => updateChoice(questionIndex, choiceIndex, 'is_correct', true)}
                        className="w-4 h-4 text-green-600"
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={choice.choice_text}
                          onChange={(e) => updateChoice(questionIndex, choiceIndex, 'choice_text', e.target.value)}
                          className="form-input"
                          placeholder={`Choice ${String.fromCharCode(65 + choiceIndex)}`}
                          required
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-20">
                        {choice.is_correct ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {testData.questions.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg mb-2">No questions added yet</p>
                <p>Click "Add Question" to start creating your test</p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || testData.questions.length === 0}
              className="btn btn-primary"
            >
              {loading ? (
                <div className="loading-spinner" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Test
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestCreator;