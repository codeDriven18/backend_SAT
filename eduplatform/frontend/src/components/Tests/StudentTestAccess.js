import React, { useState } from 'react';
import { Hash, Play, Clock, BookOpen, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const StudentTestAccess = ({ onTestStart }) => {
  const [testCode, setTestCode] = useState('');
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAccessTest = async (e) => {
    e.preventDefault();
    if (testCode.length !== 6) {
      setError('Test code must be 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/tests/access-by-code/', {
        test_code: testCode
      });
      setTestData(response.data);
    } catch (error) {
      setError(error.response?.data?.error || 'Invalid test code');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/tests/start-attempt/', {
        test_code: testCode
      });
      onTestStart(response.data);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to start test');
      setLoading(false);
    }
  };

  if (testData) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">Ready to Start Test</h1>
            <p className="opacity-90">Review the test details before you begin</p>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {testData.title}
              </h2>
              {testData.description && (
                <p className="text-gray-600">{testData.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <BookOpen className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                  <div className="font-semibold text-lg">{testData.questions.length}</div>
                  <div className="text-sm text-gray-600">Questions</div>
                </div>
              </div>

              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <Clock className="w-8 h-8 text-green-500 mr-3" />
                <div>
                  <div className="font-semibold text-lg">{testData.time_limit}</div>
                  <div className="text-sm text-gray-600">Minutes</div>
                </div>
              </div>

              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <Hash className="w-8 h-8 text-purple-500 mr-3" />
                <div>
                  <div className="font-semibold text-lg">{testData.total_marks}</div>
                  <div className="text-sm text-gray-600">Total Marks</div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                <div className="text-yellow-800">
                  <div className="font-semibold mb-1">Important Instructions:</div>
                  <ul className="text-sm space-y-1">
                    <li>• You have {testData.time_limit} minutes to complete all questions</li>
                    <li>• Each question has 4 options (A, B, C, D)</li>
                    <li>• You can navigate between questions and change your answers</li>
                    <li>• The test will auto-submit when time runs out</li>
                    <li>• You can only attempt this test once</li>
                  </ul>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setTestData(null);
                  setTestCode('');
                }}
                className="btn btn-secondary flex-1"
                disabled={loading}
              >
                Back to Code Entry
              </button>
              <button
                onClick={handleStartTest}
                className="btn btn-primary flex-1"
                disabled={loading}
              >
                {loading ? (
                  <div className="loading-spinner" />
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Test
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white text-center">
          <Hash className="w-12 h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Enter Test Code</h1>
          <p className="opacity-90">Enter the 6-digit code provided by your teacher</p>
        </div>

        <form onSubmit={handleAccessTest} className="p-6">
          <div className="form-group">
            <label className="form-label text-center">Test Access Code</label>
            <input
              type="text"
              value={testCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setTestCode(value);
                setError('');
              }}
              className="form-input text-center text-2xl font-mono tracking-wider"
              placeholder="000000"
              maxLength="6"
              required
            />
            <div className="text-center text-sm text-gray-500 mt-2">
              Enter all 6 digits
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || testCode.length !== 6}
            className="btn btn-primary w-full"
          >
            {loading ? (
              <div className="loading-spinner" />
            ) : (
              <>
                <Hash className="w-4 h-4" />
                Access Test
              </>
            )}
          </button>
        </form>

        <div className="px-6 pb-6">
          <div className="text-center text-sm text-gray-500">
            <p className="mb-2">Don't have a test code?</p>
            <p>Ask your teacher for the 6-digit access code</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentTestAccess;