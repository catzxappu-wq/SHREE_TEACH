/**
 * SHREE TEACH - Realistic Computer-Based Test (CBT) Examination Engine
 * Handles JEE question state transitions, palette coloring, live countdown timer,
 * auto-submission, response tracking, and sectional navigation.
 */

import { calculateTestResults } from './markingScheme.js';
import { saveCompletedAttempt, setActiveTestSession, clearActiveTestSession, setCurrentView } from './state.js';
import { saveAttemptToServer } from './apiService.js';

export const QUESTION_STATUS = {
  NOT_VISITED: 'not_visited',                 // Palette: Gray / White border
  NOT_ANSWERED: 'not_answered',               // Palette: Red
  ANSWERED: 'answered',                       // Palette: Green
  MARKED_FOR_REVIEW: 'marked_for_review',     // Palette: Purple
  ANSWERED_AND_MARKED: 'answered_and_marked'  // Palette: Purple with green badge
};

class CBTEngine {
  constructor() {
    this.session = null;
    this.timerInterval = null;
    this.questionStartTime = Date.now();
    this.tickCallbacks = new Set();
    this.stateCallbacks = new Set();
    this.timeWarningShown = false;
  }

  /**
   * Initializes and starts a new CBT mock test
   */
  startTest(testConfig, questions) {
    if (!questions || questions.length === 0) {
      console.error("Cannot start test with 0 questions");
      return;
    }

    // Stop any existing timer
    this.stopTimer();

    const initialStatuses = {};
    const initialAnswers = {};
    const initialTimeSpent = {};

    questions.forEach((q, idx) => {
      // First question is initially 'not_answered', others 'not_visited'
      initialStatuses[q.id] = idx === 0 ? QUESTION_STATUS.NOT_ANSWERED : QUESTION_STATUS.NOT_VISITED;
      initialAnswers[q.id] = null;
      initialTimeSpent[q.id] = 0;
    });

    const totalSeconds = (testConfig.durationMinutes || 180) * 60;

    this.session = {
      testId: testConfig.id,
      testName: testConfig.name,
      exam: testConfig.exam || 'JEE Main',
      category: testConfig.category || 'Full Test',
      durationMinutes: testConfig.durationMinutes || 180,
      maxMarks: testConfig.maxMarks || 300,
      questions: [...questions],
      currentIndex: 0,
      answers: initialAnswers,
      statuses: initialStatuses,
      timeSpent: initialTimeSpent,
      timeRemaining: totalSeconds,
      totalSeconds: totalSeconds,
      startedAt: new Date().toISOString(),
      isCompleted: false
    };

    this.questionStartTime = Date.now();
    this.timeWarningShown = false;
    setActiveTestSession(this.session);

    this.startTimer();
    this.notifyState();
  }

  startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      if (!this.session || this.session.isCompleted) {
        this.stopTimer();
        return;
      }

      this.session.timeRemaining--;

      // Track active question time
      const curQ = this.getCurrentQuestion();
      if (curQ) {
        this.session.timeSpent[curQ.id] = (this.session.timeSpent[curQ.id] || 0) + 1;
      }

      // 5-minute warning check
      if (this.session.timeRemaining === 300 && !this.timeWarningShown) {
        this.timeWarningShown = true;
        this.triggerLowTimeWarning();
      }

      // Auto submit when time runs out
      if (this.session.timeRemaining <= 0) {
        this.session.timeRemaining = 0;
        this.stopTimer();
        this.submitTest(true); // Auto submit
        return;
      }

      this.notifyTick();
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  triggerLowTimeWarning() {
    // Show toast / non-intrusive alert
    if (window && window.showAppToast) {
      window.showAppToast('⚠️ Attention: Only 5 minutes remaining in your examination!', 'warning');
    }
  }

  getCurrentQuestion() {
    if (!this.session || !this.session.questions) return null;
    return this.session.questions[this.session.currentIndex];
  }

  /**
   * Action: Save & Next
   */
  saveAndNext(currentAnswer) {
    if (!this.session) return;
    const curQ = this.getCurrentQuestion();
    if (!curQ) return;

    const hasAnswer = this.isValidAnswer(curQ, currentAnswer);

    if (hasAnswer) {
      this.session.answers[curQ.id] = currentAnswer;
      this.session.statuses[curQ.id] = QUESTION_STATUS.ANSWERED;
    } else {
      // User clicked save & next without providing an answer
      this.session.answers[curQ.id] = null;
      this.session.statuses[curQ.id] = QUESTION_STATUS.NOT_ANSWERED;
    }

    this.advanceToNextQuestion();
  }

  /**
   * Action: Mark for Review & Next
   */
  markForReviewAndNext(currentAnswer) {
    if (!this.session) return;
    const curQ = this.getCurrentQuestion();
    if (!curQ) return;

    const hasAnswer = this.isValidAnswer(curQ, currentAnswer);

    if (hasAnswer) {
      this.session.answers[curQ.id] = currentAnswer;
      this.session.statuses[curQ.id] = QUESTION_STATUS.ANSWERED_AND_MARKED;
    } else {
      this.session.answers[curQ.id] = null;
      this.session.statuses[curQ.id] = QUESTION_STATUS.MARKED_FOR_REVIEW;
    }

    this.advanceToNextQuestion();
  }

