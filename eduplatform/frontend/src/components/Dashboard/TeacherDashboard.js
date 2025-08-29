import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  TrendingUp,
  Award,
  Clock,
  AlertCircle
} from 'lucide-react';
import StatCard from '../Common/StatCard';
import api from '../../services/api';

const TeacherDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/analytics/dashboard-stats/');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load dashboard</h3>
        <p className="text-gray-600">Please try refreshing the page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Teacher Dashboard 👨‍🏫</h1>
        <p className="opacity-90">Monitor your students' progress and manage tests</p>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <StatCard
          title="Tests Created"
          value={stats.overview.total_tests}
          icon={BookOpen}
          color="primary"
        />
        <StatCard
          title="Students"
          value={stats.overview.total_students}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Assignments"
          value={stats.overview.total_assignments}
          icon={CheckCircle}
          color="yellow"
        />
        <StatCard
          title="Class Average"
          value={`${stats.overview.avg_class_score}%`}
          icon={TrendingUp}
          color="primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Activity Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Monthly Activity</h3>
            <p className="chart-subtitle">Tests assigned vs completed over time</p>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.monthly_chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#e0e0e0' }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#e0e0e0' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Bar 
                dataKey="assigned" 
                fill="var(--primary-green)" 
                name="Assigned"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="completed" 
                fill="var(--blue-500)" 
                name="Completed"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Students */}
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Top Performing Students</h3>
            <p className="chart-subtitle">Based on average test scores</p>
          </div>
          
          <div className="space-y-3">
            {stats.student_performance && stats.student_performance.length > 0 ? (
              stats.student_performance.slice(0, 5).map((student, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-yellow-600' :
                      'bg-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{student.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Award className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="font-bold text-gray-900">{student.score}%</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No student data available yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.performance.tests_created}
              </div>
              <div className="text-sm text-gray-600">Tests Created</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.performance.assignments_given}
              </div>
              <div className="text-sm text-gray-600">Assignments Given</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-yellow-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.performance.completion_rate}%
              </div>
              <div className="text-sm text-gray-600">Completion Rate</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Award className="w-8 h-8 text-purple-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.performance.average_class_score}%
              </div>
              <div className="text-sm text-gray-600">Class Average</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Results */}
      <div className="data-table">
        <div className="table-header">
          <h3 className="table-title">Recent Test Results</h3>
        </div>
        <div className="table-content">
          {stats.recent_results && stats.recent_results.length > 0 ? (
            stats.recent_results.map((result, index) => (
              <div key={index} className="table-row">
                <div className="table-cell primary">{result.student}</div>
                <div className="table-cell secondary">{result.test}</div>
                <div className="table-cell">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    result.score >= 80 ? 'bg-green-100 text-green-800' :
                    result.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {result.score}%
                  </span>
                </div>
                <div className="table-cell secondary">
                  <Clock className="w-4 h-4 inline mr-2" />
                  {result.date}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No test results yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;