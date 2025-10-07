import React, { useState } from 'react';
import { X, BookOpen, Plus, Trash2, Save, Image } from 'lucide-react';
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

  const { createTest, uploadQuestionImage } = useTeacherStore();
  const [questionImages, setQuestionImages] = useState({}); // keyed by `sectionIndex-questionIndex` -> File
  const [questionPreviews, setQuestionPreviews] = useState({}); // keyed by `sectionIndex-questionIndex` -> local preview URL
  const [uploadState, setUploadState] = useState({}); // keyed by `sectionIndex-questionIndex` -> {progress, uploading, uploadedUrl, error}

  // Note: choices are fixed to 4 for MCQ; adding extra choices is disabled.
  
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

    // Client-side validation: each MCQ must have exactly 1 correct choice
    for (const [sIndex, section] of formData.sections.entries()) {
      for (const [qIndex, question] of (section.questions || []).entries()) {
        if ((question.question_type || 'mcq') === 'mcq') {
          const correctCount = (question.choices || []).filter(c => c.is_correct).length;
          if (correctCount !== 1) {
            setError(`Section ${sIndex+1} Question ${qIndex+1}: MCQ must have exactly one correct choice.`);
            setLoading(false);
            return;
          }
        }
      }
    }

    try {
      const result = await createTest(formData);
      if (result.success) {
        const created = result.data; // expect sections with questions and IDs from backend
        const uploads = [];
        if (created?.sections && Array.isArray(created.sections)) {
          created.sections.forEach((sec, si) => {
            (sec.questions || []).forEach((q, qi) => {
              const key = `${si}-${qi}`;
              const file = questionImages[key];
              if (file && q?.id) {
                // start upload with progress and update uploadState
                uploads.push((async () => {
                  setUploadState(s => ({ ...s, [key]: { ...(s[key]||{}), uploading: true, progress: 0, error: null } }));
                  const res = await uploadQuestionImage(q.id, file, (ev) => {
                    const pct = ev.total ? Math.round((ev.loaded * 100) / ev.total) : 0;
                    setUploadState(s => ({ ...s, [key]: { ...(s[key]||{}), progress: pct } }));
                  });
                  if (res.success) {
                    setUploadState(s => ({ ...s, [key]: { ...(s[key]||{}), uploading: false, progress: 100, uploadedUrl: res.data?.image_url || null } }));
                  } else {
                    setUploadState(s => ({ ...s, [key]: { ...(s[key]||{}), uploading: false, error: res.error } }));
                  }
                  return res;
                })());
              }
            });
          });
        }
        if (uploads.length) {
          await Promise.allSettled(uploads);
        }
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
        question_type: 'mcq',
        correct_answers: [],
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

                              {/* Optional image upload (icon button) */}
                              <div className="mb-2 flex items-center space-x-3">
                                <label className="block text-sm text-gray-700">Question Image (optional)</label>
                                <div className="flex items-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => document.getElementById(`qimg-${sectionIndex}-${questionIndex}`)?.click()}
                                    className="p-2 rounded bg-gray-100 hover:bg-gray-200"
                                  >
                                    <Image className="w-5 h-5 text-gray-600" />
                                  </button>
                                  <input
                                    id={`qimg-${sectionIndex}-${questionIndex}`}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                              const file = e.target.files?.[0] || null;
                                              const key = `${sectionIndex}-${questionIndex}`;
                                              setQuestionImages((prev) => ({ ...prev, [key]: file }));
                                              // create local preview
                                              if (file) {
                                                const url = URL.createObjectURL(file);
                                                setQuestionPreviews(p => ({ ...p, [key]: url }));
                                              } else {
                                                setQuestionPreviews(p => ({ ...p, [key]: null }));
                                              }
                                              // If question already has an ID (e.g., editing existing question), upload immediately
                                              const q = formData.sections[sectionIndex].questions[questionIndex];
                                              if (file && q?.id) {
                                                // start immediate upload
                                                setUploadState(s => ({ ...s, [key]: { ...(s[key]||{}), uploading: true, progress: 0, error: null } }));
                                                uploadQuestionImage(q.id, file, (ev) => {
                                                  const pct = ev.total ? Math.round((ev.loaded * 100) / ev.total) : 0;
                                                  setUploadState(s => ({ ...s, [key]: { ...(s[key]||{}), progress: pct } }));
                                                }).then(res => {
                                                  if (res.success) {
                                                    setUploadState(s => ({ ...s, [key]: { ...(s[key]||{}), uploading: false, progress: 100, uploadedUrl: res.data?.image_url || null } }));
                                                  } else {
                                                    setUploadState(s => ({ ...s, [key]: { ...(s[key]||{}), uploading: false, error: res.error } }));
                                                  }
                                                });
                                              }
                                    }}
                                    className="hidden"
                                  />
                                          <div className="flex items-center space-x-2">
                                            {questionPreviews[`${sectionIndex}-${questionIndex}`] ? (
                                              <img src={questionPreviews[`${sectionIndex}-${questionIndex}`]} alt="preview" className="w-12 h-8 object-cover rounded" />
                                            ) : (
                                              <span className="text-sm text-gray-600">{questionImages[`${sectionIndex}-${questionIndex}`]?.name || 'No file'}</span>
                                            )}
                                            <div className="w-36">
                                              {uploadState[`${sectionIndex}-${questionIndex}`] && (
                                                <div className="text-xs">
                                                  <div className="h-2 bg-gray-200 rounded overflow-hidden">
                                                    <div style={{ width: `${uploadState[`${sectionIndex}-${questionIndex}`].progress || 0}%` }} className="h-full bg-emerald-600" />
                                                  </div>
                                                  <div className="flex items-center justify-between text-xs mt-1">
                                                    <span>{uploadState[`${sectionIndex}-${questionIndex}`].progress || 0}%</span>
                                                    {uploadState[`${sectionIndex}-${questionIndex}`].error ? (
                                                      <button type="button" onClick={async () => {
                                                        // retry
                                                        const key = `${sectionIndex}-${questionIndex}`;
                                                        const q = formData.sections[sectionIndex].questions[questionIndex];
                                                        const file = questionImages[key];
                                                        if (!file || !q?.id) return;
                                                        setUploadState(s => ({ ...s, [key]: { ...(s[key]||{}), uploading: true, progress: 0, error: null } }));
                                                        const res = await uploadQuestionImage(q.id, file, (ev) => {
                                                          const pct = ev.total ? Math.round((ev.loaded * 100) / ev.total) : 0;
                                                          setUploadState(s => ({ ...s, [key]: { ...(s[key]||{}), progress: pct } }));
                                                        });
                                                        if (res.success) {
                                                          setUploadState(s => ({ ...s, [key]: { ...(s[key]||{}), uploading: false, progress: 100, uploadedUrl: res.data?.image_url || null } }));
                                                        } else {
                                                          setUploadState(s => ({ ...s, [key]: { ...(s[key]||{}), uploading: false, error: res.error } }));
                                                        }
                                                      }} className="text-emerald-600">Retry</button>
                                                    ) : (
                                                      uploadState[`${sectionIndex}-${questionIndex}`].uploadedUrl ? <a className="text-xs text-blue-600 truncate" href={uploadState[`${sectionIndex}-${questionIndex}`].uploadedUrl} target="_blank" rel="noreferrer">View</a> : null
                                                    )}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                </div>
                              </div>

                              {/* Question type selector */}
                              <div className="mb-2">
                                <label className="block text-sm text-gray-700 mb-1">Question Type</label>
                                <select
                                  value={question.question_type || 'mcq'}
                                  onChange={(e) => updateQuestionField(sectionIndex, questionIndex, 'question_type', e.target.value)}
                                  className="w-full px-3 py-2 border rounded-lg"
                                >
                                  <option value="mcq">Multiple Choice (MCQ)</option>
                                  <option value="math_free">Math Input (student types answer)</option>
                                </select>
                              </div>

                              {/* Math free correct answers input (comma-separated) */}
                              {question.question_type === 'math_free' && (
                                <div className="mb-2">
                                  <label className="block text-sm text-gray-700 mb-1">Correct Answers (comma-separated)</label>
                                  <input
                                    type="text"
                                    value={(question.correct_answers || []).join(',')}
                                    onChange={(e) => updateQuestionField(sectionIndex, questionIndex, 'correct_answers', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                    placeholder="e.g., 5,5.0,five"
                                    className="w-full px-3 py-2 border rounded-lg"
                                  />
                                </div>
                              )}

                              {/* Choices (only for MCQ) */}
                              {question.question_type === 'mcq' && (
                                <div className="space-y-2">
                                  <div className="text-xs text-gray-500">MCQs are fixed to 4 choices (A–D). Mark exactly one as correct.</div>
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
                                  {/* Add Choice removed — MCQs remain 4 choices */}
                                </div>
                              )}
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