import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  BarChart3, 
  BookOpen, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  GraduationCap,
  ClipboardCheck,
  UserCheck,
  Trophy,
  Calendar
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  const getMenuItems = () => {
    switch (user?.user_type) {
      case 'student':
        return [
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'tests', label: 'My Tests', icon: ClipboardCheck },
          { id: 'results', label: 'Results', icon: Trophy },
          { id: 'schedule', label: 'Schedule', icon: Calendar },
        ];
      case 'teacher':
        return [
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'create-test', label: 'Create Test', icon: FileText },
          { id: 'my-tests', label: 'My Tests', icon: BookOpen },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'results', label: 'Results', icon: Trophy },
        ];
      case 'admin':
        return [
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'tests', label: 'All Tests', icon: BookOpen },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'settings', label: 'Settings', icon: Settings },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const getRoleTitle = () => {
    switch (user?.user_type) {
      case 'student': return 'Student Dashboard';
      case 'teacher': return 'Teacher Dashboard';
      case 'admin': return 'Admin Dashboard';
      default: return 'Dashboard';
    }
  };

  const getRoleIcon = () => {
    switch (user?.user_type) {
      case 'student': return GraduationCap;
      case 'teacher': return UserCheck;
      case 'admin': return Settings;
      default: return BarChart3;
    }
  };

  const RoleIcon = getRoleIcon();

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-3">
            <RoleIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="sidebar-logo">EduPlatform</div>
            <div className="sidebar-subtitle">{getRoleTitle()}</div>
          </div>
        </div>
        
        {user && (
          <div className="flex items-center p-3 bg-white bg-opacity-10 rounded-lg">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
              <span className="text-sm font-semibold">
                {user.first_name?.[0] || user.username?.[0] || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white truncate">
                {user.first_name && user.last_name 
                  ? `${user.first_name} ${user.last_name}`
                  : user.username
                }
              </div>
              <div className="text-xs opacity-75 capitalize">
                {user.user_type}
              </div>
            </div>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            >
              <Icon className="nav-item-icon" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto p-4">
        <button
          onClick={logout}
          className="nav-item w-full text-red-300 hover:text-white hover:bg-red-600 hover:bg-opacity-20"
        >
          <LogOut className="nav-item-icon" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;