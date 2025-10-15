import { create } from 'zustand';
import { studentApi } from '../api/studentApi';

const useStudentStore = create((set, get) => ({
  // Dashboard data
  assignedTests: [],
  dashboardLoading: false,

  // Current test state
  currentTest: null,
  currentSection: null,
  currentQuestions: [],
  currentAnswers: {},   // { [questionId]: choiceId }
  timeRemaining: null,
  testStatus: 'not_started', // not_started, in_progress, completed

  // Results & review
  currentResults: null,
  currentReview: null,

  // Test attempts history
  attempts: [],
  attemptsLoading: false,

  // Load assigned tests
  loadAssignedTests: async () => {
    set({ dashboardLoading: true });
    try {
      const tests = await studentApi.getAssignedTests();
      set({ assignedTests: tests, dashboardLoading: false });
    } catch (error) {
      console.error('Failed to load assigned tests:', error);
      set({ dashboardLoading: false });
    }
  },

  saveLocalAnswer: (questionId, choiceId = null, textAnswer = null) => {
    set((state) => {
      const updated = { ...state.currentAnswers };
      if (choiceId !== null) {
        updated[questionId] = choiceId; // MCQ
      } else if (textAnswer !== null && textAnswer !== "") {
        updated[questionId] = textAnswer; // math_free
      } else {
        delete updated[questionId]; // empty -> remove
      }
      return { currentAnswers: updated };
    });
  },

  // Start test
  // startTest: async (testId) => {
  //   try {
  //     const res = await studentApi.startTest(testId); // { attempt_id, current_section, sections }

  //     set({
  //       currentTest: {
  //         attempt_id: res.attempt_id,
  //         sections: res.sections,         // array of sections with id, order, time_limit
  //       },
  //       currentSection: res.current_section || null, // may be null if no active section yet
  //       testStatus: 'in_progress',
  //       currentResults: null,
  //       currentReview: null,
  //     });

  //     return res;
  //   } catch (error) {
  //     console.error('Failed to start test:', error);
  //     throw error;
  //   }
  // },

  // 
  // In useStudentStore
  startTest: async (testId) => {
    try {
      const res = await studentApi.startTest(testId); // { attempt_id, current_section, sections }
      set({
        currentTest: { attempt_id: res.attempt_id, sections: res.sections },
        currentSection: res.current_section || null,
        testStatus: 'in_progress',
        currentResults: null,
        currentReview: null,
      });
      return res; 
    } catch (e) {
      console.error('Failed to start test:', e);
      throw e;
    }
  },

  submitBulkAnswers: async (testId, sectionId) => {
    const { currentAnswers } = get();
    const answers = Object.entries(currentAnswers)
    .filter(([qid]) => qid && !isNaN(Number(qid))) // ✅ remove undefined/NaN keys
    .map(([qid, value]) => {
      const questionId = parseInt(qid, 10); // safer conversion
      if (typeof value === "number") {
        return { question_id: questionId, choice_id: value };
      } else {
        return { question_id: questionId, text_answer: String(value).trim() };
      }
    });

    console.log({answers});
    return studentApi.submitBulkAnswers(testId, sectionId,  {answers} );
  },

  startSection: async (testId, sectionId) => {
    // tell backend the section is (still) started
    await studentApi.startSection(testId, sectionId);
  
    // fetch actual questions + started_at
    const data = await studentApi.getSectionQuestions(testId, sectionId); // { section, questions }
  
    // compute remaining by started_at
    const total = (data.section?.time_limit || 0) * 60;
    let remaining = total;
    if (data.section?.started_at) {
      const startedMs = new Date(data.section.started_at).getTime();
      const nowMs = Date.now();
      const elapsed = Math.floor((nowMs - startedMs) / 1000);
      remaining = Math.max(0, total - elapsed);
    }
  
    set((state) => {
      const sameSection = state.currentSection?.id === data.section?.id;
      // Only reset answers/timer if it's a new section or server shows a different started_at
      const startedChanged = state.currentSection?.started_at !== data.section?.started_at;
  
      return {
        currentSection: data.section || null,
        currentQuestions: Array.isArray(data.questions) ? data.questions : [],
        currentAnswers: sameSection && !startedChanged ? state.currentAnswers : {}, // keep answers if resuming
        timeRemaining: sameSection && !startedChanged ? state.timeRemaining : remaining,
      };
    });
  
    return data;
  },

  // Update timer
  updateTimer: (seconds) => {
    set({ timeRemaining: seconds });
  },

  // Complete section (with autosubmit before complete)
  completeSection: async (testId, sectionId) => {
    try {
      // First bulk-submit answers
      await get().submitBulkAnswers(testId, sectionId);

      // Then call backend to complete
      const response = await studentApi.completeSection(testId, sectionId);
      set({
        currentSection: null,
        currentQuestions: [],
        currentAnswers: {},
        timeRemaining: null
      });
      return response;
    } catch (error) {
      console.error('Failed to complete section:', error);
      throw error;
    }
  },

  // Complete test
  completeTest: async (testId) => {
    try {
      const response = await studentApi.completeTest(testId);
      set({
        currentTest: null,
        currentSection: null,
        currentQuestions: [],
        currentAnswers: {},
        timeRemaining: null,
        testStatus: 'completed'
      });
      return response;
    } catch (error) {
      console.error('Failed to complete test:', error);
      throw error;
    }
  },

  decrementTimer: () => set((s) => {
    if (typeof s.timeRemaining !== 'number') {
      // don't touch it until it's initialized
      return {};
    }
    if (s.timeRemaining > 0) {
      return { timeRemaining: s.timeRemaining - 1 };
    }
    return { timeRemaining: 0 };
  }),

  // Load test results
  loadResults: async (testId) => {
    try {
      const response = await studentApi.getTestResults(testId);
      set({ currentResults: response });
      return response;
    } catch (error) {
      console.error('Failed to load results:', error);
      throw error;
    }
  },

  // Load test review
  loadReview: async (testId) => {
    try {
      const response = await studentApi.getTestReview(testId);
      set({ currentReview: response });
      return response;
    } catch (error) {
      console.error('Failed to load review:', error);
      throw error;
    }
  },

  // Load attempts
  loadAttempts: async (page = 1) => {
    set({ attemptsLoading: true });
    try {
      const response = await studentApi.getAttempts(page);
      set({
        attempts: response.results,
        attemptsLoading: false
      });
    } catch (error) {
      console.error('Failed to load attempts:', error);
      set({ attemptsLoading: false });
    }
  },

  // Reset current test
  resetCurrentTest: () => {
    set({
      currentTest: null,
      currentSection: null,
      currentQuestions: [],
      currentAnswers: {},
      timeRemaining: null,
      testStatus: 'not_started',
      currentResults: null,
      currentReview: null
    });
  }
}));

export default useStudentStore;
