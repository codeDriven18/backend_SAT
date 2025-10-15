import React, { useState, useEffect } from 'react';
import { X, BarChart3, Users, TrendingUp, Clock, Award, CheckCircle } from 'lucide-react';
import { teacherAPI } from '../../api/teacherApi';

const TestAnalyticsModal = ({ testId, onClose }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, [testId]);

  const fetchAnalytics = async () => {
    try {
      const response = await teacherAPI.getTestAnalytics(testId);
      setAnalytics(response.data);
    } catch (err) {
      setError('Failed to load analytics');
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

  if (error || !analytics) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md">
          <p className="text-red-600 mb-4">{error || 'Analytics not available'}</p>
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
      <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Test Analytics</h2>
              <p className="text-blue-100 text-sm">{analytics.test_title || 'Performance Overview'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Stats Overview */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">
                  {analytics.total_attempts || 0}
                </span>
              </div>
              <p className="text-sm text-gray-600">Total Attempts</p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-bold text-green-600">
                  {analytics.completed_attempts || 0}
                </span>
              </div>
              <p className="text-sm text-gray-600">Completed</p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span className="text-2xl font-bold text-purple-600">
                  {analytics.average_score ? `${analytics.average_score}%` : 'N/A'}
                </span>
              </div>
              <p className="text-sm text-gray-600">Average Score</p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-5 h-5 text-yellow-600" />
                <span className="text-2xl font-bold text-yellow-600">
                  {analytics.highest_score ? `${analytics.highest_score}%` : 'N/A'}
                </span>
              </div>
              <p className="text-sm text-gray-600">Highest Score</p>
            </div>
          </div>
        </div>

        {/* Detailed Analytics */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Recent Attempts */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Attempts</h3>
            {analytics.recent_attempts && analytics.recent_attempts.length > 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {analytics.recent_attempts.map((attempt, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {attempt.student_name || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(attempt.started_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {attempt.time_taken ? `${Math.round(attempt.time_taken / 60)} min` : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {attempt.percentage !== undefined ? (
                            <span className={`font-medium ${
                              attempt.percentage >= 80 ? 'text-green-600' :
                              attempt.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {attempt.percentage}%
                            </span>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            attempt.status === 'completed' ? 'bg-green-100 text-green-700' :
                            attempt.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {attempt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500">No attempts yet</p>
              </div>
            )}
          </div>

          {/* Question-wise Performance */}
          {analytics.question_stats && analytics.question_stats.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Performance</h3>
              <div className="space-y-3">
                {analytics.question_stats.map((stat, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        Question {stat.question_number || idx + 1}
                      </span>
                      <span className="text-sm text-gray-600">
                        {stat.correct_count || 0} / {stat.total_attempts || 0} correct
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          stat.success_rate >= 80 ? 'bg-green-500' :
                          stat.success_rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${stat.success_rate || 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {stat.success_rate?.toFixed(1) || 0}% success rate
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestAnalyticsModal;
