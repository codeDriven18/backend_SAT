import React, { useState, useEffect } from 'react';
import { Trophy, Clock, Calendar, Award, TrendingUp, BarChart3 } from 'lucide-react';
import api from '../../services/api';

const TestResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTestResults();
  }, []);

  const fetchTestResults = async () => {
    try {
      const response = await api.get('/tests/attempts/');
      setResults(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching test results:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  const filteredResults = results.filter(result => {
    if (filter === 'all') return true;
    if (filter === 'passed') return result.percentage >= 60;
    if (filter === 'failed') return result.percentage < 60;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Test Results</h1>
          <p className="text-gray-600">View and analyze test performance</p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="form-select"
          >
            <option value="all">All Results</option>
            <option value="passed">Passed Only</option>
            <option value="failed">Failed Only</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{results.length}</div>
                <div className="text-sm text-gray-600">Total Attempts</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Trophy className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length) || 0}%
                </div>
                <div className="text-sm text-gray-600">Average Score</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Award className="w-8 h-8 text-yellow-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {results.filter(r => r.percentage >= 60).length}
                </div>
                <div className="text-sm text-gray-600">Passed</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-purple-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round((results.filter(r => r.percentage >= 60).length / results.length) * 100) || 0}%
                </div>
                <div className="text-sm text-gray-600">Pass Rate</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Test Results ({filteredResults.length})
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredResults.length > 0 ? (
            filteredResults.map((result) => (
              <div key={result.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {result.test_title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 gap-4">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(result.completed_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {result.time_taken} minutes
                      </span>
                      {result.student_name && (
                        <span className="flex items-center">
                          Student: {result.student_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`inline-flex items-center px-3 py-2 rounded-lg font-bold text-lg ${getScoreColor(result.percentage)}`}>
                      {result.percentage}%
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Grade: {getGrade(result.percentage)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Score</span>
                    <span className="font-semibold">{result.score}/{result.total_marks}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      result.percentage >= 60 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {result.percentage >= 60 ? 'Passed' : 'Failed'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Completion</span>
                    <span className="font-semibold text-green-600">100%</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Performance</span>
                    <span>{result.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        result.percentage >= 80 ? 'bg-green-500' :
                        result.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(result.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? 'No test results available yet' 
                  : `No ${filter} results found`
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestResults;