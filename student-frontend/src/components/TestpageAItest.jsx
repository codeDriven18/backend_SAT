import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen, Clock, ArrowLeft, ArrowRight, CheckCircle, Home, Flag, ChevronDown, 
  Eye, X, Undo, MessageSquare, Minus, Grid3x3, AlertCircle, StickyNote, Edit3, Calculator,
  Minimize2, Maximize2, Send, Image as ImageIcon
} from 'lucide-react';
import useStudentStore from '../store/useStudentStore';

const TestPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();

  const {
    currentTest,
    currentSection,
    currentQuestions,
    currentAnswers,
    timeRemaining,
    startTest,
    startSection,
    saveLocalAnswer,
    completeSection,
    completeTest,
    updateTimer,
    decrementTimer,
  } = useStudentStore();

  // local UI state (optimistic)
  const [idx, setIdx] = useState(0);
  const [localAnswers, setLocalAnswers] = useState({}); // { [questionId]: choiceId }
  const [marked, setMarked] = useState({});             // { [questionId]: true }
  const [showPreview, setShowPreview] = useState(false);
  const [hidePassage, setHidePassage] = useState(false);
  
  // Strikethrough for answer choices
  const [strikethroughs, setStrikethroughs] = useState({}); // { [questionId]: [choiceId] }
  
  // Notes system
  const [notes, setNotes] = useState({}); // { [questionId]: noteText }
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [currentNote, setCurrentNote] = useState('');

  // Math free response answers
  const [freeResponseAnswers, setFreeResponseAnswers] = useState({}); // { [questionId]: text }

  // Desmos Calculator - Movable Window
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcPosition, setCalcPosition] = useState({ x: window.innerWidth - 500, y: 100 });
  const [calcSize, setCalcSize] = useState({ width: 450, height: 500 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [calcMinimized, setCalcMinimized] = useState(false);
  const calculatorRef = useRef(null);
  const calculatorInstanceRef = useRef(null);
  const calcWindowRef = useRef(null);

  const q = useMemo(() => {
    if (!Array.isArray(currentQuestions)) return null;
    return currentQuestions[idx] || null;
  }, [currentQuestions, idx]);

  const [showConfirm, setShowConfirm] = useState(false);
  const [timerHydrated, setTimerHydrated] = useState(false);

  // Dragging handlers for calculator
  const handleCalcMouseDown = (e) => {
    if (e.target.closest('.calc-resize-handle')) return;
    setIsDragging(true);
    const rect = calcWindowRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleCalcMouseMove = (e) => {
    if (isDragging && !isResizing) {
      const newX = Math.max(0, Math.min(window.innerWidth - calcSize.width, e.clientX - dragOffset.x));
      const newY = Math.max(0, Math.min(window.innerHeight - calcSize.height, e.clientY - dragOffset.y));
      setCalcPosition({ x: newX, y: newY });
    }
    if (isResizing) {
      const newWidth = Math.max(300, Math.min(800, e.clientX - calcPosition.x));
      const newHeight = Math.max(400, Math.min(700, e.clientY - calcPosition.y));
      setCalcSize({ width: newWidth, height: newHeight });
    }
  };

  const handleCalcMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  // Add global mouse event listeners for calculator dragging
  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleCalcMouseMove);
      window.addEventListener('mouseup', handleCalcMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleCalcMouseMove);
        window.removeEventListener('mouseup', handleCalcMouseUp);
      };
    }
  }, [isDragging, isResizing]);

  // Reset hydration flag whenever the section changes
  useEffect(() => {
    setTimerHydrated(false);
  }, [currentSection?.id]);

  // Mark hydrated once we see a positive number
  useEffect(() => {
    if (typeof timeRemaining === 'number' && timeRemaining > 0) {
      setTimerHydrated(true);
    }
  }, [timeRemaining]);

  // Only auto-complete when hydrated AND now actually expired
  useEffect(() => {
    if (!currentSection) return;
    if (typeof timeRemaining !== 'number') return;
    if (!timerHydrated) return;
    if (timeRemaining <= 0) {
      setShowConfirm(false);
      handleCompleteSection();
    }
  }, [timeRemaining, currentSection?.id, timerHydrated]);

  // INIT: start test -> start current/first section
  useEffect(() => {
    let on = true;
    (async () => {
      const res = await startTest(Number(testId));
      if (!on) return;
      const next = res.current_section || res.sections?.[0];
      if (next) {
        await startSection(Number(testId), next.id);
        setIdx(0);
        setLocalAnswers({});
        setMarked({});
      }
    })().catch(console.error);
    return () => { on = false; };
  }, [testId, startTest, startSection]);

  // When new questions arrive, seed localAnswers from store
  useEffect(() => {
    if (!Array.isArray(currentQuestions)) return;
    const seeded = { ...localAnswers };
    currentQuestions.forEach((qq) => {
      const cid = currentAnswers[qq.id] ?? qq.selected_choice_id ?? null;
      if (cid != null) seeded[qq.id] = cid;
    });
    setLocalAnswers(seeded);
  }, [currentQuestions, currentAnswers]);

  const formatTime = (s = 0) => {
    const m = Math.max(0, Math.floor(s / 60));
    const r = Math.max(0, s % 60);
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  };

  const timerClass =
    timeRemaining != null && timeRemaining <= 60
      ? 'bg-red-600'
      : timeRemaining != null && timeRemaining <= 300
      ? 'bg-amber-500'
      : 'bg-blue-600';

  const selectedChoiceId = q ? (localAnswers[q.id] ?? null) : null;

  // Initialize Desmos Calculator
  useEffect(() => {
    if (showCalculator && calculatorRef.current && !calculatorInstanceRef.current) {
      if (window.Desmos) {
        calculatorInstanceRef.current = window.Desmos.GraphingCalculator(calculatorRef.current, {
          keypad: true,
          expressions: true,
          settingsMenu: true,
          zoomButtons: true,
          expressionsTopbar: true,
          border: false,
        });
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (calculatorInstanceRef.current) {
        calculatorInstanceRef.current = null;
      }
    };
  }, [showCalculator]);

  useEffect(() => {
    if (!currentSection) return;
    const id = setInterval(() => {
      decrementTimer();
    }, 1000);
    return () => clearInterval(id);
  }, [currentSection?.id, decrementTimer]);

  const handleSelect = (choiceId) => {
    if (!q) return;
    setLocalAnswers((prev) => ({ ...prev, [q.id]: choiceId }));
    saveLocalAnswer(q.id, choiceId);
  };

  const handleFreeResponseChange = (e, questionId) => {
    const val = e.target.value;
    if(!q) return;
  
    // local update (for instant input display)
    setFreeResponseAnswers(prev => ({
      ...prev,
      [questionId]: val,
    }));
  
    // global update (for backend submission)
    saveLocalAnswer(questionId, null, val);
  };

  const handleFreeResponseSubmit = () => {
    if (!q || !freeResponseAnswers[q.id]?.trim()) return;
    
    // Save free response answer to backend
    saveLocalAnswer(q.id, null, freeResponseAnswers[q.id]);
    
    // Visual feedback
    const btn = document.getElementById(`send-btn-${q.id}`);
    if (btn) {
      btn.classList.add('scale-110');
      setTimeout(() => btn.classList.remove('scale-110'), 200);
    }
  };

  const toggleMark = () => {
    if (!q) return;
    setMarked((m) => ({ ...m, [q.id]: !m[q.id] }));
  };

  const toggleStrikethrough = (choiceId) => {
    if (!q) return;
    setStrikethroughs((prev) => {
      const current = prev[q.id] || [];
      const isStriked = current.includes(choiceId);
      return {
        ...prev,
        [q.id]: isStriked 
          ? current.filter(id => id !== choiceId)
          : [...current, choiceId]
      };
    });
  };

  const handleNoteOpen = () => {
    if (q) {
      setCurrentNote(notes[q.id] || '');
      setShowNoteModal(true);
    }
  };

  const handleNoteSave = () => {
    if (q) {
      setNotes((prev) => ({
        ...prev,
        [q.id]: currentNote.trim()
      }));
      setShowNoteModal(false);
    }
  };

  const handleNoteDelete = () => {
    if (q) {
      setNotes((prev) => {
        const updated = { ...prev };
        delete updated[q.id];
        return updated;
      });
      setCurrentNote('');
      setShowNoteModal(false);
    }
  };

  const goNext = () => {
    if (!currentQuestions?.length) return;
    setIdx((i) => Math.min(currentQuestions.length - 1, i + 1));
  };
  const goPrev = () => setIdx((i) => Math.max(0, i - 1));

  const handleCompleteSection = async () => {
    if (!currentSection || !currentTest) return;
    try {
      await completeSection(Number(testId), currentSection.id);
      const i = currentTest.sections.findIndex((s) => s.id === currentSection.id);
      const hasNext = i !== -1 && i < currentTest.sections.length - 1;
      if (hasNext) {
        const next = currentTest.sections[i + 1];
        await startSection(Number(testId), next.id);
        setIdx(0);
        setLocalAnswers({});
        setMarked({});
      } else {
        await completeTest(Number(testId));
        navigate('/dashboard');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Test Preview Modal - Modern Enhanced Design
  const TestPreview = () => (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{currentSection.name}</h2>
            <p className="text-blue-100 text-sm mt-1">Question Navigator</p>
          </div>
          <button
            onClick={() => setShowPreview(false)}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="bg-gradient-to-r from-blue-50 to-white p-4 border-b border-blue-100">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{currentQuestions?.length || 0}</div>
              <div className="text-xs text-gray-600 font-medium">Total Questions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {Object.keys(localAnswers).length + Object.keys(freeResponseAnswers).filter(k => freeResponseAnswers[k]).length}
              </div>
              <div className="text-xs text-gray-600 font-medium">Answered</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{Object.values(marked).filter(Boolean).length}</div>
              <div className="text-xs text-gray-600 font-medium">Marked</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg shadow-sm"></div>
              <span className="text-gray-700">Current</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-900 rounded-lg shadow-sm"></div>
              <span className="text-gray-700">Answered</span>
            </div>
            <div className="flex items-center gap-2 relative">
              <div className="w-8 h-8 bg-white border-2 border-red-500 rounded-lg shadow-sm">
                <Flag className="absolute -top-1 -right-1 w-4 h-4 text-red-600 fill-current" />
              </div>
              <span className="text-gray-700">For Review</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white border-2 border-gray-300 rounded-lg shadow-sm"></div>
              <span className="text-gray-700">Unanswered</span>
            </div>
          </div>
        </div>

        {/* Question Grid */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-8 lg:grid-cols-10 gap-3">
            {currentQuestions?.map((qq, i) => {
              const answered = localAnswers[qq.id] != null || (freeResponseAnswers[qq.id] && freeResponseAnswers[qq.id].trim() !== '');
              const isActive = i === idx;
              const isMarked = marked[qq.id];
              return (
                <button
                  key={qq.id}
                  onClick={() => {
                    setIdx(i);
                    setShowPreview(false);
                  }}
                  className={`h-10 rounded-lg border-2 text-sm font-semibold transition-all shadow-sm ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600'
                      : answered
                      ? 'bg-gray-900 text-white border-gray-900'
                      : isMarked
                      ? 'bg-white text-gray-700 border-red-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  } relative`}
                >
                  {i + 1}
                  {isMarked && (
                    <Flag className="absolute -top-1 -right-1 w-4 h-4 text-red-600 fill-current" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  // LOADING
  if (!currentTest || !currentSection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">
                {currentSection.name}
              </h1>
              <p className="text-xs text-gray-500">Section</p>
            </div>
          </div>
          <div className={`${timerClass} text-white px-4 py-1.5 rounded-lg flex items-center gap-2`}>
            <Clock className="w-4 h-4" />
            <span className="font-semibold">{formatTime(timeRemaining ?? 0)}</span>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <Home className="w-4 h-4" /> Dashboard
          </button>
        </div>
      </div>

      {/* Two-pane like Bluebook */}
      <div className="max-w-7xl mx-auto px-6 py-5 grid grid-cols-12 gap-6 flex-1">
        {/* Left: passage (if present) */}
        <aside className="col-span-5">
          <div className="bg-white border rounded-lg p-5 min-h-[60vh]">
            {q?.passage_text ? (
              <div className="prose max-w-none">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {q.passage_text}
                </p>
              </div>
            ) : (
              <div className="text-gray-400">No passage for this question.</div>
            )}
          </div>
        </aside>

        {/* Right: question + choices */}
        <main className="col-span-7 flex flex-col">
          <div className="bg-white border rounded-lg p-5 flex-1">
            {/* header row: number + tools */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-500">
                Question {idx + 1} of {currentQuestions.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHidePassage(!hidePassage)}
                  className={`p-2.5 rounded-lg border-2 transition-colors shadow-sm ${
                    hidePassage
                      ? 'bg-blue-100 text-blue-600 border-blue-200'
                      : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                  title={hidePassage ? 'Show Passage' : 'Hide Passage'}
                >
                  {hidePassage ? <Eye className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => {
                    if (q?.choices && localAnswers[q.id]) {
                      setLocalAnswers((prev) => {
                        const newAnswers = { ...prev };
                        delete newAnswers[q.id];
                        return newAnswers;
                      });
                      saveLocalAnswer(q.id, null);
                    } else if (freeResponseAnswers[q.id]) {
                      setFreeResponseAnswers((prev) => {
                        const newAnswers = { ...prev };
                        delete newAnswers[q.id];
                        return newAnswers;
                      });
                      saveLocalAnswer(q.id, null);
                    }
                  }}
                  disabled={!(localAnswers[q?.id] || freeResponseAnswers[q?.id])}
                  className="p-2.5 text-gray-600 hover:bg-gray-50 rounded-lg border-2 border-gray-200 transition-colors shadow-sm disabled:text-gray-400 disabled:cursor-not-allowed"
                  title="Clear Answer"
                >
                  <Undo className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowCalculator(!showCalculator)}
                  className={`p-2.5 rounded-lg border-2 transition-colors shadow-sm ${
                    showCalculator
                      ? 'bg-blue-100 text-blue-600 border-blue-200'
                      : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                  title="Calculator"
                >
                  <Calculator className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNoteOpen}
                  className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-lg border-2 border-amber-200 transition-colors shadow-sm"
                  title="Add Note"
                >
                  <StickyNote className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowPreview(true)}
                  className="p-2.5 text-blue-600 hover:bg-blue-100 rounded-lg border-2 border-blue-200 transition-colors shadow-sm"
                  title="Question Navigator"
                >
                  <Grid3x3 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Question Text with Enhanced Typography */}
            <div className="mb-8 p-6 bg-white rounded-xl shadow-md border-l-4 border-blue-500">
              <p className="text-lg lg:text-xl text-gray-900 leading-relaxed font-medium whitespace-pre-wrap">
                {q?.question_text}
              </p>
            </div>

            {/* Answer Section - Conditional based on question type */}
            {q?.question_type === 'math_free' ? (
              /* Math Free Response Input */
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200 shadow-md">
                  <label className="block mb-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">?</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-700">
                          Enter your answer:
                        </span>
                      </div>
                      <button
                        onClick={handleFreeResponseSubmit}
                        id={`send-btn-${q.id}`}
                        disabled={!freeResponseAnswers[q.id] || !freeResponseAnswers[q.id].trim()}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                          freeResponseAnswers[q.id] && freeResponseAnswers[q.id].trim()
                            ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <Send className="w-4 h-4" />
                        <span>Submit</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={freeResponseAnswers[q.id] || ''}
                        onChange={(e) => handleFreeResponseChange(e, q.id)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && freeResponseAnswers[q.id]?.trim()) {
                            handleFreeResponseSubmit();
                          }
                        }}
                        placeholder="Type your answer here (e.g., 42, 3/4, -5.5)"
                        className="w-full px-6 py-4 pr-12 text-xl font-semibold text-gray-900 bg-white border-2 border-blue-300 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-blue-600 transition-all placeholder:text-gray-400 placeholder:font-normal"
                        autoComplete="off"
                      />
                      {freeResponseAnswers[q.id] && freeResponseAnswers[q.id].trim() && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <CheckCircle className="w-6 h-6 text-green-600 animate-pulse" />
                        </div>
                      )}
                    </div>
                  </label>
                  {/* Helper text */}
                  <div className="mt-3 p-3 bg-blue-100 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-blue-800">
                        <p className="font-semibold mb-1">Answer Format Tips:</p>
                        <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                          <li>Enter numbers without commas (e.g., 1500 not 1,500)</li>
                          <li>Use fractions like 3/4 or decimals like 0.75</li>
                          <li>For negative numbers, include the minus sign (e.g., -5)</li>
                          <li>Press Enter or click Submit to save your answer</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  {/* Answer preview */}
                  {freeResponseAnswers[q.id] && freeResponseAnswers[q.id].trim() && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-green-800">Your Answer:</p>
                            <p className="text-2xl font-bold text-green-900">{freeResponseAnswers[q.id]}</p>
                          </div>
                        </div>
                        <div className="text-xs text-green-700 bg-green-200 px-3 py-1 rounded-full font-semibold">
                          Saved ✓
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Answer Choices - Modern Design with Strikethrough */
              <div className="space-y-4">
                {q?.choices?.map((choice) => {
                  const isSelected = selectedChoiceId === choice.id;
                  const isStriked = strikethroughs[q?.id]?.includes(choice.id);
                  return (
                    <div key={choice.id} className="relative group">
                      <button
                        onClick={() => handleSelect(choice.id)}
                        className={`w-full text-left p-5 rounded-xl border-2 transition-all relative overflow-hidden ${
                          isSelected
                            ? 'border-blue-600 bg-gradient-to-r from-blue-50 to-blue-100 shadow-lg scale-[1.02]'
                            : isStriked
                            ? 'border-gray-300 bg-gray-50 opacity-60'
                            : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50 hover:shadow-md'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-600 to-blue-400"></div>
                        )}
                        <div className={`flex items-start gap-4 ${isStriked ? 'line-through' : ''}`}>
                          <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center font-bold text-lg flex-shrink-0 transition-all ${
                            isSelected 
                              ? 'border-blue-600 bg-blue-600 text-white shadow-lg' 
                              : isStriked
                              ? 'border-gray-400 bg-gray-200 text-gray-500'
                              : 'border-gray-400 text-gray-600 group-hover:border-blue-500 group-hover:text-blue-600'
                          }`}>
                            {choice.choice_label}
                          </div>
                          <div className="flex-1 pt-2">
                            <span className={`text-base lg:text-lg leading-relaxed ${
                              isStriked ? 'text-gray-500' : 'text-gray-900'
                            }`}>
                              {choice.choice_text}
                            </span>
                          </div>
                          {isSelected && (
                            <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-2" />
                          )}
                        </div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStrikethrough(choice.id);
                        }}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${
                          isStriked
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={isStriked ? 'Remove strikethrough' : 'Strike through'}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Notes display */}
            {notes[q?.id] && (
              <div className="mt-6 p-4 bg-amber-50 rounded-xl border-2 border-amber-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <StickyNote className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-800 mb-1">Your Note:</p>
                    <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">
                      {notes[q.id]}
                    </p>
                  </div>
                  <button
                    onClick={handleNoteOpen}
                    className="p-1 text-amber-600 hover:bg-amber-100 rounded transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Bottom Navigation Bar - Enhanced Modern Design */}
      <div className="bg-gradient-to-r from-white to-blue-50 border-t-2 border-blue-200 px-4 py-4 flex-shrink-0 shadow-2xl">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={goPrev}
              disabled={idx === 0}
              className="p-2.5 text-gray-700 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold hover:from-gray-800 hover:to-gray-700 transition-all shadow-lg"
            >
              <span className="text-sm lg:text-base">Question {idx + 1} of {currentQuestions?.length || 0}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={goNext}
              disabled={idx === currentQuestions?.length - 1}
              className="p-2.5 text-gray-700 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          <div>
            {idx === currentQuestions?.length - 1 ? (
              <button
                onClick={() => setShowConfirm(true)}
                className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Finish Section
              </button>
            ) : (
              <button
                onClick={goNext}
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-amber-400 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <StickyNote className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Add Note</h3>
                  <p className="text-amber-100 text-sm">Question {idx + 1}</p>
                </div>
              </div>
              <button
                onClick={() => setShowNoteModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your note or reminder:
                </label>
                <textarea
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  placeholder="Write your thoughts, reminders, or strategies here..."
                  className="w-full h-48 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none text-base leading-relaxed"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">
                  {currentNote.length} characters
                </p>
              </div>
              <div className="flex gap-3">
                {notes[q?.id] && (
                  <button
                    onClick={handleNoteDelete}
                    className="px-6 py-3 text-red-600 hover:bg-red-50 border-2 border-red-300 rounded-xl font-semibold transition-all"
                  >
                    Delete Note
                  </button>
                )}
                <button
                  onClick={() => setShowNoteModal(false)}
                  className="flex-1 px-6 py-3 text-gray-700 hover:bg-gray-100 border-2 border-gray-300 rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNoteSave}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-white rounded-xl font-bold transition-all shadow-lg"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal - Modern Enhanced Design */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-500 p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Submit Section?</h3>
                  <p className="text-green-100 text-sm mt-1">Review your answers before submitting</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6 leading-relaxed">
                Once you submit this section, you <strong>won’t be able to return to it</strong>. 
                Please make sure you’ve answered all questions you want to complete.
              </p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600">{currentQuestions?.length || 0}</div>
                  <div className="text-xs text-gray-600 font-medium mt-1">Total</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
                  <div className="text-3xl font-bold text-green-600">
                    {Object.keys(localAnswers).length + Object.keys(freeResponseAnswers).filter(k => freeResponseAnswers[k]).length}
                  </div>
                  <div className="text-xs text-gray-600 font-medium mt-1">Answered</div>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center border border-red-200">
                  <div className="text-3xl font-bold text-red-600">
                    {(currentQuestions?.length || 0) - (Object.keys(localAnswers).length + Object.keys(freeResponseAnswers).filter(k => freeResponseAnswers[k]).length)}
                  </div>
                  <div className="text-xs text-gray-600 font-medium mt-1">Unanswered</div>
                </div>
              </div>
              {(currentQuestions?.length || 0) - (Object.keys(localAnswers).length + Object.keys(freeResponseAnswers).filter(k => freeResponseAnswers[k]).length) > 0 && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Unanswered Questions</p>
                      <p className="text-xs text-amber-700 mt-1">
                        You have {(currentQuestions?.length || 0) - (Object.keys(localAnswers).length + Object.keys(freeResponseAnswers).filter(k => freeResponseAnswers[k]).length)} unanswered question(s). 
                        Would you like to review them first?
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-6 py-3 text-gray-700 hover:bg-gray-100 border-2 border-gray-300 rounded-xl font-semibold transition-all"
                >
                  Review Answers
                </button>
                <button
                  onClick={async () => {
                    setShowConfirm(false);
                    await handleCompleteSection();
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Submit Section
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desmos Calculator Movable Window */}
      {showCalculator && (
        <div
          ref={calcWindowRef}
          className={`fixed bg-white shadow-2xl z-50 flex flex-col rounded-lg border-2 border-gray-300 ${
            calcMinimized ? 'w-16' : ''
          }`}
          style={{
            left: calcMinimized ? `${window.innerWidth - 64}px` : `${calcPosition.x}px`,
            top: calcMinimized ? '16px' : `${calcPosition.y}px`,
            width: calcMinimized ? undefined : `${calcSize.width}px`,
            height: calcMinimized ? undefined : `${calcSize.height}px`,
            transition: calcMinimized ? 'width 0.3s, height 0.3s' : 'none'
          }}
        >
          {/* Resize Handle */}
          {!calcMinimized && (
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize calc-resize-handle"
              onMouseDown={() => setIsResizing(true)}
            >
              <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-gray-400"></div>
            </div>
          )}

          {/* Header */}
          <div
            className="bg-gradient-to-r from-blue-600 to-blue-500 p-3 flex items-center justify-between flex-shrink-0 shadow-lg"
            onMouseDown={calcMinimized ? null : handleCalcMouseDown}
            style={{ cursor: calcMinimized ? 'default' : 'move' }}
          >
            {!calcMinimized ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <Calculator className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm lg:text-base font-bold text-white">Calculator</h3>
                    <p className="text-blue-100 text-xs hidden lg:block">Drag to move or resize</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCalcMinimized(true)}
                    className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                    title="Minimize - Keep in corner"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowCalculator(false)}
                    className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                    title="Close Calculator"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => setCalcMinimized(false)}
                className="w-full flex flex-col items-center gap-2 py-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                title="Open Calculator"
              >
                <Calculator className="w-6 h-6" />
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Calculator Container - only show when not minimized */}
          {!calcMinimized && (
            <>
              <div className="flex-1 overflow-hidden bg-gray-50 relative">
                <div 
                  ref={calculatorRef} 
                  className="w-full h-full"
                  style={{ minHeight: '400px' }}
                />
                {(isDragging || isResizing) && (
                  <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-semibold shadow-lg">
                    {isResizing ? `${Math.round(calcSize.width)}x${Math.round(calcSize.height)}px` : 'Moving'}
                  </div>
                )}
              </div>
              <div className="bg-white border-t-2 border-blue-200 p-3 flex-shrink-0 shadow-lg">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <p className="flex-1">
                    Drag header to move • Drag bottom-right to resize • Click minimize to hide
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Test preview modal */}
      {showPreview && <TestPreview />}
    </div>
  );
};

export default TestPage;