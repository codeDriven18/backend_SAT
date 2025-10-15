import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  ChevronRight,
  Users,
  Target,
  Timer,
  Eye,
  Settings,
} from "lucide-react";
import NotificationBell from "./NotificationBell";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import useAuth from "../hooks/useAuth";
import useStudentStore from "../store/useStudentStore";

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const {
    assignedTests,
    dashboardLoading,
    attempts,
    loadAssignedTests,
    loadAttempts,
  } = useStudentStore();

  useEffect(() => {
    loadAssignedTests();
    loadAttempts();
  }, [loadAssignedTests, loadAttempts]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleStartTest = (testId) => {
    navigate(`/test/${testId}`);
  };

  // Calculate comprehensive stats
  const completedTests = attempts.filter(
    (attempt) => attempt.status === "completed"
  ).length;
  const inProgressTests = attempts.filter(
    (attempt) => attempt.status === "in_progress"
  ).length;
  const averageScore =
    attempts.length > 0
      ? Math.round(
          attempts.reduce(
            (sum, attempt) => sum + (attempt.percentage || 0),
            0
          ) / completedTests
        )
      : 0;

  // Filter out completed tests from assigned tests
  const completedTestIds = attempts
    .filter((attempt) => attempt.status === "completed")
    .map((attempt) => attempt.test_group);

  const availableTestsCount = assignedTests.filter(
    (test) => !completedTestIds.includes(test.id)
  ).length;

  // Performance data for charts
  const performanceData = attempts
    .filter((attempt) => attempt.status === "completed")
    .slice(0, 5)
    .map((attempt, index) => ({
      name: attempt.test_title?.substring(0, 10) + "..." || `Test ${index + 1}`,
      score: attempt.percentage || 0,
    }));

  // Pie chart data for test status
  const statusData = [
    { name: "Completed", value: completedTests, color: "#10B981" },
    { name: "In Progress", value: inProgressTests, color: "#F59E0B" },
    { name: "Assigned", value: availableTestsCount, color: "#6B7280" },
  ];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: "text-emerald-600 bg-emerald-50",
      in_progress: "text-blue-600 bg-blue-50",
      not_started: "text-gray-600 bg-gray-50",
    };
    return colors[status] || "text-gray-600 bg-gray-50";
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "hard":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "easy":
        return "text-green-600 bg-green-50";
      default:
        return "text-blue-600 bg-blue-50";
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

  const Sidebar = () => (
    <div className="w-64 bg-white border-r border-gray-200 h-screen overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 h-12">
            <img src="/logo.png" alt="" />
          </div>
        </div>
      </div>

      <nav className="px-4">
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "tests", label: "Assigned Tests", icon: FileText },
          { id: "results", label: "Test Results", icon: TrendingUp },
          { id: "performance", label: "Performance", icon: Target },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left mb-1 transition-colors ${
              activeTab === item.id
                ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                : "text-gray-600 hover:bg-gray-50"
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
                {user?.first_name?.[0] || user?.username?.[0] || "S"}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {user?.first_name || user?.username || "Student"}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1 hover:bg-gray-100 rounded"
          >
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

    // Filter out completed tests from assigned tests
    const completedTestIds = attempts
      .filter((attempt) => attempt.status === "completed")
      .map((attempt) => attempt.test_group);

    const availableTests = assignedTests.filter(
      (test) => !completedTestIds.includes(test.id)
    );

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={FileText}
            title="Assigned Tests"
            value={availableTests.length}
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
              <h3 className="text-lg font-semibold text-gray-900">
                Performance Trend
              </h3>
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
              <h3 className="text-lg font-semibold text-gray-900">
                Test Status Distribution
              </h3>
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
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h3>
            <button
              onClick={() => setActiveTab("results")}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {attempts.slice(0, 5).map((attempt) => (
              <div
                key={attempt.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {attempt.test_title}
                  </p>
                  <p className="text-sm text-gray-600">
                    {attempt.status === "completed"
                      ? `Completed with ${attempt.percentage}%`
                      : `Status: ${attempt.status.replace("_", " ")}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(attempt.started_at)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      attempt.status
                    )}`}
                  >
                    {attempt.status.replace("_", " ")}
                  </span>
                  {attempt.status === "completed" && (
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

    // Filter out tests that have been completed
    const completedTestIds = attempts
      .filter((attempt) => attempt.status === "completed")
      .map((attempt) => attempt.test_group);

    const availableTests = assignedTests.filter(
      (test) => !completedTestIds.includes(test.id)
    );

    const filteredTests = availableTests.filter(
      (test) =>
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
                const totalTime = test.sections.reduce(
                  (sum, s) => sum + (s.time_limit || 0),
                  0
                );
                const totalQuestions = test.sections.reduce(
                  (sum, s) => sum + (s.question_count || 0),
                  0
                );

                return (
                  <div
                    key={test.id}
                    className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
                  >
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {test.title}
                        </h4>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                            test.difficulty
                          )}`}
                        >
                          {test.difficulty?.charAt(0).toUpperCase() +
                            test.difficulty?.slice(1) || "Medium"}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        {test.description}
                      </p>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>
                          Time limit:{" "}
                          {totalTime > 0 ? `${totalTime} mins` : "No limit"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="w-4 h-4" />
                        <span>{totalQuestions} questions</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Target className="w-4 h-4" />
                        <span>Passing: {test.passing_marks ?? "—"}%</span>
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
                  {searchQuery ? "No tests found" : "No tests assigned yet"}
                </h3>
                <p className="text-gray-500">
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "Check back later for new test assignments."}
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
            <p className="text-gray-600">
              Review your test performance and results
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Test Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Score
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {attempt.test_title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {attempt.current_section_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {attempt.status === "completed" ? (
                        <div className="flex items-center">
                          <span
                            className={`text-lg font-bold ${
                              attempt.percentage >= 70
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                          >
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
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          attempt.status
                        )}`}
                      >
                        {attempt.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(attempt.started_at)}
                    </td>
                    <td className="px-6 py-4">
                      {attempt.status === "completed" ? (
                        <button
                          onClick={() =>
                            navigate(`/results/${attempt.test_group}`)
                          }
                          className="text-blue-600 hover:text-blue-900 font-medium text-sm"
                        >
                          View Results
                        </button>
                      ) : attempt.status === "in_progress" ? (
                        <button
                          onClick={() =>
                            navigate(`/test/${attempt.test_group}`)
                          }
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No test results yet
            </h3>
            <p className="text-gray-500 mb-4">
              Complete some tests to see your results here.
            </p>
            <button
              onClick={() => setActiveTab("tests")}
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
            <h2 className="text-2xl font-bold text-gray-900">
              Performance Analytics
            </h2>
            <p className="text-gray-600">
              Detailed analysis of your test performance
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Score Trend
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Performance Metrics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                <span className="text-emerald-700 font-medium">
                  Highest Score
                </span>
                <span className="text-emerald-600 font-bold text-lg">
                  {Math.max(...attempts.map((a) => a.percentage || 0))}%
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-700 font-medium">Average Score</span>
                <span className="text-blue-600 font-bold text-lg">
                  {averageScore}%
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-purple-700 font-medium">
                  Tests Completed
                </span>
                <span className="text-purple-600 font-bold text-lg">
                  {completedTests}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="text-yellow-700 font-medium">
                  Success Rate
                </span>
                <span className="text-yellow-600 font-bold text-lg">
                  {completedTests > 0
                    ? Math.round(
                        (attempts.filter((a) => (a.percentage || 0) >= 70)
                          .length /
                          completedTests) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewContent />;
      case "tests":
        return <TestsContent />;
      case "results":
        return <ResultsContent />;
      case "performance":
        return <PerformanceContent />;
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
              <NotificationBell />
              <button 
                onClick={() => navigate('/profile')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Profile Settings"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              <button 
                onClick={() => navigate('/profile')}
                className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                title="View Profile"
              >
                <span className="text-white font-medium text-sm">
                  {user?.first_name?.[0] || user?.username?.[0] || "S"}
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
            <p className="text-gray-600 mt-1">
              Ready to continue your learning journey?
            </p>
          </div>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
