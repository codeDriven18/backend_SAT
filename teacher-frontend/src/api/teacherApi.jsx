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
  
  // Simple image upload - for test creation (before question exists)
  uploadImageOnly: (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    // Upload image without question context
    return api.post('/api/teacher/images/upload/', formData, {
      headers: {
        'Content-Type': undefined,
      },
    });
  },
  
  // Question Image Upload - for existing questions (requires question_id)
  uploadQuestionImage: (questionId, imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    // formData.append('question_id', questionId);
    return api.patch(`/api/teacher/questions/upload-image/?question_id=${questionId}`, formData, {
      headers: {
        'Content-Type': "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Uploading Q${questionId}: ${percent}%`);
      },
    });
  },
};

