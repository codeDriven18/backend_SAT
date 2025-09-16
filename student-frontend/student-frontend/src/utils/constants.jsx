export const API_BASE_URL = 'http://localhost:8000/api';

export const ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login/',
  REGISTER: '/auth/register/',
  REFRESH: '/auth/token/refresh/',
  
  // Student
  ASSIGNED_TESTS: '/student/dashboard/assigned_tests/',
  START_TEST: (testId) => `/student/test/${testId}/start/`,
  TEST_QUESTIONS: (testId, sectionId) => `/student/test/${testId}/section/${sectionId}/questions/`,
  SUBMIT_ANSWER: (testId) => `/student/test/${testId}/submit-answer/`,
  COMPLETE_TEST: (testId) => `/student/test/${testId}/complete/`,
  TEST_RESULTS: (testId) => `/student/test/${testId}/results/`,
  TEST_REVIEW: (testId) => `/student/test/${testId}/review/`,
};

export const USER_TYPES = {
  STUDENT: 'student',
  TEACHER: 'teacher'
};

export const TEST_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress', 
  COMPLETED: 'completed'
};