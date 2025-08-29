import React, { useState } from 'react';
import Sidebar from '../components/Layout/Sidebar';
import AdminDashboard from '../components/Dashboard/AdminDashboard';
import TestList from '../components/Tests/TestList';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminDashboard />;
      case 'users':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">User Management</h3>
            <p className="text-gray-600">This feature will be available in the next update</p>
          </div>
        );
      case 'tests':
        return <TestList userType="admin" />;
      case 'analytics':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
            <p className="text-gray-600">Detailed analytics coming soon</p>
          </div>
        );
      case 'settings':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">System Settings</h3>
            <p className="text-gray-600">Configuration panel coming soon</p>
          </div>
        );
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="main-content">
        <div className="content-body">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminPage;