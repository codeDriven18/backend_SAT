import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Clock, 
  Users, 
  Hash, 
  Eye,
  Calendar,
  Award,
  Copy,
  CheckCircle
} from 'lucide-react';
import api from '../../services/api';

const TeacherTestList = () => {
  const [testGroups, setTestGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    fetchTestGroups();
  }, []);

  const fetchTestGroups = async () => {
    try {
      const response = await api.get('/tests/');
      setTestGroups(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching test groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Test Groups</h1>
          <p className="text-gray-600">Manage your uploaded test groups and share codes with students</p>
        </div>
      </div>

      {testGroups.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {testGroups.map((testGroup) => (
            <div key={testGroup.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">{testGroup.title}</h3>
                  {testGroup.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {testGroup.description}
                    </p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(testGroup.difficulty)}`}>
                  {testGroup.difficulty}
                </span>
              </div>

              {/* Test Code - Most Important */}
              <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-green-600 mb-1">STUDENT ACCESS CODE</div>
                    <div className="text-2xl font-bold text-green-800 font-mono tracking-wider">
                      {testGroup.test_code}
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(testGroup.test_code)}
                    className="btn btn-secondary p-2"
                    title="Copy code"
                  >
                    {copiedCode === testGroup.test_code ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Test Statistics */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="flex items-center text-sm text-gray-600">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Questions
                  </span>
                  <span className="font-semibold text-gray-900">{testGroup.question_count || 0}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    Time Limit
                  </span>
                  <span className="font-semibold text-gray-900">{testGroup.time_limit}m</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="flex items-center text-sm text-gray-600">
                    <Award className="w-4 h-4 mr-2" />
                    Total Marks
                  </span>
                  <span className="font-semibold text-gray-900">{testGroup.total_marks}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    Pass Mark
                  </span>
                  <span className="font-semibold text-gray-900">{testGroup.passing_marks}%</span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  Created {new Date(testGroup.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${testGroup.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="text-xs text-gray-600">
                    {testGroup.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex gap-2">
                <button className="btn btn-secondary flex-1 text-sm">
                  <Eye className="w-4 h-4" />
                  View Results
                </button>
                <button 
                  onClick={() => copyToClipboard(testGroup.test_code)}
                  className="btn btn-primary flex-1 text-sm"
                >
                  <Hash className="w-4 h-4" />
                  Share Code
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <BookOpen className="w-20 h-20 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No test groups created yet</h3>
          <p className="text-gray-600 mb-6">Create your first test group to get started</p>
          <button className="btn btn-primary">
            Create Test Group
          </button>
        </div>
      )}

      {/* Instructions Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">How to use Test Codes:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span className="text-xs font-bold">1</span>
            </div>
            <div>
              <div className="font-medium mb-1">Share the 6-digit code</div>
              <div>Give students the test access code from your test group</div>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span className="text-xs font-bold">2</span>
            </div>
            <div>
              <div className="font-medium mb-1">Students enter code</div>
              <div>They can access and take the test immediately</div>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span className="text-xs font-bold">3</span>
            </div>
            <div>
              <div className="font-medium mb-1">Monitor results</div>
              <div>View student performance and analytics</div>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span className="text-xs font-bold">4</span>
            </div>
            <div>
              <div className="font-medium mb-1">One attempt only</div>
              <div>Each student can take the test only once</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherTestList;