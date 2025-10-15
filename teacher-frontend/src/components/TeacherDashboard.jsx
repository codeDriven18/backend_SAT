import React, { useState, useEffect } from "react";
import {
  Users,
  BookOpen,
  ClipboardList,
  TrendingUp,
  Plus,
  Search,
  Settings,
  Bell,
  ChevronRight,
  Calendar,
  Clock,
  Award,
  UserCheck,
  BarChart3,
  Edit,
  Trash2,
  Filter,
  LogOut,
  User,
} from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import useTeacherStore from "../store/useTeacherStore";
import CreateGroupModal from "./modals/CreateGroupModal";
import CreateTestModal from "./modals/CreateTestModal";
import EditGroupModal from "./modals/EditGroupModal";
import EditTestModal from "./modals/EditTestModal";
import TestAnalyticsModal from "./modals/TestAnalyticsModal";
import GroupDetails from "./modals/GroupDetails";
import AssignmentsPage from "./AssignmentsPage";
import LibraryPage from "./LibraryPage";
import NotificationBell from "./NotificationBell";
import ProfileSettings from "../pages/ProfileSettings";

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [showEditTestModal, setShowEditTestModal] = useState(false);
  const [showTestAnalytics, setShowTestAnalytics] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingTest, setEditingTest] = useState(null);
  const [analyticsTestId, setAnalyticsTestId] = useState(null);
  const [activeTab1, setActiveTab1] = useState("groups");
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  const { user, logout } = useAuthStore();
  const {
    dashboardStats,
    groups,
    tests,
    loading,
    errors,
    fetchDashboardStats,
    fetchGroups,
    fetchTests,
    deleteGroup,
    deleteTest,
  } = useTeacherStore();

  useEffect(() => {
    if (activeTab === "dashboard") {
      fetchDashboardStats();
    } else if (activeTab === "groups") {
      fetchGroups();
    } else if (activeTab === "tests") {
      fetchTests();
    }
  }, [activeTab]);

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

  const handleDeleteGroup = async (id) => {
    if (window.confirm("Are you sure you want to delete this group?")) {
      const result = await deleteGroup(id);
      if (!result.success) {
        alert("Failed to delete group: " + result.error);
      }
    }
  };

  const handleEditGroup = (group) => {
    setEditingGroup(group);
    setShowEditGroupModal(true);
  };

  const handleDeleteTest = async (id) => {
    if (window.confirm("Are you sure you want to delete this test?")) {
      const result = await deleteTest(id);
      if (!result.success) {
        alert("Failed to delete test: " + result.error);
      }
    }
  };

  const handleEditTest = (test) => {
    setEditingTest(test);
    setShowEditTestModal(true);
  };

  const handleShowAnalytics = (testId) => {
    setAnalyticsTestId(testId);
    setShowTestAnalytics(true);
  };

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color = "emerald",
  }) => (
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
        <div className="flex items-center space-x-2 h-12">
          <img src="/logo.png" alt="" />
        </div>
      </div>

      <nav className="px-4">
        {[
          { id: "dashboard", label: "Dashboard", icon: BarChart3 },
          { id: "groups", label: "Groups", icon: Users },
          { id: "tests", label: "Tests", icon: BookOpen },
          { id: "assignments", label: "Assignments", icon: ClipboardList },
          { id: "results", label: "Results", icon: TrendingUp },
          { id: "library", label: "Test Library", icon: BookOpen },
          { id: "profile", label: "Profile Settings", icon: User },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left mb-1 transition-colors ${
              activeTab === item.id
                ? "bg-emerald-50 text-emerald-600 border-r-2 border-emerald-600"
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
                {user?.first_name?.[0] || user?.username?.[0] || "T"}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {user?.first_name || user?.username || "Teacher"}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button onClick={logout} className="p-1 hover:bg-gray-100 rounded">
            <LogOut className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );

  const DashboardContent = () => {
    if (loading.dashboard) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={BookOpen}
            title="Total Tests"
            value={dashboardStats?.total_tests || 0}
            subtitle="Tests created"
            color="emerald"
          />
          <StatCard
            icon={Users}
            title="Student Groups"
            value={dashboardStats?.total_groups || 0}
            subtitle="Groups managed"
            color="blue"
          />
          <StatCard
            icon={UserCheck}
            title="Total Students"
            value={dashboardStats?.total_students || 0}
            subtitle="Across all groups"
            color="purple"
          />
          <StatCard
            icon={ClipboardList}
            title="Active Assignments"
            value={dashboardStats?.active_assignments || 0}
            subtitle="Currently assigned"
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Test Attempts
              </h3>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {dashboardStats?.recent_attempts?.length > 0 ? (
                dashboardStats.recent_attempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {attempt.student_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {attempt.test_title}
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
                        <span className="text-sm font-medium text-emerald-600">
                          {attempt.percentage}%
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No recent attempts</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Quick Actions
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowCreateTestModal(true)}
                className="p-4 text-left bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
              >
                <Plus className="w-6 h-6 text-emerald-600 mb-2" />
                <p className="font-medium text-emerald-700">Create Test</p>
                <p className="text-sm text-emerald-600">Build new assessment</p>
              </button>
              <button
                onClick={() => setShowCreateGroupModal(true)}
                className="p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
              >
                <Users className="w-6 h-6 text-blue-600 mb-2" />
                <p className="font-medium text-blue-700">Create Group</p>
                <p className="text-sm text-blue-600">Organize students</p>
              </button>
              <button
                onClick={() => setActiveTab("library")}
                className="p-4 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
              >
                <BookOpen className="w-6 h-6 text-purple-600 mb-2" />
                <p className="font-medium text-purple-700">Test Library</p>
                <p className="text-sm text-purple-600">
                  Browse available tests
                </p>
              </button>
              <button
                onClick={() => setActiveTab("assignments")}
                className="p-4 text-left bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200"
              >
                <ClipboardList className="w-6 h-6 text-orange-600 mb-2" />
                <p className="font-medium text-orange-700">Assign Tests</p>
                <p className="text-sm text-orange-600">Distribute to groups</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const GroupsContent = () => {
    if (loading.groups) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Student Groups</h2>
            <p className="text-gray-600">
              Manage your student groups and assignments
            </p>
          </div>
          <button
            onClick={() => setShowCreateGroupModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Group</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {groups.length > 0 ? (
            groups.map((group) => (
              <div
                key={group.id}
                className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {group.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {group.description}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <button 
                      onClick={() => handleEditGroup(group)}
                      className="p-2 hover:bg-gray-100 rounded"
                    >
                      <Edit className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="p-2 hover:bg-gray-100 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-1" />
                      {group.student_count} students
                    </span>
                    <span className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(group.created_at)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      setActiveTab1("groups-detail");
                    }}
                    className="text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No groups yet
              </h3>
              <p className="text-gray-500 mb-4">
                Create your first student group to get started
              </p>
              <button
                onClick={() => setShowCreateGroupModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg"
              >
                Create Group
              </button>
            </div>
          )}

          {activeTab1 === "groups-detail" && selectedGroupId && (
            <GroupDetails
              groupId={selectedGroupId}
              onBack={() => setActiveTab1("groups")}
            />
          )}
        </div>
      </div>
    );
  };

  const TestsContent = () => {
    if (loading.tests) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      );
    }

    const filteredTests = tests.filter(
      (test) =>
        test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Tests</h2>
            <p className="text-gray-600">Create and manage your assessments</p>
          </div>
          <button
            onClick={() => setShowCreateTestModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Test</span>
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Filter</span>
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredTests.length > 0 ? (
              filteredTests.map((test) => (
                <div key={test.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {test.title}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            test.difficulty === "hard"
                              ? "text-red-600 bg-red-50"
                              : test.difficulty === "medium"
                              ? "text-yellow-600 bg-yellow-50"
                              : "text-green-600 bg-green-50"
                          }`}
                        >
                          {test.difficulty}
                        </span>
                        {test.is_active && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium text-emerald-600 bg-emerald-50">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">{test.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{test.question_count} questions</span>
                        <span>{test.total_marks} points</span>
                        <span>Created {formatDate(test.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEditTest(test)}
                        className="p-2 hover:bg-gray-100 rounded"
                        title="Edit Test"
                      >
                        <Edit className="w-4 h-4 text-gray-400" />
                      </button>
                      <button 
                        onClick={() => handleShowAnalytics(test.id)}
                        className="p-2 hover:bg-gray-100 rounded"
                        title="View Analytics"
                      >
                        <BarChart3 className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteTest(test.id)}
                        className="p-2 hover:bg-gray-100 rounded"
                        title="Delete Test"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No tests found
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery
                    ? "No tests match your search"
                    : "Create your first test to get started"}
                </p>
                <button
                  onClick={() => setShowCreateTestModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg"
                >
                  Create Test
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const AssignmentContent = () => {};

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardContent />;
      case "groups":
        return <GroupsContent />;
      case "tests":
        return <TestsContent />;
      case "assignments":
        return <AssignmentsPage />;
      case "library":
        return <LibraryPage />;
      case "profile":
        return <ProfileSettings />;
      default:
        return <DashboardContent />;
    }
  };

  if (errors.dashboard || errors.groups || errors.tests) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-2">⚠️ Error loading data</div>
          <button
            onClick={() => window.location.reload()}
            className="text-emerald-600 hover:text-emerald-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-96"
              />
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBell />
              <button
                onClick={() => setActiveTab("profile")}
                className="w-9 h-9 bg-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-700 transition-colors"
                title="Profile Settings"
              >
                <span className="text-white font-medium text-sm">
                  {user?.first_name?.[0] || user?.username?.[0] || "T"}
                </span>
              </button>
            </div>
          </div>
        </header>

        <main className="p-6">{renderContent()}</main>
      </div>

      {/* Modals */}
      {showCreateGroupModal && (
        <CreateGroupModal
          onClose={() => setShowCreateGroupModal(false)}
          onSuccess={() => {
            setShowCreateGroupModal(false);
            fetchGroups();
          }}
        />
      )}

      {showEditGroupModal && editingGroup && (
        <EditGroupModal
          group={editingGroup}
          onClose={() => {
            setShowEditGroupModal(false);
            setEditingGroup(null);
          }}
          onSuccess={() => {
            setShowEditGroupModal(false);
            setEditingGroup(null);
            fetchGroups();
          }}
        />
      )}

      {showCreateTestModal && (
        <CreateTestModal
          onClose={() => setShowCreateTestModal(false)}
          onSuccess={() => {
            setShowCreateTestModal(false);
            fetchTests();
          }}
        />
      )}

      {showEditTestModal && editingTest && (
        <EditTestModal
          test={editingTest}
          onClose={() => {
            setShowEditTestModal(false);
            setEditingTest(null);
          }}
          onSuccess={() => {
            setShowEditTestModal(false);
            setEditingTest(null);
            fetchTests();
          }}
        />
      )}

      {showTestAnalytics && analyticsTestId && (
        <TestAnalyticsModal
          testId={analyticsTestId}
          onClose={() => {
            setShowTestAnalytics(false);
            setAnalyticsTestId(null);
          }}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;
