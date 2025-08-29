import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Users, 
  BookOpen, 
  Activity, 
  TrendingUp,
  GraduationCap,
  UserCheck,
  Settings,
  AlertCircle
} from 'lucide-react';
import StatCard from '../Common/StatCard';
import api from '../../services/api';

const AdminDashboard = () => {
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

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

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
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Admin Dashboard ⚙️</h1>
        <p className="opacity-90">Monitor platform activity and manage users</p>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <StatCard
          title="Total Users"
          value={stats.overview.total_users}
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Students"
          value={stats.overview.total_students}
          icon={GraduationCap}
          color="blue"
        />
        <StatCard
          title="Teachers"
          value={stats.overview.total_teachers}
          icon={UserCheck}
          color="yellow"
        />
        <StatCard
          title="Total Tests"
          value={stats.overview.total_tests}
          icon={BookOpen}
          color="primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Activity Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Platform Activity</h3>
            <p className="chart-subtitle">Test attempts over the last 7 days</p>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.activity_chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
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
              <Line 
                type="monotone" 
                dataKey="attempts" 
                stroke="var(--primary-green)"
                strokeWidth={3}
                dot={{ fill: 'var(--primary-green)', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, fill: 'var(--primary-green)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* User Distribution Pie Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">User Distribution</h3>
            <p className="chart-subtitle">Breakdown by user type</p>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.user_distribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {stats.user_distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.activity.total_attempts}
              </div>
              <div className="text-sm text-gray-600">Total Test Attempts</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.activity.active_tests}
              </div>
              <div className="text-sm text-gray-600">Active Tests</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-yellow-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.activity.recent_signups}
              </div>
              <div className="text-sm text-gray-600">New Users (7 days)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="data-table">
        <div className="table-header">
          <h3 className="table-title">Recent User Registrations</h3>
        </div>
        <div className="table-content">
          {stats.recent_users && stats.recent_users.length > 0 ? (
            stats.recent_users.map((user, index) => (
              <div key={index} className="table-row">
                <div className="table-cell primary">{user.username}</div>
                <div className="table-cell">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                    user.user_type === 'student' ? 'bg-green-100 text-green-800' :
                    user.user_type === 'teacher' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {user.user_type}
                  </span>
                </div>
                <div className="table-cell secondary">
                  Joined {user.date_joined}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No recent registrations</p>
            </div>
          )}
        </div>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">System Status</div>
              <div className="text-lg font-bold text-green-600">Healthy</div>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">Database</div>
              <div className="text-lg font-bold text-green-600">Online</div>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">API Status</div>
              <div className="text-lg font-bold text-green-600">Active</div>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">Storage</div>
              <div className="text-lg font-bold text-yellow-600">85%</div>
            </div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;