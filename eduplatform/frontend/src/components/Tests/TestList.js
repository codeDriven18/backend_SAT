import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Clock, 
  Users, 
  Play, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Award
} from 'lucide-react';
import api from '../../services/api';

const TestList = ({ userType }) => {
  const [tests, setTests] = useState([]);
  const [studentTests, setStudentTests] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userType === 'student') {
      fetchStudentTests();
    } else {
      fetchTests();
    }
  }, [userType]);

  const fetchTests = async () => {
    try {
      const response = await api.get('/tests/');
      setTests(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentTests = async () => {
    try {
      const response = await api.get('/tests/student-tests/');
      setStudentTests(response.data);
    } catch (error) {
      console.error('Error fetching student tests:', error);
    } finally {
      setLoading(false);
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

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" />
      </div>
    );
  }

  // Student View
  if (userType === 'student' && studentTests) {
    return (
      <div className="space-y-6">
        {/* Pending Tests */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
            <h2 className="text-xl font-bold flex items-center">
              <Clock className="w-6 h-6 mr-2" />
              Pending Tests ({studentTests.pending_tests?.length || 0})
            </h2>
            <p className="opacity-90">Tests waiting to be completed</p>
          </div>

          <div className="p-6">
            {studentTests.pending_tests && studentTests.pending_tests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {studentTests.pending_tests.map((assignment) => (
                  <div key={assignment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{assignment.test_title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getDifficultyColor('medium')}`}>
                        Pending
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                      </div>
                      {assignment.due_date && (
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <button className="btn btn-primary w-full">
                      <Play className="w-4 h-4" />
                      Start Test
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg mb-2">No pending tests</p>
                <p>All caught up! Check back later for new assignments.</p>
              </div>
            )}
          </div>
        </div>

        {/* Completed Tests */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
            <h2 className="text-xl font-bold flex items-center">
              <CheckCircle className="w-6 h-6 mr-2" />
              Completed Tests ({studentTests.completed_tests?.length || 0})
            </h2>
            <p className="opacity-90">Your test history and results</p>
          </div>

          <div className="p-6">
            {studentTests.completed_tests && studentTests.completed_tests.length > 0 ? (
              <div className="space-y-4">
                {studentTests.completed_tests.map((completed) => (
                  <div key={completed.assignment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{completed.assignment.test_title}</h3>
                        <p className="text-sm text-gray-600">
                          Completed on {new Date(completed.attempt.completed_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(completed.attempt.percentage)}`}>
                          {completed.attempt.percentage}%
                        </div>
                        <div className="text-sm text-gray-600">
                          {completed.attempt.score}/{completed.attempt.total_marks} points
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        Time: {completed.attempt.time_taken} minutes
                      </div>
                      <div className="flex items-center">
                        <Award className={`w-4 h-4 mr-2 ${completed.attempt.percentage >= 60 ? 'text-green-500' : 'text-red-500'}`} />
                        {completed.attempt.percentage >= 60 ? 'Passed' : 'Failed'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg mb-2">No completed tests yet</p>
                <p>Complete your first test to see results here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Teacher/Admin View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tests</h1>
          <p className="text-gray-600">Manage your created tests</p>
        </div>
      </div>

      {tests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <div key={test.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-gray-900 text-lg">{test.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(test.difficulty)}`}>
                  {test.difficulty}
                </span>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {test.description || 'No description provided'}
              </p>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Questions
                  </span>
                  <span className="font-semibold">{test.question_count || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Time Limit
                  </span>
                  <span className="font-semibold">{test.time_limit} min</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Award className="w-4 h-4 mr-2" />
                    Total Marks
                  </span>
                  <span className="font-semibold">{test.total_marks}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  Created {new Date(test.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center text-xs">
                  <div className={`w-2 h-2 rounded-full mr-2 ${test.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                  {test.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No tests created yet</h3>
          <p className="text-gray-600">Create your first test to get started</p>
        </div>
      )}
    </div>
  );
};

export default TestList;