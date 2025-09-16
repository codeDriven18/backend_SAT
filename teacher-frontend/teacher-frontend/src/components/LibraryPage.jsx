import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Eye, BookOpen } from "lucide-react";
import { teacherAPI } from "../api/teacherApi";

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

const badgeClass = (difficulty) => {
  const d = (difficulty || "").toLowerCase();
  if (d === "hard") return "text-red-600 bg-red-50";
  if (d === "medium") return "text-yellow-600 bg-yellow-50";
  return "text-green-600 bg-green-50";
};

const LibraryPage = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState({ tests: true, preview: false });
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [preview, setPreview] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading((p) => ({ ...p, tests: true }));
        setError(null);
        const res = await teacherAPI.getLibraryTests();
        console.log(res.data.result);
        if (!cancelled) setTests(Array.isArray(res.data) ? res.data : res.data.result || []);
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.detail || "Failed to load tests");
      } finally {
        if (!cancelled) setLoading((p) => ({ ...p, tests: false }));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tests;
    return tests.filter(
      (t) =>
        (t.title || "").toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q)
    );
  }, [tests, searchQuery]);

  const handleViewDetails = async (id) => {
    try {
      setLoading((p) => ({ ...p, preview: true }));
      const { data } = await teacherAPI.previewLibraryTest(id);
      setPreview(data);
      setPreviewOpen(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading((p) => ({ ...p, preview: false }));
    }
  };

  if (loading.tests) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Library</h2>
          <p className="text-gray-600">Browse and reuse public tests</p>
        </div>
        {/* No "Create Test" button here */}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Filter</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 text-red-700 bg-red-50 border-b border-red-100">{error}</div>
        )}

        <div className="divide-y divide-gray-100">
          {filtered.length > 0 ? (
            filtered.map((test) => (
              <div key={test.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{test.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeClass(test.difficulty)}`}>
                        {test.difficulty}
                      </span>
                      {test.is_active && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium text-emerald-600 bg-emerald-50">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2 line-clamp-2">{test.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {typeof test.question_count === "number" && <span>{test.question_count} questions</span>}
                      <span>{test.total_marks} points</span>
                      <span>Created {formatDate(test.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewDetails(test.id)}
                      className="inline-flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      <Eye className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">View details</span>
                    </button>
                    <button
                      onClick={() => navigate(`/teacher/library/${test.id}`)}
                      className="ml-2 text-emerald-700 hover:text-emerald-800 text-sm"
                    >
                      Open full view →
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tests found</h3>
              <p className="text-gray-500">Try a different search.</p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Drawer/Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPreviewOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white shadow-xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Preview</h3>
              <button onClick={() => setPreviewOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            {loading.preview || !preview ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">{preview.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeClass(preview.difficulty)}`}>
                      {preview.difficulty}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1">{preview.description}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    <span>By {preview.created_by}</span> ·{" "}
                    <span>{preview.total_marks} points</span> ·{" "}
                    <span>Created {formatDate(preview.created_at)}</span>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="px-4 py-2 bg-gray-50 border-b font-medium text-sm text-gray-700">Sections</div>
                  <ul className="divide-y">
                    {preview.sections.map((s) => (
                      <li key={s.id} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{s.name}</div>
                          <div className="text-sm text-gray-500">
                            {s.question_count} questions{typeof s.time_limit === "number" ? ` · ${s.time_limit} min` : ""}
                          </div>
                        </div>
                        <button
                          className="text-emerald-700 hover:text-emerald-800 text-sm"
                          onClick={() => {
                            setPreviewOpen(false);
                            navigate(`/teacher/library/${preview.id}`);
                          }}
                        >
                          Review →
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => {
                      setPreviewOpen(false);
                      navigate(`/teacher/library/${preview.id}`);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg"
                  >
                    Open full view
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LibraryPage;