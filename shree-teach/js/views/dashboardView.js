/**
 * SHREE TEACH - Mock Test Dashboard & Student Progress View
 * Displays available tests with comprehensive filters, student stats, and recent attempts.
 */

import { getState, setCurrentView } from '../state.js';
import { PRECONFIGURED_TESTS } from '../data/mockTests.js';
import { QUESTION_DATABASE, filterQuestions, getBalancedTestQuestions } from '../data/questions.js';
import { cbtEngine } from '../cbtEngine.js';

export function renderDashboardView(container, viewParams = {}) {
  const state = getState();
  const user = state.user;
  const attempts = state.attempts || [];

  // Compute student summary statistics
  const testsAttemptedCount = attempts.length;
  let totalScore = 0;
  let bestScore = 0;
  let totalAcc = 0;
  let totalQuestionsSolved = 0;

  attempts.forEach(att => {
    totalScore += att.score;
    if (att.score > bestScore) bestScore = att.score;
    totalAcc += att.accuracy;
    totalQuestionsSolved += (att.correctCount + att.incorrectCount);
  });

  const avgScore = testsAttemptedCount > 0 ? Math.round(totalScore / testsAttemptedCount) : 0;
  const avgAccuracy = testsAttemptedCount > 0 ? Math.round(totalAcc / testsAttemptedCount) : 0;
  const streakDays = state.streak?.days || 5;

  // Active filters from viewParams or defaults
  let selectedExam = viewParams.examFilter || 'All';
  let selectedSubject = viewParams.subjectFilter || 'All';
  let selectedDifficulty = viewParams.difficultyFilter || 'All';
  let selectedCategory = viewParams.typeFilter || 'All';

  function renderContent() {
    // Filter tests
    const filteredTests = PRECONFIGURED_TESTS.filter(test => {
      if (selectedExam !== 'All' && test.exam !== selectedExam) return false;
      if (selectedSubject !== 'All' && test.subject !== 'All Subjects' && test.subject !== selectedSubject) return false;
      if (selectedDifficulty !== 'All' && test.difficulty !== selectedDifficulty) return false;
      if (selectedCategory !== 'All' && test.category !== selectedCategory) return false;
      return true;
    });

    container.innerHTML = `
      <div class="dashboard-page">
        <!-- Student Overview Header -->
        <div class="student-welcome-banner">
          <div class="welcome-text">
            <div class="student-badge">
              <span class="user-status-dot"></span>
              <span>JEE Aspirant Portal</span>
            </div>
            <h1>Welcome back, <span class="student-name">${user.name || 'Aman'}</span>!</h1>
            <p>Target: <strong>${user.targetExam || 'JEE Main 2025'}</strong> • Target Year: <strong>${user.targetYear || '2025'}</strong></p>
          </div>
          <div class="streak-widget">
            <div class="streak-fire">🔥</div>
            <div class="streak-info">
              <div class="streak-count">${streakDays} Days</div>
              <div class="streak-label">Practice Streak</div>
            </div>
          </div>
        </div>

        <!-- Student Quick Metric Cards -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-title">Tests Attempted</span>
              <span class="metric-icon">📝</span>
            </div>
            <div class="metric-value">${testsAttemptedCount}</div>
            <div class="metric-sub">Full mocks & sectionals</div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-title">Average Score</span>
              <span class="metric-icon">📊</span>
            </div>
            <div class="metric-value">${avgScore} <span class="metric-max">/ 300</span></div>
            <div class="metric-sub">Across all attempts</div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-title">Best Score</span>
              <span class="metric-icon">🏆</span>
            </div>
            <div class="metric-value highlight-gold">${bestScore} <span class="metric-max">/ 300</span></div>
            <div class="metric-sub">Personal best performance</div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-title">Average Accuracy</span>
              <span class="metric-icon">🎯</span>
            </div>
            <div class="metric-value highlight-green">${avgAccuracy}%</div>
            <div class="metric-sub">${totalQuestionsSolved} questions evaluated</div>
          </div>
        </div>

        <!-- Section: Available Mock Tests -->
        <div class="dashboard-section-header">
          <div>
            <h2 class="section-title">JEE Mock Test Series</h2>
            <p class="section-subtitle">Real NTA CBT & IIT Advanced simulated examination papers.</p>
          </div>
          <button class="btn btn-outline" id="generateCustomTestBtn">
            <span>⚙️</span> Custom Test Generator
          </button>
        </div>

        <!-- Filters Bar -->
        <div class="filters-container">
          <div class="filter-group">
            <label>Target Exam</label>
            <div class="filter-pills" id="examFilterPills">
              <button class="pill ${selectedExam === 'All' ? 'active' : ''}" data-filter="exam" data-val="All">All Exams</button>
              <button class="pill ${selectedExam === 'JEE Main' ? 'active' : ''}" data-filter="exam" data-val="JEE Main">JEE Main</button>
              <button class="pill ${selectedExam === 'JEE Advanced' ? 'active' : ''}" data-filter="exam" data-val="JEE Advanced">JEE Advanced</button>
            </div>
          </div>

          <div class="filter-group">
            <label>Subject</label>
            <div class="filter-pills" id="subjectFilterPills">
              <button class="pill ${selectedSubject === 'All' ? 'active' : ''}" data-filter="subject" data-val="All">All Subjects</button>
              <button class="pill ${selectedSubject === 'Physics' ? 'active' : ''}" data-filter="subject" data-val="Physics">Physics</button>
              <button class="pill ${selectedSubject === 'Chemistry' ? 'active' : ''}" data-filter="subject" data-val="Chemistry">Chemistry</button>
              <button class="pill ${selectedSubject === 'Mathematics' ? 'active' : ''}" data-filter="subject" data-val="Mathematics">Mathematics</button>
            </div>
          </div>

          <div class="filter-group">
            <label>Test Type</label>
            <div class="filter-pills" id="categoryFilterPills">
              <button class="pill ${selectedCategory === 'All' ? 'active' : ''}" data-filter="category" data-val="All">All Types</button>
              <button class="pill ${selectedCategory === 'Full Test' ? 'active' : ''}" data-filter="category" data-val="Full Test">Full Test</button>
              <button class="pill ${selectedCategory === 'Chapter Test' ? 'active' : ''}" data-filter="category" data-val="Chapter Test">Chapter Test</button>
              <button class="pill ${selectedCategory === 'Previous Year Paper' ? 'active' : ''}" data-filter="category" data-val="Previous Year Paper">PYQ Paper</button>
            </div>
          </div>

          <div class="filter-group">
            <label>Difficulty</label>
            <div class="filter-pills" id="diffFilterPills">
              <button class="pill ${selectedDifficulty === 'All' ? 'active' : ''}" data-filter="diff" data-val="All">All</button>
              <button class="pill ${selectedDifficulty === 'Easy' ? 'active' : ''}" data-filter="diff" data-val="Easy">Easy</button>
              <button class="pill ${selectedDifficulty === 'Medium' ? 'active' : ''}" data-filter="diff" data-val="Medium">Medium</button>
              <button class="pill ${selectedDifficulty === 'Hard' ? 'active' : ''}" data-filter="diff" data-val="Hard">Hard</button>
            </div>
          </div>
        </div>

        <!-- Mock Tests Card Grid -->
        <div class="mock-tests-grid">
          ${filteredTests.length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon">🔍</div>
              <h3>No Mock Tests Match Your Filters</h3>
              <p>Try resetting one or more filters above to browse available JEE mock tests.</p>
              <button class="btn btn-outline reset-filters-btn">Reset All Filters</button>
            </div>
          ` : filteredTests.map(test => {
            // Check if attempted in history
            const prevAttempt = attempts.find(a => a.testId === test.id);
            const isAttempted = !!prevAttempt;

            return `
              <div class="test-card" data-testid="${test.id}">
                <div class="test-card-top">
                  <div class="test-badges">
                    <span class="badge ${test.exam === 'JEE Main' ? 'badge-main' : 'badge-adv'}">${test.exam}</span>
                    <span class="badge badge-category">${test.category}</span>
                    <span class="badge badge-diff ${test.difficulty.toLowerCase()}">${test.difficulty}</span>
                  </div>
                  <div class="attempt-status ${isAttempted ? 'status-attempted' : 'status-not-attempted'}">
                    ${isAttempted ? `✓ Attempted (${prevAttempt.score}/${test.maxMarks})` : 'Not Attempted'}
                  </div>
                </div>

                <h3 class="test-title">${test.name}</h3>
                <p class="test-desc">${test.description}</p>

                <div class="test-meta-grid">
                  <div class="meta-item">
                    <span class="meta-icon">❓</span>
                    <div>
                      <strong>${test.questionCount} Questions</strong>
                      <span>${test.physicsCount ? `P:${test.physicsCount} ` : ''}${test.chemistryCount ? `C:${test.chemistryCount} ` : ''}${test.mathCount ? `M:${test.mathCount}` : ''}</span>
                    </div>
                  </div>
                  <div class="meta-item">
                    <span class="meta-icon">⏱️</span>
                    <div>
                      <strong>${test.durationMinutes} Minutes</strong>
                      <span>Countdown timer</span>
                    </div>
                  </div>
                  <div class="meta-item">
                    <span class="meta-icon">🎯</span>
                    <div>
                      <strong>${test.maxMarks} Marks Max</strong>
                      <span>Standard JEE scale</span>
                    </div>
                  </div>
                  <div class="meta-item">
                    <span class="meta-icon">⚖️</span>
                    <div>
                      <strong>Negative Marking</strong>
                      <span>${test.negativeMarkingText}</span>
                    </div>
                  </div>
                </div>

                <div class="test-card-actions">
                  <button class="btn btn-primary btn-block start-mock-btn" data-testid="${test.id}">
                    ${isAttempted ? 'Re-attempt Test' : 'Start Test'}
                  </button>
                  ${isAttempted ? `
                    <button class="btn btn-outline btn-block review-past-btn" data-attemptid="${prevAttempt.id}">
                      View Analysis
                    </button>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Recent Attempts & Progress Section -->
        ${attempts.length > 0 ? `
          <div class="recent-attempts-section">
            <h2 class="section-title">Recent Test Attempts & History</h2>
            <div class="attempts-table-card">
              <div class="table-responsive">
                <table class="attempts-table">
                  <thead>
                    <tr>
                      <th>Test Name</th>
                      <th>Exam</th>
                      <th>Date</th>
                      <th>Score</th>
                      <th>Accuracy</th>
                      <th>Time Spent</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${attempts.map(att => `
                      <tr>
                        <td><strong>${att.testName}</strong></td>
                        <td><span class="badge ${att.exam === 'JEE Main' ? 'badge-main' : 'badge-adv'}">${att.exam}</span></td>
                        <td>${new Date(att.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td><strong class="score-pill">${att.score} / ${att.maxMarks}</strong></td>
                        <td><span class="accuracy-pill">${att.accuracy}%</span></td>
                        <td>${att.timeSpentMinutes} mins</td>
                        <td>
                          <button class="btn btn-sm btn-outline view-attempt-btn" data-attemptid="${att.id}">
                            View Report
                          </button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    // Filter pill events
    container.querySelectorAll('.pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const filterType = btn.dataset.filter;
        const val = btn.dataset.val;
        if (filterType === 'exam') selectedExam = val;
        else if (filterType === 'subject') selectedSubject = val;
        else if (filterType === 'category') selectedCategory = val;
        else if (filterType === 'diff') selectedDifficulty = val;
        renderContent();
      });
    });

    // Reset filters
    const resetBtn = container.querySelector('.reset-filters-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        selectedExam = 'All';
        selectedSubject = 'All';
        selectedDifficulty = 'All';
        selectedCategory = 'All';
        renderContent();
      });
    }

    // Custom test generator button
    const customTestBtn = container.querySelector('#generateCustomTestBtn');
    if (customTestBtn) {
      customTestBtn.addEventListener('click', () => {
        setCurrentView('practice', { openGenerator: true });
      });
    }

    // Start mock test buttons
    container.querySelectorAll('.start-mock-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const testId = btn.dataset.testid;
        const testObj = PRECONFIGURED_TESTS.find(t => t.id === testId);
        if (!testObj) return;

        // Select authentically balanced questions for full test or sectional test
        const testQuestions = getBalancedTestQuestions(testObj);

        cbtEngine.startTest(testObj, testQuestions);
        setCurrentView('cbt-exam');
      });
    });

    // View past attempt buttons
    container.querySelectorAll('.view-attempt-btn, .review-past-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const attId = btn.dataset.attemptid;
        const attempt = attempts.find(a => a.id === attId);
        if (attempt) {
          setCurrentView('results', { attemptId: attId, resultData: attempt });
        }
      });
    });
  }

  renderContent();

  if (viewParams && (viewParams.focus === 'performance' || viewParams.scroll === 'attempts')) {
    setTimeout(() => {
      const el = container.querySelector('.recent-attempts-section') || container.querySelector('.metrics-grid');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  }
}
