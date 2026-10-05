/**
 * SHREE TEACH - State Management Store
 * Manages user profile, active test sessions, history, and localStorage persistence.
 */

const STORAGE_KEYS = {
  USER: 'shree_teach_user',
  ATTEMPTS: 'shree_teach_attempts',
  STREAK: 'shree_teach_streak',
  CURRENT_TEST: 'shree_teach_active_test'
};

// Default mock user
const DEFAULT_USER = {
  name: "Aman Sharma",
  email: "aman.jee@shreeteach.in",
  mobile: "+91 98765 43210",
  targetExam: "JEE Main & Advanced 2025",
  targetYear: "2025",
  isLoggedIn: true
};

// Initial state
let state = {
  user: loadUser(),
  attempts: loadAttempts(),
  streak: loadStreak(),
  currentView: 'home', // 'home' | 'mock-tests' | 'practice' | 'pyq' | 'performance' | 'cbt-exam' | 'results' | 'about'
  activeTest: null,
  lastCompletedResult: null
};

// Listeners for reactive updates
const listeners = new Set();

function loadUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : DEFAULT_USER;
  } catch (e) {
    return DEFAULT_USER;
  }
}

function loadAttempts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  // Provide initial realistic historical attempts so dashboard looks rich immediately!
  return [
    {
      id: "attempt_sample_1",
      testId: "jm_full_01",
      testName: "JEE Main Full Mock Test #01",
      exam: "JEE Main",
      date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      score: 216,
      maxMarks: 300,
      percentage: 72,
      accuracy: 78.5,
      timeSpentMinutes: 165,
      correctCount: 56,
      incorrectCount: 15,
      unattemptedCount: 4,
      subjectBreakdown: {
        Physics: { score: 72, maxMarks: 100, correct: 19, incorrect: 4, unattempted: 2, accuracy: 82.6 },
        Chemistry: { score: 80, maxMarks: 100, correct: 21, incorrect: 3, unattempted: 1, accuracy: 87.5 },
        Mathematics: { score: 64, maxMarks: 100, correct: 16, incorrect: 8, unattempted: 1, accuracy: 66.7 }
      },
      percentileEstimate: "98.85 - 99.12 %ile",
      rankEstimate: "8,500 - 11,200 (Estimated)"
    },
    {
      id: "attempt_sample_2",
      testId: "jm_math_ranker",
      testName: "JEE Main Mathematics Rank Booster",
      exam: "JEE Main",
      date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      score: 76,
      maxMarks: 100,
      percentage: 76,
      accuracy: 80,
      timeSpentMinutes: 54,
      correctCount: 20,
      incorrectCount: 4,
      unattemptedCount: 1,
      subjectBreakdown: {
        Mathematics: { score: 76, maxMarks: 100, correct: 20, incorrect: 4, unattempted: 1, accuracy: 80 }
      },
      percentileEstimate: "99.05 - 99.30 %ile (Sectional)",
      rankEstimate: "High Mathematics Standing"
    }
  ];
}

function loadStreak() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STREAK);
    return raw ? JSON.parse(raw) : { days: 6, lastActiveDate: new Date().toDateString() };
  } catch (e) {
    return { days: 6, lastActiveDate: new Date().toDateString() };
  }
}

export function getState() {
  return state;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach(fn => fn(state));
}

export function setCurrentView(viewName, params = {}) {
  state.currentView = viewName;
  state.viewParams = params;
  notify();
  // Scroll to top on view changes (except if in exam)
  if (viewName !== 'cbt-exam') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

export function setUser(userData) {
  state.user = { ...userData, isLoggedIn: true };
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(state.user));
  } catch (e) {}
  notify();
}

export function logoutUser() {
  state.user = {
    name: "Guest Student",
    email: "",
    mobile: "",
    targetExam: "JEE Main 2025",
    targetYear: "2025",
    isLoggedIn: false
  };
  try {
    localStorage.removeItem(STORAGE_KEYS.USER);
  } catch (e) {}
  notify();
}

export function saveCompletedAttempt(attemptData) {
  state.attempts.unshift(attemptData);
  state.lastCompletedResult = attemptData;
  try {
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(state.attempts));
  } catch (e) {}
  notify();
}

export function setActiveTestSession(session) {
  state.activeTest = session;
  notify();
}

export function clearActiveTestSession() {
  state.activeTest = null;
  notify();
}
