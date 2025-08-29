import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Trophy, 
  TrendingUp,
  Calendar,
  AlertCircle
} from 'lucide-react';
import StatCard from '../Common/StatCard';
import api from '../../services/api';

const StudentDashboard = () => {
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
        <h1 className="text-2xl font-bold mb-2">Welcome back! 👋</h1>
        <p className="opacity-90">Ready to continue your learning journey?</p>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <StatCard
          title="Total Assigned"
          value={stats.overview.total_assigned}
          icon={BookOpen}
          color="primary"
        />
        <StatCard
          title="Completed"
          value={stats.overview.completed}
          icon={CheckCircle}
          color="blue"
        />
        <StatCard
          title="Pending"
          value={stats.overview.pending}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Average Score"
          value={`${stats.overview.avg_score}%`}
          icon={Trophy}
          color="primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Performance Trend</h3>
            <p className="chart-subtitle">Your scores over recent tests</p>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.performance_chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="test" 
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#e0e0e0' }}
              />
              <YAxis 
                domain={[0, 100]}
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
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="var(--primary-green)"
                strokeWidth={3}
                dot={{ fill: 'var(--primary-green)', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, fill: 'var(--primary-green)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Overview */}
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Performance Overview</h3>
            <p className="chart-subtitle">Your overall statistics</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Trophy className="w-5 h-5 text-yellow-500 mr-3" />
                <span className="font-medium">Highest Score</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                {stats.performance.highest_score}%
              </span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <TrendingUp className="w-5 h-5 text-green-500 mr-3" />
                <span className="font-medium">Average Score</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                {stats.performance.average_score}%
              </span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-blue-500 mr-3" />
                <span className="font-medium">Time Spent</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                {stats.performance.total_time_spent} min
              </span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                <span className="font-medium">Completion Rate</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                {stats.performance.completion_rate}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tests */}
      <div className="data-table">
        <div className="table-header">
          <h3 className="table-title">Recent Test Results</h3>
        </div>
        <div className="table-content">
          {stats.recent_tests && stats.recent_tests.length > 0 ? (
            stats.recent_tests.map((test, index) => (
              <div key={index} className="table-row">
                <div className="table-cell primary">{test.title}</div>
                <div className="table-cell">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    test.score >= 80 ? 'bg-green-100 text-green-800' :
                    test.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {test.score}%
                  </span>
                </div>
                <div className="table-cell secondary">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  {test.date}
                </div>
                <div className="table-cell secondary">
                  <Clock className="w-4 h-4 inline mr-2" />
                  {test.time_taken} min
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No tests completed yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;