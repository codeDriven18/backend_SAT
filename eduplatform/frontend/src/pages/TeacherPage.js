import React, { useState } from 'react';
import Sidebar from '../components/Layout/Sidebar';
import TeacherDashboard from '../components/Dashboard/TeacherDashboard';
import TestCreator from '../components/Tests/TestCreator';
import TeacherTestList from '../components/Tests/TeacherTestList';
import TestResults from '../components/Tests/TestResults';

const TeacherPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <TeacherDashboard />;
      case 'create-test':
        return <TestCreator />;
      case 'my-tests':
        return <TeacherTestList />;
      case 'students':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Students Management</h3>
            <p className="text-gray-600 mb-4">View student performance and test results</p>
            <p className="text-sm text-gray-500">Students access tests directly using test codes</p>
          </div>
        );
      case 'results':
        return <TestResults />;
      default:
        return <TeacherDashboard />;
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

export default TeacherPage;