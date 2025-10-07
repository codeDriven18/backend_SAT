// src/api/teacherApi.js
import api from './index';

export const teacherAPI = {
  // Dashboard
  getDashboardStats: () => api.get('/api/teacher/dashboard/'),
  
  // Groups
  getGroups: () => api.get('/api/teacher/groups/'),
  createGroup: (groupData) => api.post('/api/teacher/groups/', groupData),
  updateGroup: (id, groupData) => api.put(`/api/teacher/groups/${id}/`, groupData),
  deleteGroup: (id) => api.delete(`/api/teacher/groups/${id}/`),
  getGroup: (id) => api.get(`/api/teacher/groups/${id}/`),
  addStudentToGroup: (groupId, studentData) => api.post(`/api/teacher/groups/${groupId}/add_student/`, studentData),
  removeStudentFromGroup: (groupId, studentData) => api.post(`/api/teacher/groups/${groupId}/remove_student/`, studentData),
  
  // Tests
  getTests: () => api.get('/api/teacher/tests/'),
  createTest: (testData) => api.post('/api/teacher/tests/', testData),
  updateTest: (id, testData) => api.put(`/api/teacher/tests/${id}/`, testData),
  deleteTest: (id) => api.delete(`/api/teacher/tests/${id}/`),
  getTest: (id) => api.get(`/api/teacher/tests/${id}/`),

  // Question image upload (optional)
  uploadQuestionImage: (questionId, file, onProgress) => {
    const form = new FormData();
    form.append('image', file);
    const config = {
      headers: { 'Content-Type': 'multipart/form-data' },
    };
    if (onProgress) config.onUploadProgress = onProgress;
    return api.post(`/api/teacher/questions/upload-image?question_id=${questionId}`, form, config);
  },
  
  // Test Library
  getLibraryTests: () => api.get('/api/teacher/library/'),
  getLibraryTest: (id) => api.get(`/api/teacher/library/${id}/`),
  previewLibraryTest: (id) => api.get(`/api/teacher/library/${id}/preview/`),
  
  // Assignments
  getAssignments: () => api.get('/api/teacher/assignments/'),
  createAssignment: (assignmentData) => api.post('/api/teacher/assignments/', assignmentData),
  updateAssignment: (id, assignmentData) => api.put(`/api/teacher/assignments/${id}/`, assignmentData),
  deleteAssignment: (id) => api.delete(`/api/teacher/assignments/${id}/`),
  assignTestToGroup: (assignmentData) => api.post('/api/teacher/assign-test/', assignmentData),
  
  // Analytics
  getTestAnalytics: (testId) => api.get(`/api/teacher/analytics/test_analytics/?test_id=${testId}`),
  
  // Students
  searchStudents: (query) => api.get(`/api/teacher/students/search/?q=${query}`),
};

