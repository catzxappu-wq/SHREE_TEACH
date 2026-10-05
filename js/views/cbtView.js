/**
 * SHREE TEACH - Authentic Computer-Based Test (CBT) Interface View
 * Fully matches official JEE exam screens with question palette, live countdown timer,
 * multi-subject sections, MCQ/Multiple-correct/Numerical question areas, and submit modal.
 */

import { cbtEngine, QUESTION_STATUS } from '../cbtEngine.js';
import { getState, setCurrentView } from '../state.js';

export function renderCBTView(container) {
  const session = cbtEngine.session;
  if (!session || !session.questions || session.questions.length === 0) {
    container.innerHTML = `
      <div class="exam-error-state">
        <h2>No Active Test Session Found</h2>
        <p>Please select a mock test from the dashboard to launch the CBT examination interface.</p>
        <button class="btn btn-primary" id="returnDashboardBtn">Go to Mock Tests</button>
      </div>
    `;
    const btn = container.querySelector('#returnDashboardBtn');
    if (btn) btn.addEventListener('click', () => setCurrentView('mock-tests'));
    return;
  }

  const user = getState().user;

  // Render CBT Shell
  container.innerHTML = `
    <div class="cbt-exam-container" id="cbtExamRoot">
      <!-- Top Exam Bar -->
      <header class="cbt-top-bar">
        <div class="cbt-brand-box">
          <div class="cbt-logo-badge">ST</div>
          <div class="cbt-brand-text">
            <span class="cbt-platform-name">SHREE TEACH</span>
            <span class="cbt-title-divider">|</span>
            <span class="cbt-exam-tag">JEE MOCK TEST SYSTEM</span>
          </div>
        </div>

        <div class="cbt-test-info">
          <span class="cbt-test-name" id="cbtTestNameDisplay">${session.testName}</span>
          <span class="cbt-exam-badge">${session.exam}</span>
        </div>

        <!-- Candidate Profile & Timer -->
        <div class="cbt-top-right">
          <div class="cbt-timer-box" id="cbtTimerBox" title="Time Remaining">
            <span class="timer-icon">⏱️</span>
            <div class="timer-details">
              <span class="timer-label">Time Left</span>
              <span class="timer-digits" id="cbtTimerDigits">${cbtEngine.formatTime(session.timeRemaining)}</span>
            </div>
          </div>

          <div class="cbt-candidate-chip">
            <div class="candidate-avatar">👤</div>
            <div class="candidate-meta">
              <span class="candidate-name">${user.name || 'Candidate'}</span>
              <span class="candidate-id">Roll: ST-2025-9921</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Sub-bar: Subject Tabs & Palette Toggle on Mobile -->
      <div class="cbt-section-bar">
        <div class="cbt-subject-tabs" id="cbtSubjectTabs">
          <!-- Dynamically populated subject tabs -->
        </div>
        <div class="cbt-mobile-palette-toggle">
          <button class="btn btn-sm btn-outline" id="toggleMobilePaletteBtn">
            <span>🎨</span> Question Palette (<span id="paletteCountIndicator">0/0</span>)
          </button>
        </div>
      </div>

      <!-- Main Examination Area -->
      <div class="cbt-main-content">
        <!-- Question Pane (Left/Center) -->
        <main class="cbt-question-pane">
          <!-- Question Header -->
          <div class="q-header-bar">
            <div class="q-number-title">
              <span class="q-num-pill" id="qCurrentNumberPill">Question 1</span>
              <span class="q-type-pill" id="qTypePill">Single Choice (+4, -1)</span>
              <span class="q-chapter-pill" id="qChapterPill">Kinematics</span>
            </div>
            <div class="q-marking-scheme" id="qMarkingScheme">
              Marks: <strong class="text-green">+4</strong> | Negative: <strong class="text-red">-1</strong>
            </div>
          </div>

          <!-- Question Body & Content -->
          <div class="q-scroll-area">
            <div class="q-text-card" id="qTextCard">
              <!-- Question text rendered here -->
            </div>

            <!-- Answer Options Area -->
            <div class="q-options-container" id="qOptionsContainer">
              <!-- Options or numerical pad rendered here -->
            </div>
          </div>

          <!-- Bottom Action Buttons Bar -->
          <footer class="cbt-action-footer">
            <div class="footer-left-actions">
              <button class="btn btn-cbt-review" id="markReviewBtn">
                Mark for Review & Next
              </button>
              <button class="btn btn-cbt-clear" id="clearResponseBtn">
                Clear Response
              </button>
            </div>

            <div class="footer-right-actions">
              <button class="btn btn-cbt-nav" id="prevQuestionBtn">
                &larr; Previous
              </button>
              <button class="btn btn-cbt-save" id="saveNextBtn">
                Save & Next &rarr;
              </button>
              <button class="btn btn-cbt-submit" id="submitExamBtn">
                Submit Test
              </button>
            </div>
          </footer>
        </main>

        <!-- Right Side: Question Navigation Palette -->
        <aside class="cbt-palette-pane" id="cbtPalettePane">
          <div class="palette-header">
            <h3>Question Palette</h3>
            <button class="close-palette-mobile" id="closeMobilePaletteBtn">&times;</button>
          </div>

          <!-- Palette Legend (Official NTA Color Scheme) -->
          <div class="palette-legend">
            <div class="legend-row">
              <div class="legend-item">
                <span class="legend-chip answered">0</span>
                <span>Answered</span>
              </div>
              <div class="legend-item">
                <span class="legend-chip not-answered">0</span>
                <span>Not Answered</span>
              </div>
            </div>
            <div class="legend-row">
              <div class="legend-item">
                <span class="legend-chip not-visited">0</span>
                <span>Not Visited</span>
              </div>
              <div class="legend-item">
                <span class="legend-chip marked-review">0</span>
                <span>Marked for Review</span>
              </div>
            </div>
            <div class="legend-row">
              <div class="legend-item full-width">
                <span class="legend-chip ans-marked">0</span>
                <span>Answered & Marked for Review</span>
              </div>
            </div>
          </div>

          <!-- Section Filter inside Palette -->
          <div class="palette-section-title" id="paletteCurrentSectionLabel">
            Physics Section (Questions 1 - 25)
          </div>

          <!-- Question Grid Numbers -->
          <div class="palette-grid" id="paletteGrid">
            <!-- Grid buttons injected dynamically -->
          </div>

          <!-- Quick Palette Actions -->
          <div class="palette-footer">
            <button class="btn btn-primary btn-block" id="paletteSubmitBtn">
              Submit Test
            </button>
          </div>
        </aside>
      </div>

      <!-- Confirmation / Submission Dialog Modal -->
      <div class="modal-overlay" id="submitConfirmModal" style="display: none;">
        <div class="modal-card cbt-modal-card">
          <div class="modal-header">
            <div class="modal-icon-badge">📋</div>
            <div>
              <h3>Examination Summary</h3>
              <p>Are you sure you want to finish and submit your test?</p>
            </div>
          </div>
          <div class="modal-body">
            <div class="summary-stats-grid" id="summaryStatsGrid">
              <!-- Summary breakdown populated dynamically -->
            </div>
            <div class="warning-callout">
              ⚠️ Once submitted, you cannot change your answers. Detailed scorecard and chapter solutions will be generated immediately.
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline" id="cancelSubmitModalBtn">Resume Test</button>
            <button class="btn btn-primary" id="confirmFinalSubmitBtn">Confirm & Submit</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach live timer listener
  const timerDigits = container.querySelector('#cbtTimerDigits');
  const timerBox = container.querySelector('#cbtTimerBox');

  const unsubscribeTimer = cbtEngine.onTick((remainingSeconds, formattedString) => {
    if (timerDigits) timerDigits.textContent = formattedString;
    // Turn red if less than 5 minutes
    if (remainingSeconds < 300) {
      timerBox?.classList.add('timer-danger');
    }
  });

  // State change listener
  const unsubscribeState = cbtEngine.onStateChange(() => {
    renderCurrentQuestionState();
  });

  // Initial render of question
  renderCurrentQuestionState();

  // Attach CBT Controller Events
  attachCBTEvents(container);
}

function renderCurrentQuestionState() {
  const session = cbtEngine.session;
  if (!session) return;

  const curQ = cbtEngine.getCurrentQuestion();
  if (!curQ) return;

  const totalQuestions = session.questions.length;
  const currentQNum = session.currentIndex + 1;

  // Header badges
  const qNumPill = document.getElementById('qCurrentNumberPill');
  const qTypePill = document.getElementById('qTypePill');
  const qChapterPill = document.getElementById('qChapterPill');
  const qMarkingScheme = document.getElementById('qMarkingScheme');

  if (qNumPill) qNumPill.textContent = `Question ${currentQNum} of ${totalQuestions}`;
  if (qChapterPill) qChapterPill.textContent = `${curQ.subject} • ${curQ.chapter}`;

  const posMarks = curQ.positiveMarks ?? 4;
  const negMarks = curQ.negativeMarks ?? (curQ.type === 'numerical' ? 0 : 1);

  if (curQ.type === 'single_correct') {
    if (qTypePill) qTypePill.textContent = 'Single Choice (MCQ)';
    if (qMarkingScheme) qMarkingScheme.innerHTML = `Marks: <strong class="text-green">+${posMarks}</strong> | Negative: <strong class="text-red">-${negMarks}</strong>`;
  } else if (curQ.type === 'multiple_correct') {
    if (qTypePill) qTypePill.textContent = 'Multiple Choice (One or More Correct)';
    if (qMarkingScheme) qMarkingScheme.innerHTML = `Full: <strong class="text-green">+${posMarks}</strong> | Partial: <strong class="text-blue">+1 each</strong> | Penalty: <strong class="text-red">-${negMarks}</strong>`;
  } else if (curQ.type === 'numerical') {
    if (qTypePill) qTypePill.textContent = 'Numerical Value Question';
    if (qMarkingScheme) qMarkingScheme.innerHTML = `Marks: <strong class="text-green">+${posMarks}</strong> | Negative: <strong class="text-red">-${negMarks}</strong>`;
  }

  // Question Text
  const qTextCard = document.getElementById('qTextCard');
  if (qTextCard) {
    qTextCard.innerHTML = `
      <div class="q-prompt-box">
        <p class="q-main-text">${escapeAndFormatMath(curQ.question)}</p>
      </div>
    `;
  }

  // Question Options / Inputs
  const qOptionsContainer = document.getElementById('qOptionsContainer');
  const currentAnswer = session.answers[curQ.id];

  if (qOptionsContainer) {
    if (curQ.type === 'single_correct') {
      const letters = ['A', 'B', 'C', 'D'];
      qOptionsContainer.innerHTML = `
        <div class="options-list single-choice-list">
          ${curQ.options.map((opt, idx) => {
            const isSelected = currentAnswer !== null && Number(currentAnswer) === idx;
            return `
              <label class="cbt-option-item ${isSelected ? 'selected' : ''}" data-optindex="${idx}">
                <input type="radio" name="cbtOption" value="${idx}" ${isSelected ? 'checked' : ''} />
                <span class="opt-label-letter">${letters[idx]}</span>
                <span class="opt-text">${escapeAndFormatMath(opt)}</span>
              </label>
            `;
          }).join('')}
        </div>
      `;
    } else if (curQ.type === 'multiple_correct') {
      const letters = ['A', 'B', 'C', 'D'];
      const selectedIndices = Array.isArray(currentAnswer) ? currentAnswer : [];
      qOptionsContainer.innerHTML = `
        <div class="multiple-choice-tip">
          ℹ️ Select all correct choices. Partial marks (+1 per correct option) awarded if no wrong option is selected.
        </div>
        <div class="options-list multi-choice-list">
          ${curQ.options.map((opt, idx) => {
            const isSelected = selectedIndices.includes(idx);
            return `
              <label class="cbt-option-item ${isSelected ? 'selected' : ''}" data-optindex="${idx}">
                <input type="checkbox" name="cbtMultiOption" value="${idx}" ${isSelected ? 'checked' : ''} />
                <span class="opt-label-letter check-box-letter">${letters[idx]}</span>
                <span class="opt-text">${escapeAndFormatMath(opt)}</span>
              </label>
            `;
          }).join('')}
        </div>
      `;
    } else if (curQ.type === 'numerical') {
      const numVal = currentAnswer !== null && currentAnswer !== undefined ? currentAnswer : '';
      qOptionsContainer.innerHTML = `
        <div class="numerical-input-card">
          <label class="numerical-label">Enter your numeric or decimal answer below:</label>
          <div class="numeric-field-wrapper">
            <input type="text" id="numericalInputField" class="numerical-input" placeholder="e.g. 12.5 or 4" value="${numVal}" autocomplete="off" />
          </div>
          <!-- Clean Virtual Keypad for CBT Realism -->
          <div class="virtual-keypad">
            <button type="button" class="keypad-key" data-key="7">7</button>
            <button type="button" class="keypad-key" data-key="8">8</button>
            <button type="button" class="keypad-key" data-key="9">9</button>
            <button type="button" class="keypad-key" data-key="4">4</button>
            <button type="button" class="keypad-key" data-key="5">5</button>
            <button type="button" class="keypad-key" data-key="6">6</button>
            <button type="button" class="keypad-key" data-key="1">1</button>
            <button type="button" class="keypad-key" data-key="2">2</button>
            <button type="button" class="keypad-key" data-key="3">3</button>
            <button type="button" class="keypad-key" data-key="0">0</button>
            <button type="button" class="keypad-key" data-key=".">.</button>
            <button type="button" class="keypad-key" data-key="-">-</button>
            <button type="button" class="keypad-key key-backspace" data-key="BACK">⌫ Del</button>
            <button type="button" class="keypad-key key-clear" data-key="CLEAR">Clear</button>
          </div>
        </div>
      `;
    }
  }

  // Update Subject Tabs
  renderSubjectTabs();

  // Update Palette Grid & Summary
  renderPalette();
}

function renderSubjectTabs() {
  const session = cbtEngine.session;
  if (!session) return;

  const curQ = cbtEngine.getCurrentQuestion();
  const tabsContainer = document.getElementById('cbtSubjectTabs');
  if (!tabsContainer) return;

  // Group questions by subject
  const subjectsMap = {};
  session.questions.forEach((q, idx) => {
    const s = q.subject || 'All';
    if (!subjectsMap[s]) subjectsMap[s] = [];
    subjectsMap[s].push(idx);
  });

  const subjectNames = Object.keys(subjectsMap);

  tabsContainer.innerHTML = subjectNames.map(subj => {
    const indices = subjectsMap[subj];
    const isCurrentSubj = curQ && curQ.subject === subj;
    // Count answered in this subject
    const answeredCount = indices.filter(idx => {
      const q = session.questions[idx];
      const st = session.statuses[q.id];
      return st === QUESTION_STATUS.ANSWERED || st === QUESTION_STATUS.ANSWERED_AND_MARKED;
    }).length;

    return `
      <button class="cbt-subj-tab ${isCurrentSubj ? 'active' : ''}" data-subject="${subj}">
        <span class="tab-subj-name">${subj}</span>
        <span class="tab-count-pill">${answeredCount} / ${indices.length}</span>
      </button>
    `;
  }).join('');

  // Tab click listeners
  tabsContainer.querySelectorAll('.cbt-subj-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const s = tab.dataset.subject;
      const firstIdx = subjectsMap[s][0];
      if (firstIdx !== undefined) {
        cbtEngine.goToQuestion(firstIdx);
      }
    });
  });
}

function renderPalette() {
  const session = cbtEngine.session;
  if (!session) return;

  const curQ = cbtEngine.getCurrentQuestion();
  const gridContainer = document.getElementById('paletteGrid');
  const counts = cbtEngine.getSummaryCounts();

  // Update Legend counts
  const ansEl = document.querySelector('.legend-chip.answered');
  const notAnsEl = document.querySelector('.legend-chip.not-answered');
  const notVisEl = document.querySelector('.legend-chip.not-visited');
  const revEl = document.querySelector('.legend-chip.marked-review');
  const ansMarkEl = document.querySelector('.legend-chip.ans-marked');

  if (ansEl) ansEl.textContent = counts.answered;
  if (notAnsEl) notAnsEl.textContent = counts.notAnswered;
  if (notVisEl) notVisEl.textContent = counts.notVisited;
  if (revEl) revEl.textContent = counts.markedForReview;
  if (ansMarkEl) ansMarkEl.textContent = counts.answeredAndMarked;

  const countIndicator = document.getElementById('paletteCountIndicator');
  if (countIndicator) {
    countIndicator.textContent = `${counts.answered + counts.answeredAndMarked}/${session.questions.length}`;
  }

  // Section label inside palette
  const secLabel = document.getElementById('paletteCurrentSectionLabel');
  if (secLabel && curQ) {
    secLabel.textContent = `${curQ.subject} Section`;
  }

  // Populate Palette Grid Buttons
  if (gridContainer) {
    gridContainer.innerHTML = session.questions.map((q, idx) => {
      const isCurrent = idx === session.currentIndex;
      const status = session.statuses[q.id] || QUESTION_STATUS.NOT_VISITED;

      let statusClass = 'not-visited';
      if (status === QUESTION_STATUS.ANSWERED) statusClass = 'answered';
      else if (status === QUESTION_STATUS.NOT_ANSWERED) statusClass = 'not-answered';
      else if (status === QUESTION_STATUS.MARKED_FOR_REVIEW) statusClass = 'marked-review';
      else if (status === QUESTION_STATUS.ANSWERED_AND_MARKED) statusClass = 'ans-marked';

      return `
        <button class="palette-btn ${statusClass} ${isCurrent ? 'active-q' : ''}" data-qindex="${idx}" title="Question ${idx + 1} (${q.subject})">
          ${idx + 1}
        </button>
      `;
    }).join('');

    // Palette button click -> Navigate
    gridContainer.querySelectorAll('.palette-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetIdx = Number(btn.dataset.qindex);
        cbtEngine.goToQuestion(targetIdx);
      });
    });
  }
}

/**
 * Extracts current answer from active inputs
 */
function getActiveAnswer(question) {
  if (!question) return null;

  if (question.type === 'single_correct') {
    const selected = document.querySelector('input[name="cbtOption"]:checked');
    return selected ? Number(selected.value) : null;
  }

  if (question.type === 'multiple_correct') {
    const checkboxes = document.querySelectorAll('input[name="cbtMultiOption"]:checked');
    const values = [];
    checkboxes.forEach(cb => values.push(Number(cb.value)));
    return values.length > 0 ? values : null;
  }

  if (question.type === 'numerical') {
    const inp = document.getElementById('numericalInputField');
    if (inp && inp.value.trim() !== '') {
      return inp.value.trim();
    }
    return null;
  }

  return null;
}

function attachCBTEvents(container) {
  // Option selection visual highlighting
  container.addEventListener('change', (e) => {
    if (e.target.name === 'cbtOption') {
      container.querySelectorAll('.cbt-option-item').forEach(el => el.classList.remove('selected'));
      e.target.closest('.cbt-option-item')?.classList.add('selected');
    } else if (e.target.name === 'cbtMultiOption') {
      const item = e.target.closest('.cbt-option-item');
      if (e.target.checked) item?.classList.add('selected');
      else item?.classList.remove('selected');
    }
  });

  // Keypad clicks for numerical input
  container.addEventListener('click', (e) => {
    const keyBtn = e.target.closest('.keypad-key');
    if (keyBtn) {
      const keyVal = keyBtn.dataset.key;
      const inputEl = document.getElementById('numericalInputField');
      if (inputEl) {
        if (keyVal === 'BACK') {
          inputEl.value = inputEl.value.slice(0, -1);
        } else if (keyVal === 'CLEAR') {
          inputEl.value = '';
        } else {
          // Prevent multiple decimal points or negative signs misplaced
          if (keyVal === '.' && inputEl.value.includes('.')) return;
          if (keyVal === '-' && inputEl.value.length > 0) return;
          inputEl.value += keyVal;
        }
        inputEl.focus();
      }
    }
  });

  // Action Buttons
  const saveNextBtn = container.querySelector('#saveNextBtn');
  if (saveNextBtn) {
    saveNextBtn.addEventListener('click', () => {
      const curQ = cbtEngine.getCurrentQuestion();
      const ans = getActiveAnswer(curQ);
      cbtEngine.saveAndNext(ans);
    });
  }

  const markReviewBtn = container.querySelector('#markReviewBtn');
  if (markReviewBtn) {
    markReviewBtn.addEventListener('click', () => {
      const curQ = cbtEngine.getCurrentQuestion();
      const ans = getActiveAnswer(curQ);
      cbtEngine.markForReviewAndNext(ans);
    });
  }

  const clearResponseBtn = container.querySelector('#clearResponseBtn');
  if (clearResponseBtn) {
    clearResponseBtn.addEventListener('click', () => {
      cbtEngine.clearResponse();
    });
  }

  const prevQuestionBtn = container.querySelector('#prevQuestionBtn');
  if (prevQuestionBtn) {
    prevQuestionBtn.addEventListener('click', () => {
      cbtEngine.previousQuestion();
    });
  }

  // Submit test triggers confirmation modal
  const submitExamBtn = container.querySelector('#submitExamBtn');
  const paletteSubmitBtn = container.querySelector('#paletteSubmitBtn');
  const submitModal = container.querySelector('#submitConfirmModal');

  function openSubmitConfirmation() {
    const counts = cbtEngine.getSummaryCounts();
    const statsGrid = container.querySelector('#summaryStatsGrid');
    if (statsGrid) {
      statsGrid.innerHTML = `
        <div class="summary-stat-box green">
          <span class="stat-number">${counts.answered}</span>
          <span class="stat-text">Answered</span>
        </div>
        <div class="summary-stat-box red">
          <span class="stat-number">${counts.notAnswered}</span>
          <span class="stat-text">Not Answered</span>
        </div>
        <div class="summary-stat-box purple">
          <span class="stat-number">${counts.markedForReview}</span>
          <span class="stat-text">Marked for Review</span>
        </div>
        <div class="summary-stat-box violet">
          <span class="stat-number">${counts.answeredAndMarked}</span>
          <span class="stat-text">Answered & Marked</span>
        </div>
        <div class="summary-stat-box gray">
          <span class="stat-number">${counts.notVisited}</span>
          <span class="stat-text">Not Visited</span>
        </div>
      `;
    }
    if (submitModal) submitModal.style.display = 'flex';
  }

  if (submitExamBtn) submitExamBtn.addEventListener('click', openSubmitConfirmation);
  if (paletteSubmitBtn) paletteSubmitBtn.addEventListener('click', openSubmitConfirmation);

  const cancelSubmitModalBtn = container.querySelector('#cancelSubmitModalBtn');
  if (cancelSubmitModalBtn) {
    cancelSubmitModalBtn.addEventListener('click', () => {
      if (submitModal) submitModal.style.display = 'none';
    });
  }

  const confirmFinalSubmitBtn = container.querySelector('#confirmFinalSubmitBtn');
  if (confirmFinalSubmitBtn) {
    confirmFinalSubmitBtn.addEventListener('click', () => {
      if (submitModal) submitModal.style.display = 'none';
      cbtEngine.submitTest(false);
    });
  }

  // Mobile Palette Toggle
  const toggleMobilePaletteBtn = container.querySelector('#toggleMobilePaletteBtn');
  const closeMobilePaletteBtn = container.querySelector('#closeMobilePaletteBtn');
  const palettePane = container.querySelector('#cbtPalettePane');

  if (toggleMobilePaletteBtn && palettePane) {
    toggleMobilePaletteBtn.addEventListener('click', () => {
      palettePane.classList.toggle('mobile-open');
    });
  }

  if (closeMobilePaletteBtn && palettePane) {
    closeMobilePaletteBtn.addEventListener('click', () => {
      palettePane.classList.remove('mobile-open');
    });
  }
}

/**
 * Format math expressions nicely
 */
function escapeAndFormatMath(text) {
  if (!text) return '';
  // Convert newlines to breaks
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
