import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen, Clock, ArrowLeft, ArrowRight, CheckCircle, Home, Flag
} from 'lucide-react';
import useStudentStore from '../store/useStudentStore';

export default function TestPage() {
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

  const q = useMemo(() => currentQuestions?.[idx] || null, [currentQuestions, idx]);

  const [showConfirm, setShowConfirm] = useState(false);
  const [timerHydrated, setTimerHydrated] = useState(false);

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
    if (typeof timeRemaining !== 'number') return; // ignore null/undefined
    if (!timerHydrated) return;                    // ignore first 0 before load
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

  // When new questions arrive, seed localAnswers from store (so persisted choices show selected)
  useEffect(() => {
    if (!Array.isArray(currentQuestions)) return;
    const seeded = { ...localAnswers };
    currentQuestions.forEach((qq) => {
      const cid = currentAnswers[qq.id] ?? qq.selected_choice_id ?? null;
      if (cid != null) seeded[qq.id] = cid;
    });
    setLocalAnswers(seeded);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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


  useEffect(() => {
    if (!currentSection) return;
    const id = setInterval(() => {
      decrementTimer();
    }, 1000);
    return () => clearInterval(id);
  }, [currentSection?.id, decrementTimer]);


  const handleSelect = (choiceId) => {
    if (!q) return;
    // Optimistic UI
    setLocalAnswers((prev) => ({ ...prev, [q.id]: choiceId }));
    // Persist in store
    saveLocalAnswer(q.id, choiceId);
  };

  const toggleMark = () => {
    if (!q) return;
    setMarked((m) => ({ ...m, [q.id]: !m[q.id] }));
  };

  const goNext = () => {
    if (!currentQuestions?.length) return;
    setIdx((i) => Math.min(currentQuestions.length - 1, i + 1));
  };
  const goPrev = () => setIdx((i) => Math.max(0, i - 1));

  const handleCompleteSection = async () => {
  if (!currentSection || !currentTest) return;
  try {
    await completeSection(Number(testId), currentSection.id); // bulk inside store
    const i = currentTest.sections.findIndex((s) => s.id === currentSection.id);
    const hasNext = i !== -1 && i < currentTest.sections.length - 1;
    if (hasNext) {
      const next = currentTest.sections[i + 1];
      await startSection(Number(testId), next.id); // will compute remaining from started_at
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
    <div className="min-h-screen bg-gray-50">
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
      <div className="max-w-7xl mx-auto px-6 py-5 grid grid-cols-12 gap-6">
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
        <main className="col-span-7">
          <div className="bg-white border rounded-lg p-5">
            {/* header row: number + Mark for review */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-500">
                Question {idx + 1} of {currentQuestions.length}
              </div>
              <button
                onClick={toggleMark}
                className={`flex items-center gap-2 px-3 py-1.5 rounded border text-sm ${
                  marked[q?.id]
                    ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                title="Mark for review"
              >
                <Flag className="w-4 h-4" />
                {marked[q?.id] ? 'Marked' : 'Mark for Review'}
              </button>
            </div>

            {/* stem */}
            <div className="text-[17px] font-medium text-gray-900 whitespace-pre-wrap mb-5">
              {q?.question_text}
            </div>

            {/* choices */}
            <div className="space-y-3 mb-8">
              {q?.choices?.map((c) => {
                const isSelected = selectedChoiceId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(c.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all focus:outline-none ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="px-2 py-1 rounded bg-gray-100 text-gray-800 text-sm font-semibold">
                        {c.choice_label}
                      </span>
                      <span className="text-gray-900">{c.choice_text}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* nav row */}
            <div className="flex items-center justify-between">
              <button
                onClick={goPrev}
                disabled={idx === 0}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>

              {idx === currentQuestions.length - 1 ? (
                <button
                onClick={() => setShowConfirm(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
              >
                Complete Section <CheckCircle className="w-4 h-4" />
              </button>
              ) : (
                <button
                  onClick={goNext}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg flex items-center gap-2"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          {showConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Finish this section?</h3>
                <p className="text-gray-600 mb-6">
                  You won’t be able to change your answers after you finish this section.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => { setShowConfirm(false); await handleCompleteSection(); }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                  >
                    Finish Section
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* bottom rail with question numbers (compact) */}
          <div className="mt-4 bg-white border rounded-lg p-3">
            <div className="grid grid-cols-12 gap-1">
              {currentQuestions?.map((qq, i) => {
                const sel = localAnswers[qq.id] != null;
                const isActive = i === idx;
                const isMarked = marked[qq.id];
                return (
                  <button
                    key={qq.id}
                    onClick={() => setIdx(i)}
                    className={`h-9 rounded border text-sm font-medium ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600'
                        : sel
                        ? 'bg-green-100 text-green-800 border-green-300'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    } relative`}
                  >
                    {i + 1}
                    {isMarked && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-3 h-3 rounded-full bg-yellow-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
