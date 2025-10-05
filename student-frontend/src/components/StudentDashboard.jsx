import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  TrendingUp,
  Award,
  Play,
  User,
  LogOut,
  BarChart3,
  FileText,
  CheckCircle,
  AlertCircle,
  Calendar,
  Search,
  Bell,
  ChevronRight,
  Users,
  Target,
  Timer,
  Eye
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import useAuth from '../hooks/useAuth';
import useStudentStore from '../store/useStudentStore';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const {
    assignedTests,
    dashboardLoading,
    attempts,
    loadAssignedTests,
    loadAttempts
  } = useStudentStore();

  useEffect(() => {
    loadAssignedTests();
    loadAttempts();
  }, [loadAssignedTests, loadAttempts]);

  // Generate dynamic notifications based on student data
  useEffect(() => {
    const generateNotifications = () => {
      const newNotifications = [];
      const now = new Date();

      // Check for new assigned tests
      assignedTests.forEach(test => {
        const testDate = new Date(test.created_at || test.assigned_at);
        const daysSinceAssigned = Math.floor((now - testDate) / (1000 * 60 * 60 * 24));
        
        if (daysSinceAssigned <= 1) {
          newNotifications.push({
            id: `new-test-${test.id}`,
            type: 'new_test',
            title: 'New Test Assigned',
            message: `"${test.title}" has been assigned to you`,
            timestamp: testDate,
            unread: true,
            action: () => setActiveTab('tests')
          });
        }
      });

      // Check for test deadlines
      assignedTests.forEach(test => {
        if (test.deadline) {
          const deadline = new Date(test.deadline);
          const daysUntilDeadline = Math.floor((deadline - now) / (1000 * 60 * 60 * 24));
          
          if (daysUntilDeadline <= 3 && daysUntilDeadline >= 0) {
            newNotifications.push({
              id: `deadline-${test.id}`,
              type: 'deadline',
              title: 'Test Deadline Approaching',
              message: `"${test.title}" is due in ${daysUntilDeadline === 0 ? 'today' : `${daysUntilDeadline} day${daysUntilDeadline > 1 ? 's' : ''}`}`,
              timestamp: now,
              unread: true,
              action: () => setActiveTab('tests')
            });
          }
        }
      });

      // Check for completed tests that need review
      attempts.forEach(attempt => {
        if (attempt.status === 'completed' && attempt.percentage !== undefined) {
          const completedDate = new Date(attempt.completed_at || attempt.started_at);
          const daysSinceCompleted = Math.floor((now - completedDate) / (1000 * 60 * 60 * 24));
          
          if (daysSinceCompleted <= 1) {
            newNotifications.push({
              id: `completed-${attempt.id}`,
              type: 'completed',
              title: 'Test Completed',
              message: `You scored ${attempt.percentage}% on "${attempt.test_title}"`,
              timestamp: completedDate,
              unread: true,
              action: () => setActiveTab('results')
            });
          }
        }
      });

      // Check for performance achievements
      const recentAttempts = attempts.filter(attempt => {
        const attemptDate = new Date(attempt.started_at);
        const daysSinceAttempt = Math.floor((now - attemptDate) / (1000 * 60 * 60 * 24));
        return daysSinceAttempt <= 7 && attempt.status === 'completed';
      });

      if (recentAttempts.length > 0) {
        const highScores = recentAttempts.filter(attempt => attempt.percentage >= 90);
        if (highScores.length > 0) {
          newNotifications.push({
            id: 'high-score',
            type: 'achievement',
            title: 'Excellent Performance!',
            message: `You achieved ${highScores.length} high score${highScores.length > 1 ? 's' : ''} (90%+) this week`,
            timestamp: now,
            unread: true,
            action: () => setActiveTab('performance')
          });
        }
      }

      // Check for improvement opportunities
      const lowScores = attempts.filter(attempt => 
        attempt.status === 'completed' && attempt.percentage < 70
      );
      
      if (lowScores.length >= 2) {
        newNotifications.push({
          id: 'improvement',
          type: 'improvement',
          title: 'Practice More',
          message: 'Consider reviewing your weak areas to improve your scores',
          timestamp: now,
          unread: true,
          action: () => setActiveTab('performance')
        });
      }

      setNotifications(newNotifications);
    };

    if (!dashboardLoading) {
      generateNotifications();
    }
  }, [assignedTests, attempts, dashboardLoading]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleStartTest = (testId) => {
    navigate(`/test/${testId}`);
  };

  const handleNotificationClick = (notification) => {
    // Mark as read
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, unread: false } : n)
    );
    
    // Execute notification action
    if (notification.action) {
      notification.action();
    }
    
    // Close dropdown
    setShowNotifications(false);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_test': return <FileText className="w-4 h-4" />;
      case 'deadline': return <AlertCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'achievement': return <Award className="w-4 h-4" />;
      case 'improvement': return <TrendingUp className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'new_test': return 'text-blue-600 bg-blue-50';
      case 'deadline': return 'text-red-600 bg-red-50';
      case 'completed': return 'text-green-600 bg-green-50';
      case 'achievement': return 'text-yellow-600 bg-yellow-50';
      case 'improvement': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Calculate comprehensive stats
  const completedTests = attempts.filter(attempt => attempt.status === 'completed').length;
  const inProgressTests = attempts.filter(attempt => attempt.status === 'in_progress').length;
  const averageScore = attempts.length > 0 
    ? Math.round(attempts.reduce((sum, attempt) => sum + (attempt.percentage || 0), 0) / completedTests)
    : 0;

  // Performance data for charts
  const performanceData = attempts
    .filter(attempt => attempt.status === 'completed')
    .slice(0, 5)
    .map((attempt, index) => ({
      name: attempt.test_title?.substring(0, 10) + '...' || `Test ${index + 1}`,
      score: attempt.percentage || 0
    }));

  // Pie chart data for test status
  const statusData = [
    { name: 'Completed', value: completedTests, color: '#10B981' },
    { name: 'In Progress', value: inProgressTests, color: '#F59E0B' },
    { name: 'Assigned', value: assignedTests.length, color: '#6B7280' }
  ];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'text-emerald-600 bg-emerald-50',
      in_progress: 'text-blue-600 bg-blue-50',
      not_started: 'text-gray-600 bg-gray-50'
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'hard': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'easy': return 'text-green-600 bg-green-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "blue" }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className={`text-3xl font-bold text-${color}-600 mt-1`}>{value}</p>
          {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-50`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const NotificationDropdown = () => (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          {notifications.some(n => n.unread) && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                notification.unread ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                    {notification.unread && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(notification.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );

  const Sidebar = () => (
    <div className="w-64 bg-white border-r border-gray-200 h-screen overflow-y-auto">
      <div className="p-6">
        <div 
          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
          onClick={() => setActiveTab('overview')}
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">$4$</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900">4prep-SAT</h1>
            <p className="text-xs text-gray-500">College Prep Community</p>
          </div>
        </div>
      </div>

      <nav className="px-4">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'tests', label: 'Assigned Tests', icon: FileText },
          { id: 'results', label: 'Test Results', icon: TrendingUp },
          { id: 'performance', label: 'Performance', icon: Target },
          { id: 'profile', label: 'Profile', icon: User },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left mb-1 transition-colors ${
              activeTab === item.id
                ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="absolute bottom-0 p-4 border-t border-gray-200 w-64">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium text-sm">
                {user?.first_name?.[0] || user?.username?.[0] || 'S'}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {user?.first_name || user?.username || 'Student'}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="p-1 hover:bg-gray-100 rounded">
            <LogOut className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );

  const OverviewContent = () => {
    if (dashboardLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={FileText}
            title="Assigned Tests"
            value={assignedTests.length}
            subtitle="Available to take"
            color="blue"
          />
          <StatCard
            icon={CheckCircle}
            title="Completed"
            value={completedTests}
            subtitle="Tests finished"
            color="emerald"
          />
          <StatCard
            icon={Clock}
            title="In Progress"
            value={inProgressTests}
            subtitle="Currently taking"
            color="yellow"
          />
          <StatCard
            icon={TrendingUp}
            title="Average Score"
            value={`${averageScore}%`}
            subtitle="Overall performance"
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Performance Trend</h3>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Test Status Distribution</h3>
            </div>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <button 
              onClick={() => setActiveTab('results')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {attempts.slice(0, 5).map((attempt) => (
              <div key={attempt.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{attempt.test_title}</p>
                  <p className="text-sm text-gray-600">
                    {attempt.status === 'completed' 
                      ? `Completed with ${attempt.percentage}%`
                      : `Status: ${attempt.status.replace('_', ' ')}`
                    }
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(attempt.started_at)}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(attempt.status)}`}>
                    {attempt.status.replace('_', ' ')}
                  </span>
                  {attempt.status === 'completed' && (
                    <button 
                      onClick={() => navigate(`/results/${attempt.test_group}`)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const TestsContent = () => {
    if (dashboardLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }
  
    const filteredTests = assignedTests.filter(test => 
      test.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Assigned Tests</h2>
            <p className="text-gray-600">Complete your assigned assessments</p>
          </div>
        </div>
  
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="relative max-w-md">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
  
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredTests.length > 0 ? (
              filteredTests.map((test) => {
                
                const totalTime = test.sections.reduce((sum, s) => sum + (s.time_limit || 0), 0);
                const totalQuestions = test.sections.reduce((sum, s) => sum + (s.question_count || 0), 0);
  
                return (
                  <div
                    key={test.id}
                    className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
                  >
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{test.title}</h4>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                            test.difficulty
                          )}`}
                        >
                          {test.difficulty?.charAt(0).toUpperCase() + test.difficulty?.slice(1) || 'Medium'}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">{test.description}</p>
                    </div>
  
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>Time limit: {totalTime > 0 ? `${totalTime} mins` : 'No limit'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="w-4 h-4" />
                        <span>{totalQuestions} questions</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Target className="w-4 h-4" />
                        <span>Passing: {test.passing_marks ?? '—'}%</span>
                      </div>
                    </div>
  
                    <button
                      onClick={() => handleStartTest(test.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium"
                    >
                      <Play className="w-4 h-4" />
                      Start Test
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'No tests found' : 'No tests assigned yet'}
                </h3>
                <p className="text-gray-500">
                  {searchQuery ? 'Try adjusting your search terms' : 'Check back later for new test assignments.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  

  const ResultsContent = () => {
    if (dashboardLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Test Results</h2>
            <p className="text-gray-600">Review your test performance and results</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Test Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Score</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{attempt.test_title}</div>
                      <div className="text-sm text-gray-500">{attempt.current_section_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      {attempt.status === 'completed' ? (
                        <div className="flex items-center">
                          <span className={`text-lg font-bold ${attempt.percentage >= 70 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {attempt.percentage}%
                          </span>
                          <span className="text-sm text-gray-500 ml-2">
                            ({attempt.total_score}/{attempt.total_marks})
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(attempt.status)}`}>
                        {attempt.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(attempt.started_at)}
                    </td>
                    <td className="px-6 py-4">
                      {attempt.status === 'completed' ? (
                        <button 
                          onClick={() => navigate(`/results/${attempt.test_group}`)}
                          className="text-blue-600 hover:text-blue-900 font-medium text-sm"
                        >
                          View Results
                        </button>
                      ) : attempt.status === 'in_progress' ? (
                        <button 
                          onClick={() => navigate(`/test/${attempt.test_group}`)}
                          className="text-yellow-600 hover:text-yellow-900 font-medium text-sm"
                        >
                          Continue
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {attempts.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No test results yet</h3>
            <p className="text-gray-500 mb-4">Complete some tests to see your results here.</p>
            <button 
              onClick={() => setActiveTab('tests')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              View Assigned Tests
            </button>
          </div>
        )}
      </div>
    );
  };

  const PerformanceContent = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Performance Analytics</h2>
            <p className="text-gray-600">Detailed analysis of your test performance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                <span className="text-emerald-700 font-medium">Highest Score</span>
                <span className="text-emerald-600 font-bold text-lg">
                  {Math.max(...attempts.map(a => a.percentage || 0))}%
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-700 font-medium">Average Score</span>
                <span className="text-blue-600 font-bold text-lg">{averageScore}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-purple-700 font-medium">Tests Completed</span>
                <span className="text-purple-600 font-bold text-lg">{completedTests}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="text-yellow-700 font-medium">Success Rate</span>
                <span className="text-yellow-600 font-bold text-lg">
                  {completedTests > 0 ? Math.round((attempts.filter(a => (a.percentage || 0) >= 70).length / completedTests) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ProfileContent = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({
      firstName: user?.first_name || '',
      lastName: user?.last_name || '',
      email: user?.email || '',
      username: user?.username || '',
      phone: user?.phone || '',
      dateOfBirth: user?.date_of_birth || '',
      school: user?.school || '',
      grade: user?.grade || '',
      bio: user?.bio || ''
    });

    const handleInputChange = (field, value) => {
      setProfileData(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveProfile = () => {
      // Here you would typically make an API call to update the profile
      console.log('Saving profile:', profileData);
      setIsEditing(false);
      // You could add a success notification here
    };

    const handleCancelEdit = () => {
      setProfileData({
        firstName: user?.first_name || '',
        lastName: user?.last_name || '',
        email: user?.email || '',
        username: user?.username || '',
        phone: user?.phone || '',
        dateOfBirth: user?.date_of_birth || '',
        school: user?.school || '',
        grade: user?.grade || '',
        bio: user?.bio || ''
      });
      setIsEditing(false);
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
            <p className="text-gray-600">Manage your account information and preferences</p>
          </div>
          <div className="flex space-x-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-2xl">
                    {user?.first_name?.[0] || user?.username?.[0] || 'S'}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {user?.first_name || user?.username || 'Student'}
                </h3>
                <p className="text-gray-600">{user?.email}</p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member since:</span>
                    <span className="font-medium">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tests completed:</span>
                    <span className="font-medium">{completedTests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average score:</span>
                    <span className="font-medium">{averageScore}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 mt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Tests</span>
                  <span className="font-medium">{assignedTests.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-medium text-green-600">{completedTests}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">In Progress</span>
                  <span className="font-medium text-blue-600">{inProgressTests}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-medium text-purple-600">
                    {completedTests > 0 ? Math.round((attempts.filter(a => (a.percentage || 0) >= 70).length / completedTests) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.firstName || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.lastName || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.username}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.phone || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={profileData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.dateOfBirth || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">School</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.school}
                      onChange={(e) => handleInputChange('school', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.school || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
                  {isEditing ? (
                    <select
                      value={profileData.grade}
                      onChange={(e) => handleInputChange('grade', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Grade</option>
                      <option value="9">9th Grade</option>
                      <option value="10">10th Grade</option>
                      <option value="11">11th Grade</option>
                      <option value="12">12th Grade</option>
                      <option value="college">College</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">{profileData.grade ? `${profileData.grade}th Grade` : 'Not provided'}</p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                {isEditing ? (
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-gray-900">{profileData.bio || 'No bio provided'}</p>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 mt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h4>
              <div className="space-y-4">
                {attempts.slice(0, 5).map((attempt) => (
                  <div key={attempt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${getStatusColor(attempt.status)}`}>
                        {attempt.status === 'completed' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{attempt.test_title}</p>
                        <p className="text-sm text-gray-600">
                          {attempt.status === 'completed' 
                            ? `Completed with ${attempt.percentage}%`
                            : `Status: ${attempt.status.replace('_', ' ')}`
                          }
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(attempt.started_at)}</span>
                  </div>
                ))}
                {attempts.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No recent activity</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewContent />;
      case 'tests':
        return <TestsContent />;
      case 'results':
        return <ResultsContent />;
      case 'performance':
        return <PerformanceContent />;
      case 'profile':
        return <ProfileContent />;
      default:
        return <OverviewContent />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-96"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative" ref={notificationRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 hover:bg-gray-100 rounded-lg relative"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {notifications.some(n => n.unread) && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">
                        {notifications.filter(n => n.unread).length > 9 ? '9+' : notifications.filter(n => n.unread).length}
                      </span>
                    </span>
                  )}
                </button>
                {showNotifications && <NotificationDropdown />}
              </div>
              <button 
                onClick={() => setActiveTab('profile')}
                className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <span className="text-white font-medium text-sm">
                  {user?.first_name?.[0] || user?.username?.[0] || 'S'}
                </span>
              </button>
            </div>
          </div>
        </header>

        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.first_name || user?.username}!
            </h1>
            <p className="text-gray-600 mt-1">Ready to continue your learning journey?</p>
          </div>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
