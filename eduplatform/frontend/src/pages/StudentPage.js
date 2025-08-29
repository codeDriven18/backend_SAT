import React, { useState } from 'react';
import Sidebar from '../components/Layout/Sidebar';
import StudentDashboard from '../components/Dashboard/StudentDashboard';
import TestList from '../components/Tests/TestList';
import TestResults from '../components/Tests/TestResults';

const StudentPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <StudentDashboard />;
      case 'tests':
        return <TestList userType="student" />;
      case 'results':
        return <TestResults />;
      case 'schedule':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Schedule Coming Soon</h3>
            <p className="text-gray-600">This feature will be available in the next update</p>
          </div>
        );
      default:
        return <StudentDashboard />;
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

export default StudentPage;