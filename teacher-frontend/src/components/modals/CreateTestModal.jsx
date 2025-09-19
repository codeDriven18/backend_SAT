import React, { useState } from 'react';
import { X, BookOpen, Plus, Trash2, Save } from 'lucide-react';
import useTeacherStore from '../../store/useTeacherStore';


const CreateTestModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    passing_marks: 60,
    is_active: true,
    is_public: false,
    sections: [
      {
        name: 'Section 1',
        description: '',
        time_limit: 30,
        order: 1,
        questions: [
          {
            question_text: '',
            passage_text: '',
            marks: 1,
            order: 1,
            choices: [
              { choice_text: '', choice_label: 'A', is_correct: false },
              { choice_text: '', choice_label: 'B', is_correct: false },
              { choice_text: '', choice_label: 'C', is_correct: false },
              { choice_text: '', choice_label: 'D', is_correct: false }
            ]
          }
        ]
      }
    ]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  const { createTest } = useTeacherStore();

  const addChoice = (sectionIndex, questionIndex) => {
    const updatedSections = [...formData.sections];
    updatedSections[sectionIndex].questions[questionIndex].choices.push({
      choice_text: '',
      choice_label: String.fromCharCode(65 + updatedSections[sectionIndex].questions[questionIndex].choices.length), // A,B,C...
      is_correct: false,
    });
    setFormData({ ...formData, sections: updatedSections });
  };
  
  const updateQuestionField = (sectionIndex, questionIndex, field, value) => {
    const updatedSections = [...formData.sections];
    updatedSections[sectionIndex].questions[questionIndex][field] = value;
    setFormData({ ...formData, sections: updatedSections });
  };
  
  const updateChoiceField = (sectionIndex, questionIndex, choiceIndex, field, value) => {
    const updatedSections = [...formData.sections];
    updatedSections[sectionIndex].questions[questionIndex].choices[choiceIndex][field] = value;
    setFormData({ ...formData, sections: updatedSections });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await createTest(formData);
      if (result.success) {
        onSuccess();
      } else {
        setError(result.error.detail || result.error.message || 'Failed to create test');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addSection = () => {
    setFormData({
      ...formData,
      sections: [
        ...formData.sections,
        {
          name: `Section ${formData.sections.length + 1}`,
          description: '',
          time_limit: 30,
          order: formData.sections.length + 1,
          questions: []
        }
      ]
    });
  };

  const addQuestion = (sectionIndex) => {
    const updatedSections = [...formData.sections];
    updatedSections[sectionIndex].questions.push({
      question_text: '',
      passage_text: '',
      marks: 1,
      order: updatedSections[sectionIndex].questions.length + 1,
      choices: [
        { choice_text: '', choice_label: 'A', is_correct: false },
        { choice_text: '', choice_label: 'B', is_correct: false },
        { choice_text: '', choice_label: 'C', is_correct: false },
        { choice_text: '', choice_label: 'D', is_correct: false }
      ]
    });
    setFormData({ ...formData, sections: updatedSections });
  };

  const BasicInfoStep = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Test Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="e.g., SAT Math Practice Test"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="Describe your test..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty
          </label>
          <select
            value={formData.difficulty}
            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Passing Marks
          </label>
          <input
            type="number"
            value={formData.passing_marks}
            onChange={(e) => setFormData({ ...formData, passing_marks: parseInt(e.target.value) })}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="ml-2 text-sm text-gray-700">Active</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.is_public}
            onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="ml-2 text-sm text-gray-700">Public (visible in library)</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-semibold text-gray-900">Create New Test</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <BasicInfoStep />

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Test Sections</h3>
              <button
                type="button"
                onClick={addSection}
                className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700"
              >
                <Plus className="w-4 h-4" />
                <span>Add Section</span>
              </button>
            </div>

            <div className="space-y-4">
              {formData.sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Section Name
                      </label>
                      <input
                        type="text"
                        value={section.name}
                        onChange={(e) => {
                          const updatedSections = [...formData.sections];
                          updatedSections[sectionIndex].name = e.target.value;
                          setFormData({ ...formData, sections: updatedSections });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time Limit (minutes)
                      </label>
                      <input
                        type="number"
                        value={section.time_limit}
                        onChange={(e) => {
                          const updatedSections = [...formData.sections];
                          updatedSections[sectionIndex].time_limit = parseInt(e.target.value);
                          setFormData({ ...formData, sections: updatedSections });
                        }}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={section.description}
                      onChange={(e) => {
                        const updatedSections = [...formData.sections];
                        updatedSections[sectionIndex].description = e.target.value;
                        setFormData({ ...formData, sections: updatedSections });
                      }}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {section.questions.length} question{section.questions.length !== 1 ? 's' : ''}

                        {section.questions.map((question, questionIndex) => (
                            <div key={questionIndex} className="mt-4 p-4 border rounded-lg bg-gray-50">
                              <h4 className="font-medium mb-2">Question {questionIndex + 1}</h4>

                              {/* Question text */}
                              <input
                                type="text"
                                value={question.question_text}
                                onChange={(e) =>
                                  updateQuestionField(sectionIndex, questionIndex, "question_text", e.target.value)
                                }
                                placeholder="Enter question text"
                                className="w-full px-3 py-2 mb-2 border rounded-lg"
                              />

                              {/* Passage text */}
                              <textarea
                                value={question.passage_text}
                                onChange={(e) =>
                                  updateQuestionField(sectionIndex, questionIndex, "passage_text", e.target.value)
                                }
                                placeholder="Optional passage..."
                                rows={2}
                                className="w-full px-3 py-2 mb-2 border rounded-lg"
                              />

                              {/* Marks */}
                              <input
                                type="number"
                                value={question.marks}
                                onChange={(e) =>
                                  updateQuestionField(sectionIndex, questionIndex, "marks", parseInt(e.target.value))
                                }
                                className="w-24 px-3 py-2 mb-2 border rounded-lg"
                              />

                              {/* Choices */}
                              <div className="space-y-2">
                                {question.choices.map((choice, choiceIndex) => (
                                  <div key={choiceIndex} className="flex items-center space-x-2">
                                    <input
                                      type="text"
                                      value={choice.choice_text}
                                      onChange={(e) =>
                                        updateChoiceField(sectionIndex, questionIndex, choiceIndex, "choice_text", e.target.value)
                                      }
                                      placeholder={`Choice ${choice.choice_label}`}
                                      className="flex-1 px-3 py-2 border rounded-lg"
                                    />
                                    <label className="flex items-center space-x-1">
                                      <input
                                        type="checkbox"
                                        checked={choice.is_correct}
                                        onChange={(e) =>
                                          updateChoiceField(sectionIndex, questionIndex, choiceIndex, "is_correct", e.target.checked)
                                        }
                                      />
                                      <span>Correct</span>
                                    </label>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => addChoice(sectionIndex, questionIndex)}
                                  className="text-sm text-emerald-600 hover:text-emerald-700"
                                >
                                  + Add Choice
                                </button>
                              </div>
                            </div>
                          ))}
                    </span>
                    <button
                      type="button"
                      onClick={() => addQuestion(sectionIndex)}
                      className="text-sm text-emerald-600 hover:text-emerald-700"
                    >
                      Add Question
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex space-x-3 pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Create Test</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTestModal;