/**
 * SHREE TEACH - Results & Performance Diagnostic View
 * Displays overall score, rank/percentile simulator, subject cards, visual SVG charts,
 * strong/weak chapter insights, and full question solution review.
 */

import { getState, setCurrentView } from '../state.js';
import { simulatePercentileAndRank, generateDiagnosticInsights } from '../analytics.js';

export function renderResultView(container, viewParams = {}) {
  const state = getState();
  // Get active result or last completed or find by attemptId
  let result = viewParams.resultData;
  if (!result && viewParams.attemptId) {
    result = state.attempts.find(a => a.id === viewParams.attemptId);
  }
  if (!result) {
    result = state.lastCompletedResult || state.attempts[0];
  }

  if (!result) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📊</div>
        <h2>No Test Result Found</h2>
        <p>Complete a mock test to view detailed score breakdown and diagnostic performance analysis.</p>
        <button class="btn btn-primary" id="goMocksBtn">View Available Tests</button>
      </div>
    `;
    container.querySelector('#goMocksBtn')?.addEventListener('click', () => setCurrentView('mock-tests'));
    return;
  }

  // Rank / Percentile Simulation
  const simulation = simulatePercentileAndRank(result.score, result.maxMarks, result.exam);

  // Subject and Chapter Diagnostics
  const diagnostics = generateDiagnosticInsights(result.subjectBreakdown, result.chapterBreakdown);

  // Filter reviews
  let reviewFilter = 'all'; // 'all' | 'correct' | 'incorrect' | 'unattempted'
  const reviews = result.questionReviews || [];

  function renderContent() {
    const filteredReviews = reviews.filter(r => {
      if (reviewFilter === 'correct') return r.evalResult.isCorrect;
      if (reviewFilter === 'incorrect') return r.evalResult.isAttempted && !r.evalResult.isCorrect;
      if (reviewFilter === 'unattempted') return !r.evalResult.isAttempted;
      return true;
    });

    container.innerHTML = `
      <div class="results-page">
        <!-- Results Banner Header -->
        <div class="results-header-card">
          <div class="results-header-left">
            <span class="badge ${result.exam === 'JEE Main' ? 'badge-main' : 'badge-adv'}">${result.exam} MOCK REPORT</span>
            <h1 class="results-test-title">${result.testName}</h1>
            <p class="results-meta-line">
              Completed on ${new Date(result.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} • 
              Time Spent: <strong>${result.timeSpentMinutes} mins</strong>
              ${result.isAutoSubmitted ? ' • <span class="text-orange">(Auto-submitted on time limit)</span>' : ''}
            </p>
          </div>
          <div class="results-header-actions">
            <button class="btn btn-outline" id="reAttemptBtn">
              🔄 Retake Test
            </button>
            <button class="btn btn-primary" id="allTestsBtn">
              📋 All Tests
            </button>
          </div>
        </div>

        <!-- Overall Score Card -->
        <div class="score-summary-grid">
          <div class="main-score-card">
            <div class="score-radial-wrapper">
              <svg class="score-circular-svg" viewBox="0 0 120 120">
                <circle class="circle-bg" cx="60" cy="60" r="50"></circle>
                <circle class="circle-progress" cx="60" cy="60" r="50" 
                  style="stroke-dasharray: 314; stroke-dashoffset: ${314 - (314 * Math.max(0, result.percentage)) / 100};">
                </circle>
              </svg>
              <div class="score-number-inside">
                <span class="total-marks">${result.score}</span>
                <span class="max-marks-sub">/ ${result.maxMarks}</span>
              </div>
            </div>
            <div class="score-text-summary">
              <h3>Overall Test Score</h3>
              <p class="score-highlight">${result.percentage}% Marks Scored</p>
              <div class="score-pill-row">
                <span class="tag-pill tag-green">✓ ${result.correctCount} Correct</span>
                <span class="tag-pill tag-red">✗ ${result.incorrectCount} Incorrect</span>
                <span class="tag-pill tag-gray">○ ${result.unattemptedCount} Unattempted</span>
              </div>
            </div>
          </div>

          <!-- Rank & Percentile Simulator Card -->
          <div class="simulator-card">
            <div class="simulator-header">
              <span class="sim-badge">PERFORMANCE SIMULATOR</span>
              <h3>Estimated Standing</h3>
            </div>
            <div class="sim-metrics">
              <div class="sim-box">
                <span class="sim-label">Practice Percentile Range</span>
                <span class="sim-value text-blue">${simulation.percentile}</span>
              </div>
              <div class="sim-box">
                <span class="sim-label">Estimated Rank Bracket</span>
                <span class="sim-value text-gold">${simulation.rankEstimate}</span>
              </div>
            </div>
            <div class="sim-zone-pill">
              <strong>Standing:</strong> ${simulation.zone}
            </div>
            <p class="sim-advice">${simulation.advice}</p>
            <div class="disclaimer-note">
              ℹ️ <em>Important:</em> ${simulation.isUnofficialDisclaimer}
            </div>
          </div>
        </div>

        <!-- Diagnostic Feedback Alert -->
        <div class="diagnostic-banner">
          <div class="diag-icon">💡</div>
          <div class="diag-body">
            <h4>Diagnostic Feedback & Insights</h4>
            <p>${diagnostics.summaryText}</p>
          </div>
        </div>

        <!-- Subject Analysis Cards -->
        <div class="section-title-wrap">
          <h2 class="section-title">Subject-Wise Performance Breakdown</h2>
          <p class="section-subtitle">Individual scores, questions attempted, and accuracy across disciplines.</p>
        </div>

        <div class="subjects-cards-grid">
          ${Object.values(result.subjectBreakdown || {}).map(subj => {
            const subjColor = subj.name === 'Physics' ? '#3B82F6' : subj.name === 'Chemistry' ? '#10B981' : '#F59E0B';
            return `
              <div class="subj-card" style="border-top: 4px solid ${subjColor};">
                <div class="subj-card-header">
                  <div class="subj-title-group">
                    <span class="subj-indicator-dot" style="background: ${subjColor};"></span>
                    <h3>${subj.name}</h3>
                  </div>
                  <span class="subj-score-badge">${subj.score} / ${subj.maxMarks}</span>
                </div>

                <div class="subj-progress-bar-wrap">
                  <div class="subj-progress-label">
                    <span>Accuracy</span>
                    <strong>${subj.accuracy}%</strong>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill" style="width: ${subj.accuracy}%; background: ${subjColor};"></div>
                  </div>
                </div>

                <div class="subj-breakdown-row">
                  <div class="stat-cell">
                    <span class="stat-num text-green">${subj.correct}</span>
                    <span class="stat-lbl">Correct</span>
                  </div>
                  <div class="stat-cell">
                    <span class="stat-num text-red">${subj.incorrect}</span>
                    <span class="stat-lbl">Incorrect</span>
                  </div>
                  <div class="stat-cell">
                    <span class="stat-num text-gray">${subj.unattempted}</span>
                    <span class="stat-lbl">Unattempted</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Visual Performance Charts -->
        <div class="charts-comparison-card">
          <div class="chart-header">
            <h3>Visual Performance Comparison</h3>
            <span>Normalized Subject Marks & Accuracy Comparison</span>
          </div>
          <div class="custom-bar-chart">
            ${Object.values(result.subjectBreakdown || {}).map(subj => {
              const heightPercent = Math.max(8, Math.min(100, (subj.score / subj.maxMarks) * 100));
              const subjColor = subj.name === 'Physics' ? '#3B82F6' : subj.name === 'Chemistry' ? '#10B981' : '#F59E0B';
              return `
                <div class="chart-col">
                  <div class="bar-value-label">${subj.score} pts</div>
                  <div class="bar-track">
                    <div class="bar-fill" style="height: ${heightPercent}%; background: ${subjColor};"></div>
                  </div>
                  <div class="bar-col-name">${subj.name}</div>
                  <div class="bar-acc-tag">${subj.accuracy}% Acc</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Strong & Weak Chapters Section -->
        <div class="chapters-diagnostic-grid">
          <div class="diag-card strong-card">
            <div class="diag-card-title text-green">
              <span>⭐</span> Strong Chapters (Keep It Up)
            </div>
            <ul class="diag-chapter-list">
              ${diagnostics.strongChapters.length > 0 ? diagnostics.strongChapters.map(ch => `
                <li><span class="check-icon">✓</span> ${ch}</li>
              `).join('') : `
                <li class="empty-list-note">Practice more to establish strong chapters!</li>
              `}
            </ul>
          </div>

          <div class="diag-card weak-card">
            <div class="diag-card-title text-red">
              <span>⚠️</span> Chapters Needing Improvement
            </div>
            <ul class="diag-chapter-list">
              ${diagnostics.weakChapters.length > 0 ? diagnostics.weakChapters.map(ch => `
                <li><span class="warn-icon">!</span> ${ch}</li>
              `).join('') : `
                <li class="empty-list-note">No major weak chapters detected in this test!</li>
              `}
            </ul>
          </div>

          <div class="diag-card recommend-card">
            <div class="diag-card-title text-blue">
              <span>🎯</span> Recommended Chapters to Practice Next
            </div>
            <div class="recommend-tags">
              ${diagnostics.recommendedNext.map(ch => `
                <button class="recommend-tag-btn" data-chapname="${ch}">
                  + Practice ${ch}
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Question-by-Question Solution Review -->
        <div class="solutions-review-section">
          <div class="review-section-header">
            <div>
              <h2 class="section-title">Detailed Solutions & Explanations</h2>
              <p class="section-subtitle">Review every question with step-by-step mathematical reasoning and verified answer keys.</p>
            </div>
            <div class="review-filter-tabs">
              <button class="r-tab ${reviewFilter === 'all' ? 'active' : ''}" data-filter="all">All (${reviews.length})</button>
              <button class="r-tab ${reviewFilter === 'correct' ? 'active' : ''}" data-filter="correct">Correct (${result.correctCount})</button>
              <button class="r-tab ${reviewFilter === 'incorrect' ? 'active' : ''}" data-filter="incorrect">Incorrect (${result.incorrectCount})</button>
              <button class="r-tab ${reviewFilter === 'unattempted' ? 'active' : ''}" data-filter="unattempted">Unattempted (${result.unattemptedCount})</button>
            </div>
          </div>

          <div class="question-solutions-list">
            ${filteredReviews.length === 0 ? `
              <div class="empty-filter-state">
                <p>No questions match the "${reviewFilter}" filter.</p>
              </div>
            ` : filteredReviews.map((r) => {
              const q = r.question;
              const evalRes = r.evalResult;
              let statusBadgeClass = 'unattempted';
              if (evalRes.isCorrect) statusBadgeClass = 'correct';
              else if (evalRes.isAttempted) statusBadgeClass = 'incorrect';

              const letters = ['A', 'B', 'C', 'D'];

              let userAnsDisplay = "None (Unattempted)";
              if (r.userAnswer !== null && r.userAnswer !== undefined) {
                if (q.type === 'single_correct') {
                  userAnsDisplay = `Option ${letters[r.userAnswer]} (${q.options[r.userAnswer]})`;
                } else if (q.type === 'multiple_correct') {
                  userAnsDisplay = r.userAnswer.map(idx => `Option ${letters[idx]}`).join(', ');
                } else if (q.type === 'numerical') {
                  userAnsDisplay = `${r.userAnswer}`;
                }
              }

              let correctAnsDisplay = "";
              if (q.type === 'single_correct') {
                correctAnsDisplay = `Option ${letters[q.correctAnswer]} (${q.options[q.correctAnswer]})`;
              } else if (q.type === 'multiple_correct') {
                correctAnsDisplay = q.correctAnswer.map(idx => `Option ${letters[idx]}`).join(', ');
              } else if (q.type === 'numerical') {
                correctAnsDisplay = `${q.correctAnswer} (Tolerance: ±${q.tolerance || 0.05})`;
              }

              return `
                <div class="solution-card ${statusBadgeClass}">
                  <div class="sol-card-header">
                    <div class="sol-q-meta">
                      <span class="sol-q-index">Q${r.index}</span>
                      <span class="badge ${q.subject === 'Physics' ? 'badge-phy' : q.subject === 'Chemistry' ? 'badge-chem' : 'badge-math'}">${q.subject}</span>
                      <span class="sol-chap-name">${q.chapter}</span>
                      <span class="badge badge-diff ${q.difficulty.toLowerCase()}">${q.difficulty}</span>
                    </div>
                    <div class="sol-score-pill ${statusBadgeClass}">
                      ${evalRes.marksAwarded > 0 ? `+${evalRes.marksAwarded}` : evalRes.marksAwarded} Marks
                      <span class="sol-status-text">(${evalRes.statusText})</span>
                    </div>
                  </div>

                  <div class="sol-question-text">
                    ${escapeMath(q.question)}
                  </div>

                  ${q.options ? `
                    <div class="sol-options-grid">
                      ${q.options.map((opt, oIdx) => {
                        const isCorrectOption = Array.isArray(q.correctAnswer) ? q.correctAnswer.includes(oIdx) : q.correctAnswer === oIdx;
                        const isUserOption = Array.isArray(r.userAnswer) ? r.userAnswer.includes(oIdx) : r.userAnswer === oIdx;

                        let optClass = '';
                        if (isCorrectOption) optClass = 'is-correct-opt';
                        if (isUserOption && !isCorrectOption) optClass = 'is-wrong-user-opt';

                        return `
                          <div class="sol-opt-row ${optClass}">
                            <span class="opt-label">${letters[oIdx]}</span>
                            <span class="opt-text">${escapeMath(opt)}</span>
                            ${isCorrectOption ? '<span class="opt-tag-correct">✓ Correct Key</span>' : ''}
                            ${isUserOption && !isCorrectOption ? '<span class="opt-tag-user">✗ Your Answer</span>' : ''}
                          </div>
                        `;
                      }).join('')}
                    </div>
                  ` : `
                    <div class="sol-numerical-comparison">
                      <div class="num-compare-box">
                        <span class="compare-lbl">Your Answer:</span>
                        <strong class="${evalRes.isCorrect ? 'text-green' : 'text-red'}">${userAnsDisplay}</strong>
                      </div>
                      <div class="num-compare-box">
                        <span class="compare-lbl">Correct Value:</span>
                        <strong class="text-green">${correctAnsDisplay}</strong>
                      </div>
                    </div>
                  `}

                  <!-- Detailed Step-by-Step Solution -->
                  <div class="sol-explanation-box">
                    <div class="exp-header">
                      <span class="exp-icon">📝</span>
                      <strong>Step-by-Step Mathematical Explanation:</strong>
                    </div>
                    <div class="exp-body">
                      ${escapeMath(q.explanation)}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    // Review filter tabs
    container.querySelectorAll('.r-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        reviewFilter = tab.dataset.filter;
        renderContent();
      });
    });

    // Retake Test
    const reAttemptBtn = container.querySelector('#reAttemptBtn');
    if (reAttemptBtn) {
      reAttemptBtn.addEventListener('click', () => {
        setCurrentView('mock-tests');
      });
    }

    // All Tests
    const allTestsBtn = container.querySelector('#allTestsBtn');
    if (allTestsBtn) {
      allTestsBtn.addEventListener('click', () => {
        setCurrentView('mock-tests');
      });
    }

    // Recommended chapters practice triggers
    container.querySelectorAll('.recommend-tag-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const chap = btn.dataset.chapname;
        setCurrentView('practice', { chapter: chap });
      });
    });
  }

  renderContent();
}

function escapeMath(text) {
  if (!text) return '';
  return text
    .replace(/\n/g, '<br/>')
    .replace(/θ/g, '&theta;')
    .replace(/λ/g, '&lambda;')
    .replace(/μ/g, '&mu;')
    .replace(/π/g, '&pi;')
    .replace(/ε₀/g, '&epsilon;<sub>0</sub>')
    .replace(/ρ₀/g, '&rho;<sub>0</sub>')
    .replace(/ΔG°/g, '&Delta;G&deg;')
    .replace(/ΔP/g, '&Delta;P')
    .replace(/E°/g, 'E&deg;')
    .replace(/([A-Za-z0-9]+)\^([0-9\/\-\+a-z]+)/g, '$1<sup>$2</sup>')
    .replace(/([A-Za-z]+)_([0-9a-zA-Z]+)/g, '$1<sub>$2</sub>');
}
