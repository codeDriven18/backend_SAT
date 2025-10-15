import React, { useState, useCallback, useRef } from 'react';
import { X, BookOpen, Plus, Trash2, Save, Image as ImageIcon, Upload } from 'lucide-react';
import useTeacherStore from '../../store/useTeacherStore';
import { teacherAPI } from '../../api/teacherApi';


const CreateTestModal = ({ onClose, onSuccess }) => {
  // console.log("CreateTestModal rendered");
  const fileInputRefs = useRef({});
  const [uploadingImages, setUploadingImages] = useState({});
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
            image: '',
            question_type: 'mcq',
            answer_format: 'integer',
            marks: 1,
            order: 1,
            correct_answers: [],
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [passingMarks, setPassingMarks] = useState(400);
  const [sections, setSections] = useState([]);

// Optional (if modal closing function is passed as prop)
  const handdleClose = () => {
    setTitle('');
    setDescription('');
    setSections([]);
    setIsSubmitting(false);
    onClose();
  };

  const { createTest } = useTeacherStore();

  // Use useCallback to prevent re-renders
  const handleTitleChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, title: e.target.value }));
  }, []);

  const handleDescriptionChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, description: e.target.value }));
  }, []);

  const handleDifficultyChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, difficulty: e.target.value }));
  }, []);

  const handlePassingMarksChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, passing_marks: parseInt(e.target.value) || 0 }));
  }, []);

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
    
    // Agar "is_correct" o'zgaryotgan bo'lsa va true qilinayotgan bo'lsa
    if (field === 'is_correct' && value === true) {
      // Avval barcha choicelarni false qilish
      updatedSections[sectionIndex].questions[questionIndex].choices.forEach((choice, idx) => {
        choice.is_correct = false;
      });
    }
    
    // Keyin tanlangan choiceni yangilash
    updatedSections[sectionIndex].questions[questionIndex].choices[choiceIndex][field] = value;
    setFormData(prev => ({ ...prev, sections: updatedSections }));
  };

 

  const handleSubmit = async (e) => {

    e.preventDefault();
    e.stopPropagation();
    console.log("✅ handleSubmit triggered");
  try {
    setIsSubmitting(true);

    // 🧹 Sanitize formData before sending JSON
    const cleanedFormData = {
      ...formData,
      sections: formData.sections.map(section => ({
        ...section,
        questions: section.questions.map(q => {
          const questionCopy = { ...q };

          // If it's a File (we upload later), set image to null for now
          if (questionCopy.image && typeof questionCopy.image !== 'string') {
            questionCopy.image = null;
          }

          // If it's a blob/local URL, remove it
          if (typeof questionCopy.image === 'string' && questionCopy.image.startsWith('blob:')) {
            questionCopy.image = null;
          }

          // If there’s any preview URL or local-only field, clean it
          delete questionCopy.previewUrl;

          return questionCopy;
        })
      }))
    };

    // 1️⃣ Create the test (only text JSON, no files)
    const response = await teacherAPI.createTest(cleanedFormData);
    console.log('✅ Test created:', response.data);

    const createdSections = response.data.sections;

    // 2️⃣ Upload images afterward (real files)
    for (const [sIdx, section] of formData.sections.entries()) {
      for (const [qIdx, question] of section.questions.entries()) {
        const backendQuestion = response.data.sections[sIdx].questions[qIdx];
    
        if (question.image && question.image instanceof File) {
          console.log(`Uploading image for question ${backendQuestion.id}...`);
          try {
            await teacherAPI.uploadQuestionImage(backendQuestion.id, question.image);
            console.log(`✅ Uploaded image for question ${backendQuestion.id}`);
          } catch (err) {
            console.error(`❌ Failed to upload image for question ${backendQuestion.id}`, err);
          }
        }
      }
    }
    
    // const response = await teacherAPI.createTest(cleanedFormData);
    // const testId = response.data.id;
    // console.log(response);
    // const fullTest = await teacherAPI.getTest(testId);
    // console.log(fullTest);
    // for (const [sIdx, section] of fullTest.data.sections.entries()) {
    //   for (const [qIdx, question] of section.questions.entries()) {
    //     const imageFile = formData.sections[sIdx].questions[qIdx].image;
    //     if (imageFile && imageFile instanceof File) {
    //       await teacherAPI.uploadQuestionImage(question.id, imageFile);
    //     }
    //   }
    // }
    alert('✅ Test created successfully!');
    await new Promise((resolve) => setTimeout(resolve, 500)); // small delay
    handdleClose();


  } catch (error) {
    console.error('❌ Failed to create test:', error.response?.data || error.message);
    alert(`Failed to create test: ${error.message}`);
  } finally {
    setIsSubmitting(false);
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

  const deleteSection = (sectionIndex) => {
    if (formData.sections.length <= 1) {
      alert('At least one section is required!');
      return;
    }
    const updatedSections = formData.sections.filter((_, index) => index !== sectionIndex);
    // Update order for remaining sections
    updatedSections.forEach((section, index) => {
      section.order = index + 1;
    });
    setFormData({ ...formData, sections: updatedSections });
  };

  const addQuestion = (sectionIndex) => {
    const updatedSections = [...formData.sections];
    updatedSections[sectionIndex].questions.push({
      question_text: '',
      passage_text: '',
      image: '',
      question_type: 'mcq',
      answer_format: 'integer',
      marks: 1,
      order: updatedSections[sectionIndex].questions.length + 1,
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

  const deleteQuestion = (sectionIndex, questionIndex) => {
    const updatedSections = [...formData.sections];
    updatedSections[sectionIndex].questions = updatedSections[sectionIndex].questions.filter(
      (_, index) => index !== questionIndex
    );
    // Update order for remaining questions
    updatedSections[sectionIndex].questions.forEach((q, index) => {
      q.order = index + 1;
    });
    setFormData({ ...formData, sections: updatedSections });
  };

  const handleImageUpload = async (sectionIndex, questionIndex, file) => {
    if (!file) return;
  
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }
  
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, GIF)');
      return;
    }
  
    const key = `${sectionIndex}-${questionIndex}`;
    setUploadingImages(prev => ({ ...prev, [key]: true }));
  
    try {
      const localUrl = URL.createObjectURL(file);
      const updatedSections = [...formData.sections];
  
      // Store both: real File and preview URL
      updatedSections[sectionIndex].questions[questionIndex].image = file;        // ✅ real file
      updatedSections[sectionIndex].questions[questionIndex].previewUrl = localUrl; // ✅ preview only
  
      setFormData({ ...formData, sections: updatedSections });
      console.log('Image prepared for upload:', file.name);
    } catch (error) {
      console.error('Error loading image:', error);
      alert('Failed to load image: ' + error.message);
    } finally {
      setUploadingImages(prev => ({ ...prev, [key]: false }));
    }
  };
  
  const sanitizeFormData = (data) => {
    const sanitizedSections = data.sections.map(section => ({
      ...section,
      questions: section.questions.map(q => {
        const cleanQ = { ...q };
        delete cleanQ.previewUrl; // remove local blob URLs
        if (cleanQ.image && typeof cleanQ.image !== 'string') {
          delete cleanQ.image; // remove File before sending JSON
        }
        return cleanQ;
      }),
    }));
    return { ...data, sections: sanitizedSections };
  };
  

  const removeImage = (sectionIndex, questionIndex) => {
    const updatedSections = [...formData.sections];
    updatedSections[sectionIndex].questions[questionIndex].image_url = '';
    setFormData({ ...formData, sections: updatedSections });
  };

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
          {/* Basic Info Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={handleTitleChange}
                required
                autoComplete="off"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g., SAT Math Practice Test"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={handleDescriptionChange}
                rows={3}
                autoComplete="off"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                  onChange={handleDifficultyChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                  onChange={handlePassingMarksChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="ml-2 text-sm text-gray-700">Public (visible in library)</span>
              </label>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">Test Sections</h3>
            </div>

            <div className="space-y-4">
              {formData.sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="border border-gray-200 rounded-lg p-4 relative">
                  {/* Delete Section Button */}
                  {formData.sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => deleteSection(sectionIndex)}
                      className="absolute top-4 right-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Section"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 mb-4 pr-12">
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
                          setFormData(prev => ({ ...prev, sections: updatedSections }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                          updatedSections[sectionIndex].time_limit = parseInt(e.target.value) || 0;
                          setFormData(prev => ({ ...prev, sections: updatedSections }));
                        }}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                        setFormData(prev => ({ ...prev, sections: updatedSections }));
                      }}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  {/* Questions List */}
                  <div className="mt-4">
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Questions ({section.questions.length})
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {section.questions.map((question, questionIndex) => (
                        <div key={questionIndex} className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative">
                          {/* Delete Question Button */}
                          <button
                            type="button"
                            onClick={() => deleteQuestion(sectionIndex, questionIndex)}
                            className="absolute top-3 right-3 p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete Question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          
                          <h4 className="font-medium mb-3 text-gray-800 pr-8">Question {questionIndex + 1}</h4>

                          {/* Question Type */}
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Question Type
                            </label>
                            <select
                              value={question.question_type || 'mcq'}
                              onChange={(e) => {
                                updateQuestionField(sectionIndex, questionIndex, "question_type", e.target.value);
                                const updatedSections = [...formData.sections];
                                
                                // Agar math_free tanlanganida
                                if (e.target.value === 'math_free') {
                                  updatedSections[sectionIndex].questions[questionIndex].choices = [];
                                  // correct_answers array'ini boshlash
                                  if (!updatedSections[sectionIndex].questions[questionIndex].correct_answers) {
                                    updatedSections[sectionIndex].questions[questionIndex].correct_answers = [''];
                                  }
                                } else if (e.target.value === 'mcq') {
                                  // Agar mcq tanlanganida va choicelar bo'sh bo'lsa
                                  if (!question.choices || question.choices.length === 0) {
                                    updatedSections[sectionIndex].questions[questionIndex].choices = [
                                      { choice_text: '', choice_label: 'A', is_correct: false },
                                      { choice_text: '', choice_label: 'B', is_correct: false },
                                      { choice_text: '', choice_label: 'C', is_correct: false },
                                      { choice_text: '', choice_label: 'D', is_correct: false }
                                    ];
                                  }
                                  // correct_answers'ni bo'shatish
                                  updatedSections[sectionIndex].questions[questionIndex].correct_answers = [];
                                }
                                setFormData(prev => ({ ...prev, sections: updatedSections }));
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                              <option value="mcq">Multiple Choice (MCQ)</option>
                              <option value="math_free">Math Free Response</option>
                            </select>
                          </div>

                          {/* Answer Format - faqat Math Free Response uchun */}
                          {question.question_type === 'math_free' && (
                            <div className="mb-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Answer Format
                              </label>
                              <select
                                value={question.answer_format || 'integer'}
                                onChange={(e) =>
                                  updateQuestionField(sectionIndex, questionIndex, "answer_format", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="integer">Integer (e.g., 42)</option>
                                <option value="decimal">Decimal (e.g., 3.14)</option>
                                <option value="fraction">Fraction (e.g., 1/2)</option>
                              </select>
                              <p className="text-xs text-gray-500 mt-1">
                                This helps validate student answers more accurately
                              </p>
                            </div>
                          )}

                          {/* Question text */}
                          <input
                            type="text"
                            value={question.question_text}
                            onChange={(e) =>
                              updateQuestionField(sectionIndex, questionIndex, "question_text", e.target.value)
                            }
                            placeholder="Enter question text"
                            className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />

                          {/* Passage text */}
                          <textarea
                            value={question.passage_text}
                            onChange={(e) =>
                              updateQuestionField(sectionIndex, questionIndex, "passage_text", e.target.value)
                            }
                            placeholder="Optional passage..."
                            rows={2}
                            className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />

                          {/* Image Upload Section */}
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Question Image (Optional)
                            </label>
                            
                            {question.image ? (
                              <div className="relative inline-block">
                                <img 
                                  src={question.previewUrl || question.image} 
                                  alt="Question" 
                                  className="max-w-full max-h-64 rounded-lg border border-gray-300 shadow-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(sectionIndex, questionIndex)}
                                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg"
                                  title="Remove image"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="file"
                                  accept="image/*"
                                  ref={el => fileInputRefs.current[`${sectionIndex}-${questionIndex}`] = el}
                                  onChange={(e) => handleImageUpload(sectionIndex, questionIndex, e.target.files[0])}
                                  className="hidden"
                                />
                                <button
                                  type="button"
                                  onClick={() => fileInputRefs.current[`${sectionIndex}-${questionIndex}`]?.click()}
                                  disabled={uploadingImages[`${sectionIndex}-${questionIndex}`]}
                                  className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-100 disabled:opacity-50 flex items-center space-x-2 transition-colors"
                                >
                                  {uploadingImages[`${sectionIndex}-${questionIndex}`] ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                      <span>Uploading...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-4 h-4" />
                                      <span>Upload Image</span>
                                    </>
                                  )}
                                </button>
                                <span className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</span>
                              </div>
                            )}
                          </div>

                          {/* Marks */}
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Marks
                            </label>
                            <input
                              type="number"
                              value={question.marks}
                              onChange={(e) =>
                                updateQuestionField(sectionIndex, questionIndex, "marks", parseInt(e.target.value) || 1)
                              }
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </div>

                          {/* Choices - faqat MCQ uchun */}
                          {question.question_type === 'mcq' && (
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Answer Choices (Select the correct answer)
                              </label>
                              {question.choices && question.choices.map((choice, choiceIndex) => (
                                <div key={choiceIndex} className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-gray-600 w-6">{choice.choice_label}.</span>
                                  <input
                                    type="text"
                                    value={choice.choice_text}
                                    onChange={(e) =>
                                      updateChoiceField(sectionIndex, questionIndex, choiceIndex, "choice_text", e.target.value)
                                    }
                                    placeholder={`Choice ${choice.choice_label}`}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                  />
                                  <label className="flex items-center space-x-1 whitespace-nowrap cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`correct-answer-${sectionIndex}-${questionIndex}`}
                                      checked={choice.is_correct}
                                      onChange={(e) =>
                                        updateChoiceField(sectionIndex, questionIndex, choiceIndex, "is_correct", e.target.checked)
                                      }
                                      className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm text-gray-700">Correct</span>
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Math Free Response uchun correct answers */}
                          {question.question_type === 'math_free' && (
                            <div className="mt-3 space-y-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Correct Answer(s) *
                              </label>
                              <p className="text-xs text-gray-500 mb-2">
                                Enter possible correct answers (e.g., 42, 42.0, 0.5, 1/2). Add multiple if there are alternative correct answers.
                              </p>
                              
                              {(question.correct_answers || ['']).map((answer, answerIndex) => (
                                <div key={answerIndex} className="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={answer}
                                    onChange={(e) => {
                                      const updatedSections = [...formData.sections];
                                      if (!updatedSections[sectionIndex].questions[questionIndex].correct_answers) {
                                        updatedSections[sectionIndex].questions[questionIndex].correct_answers = [];
                                      }
                                      updatedSections[sectionIndex].questions[questionIndex].correct_answers[answerIndex] = e.target.value;
                                      setFormData(prev => ({ ...prev, sections: updatedSections }));
                                    }}
                                    placeholder={`Correct answer ${answerIndex + 1}`}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                  {(question.correct_answers || []).length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updatedSections = [...formData.sections];
                                        updatedSections[sectionIndex].questions[questionIndex].correct_answers.splice(answerIndex, 1);
                                        setFormData(prev => ({ ...prev, sections: updatedSections }));
                                      }}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                              
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedSections = [...formData.sections];
                                  if (!updatedSections[sectionIndex].questions[questionIndex].correct_answers) {
                                    updatedSections[sectionIndex].questions[questionIndex].correct_answers = [];
                                  }
                                  updatedSections[sectionIndex].questions[questionIndex].correct_answers.push('');
                                  setFormData(prev => ({ ...prev, sections: updatedSections }));
                                }}
                                className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Alternative Answer</span>
                              </button>
                              
                              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-xs text-blue-700">
                                  <strong>Note:</strong> Students will enter their numerical answer. You can add multiple correct answers for flexibility (e.g., 0.5, 1/2, .5).
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add Question Button - at the bottom */}
                    <button
                      type="button"
                      onClick={() => addQuestion(sectionIndex)}
                      className="w-full mt-3 px-4 py-2 border-2 border-dashed border-emerald-300 text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="font-medium">Add Question</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Add Section Button - at the bottom of all sections */}
            <button
              type="button"
              onClick={addSection}
              className="w-full mt-4 px-4 py-3 border-2 border-dashed border-blue-300 text-blue-600 hover:border-blue-400 hover:bg-blue-50 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Add New Section</span>
            </button>
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
              type="button"
              onClick={(e) => handleSubmit(e)}   // pass event manually
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