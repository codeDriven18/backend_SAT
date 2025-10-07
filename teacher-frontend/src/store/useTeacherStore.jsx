import { create } from 'zustand';
import { teacherAPI } from '../api/teacherApi';

const useTeacherStore = create((set, get) => ({
  // Dashboard state
  dashboardStats: null,
  
  // Groups state
  groups: [],
  selectedGroup: null,
  
  // Tests state
  tests: [],
  selectedTest: null,
  
  // Library state
  libraryTests: [],
  
  // Assignments state
  assignments: [],
  
  // Loading states
  loading: {
    dashboard: false,
    groups: false,
    tests: false,
    library: false,
    assignments: false,
  },
  
  // Error states
  errors: {},

  // Dashboard actions
  fetchDashboardStats: async () => {
    set(state => ({ loading: { ...state.loading, dashboard: true } }));
    try {
      const response = await teacherAPI.getDashboardStats();
      set({ dashboardStats: response.data });
    } catch (error) {
      set(state => ({ errors: { ...state.errors, dashboard: error.message } }));
    } finally {
      set(state => ({ loading: { ...state.loading, dashboard: false } }));
    }
  },

  // Groups actions
  fetchGroups: async () => {
    set(state => ({ loading: { ...state.loading, groups: true } }));
    try {
      const response = await teacherAPI.getGroups();
      set({ groups: response.data.results || response.data });
    } catch (error) {
      set(state => ({ errors: { ...state.errors, groups: error.message } }));
    } finally {
      set(state => ({ loading: { ...state.loading, groups: false } }));
    }
  },

  createGroup: async (groupData) => {
    try {
      const response = await teacherAPI.createGroup(groupData);
      set(state => ({ groups: [...state.groups, response.data] }));
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  updateGroup: async (id, groupData) => {
    try {
      const response = await teacherAPI.updateGroup(id, groupData);
      set(state => ({
        groups: state.groups.map(group => 
          group.id === id ? response.data : group
        )
      }));
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  deleteGroup: async (id) => {
    try {
      await teacherAPI.deleteGroup(id);
      set(state => ({
        groups: state.groups.filter(group => group.id !== id)
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Tests actions
  fetchTests: async () => {
    set(state => ({ loading: { ...state.loading, tests: true } }));
    try {
      const response = await teacherAPI.getTests();
      set({ tests: response.data.results || response.data });
    } catch (error) {
      set(state => ({ errors: { ...state.errors, tests: error.message } }));
    } finally {
      set(state => ({ loading: { ...state.loading, tests: false } }));
    }
  },

  createTest: async (testData) => {
    try {
      const response = await teacherAPI.createTest(testData);
      set(state => ({ tests: [...state.tests, response.data] }));
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  uploadQuestionImage: async (questionId, file) => {
    if (!file) return { success: true };
    try {
      const response = await teacherAPI.uploadQuestionImage(questionId, file, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        // optional: set transient UI state elsewhere if needed
        // console.log('upload progress', questionId, percentCompleted);
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Library actions
  fetchLibraryTests: async () => {
    set(state => ({ loading: { ...state.loading, library: true } }));
    try {
      const response = await teacherAPI.getLibraryTests();
      set({ libraryTests: response.data.results || response.data });
    } catch (error) {
      set(state => ({ errors: { ...state.errors, library: error.message } }));
    } finally {
      set(state => ({ loading: { ...state.loading, library: false } }));
    }
  },

  // Assignments actions
  fetchAssignments: async () => {
    set(state => ({ loading: { ...state.loading, assignments: true } }));
    try {
      const response = await teacherAPI.getAssignments();
      set({ assignments: response.data.results || response.data });
    } catch (error) {
      set(state => ({ errors: { ...state.errors, assignments: error.message } }));
    } finally {
      set(state => ({ loading: { ...state.loading, assignments: false } }));
    }
  },

  assignTestToGroup: async (testId, groupId) => {
    try {
      const response = await teacherAPI.assignTestToGroup({ test_id: testId, group_id: groupId });
      await get().fetchAssignments(); // Refresh assignments
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },
}));

export default useTeacherStore;