  /**
   * Action: Clear Response
   */
  clearResponse() {
    if (!this.session) return;
    const curQ = this.getCurrentQuestion();
    if (!curQ) return;

    this.session.answers[curQ.id] = null;
    this.session.statuses[curQ.id] = QUESTION_STATUS.NOT_ANSWERED;
    this.notifyState();
  }

  /**
   * Action: Previous Question
   */
  previousQuestion() {
    if (!this.session) return;
    if (this.session.currentIndex > 0) {
      this.goToQuestion(this.session.currentIndex - 1);
    }
  }

  /**
   * Navigate directly to a specific question index
   */
  goToQuestion(index) {
    if (!this.session || index < 0 || index >= this.session.questions.length) return;

    // Before leaving the current question, if it was 'not_visited', turn it to 'not_answered'
    const curQ = this.getCurrentQuestion();
    if (curQ && this.session.statuses[curQ.id] === QUESTION_STATUS.NOT_VISITED) {
      this.session.statuses[curQ.id] = QUESTION_STATUS.NOT_ANSWERED;
    }

    this.session.currentIndex = index;

    // The target question: if 'not_visited', become 'not_answered'
    const targetQ = this.session.questions[index];
    if (targetQ && this.session.statuses[targetQ.id] === QUESTION_STATUS.NOT_VISITED) {
      this.session.statuses[targetQ.id] = QUESTION_STATUS.NOT_ANSWERED;
    }

    this.notifyState();
  }

  advanceToNextQuestion() {
    if (this.session.currentIndex < this.session.questions.length - 1) {
      this.goToQuestion(this.session.currentIndex + 1);
    } else {
      // Last question reached
      this.notifyState();
    }
  }

  isValidAnswer(question, answer) {
    if (answer === null || answer === undefined) return false;
    if (question.type === 'single_correct') {
      return answer !== '' && !isNaN(answer);
    }
    if (question.type === 'multiple_correct') {
      return Array.isArray(answer) && answer.length > 0;
    }
    if (question.type === 'numerical') {
      return answer.toString().trim() !== '' && !isNaN(parseFloat(answer));
    }
    return false;
  }

  /**
   * Calculates live summary counts for palette & submission dialog
   */
  getSummaryCounts() {
    if (!this.session) return { notVisited: 0, notAnswered: 0, answered: 0, markedForReview: 0, answeredAndMarked: 0 };

    const counts = {
      notVisited: 0,
      notAnswered: 0,
      answered: 0,
      markedForReview: 0,
      answeredAndMarked: 0
    };

    Object.values(this.session.statuses).forEach(st => {
      switch (st) {
        case QUESTION_STATUS.NOT_VISITED: counts.notVisited++; break;
        case QUESTION_STATUS.NOT_ANSWERED: counts.notAnswered++; break;
        case QUESTION_STATUS.ANSWERED: counts.answered++; break;
        case QUESTION_STATUS.MARKED_FOR_REVIEW: counts.markedForReview++; break;
        case QUESTION_STATUS.ANSWERED_AND_MARKED: counts.answeredAndMarked++; break;
      }
    });

    return counts;
  }

  /**
   * Submits the examination and calculates detailed score results
   */
  submitTest(isAuto = false) {
    if (!this.session || this.session.isCompleted) return;

    this.stopTimer();
    this.session.isCompleted = true;

    const timeSpentSeconds = this.session.totalSeconds - this.session.timeRemaining;
    const timeSpentMinutes = Math.max(1, Math.round(timeSpentSeconds / 60));

    // Calculate marks with dynamic marking scheme
    const computedResults = calculateTestResults(
      this.session.questions,
      this.session.answers,
      this.session.timeSpent,
      {
        testId: this.session.testId,
        testName: this.session.testName,
        exam: this.session.exam,
        durationMinutes: this.session.durationMinutes,
        timeSpentMinutes,
        completedAt: new Date().toISOString(),
        isAutoSubmitted: isAuto
      }
    );

    // Save attempt to student history
    const attemptRecord = {
      id: "attempt_" + Date.now(),
      testId: this.session.testId,
      testName: this.session.testName,
      exam: this.session.exam,
      date: new Date().toISOString(),
      score: computedResults.totalScore,
      maxMarks: computedResults.maxMarks,
      percentage: computedResults.percentage,
      accuracy: computedResults.accuracy,
      timeSpentMinutes,
      correctCount: computedResults.correctCount,
      incorrectCount: computedResults.incorrectCount,
      unattemptedCount: computedResults.unattemptedCount,
      subjectBreakdown: computedResults.subjectStats,
      chapterBreakdown: computedResults.chapterStats,
      questionReviews: computedResults.questionReviews,
      isAutoSubmitted: isAuto
    };

    saveCompletedAttempt(attemptRecord);
    saveAttemptToServer(attemptRecord);
    clearActiveTestSession();

    // Transition view to results
    setCurrentView('results', { attemptId: attemptRecord.id, resultData: attemptRecord });
  }

  formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const pad = n => n.toString().padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }

  onTick(fn) {
    this.tickCallbacks.add(fn);
    return () => this.tickCallbacks.delete(fn);
  }

  notifyTick() {
    this.tickCallbacks.forEach(fn => fn(this.session.timeRemaining, this.formatTime(this.session.timeRemaining)));
  }

  onStateChange(fn) {
    this.stateCallbacks.add(fn);
    return () => this.stateCallbacks.delete(fn);
  }

  notifyState() {
    this.stateCallbacks.forEach(fn => fn(this.session));
  }
}

export const cbtEngine = new CBTEngine();
