import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { teacherAPI } from "../../api/teacherApi";

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

const LibraryTestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [t, p] = await Promise.all([
          teacherAPI.getLibraryTest(id),
          teacherAPI.previewLibraryTest(id),
        ]);
        if (!cancelled) {
          setTest(t.data || null);
          setPreview(p.data || null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const questions = useMemo(() => {
    // Expecting nested sections with questions in the full test payload
    // Fallback to empty array if not present
    const secs = (test && test.sections) || [];
    const list = [];
    let idx = 1;
    secs.forEach((s) => {
      (s.questions || []).forEach((q) => {
        list.push({
          index: idx++,
          sectionName: s.name,
          correct: q.correct_answer || q.answer || "",
          yourAnswer: q.your_answer || "Omitted",
          complexity: q.complexity || q.difficulty || "", // fallback
          id: q.id,
        });
      });
    });
    return list;
  }, [test]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!test || !preview) {
    return (
      <div className="p-6">
        <button onClick={() => navigate(-1)} className="text-emerald-700 mb-4">← Back</button>
        <div className="text-gray-600">Test not found or not accessible.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <button onClick={() => navigate(-1)} className="text-emerald-700">← Back</button>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-gray-900">{preview.title}</h1>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {preview.difficulty}
          </span>
        </div>
        <p className="text-gray-600">{preview.description}</p>
        <div className="mt-3 text-sm text-gray-500">
          <span>{preview.total_marks} points</span> ·{" "}
          <span>Passing {preview.passing_marks}</span> ·{" "}
          <span>Created {formatDate(preview.created_at)}</span>
        </div>
      </div>

      {/* Sections summary */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b font-medium text-gray-700">Sections</div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500">
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Section</th>
              <th className="px-4 py-2">Time limit</th>
              <th className="px-4 py-2">Questions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {preview.sections.map((s, i) => (
              <tr key={s.id} className="text-sm">
                <td className="px-4 py-3">{i + 1}</td>
                <td className="px-4 py-3">{s.name}</td>
                <td className="px-4 py-3">{typeof s.time_limit === "number" ? `${s.time_limit} min` : "—"}</td>
                <td className="px-4 py-3">{s.question_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Questions table (similar to your screenshot) */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b font-medium text-gray-700">Questions</div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500">
              <th className="px-4 py-2">Question</th>
              <th className="px-4 py-2">Section</th>
              <th className="px-4 py-2">Correct Answer</th>
              <th className="px-4 py-2">Your Answer</th>
              <th className="px-4 py-2">Complexity</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {questions.map((q) => (
              <tr key={q.id || q.index} className="text-sm">
                <td className="px-4 py-3">{q.index}</td>
                <td className="px-4 py-3">{q.sectionName}</td>
                <td className="px-4 py-3">{q.correct || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-lg text-xs ${q.yourAnswer === "Omitted" ? "bg-gray-200 text-gray-700" : "bg-red-100 text-red-700"}`}>
                    {q.yourAnswer || "—"}
                  </span>
                </td>
                <td className="px-4 py-3">{q.complexity || "—"}</td>
                <td className="px-4 py-3">
                  <button
                    className="px-3 py-1 border rounded hover:bg-gray-50"
                    onClick={() => {
                      // Hook up to your per-question review route if you have one
                      // e.g., navigate(`/teacher/library/${id}/question/${q.id}`);
                      alert("Attach this to your question review page.");
                    }}
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
            {questions.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={6}>
                  No questions available in this test payload.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LibraryTestDetailPage;