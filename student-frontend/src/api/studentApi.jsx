// src/api/studentApi.js
import api from './index';

export const studentApi = {
  // Dashboard
  getAssignedTests: async () => {
    const { data } = await api.get('/api/student/dashboard/assigned_tests/');
    return data;
  },

  // Test Management
  startTest: async (testId) => {
    // returns: { attempt_id, current_section, sections }
    const { data } = await api.post(`/api/student/test/${testId}/start/`);
    return data;
  },

  startSection: async (testId, sectionId) => {
    // returns: usually { section: {...}, started_at: ... } (depends on your backend)
    const { data } = await api.post(`/api/student/test/${testId}/section/${sectionId}/start/`);
    return data;
  },

  getSectionQuestions: async (testId, sectionId) => {
    // returns: { section: {...}, questions: [...] }
    const { data } = await api.get(`/api/student/test/${testId}/section/${sectionId}/questions/`);
    return data;
  },

  // Bulk save answers
  submitBulkAnswers: async (testId, sectionId, data) => {
    const { data: res } = await api.post(
      `/api/student/test/${testId}/section/${sectionId}/answers/`,
      data   // ✅ don't wrap again
    );
    return res;
  },

  // (Optional) keep single submit only if you still use it somewhere
  submitAnswer: async (testId, answerData) => {
    // answerData = { question_id, choice_id }
    const { data } = await api.post(`/api/student/test/${testId}/submit-answer/`, answerData);
    return data;
  },

  completeSection: async (testId, sectionId) => {
    const { data } = await api.post(`/api/student/test/${testId}/section/${sectionId}/complete/`);
    return data;
  },

  completeTest: async (testId) => {
    const { data } = await api.post(`/api/student/test/${testId}/complete/`);
    return data;
  },

  // Results and Review
  getTestResults: async (testId) => {
    const { data } = await api.get(`/api/student/test/${testId}/results/`);
    return data;
  },

  getTestReview: async (testId) => {
    const { data } = await api.get(`/api/student/test/${testId}/review/`);
    return data;
  },

  // Attempts
  getAttempts: async (page = 1) => {
    const { data } = await api.get(`/api/student/attempts/?page=${page}`);
    return data;
  },

  getAttempt: async (attemptId) => {
    const { data } = await api.get(`/api/student/attempts/${attemptId}/`);
    return data;
  },
};
