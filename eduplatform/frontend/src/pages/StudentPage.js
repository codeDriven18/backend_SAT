import React, { useState } from 'react';
import Sidebar from '../components/Layout/Sidebar';
import StudentDashboard from '../components/Dashboard/StudentDashboard';
import StudentTestAccess from '../components/Tests/StudentTestAccess';
import TestTakingInterface from '../components/Tests/TestTakingInterface';
import TestResults from '../components/Tests/TestResults';

const StudentPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentTest, setCurrentTest] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const handleTestStart = (testData) => {
    setCurrentTest(testData);
    setActiveTab('taking-test');
  };

  const handleTestComplete = (result) => {
    setTestResult(result);
    setCurrentTest(null);
    setActiveTab('test-completed');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <StudentDashboard />;
      case 'tests':
        return <StudentTestAccess onTestStart={handleTestStart} />;
      case 'taking-test':
        return currentTest ? (
          <TestTakingInterface
            testData={currentTest}
            attemptId={currentTest.attempt_id}
            onTestComplete={handleTestComplete}
          />
        ) : (
          <StudentTestAccess onTestStart={handleTestStart} />
        );
      case 'test-completed':
        return testResult ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white text-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎉</span>
                </div>
                <h1 className="text-2xl font-bold mb-2">Test Completed!</h1>
                <p className="opacity-90">Your answers have been submitted successfully</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{testResult.score}</div>
                    <div className="text-sm text-gray-600">Score</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{testResult.percentage}%</div>
                    <div className="text-sm text-gray-600">Percentage</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{testResult.time_taken}m</div>
                    <div className="text-sm text-gray-600">Time Taken</div>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                    testResult.percentage >= 60 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {testResult.percentage >= 60 ? '✓ Passed' : '✗ Failed'}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setTestResult(null);
                      setActiveTab('tests');
                    }}
                    className="btn btn-secondary flex-1"
                  >
                    Take Another Test
                  </button>
                  <button
                    onClick={() => setActiveTab('results')}
                    className="btn btn-primary flex-1"
                  >
                    View All Results
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <StudentTestAccess onTestStart={handleTestStart} />
        );
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

  // Don't show sidebar when taking test
  if (activeTab === 'taking-test') {
    return renderContent();
  }

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