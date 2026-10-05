/**
 * SHREE TEACH - Practice Mode & Random Mock Test Generator
 * Supports instant-feedback question drills and customized mock test generation.
 */

import { QUESTION_DATABASE, filterQuestions } from '../data/questions.js';
import { JEE_SUBJECTS, getAllChapters } from '../data/chapters.js';
import { evaluateQuestionScore } from '../markingScheme.js';
import { cbtEngine } from '../cbtEngine.js';
import { setCurrentView } from '../state.js';

export function renderPracticeView(container, viewParams = {}) {
  let activeTab = viewParams.openGenerator ? 'generator' : 'practice'; // 'practice' | 'generator'

  // Practice state
  let practiceSubject = viewParams.subject || 'All';
  let practiceChapter = viewParams.chapter || 'All';
  let practiceDifficulty = 'All';
  let practiceType = 'All';
  let currentQuestion = null;
  let hasEvaluated = false;
  let selectedOption = null;
  let evalResult = null;

  // Generator state
  let genExam = 'JEE Main';
  let genSubject = 'All';
  let genDifficulty = 'Mixed';
  let genCount = 15;
  let genDuration = 45;

  function loadRandomPracticeQuestion() {
    let pool = filterQuestions({
      subject: practiceSubject !== 'All' ? practiceSubject : undefined,
      chapter: practiceChapter !== 'All' ? practiceChapter : undefined,
      difficulty: practiceDifficulty !== 'All' ? practiceDifficulty : undefined,
      type: practiceType !== 'All' ? practiceType : undefined
    });

    if (pool.length === 0) {
      pool = QUESTION_DATABASE;
    }

    // Pick random question from pool
    const randIdx = Math.floor(Math.random() * pool.length);
    currentQuestion = pool[randIdx];
    hasEvaluated = false;
    selectedOption = null;
    evalResult = null;
  }

  // Load initial practice question
  loadRandomPracticeQuestion();

  function renderContent() {
    const chaptersList = getAllChapters(practiceSubject !== 'All' ? practiceSubject : null);

    container.innerHTML = `
      <div class="practice-page-container">
        <!-- Top Tab Switcher -->
        <div class="practice-tabs-header">
          <div class="practice-mode-pills">
            <button class="mode-pill ${activeTab === 'practice' ? 'active' : ''}" id="tabPracticeModeBtn">
              <span>🎯</span> Instant Practice Mode
            </button>
            <button class="mode-pill ${activeTab === 'generator' ? 'active' : ''}" id="tabGeneratorModeBtn">
              <span>⚙️</span> Custom Mock Generator
            </button>
          </div>
          <div class="practice-help-text">
            ${activeTab === 'practice' ? 'Select a topic and practice with immediate solutions and conceptual tips.' : 'Configure parameters to generate a custom-tailored test dynamically.'}
          </div>
        </div>

        ${activeTab === 'practice' ? renderPracticeModeUI(chaptersList) : renderGeneratorModeUI()}
      </div>
    `;

    attachEvents();
  }

  function renderPracticeModeUI(chaptersList) {
    if (!currentQuestion) {
      return `<div class="empty-state">No question found matching criteria.</div>`;
    }

    const letters = ['A', 'B', 'C', 'D'];

    return `
      <!-- Filters row for practice -->
      <div class="practice-filters-bar">
        <div class="p-filter-item">
          <label>Subject</label>
          <select id="pSubjectSelect" class="form-select">
            <option value="All" ${practiceSubject === 'All' ? 'selected' : ''}>All Subjects</option>
            <option value="Physics" ${practiceSubject === 'Physics' ? 'selected' : ''}>Physics</option>
            <option value="Chemistry" ${practiceSubject === 'Chemistry' ? 'selected' : ''}>Chemistry</option>
            <option value="Mathematics" ${practiceSubject === 'Mathematics' ? 'selected' : ''}>Mathematics</option>
          </select>
        </div>

        <div class="p-filter-item">
          <label>Chapter</label>
          <select id="pChapterSelect" class="form-select">
            <option value="All">All Chapters</option>
            ${chaptersList.map(ch => `
              <option value="${ch.name}" ${practiceChapter === ch.name ? 'selected' : ''}>${ch.name}</option>
            `).join('')}
          </select>
        </div>

        <div class="p-filter-item">
          <label>Difficulty</label>
          <select id="pDifficultySelect" class="form-select">
            <option value="All" ${practiceDifficulty === 'All' ? 'selected' : ''}>All Levels</option>
            <option value="Easy" ${practiceDifficulty === 'Easy' ? 'selected' : ''}>Easy</option>
            <option value="Medium" ${practiceDifficulty === 'Medium' ? 'selected' : ''}>Medium</option>
            <option value="Hard" ${practiceDifficulty === 'Hard' ? 'selected' : ''}>Hard</option>
          </select>
        </div>

        <div class="p-filter-item">
          <label>Question Type</label>
          <select id="pTypeSelect" class="form-select">
            <option value="All" ${practiceType === 'All' ? 'selected' : ''}>All Types</option>
            <option value="single_correct" ${practiceType === 'single_correct' ? 'selected' : ''}>Single Choice</option>
            <option value="multiple_correct" ${practiceType === 'multiple_correct' ? 'selected' : ''}>Multiple Choice</option>
            <option value="numerical" ${practiceType === 'numerical' ? 'selected' : ''}>Numerical</option>
          </select>
        </div>
      </div>

      <!-- Practice Question Card -->
      <div class="practice-question-card">
        <div class="practice-card-header">
          <div class="practice-meta">
            <span class="badge ${currentQuestion.subject === 'Physics' ? 'badge-phy' : currentQuestion.subject === 'Chemistry' ? 'badge-chem' : 'badge-math'}">
              ${currentQuestion.subject}
            </span>
            <span class="p-chapter-tag">${currentQuestion.chapter}</span>
            <span class="badge badge-diff ${currentQuestion.difficulty.toLowerCase()}">${currentQuestion.difficulty}</span>
            <span class="badge badge-category">${currentQuestion.exam}</span>
          </div>
          <div class="practice-marking-tag">
            +${currentQuestion.positiveMarks} / -${currentQuestion.negativeMarks} Marks
          </div>
        </div>

        <div class="practice-question-text">
          ${escapeMath(currentQuestion.question)}
        </div>

        <!-- Options / Input Area -->
        <div class="practice-input-area">
          ${currentQuestion.type === 'single_correct' ? `
            <div class="practice-options-list">
              ${currentQuestion.options.map((opt, idx) => {
                let optStateClass = '';
                if (hasEvaluated) {
                  if (idx === currentQuestion.correctAnswer) optStateClass = 'correct-opt';
                  else if (selectedOption === idx) optStateClass = 'wrong-opt';
                } else if (selectedOption === idx) {
                  optStateClass = 'active-opt';
                }

                return `
                  <button class="practice-opt-btn ${optStateClass}" data-optindex="${idx}" ${hasEvaluated ? 'disabled' : ''}>
                    <span class="p-opt-letter">${letters[idx]}</span>
                    <span class="p-opt-text">${escapeMath(opt)}</span>
                  </button>
                `;
              }).join('')}
            </div>
          ` : currentQuestion.type === 'multiple_correct' ? `
            <div class="practice-options-list">
              ${currentQuestion.options.map((opt, idx) => {
                const userSelections = Array.isArray(selectedOption) ? selectedOption : [];
                const isSelected = userSelections.includes(idx);
                let optStateClass = '';
                if (hasEvaluated) {
                  if (currentQuestion.correctAnswer.includes(idx)) optStateClass = 'correct-opt';
                  else if (isSelected) optStateClass = 'wrong-opt';
                } else if (isSelected) {
                  optStateClass = 'active-opt';
                }

                return `
                  <button class="practice-opt-btn ${optStateClass}" data-multiindex="${idx}" ${hasEvaluated ? 'disabled' : ''}>
                    <span class="p-opt-letter">[${letters[idx]}]</span>
                    <span class="p-opt-text">${escapeMath(opt)}</span>
                  </button>
                `;
              }).join('')}
            </div>
          ` : `
            <div class="practice-numerical-input">
              <label>Enter Numeric Answer:</label>
              <input type="text" id="pNumInput" class="form-control" placeholder="e.g. 10.5" value="${selectedOption || ''}" ${hasEvaluated ? 'disabled' : ''} />
            </div>
          `}
        </div>

        <!-- Practice Action Buttons -->
        <div class="practice-action-bar">
          ${!hasEvaluated ? `
            <button class="btn btn-primary" id="checkAnswerBtn">
              Check Answer & Solution
            </button>
          ` : `
            <button class="btn btn-gold" id="nextPracticeQBtn">
              Try Another Question &rarr;
            </button>
          `}
          <button class="btn btn-outline" id="skipQuestionBtn">
            Skip / Next Question
          </button>
        </div>

        <!-- Instant Solution Box (Revealed after check) -->
        ${hasEvaluated ? `
          <div class="practice-evaluation-box ${evalResult.isCorrect ? 'eval-success' : 'eval-failure'}">
            <div class="eval-result-header">
              <span class="eval-icon">${evalResult.isCorrect ? '✅' : '❌'}</span>
              <div>
                <strong>${evalResult.isCorrect ? 'Excellent! Correct Answer' : 'Incorrect Answer'}</strong>
                <p>Status: ${evalResult.statusText} (${evalResult.marksAwarded > 0 ? `+${evalResult.marksAwarded}` : evalResult.marksAwarded} Marks)</p>
              </div>
            </div>

            <div class="eval-solution-content">
              <h4>Detailed Step-by-Step Solution:</h4>
              <p>${escapeMath(currentQuestion.explanation)}</p>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  function renderGeneratorModeUI() {
    const chapters = getAllChapters(genSubject !== 'All' ? genSubject : null);

    return `
      <div class="generator-card">
        <div class="generator-header">
          <div class="gen-icon">⚙️</div>
          <div>
            <h2>Random Mock Test Generator</h2>
            <p>Generate a balanced, high-yield practice test dynamically tailored to your study goals.</p>
          </div>
        </div>

        <form id="generatorForm" class="generator-form">
          <div class="form-grid">
            <div class="form-group">
              <label>Target Examination</label>
              <select id="genExamSelect" class="form-select">
                <option value="JEE Main" ${genExam === 'JEE Main' ? 'selected' : ''}>JEE Main (300 Marks Pattern)</option>
                <option value="JEE Advanced" ${genExam === 'JEE Advanced' ? 'selected' : ''}>JEE Advanced (IIT Pattern)</option>
              </select>
            </div>

            <div class="form-group">
              <label>Subject Focus</label>
              <select id="genSubjSelect" class="form-select">
                <option value="All" ${genSubject === 'All' ? 'selected' : ''}>All Subjects (Full Syllabus)</option>
                <option value="Physics" ${genSubject === 'Physics' ? 'selected' : ''}>Physics Only</option>
                <option value="Chemistry" ${genSubject === 'Chemistry' ? 'selected' : ''}>Chemistry Only</option>
                <option value="Mathematics" ${genSubject === 'Mathematics' ? 'selected' : ''}>Mathematics Only</option>
              </select>
            </div>

            <div class="form-group">
              <label>Difficulty Distribution</label>
              <select id="genDiffSelect" class="form-select">
                <option value="Mixed">Mixed (Standard JEE Distribution)</option>
                <option value="Easy">Easy (Foundation / Speed Drill)</option>
                <option value="Medium">Medium (Balanced JEE Main)</option>
                <option value="Hard">Hard (Rank Decider / Advanced)</option>
              </select>
            </div>

            <div class="form-group">
              <label>Number of Questions</label>
              <select id="genCountSelect" class="form-select">
                <option value="10">10 Questions (Quick Quiz)</option>
                <option value="15" selected>15 Questions (Sprint Test)</option>
                <option value="25">25 Questions (Sectional Full Test)</option>
                <option value="30">30 Questions (Half-Length Mock)</option>
              </select>
            </div>

            <div class="form-group">
              <label>Test Duration</label>
              <select id="genDurationSelect" class="form-select">
                <option value="30">30 Minutes</option>
                <option value="45" selected>45 Minutes</option>
                <option value="60">60 Minutes</option>
                <option value="90">90 Minutes</option>
              </select>
            </div>

            <div class="form-group">
              <label>Specific Chapter (Optional)</label>
              <select id="genChapterSelect" class="form-select">
                <option value="All">All Chapters from Selected Subject</option>
                ${chapters.map(ch => `<option value="${ch.name}">${ch.name}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="generator-preview-box">
            <div class="gen-metric">
              <span class="lbl">Total Questions:</span>
              <strong id="genPreviewCount">15 Qs</strong>
            </div>
            <div class="gen-metric">
              <span class="lbl">Max Score:</span>
              <strong id="genPreviewMarks">60 Marks</strong>
            </div>
            <div class="gen-metric">
              <span class="lbl">Allocated Time:</span>
              <strong id="genPreviewTime">45 Mins</strong>
            </div>
            <div class="gen-metric">
              <span class="lbl">Scoring:</span>
              <strong>Configurable +4 / -1</strong>
            </div>
          </div>

          <div class="generator-actions">
            <button type="submit" class="btn btn-primary btn-lg" id="startCustomTestBtn">
              🚀 Generate & Launch Test in CBT Interface
            </button>
          </div>
        </form>
      </div>
    `;
  }

  function attachEvents() {
    // Mode switcher buttons
    const tabPracticeBtn = container.querySelector('#tabPracticeModeBtn');
    const tabGenBtn = container.querySelector('#tabGeneratorModeBtn');

    if (tabPracticeBtn) {
      tabPracticeBtn.addEventListener('click', () => {
        activeTab = 'practice';
        renderContent();
      });
    }

    if (tabGenBtn) {
      tabGenBtn.addEventListener('click', () => {
        activeTab = 'generator';
        renderContent();
      });
    }

    if (activeTab === 'practice') {
      // Filter dropdown changes
      const pSubj = container.querySelector('#pSubjectSelect');
      const pChap = container.querySelector('#pChapterSelect');
      const pDiff = container.querySelector('#pDifficultySelect');
      const pType = container.querySelector('#pTypeSelect');

      if (pSubj) {
        pSubj.addEventListener('change', (e) => {
          practiceSubject = e.target.value;
          practiceChapter = 'All';
          loadRandomPracticeQuestion();
          renderContent();
        });
      }
      if (pChap) {
        pChap.addEventListener('change', (e) => {
          practiceChapter = e.target.value;
          loadRandomPracticeQuestion();
          renderContent();
        });
      }
      if (pDiff) {
        pDiff.addEventListener('change', (e) => {
          practiceDifficulty = e.target.value;
          loadRandomPracticeQuestion();
          renderContent();
        });
      }
      if (pType) {
        pType.addEventListener('change', (e) => {
          practiceType = e.target.value;
          loadRandomPracticeQuestion();
          renderContent();
        });
      }

      // Single option click
      container.querySelectorAll('.practice-opt-btn[data-optindex]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (hasEvaluated) return;
          selectedOption = Number(btn.dataset.optindex);
          renderContent();
        });
      });

      // Multiple option click
      container.querySelectorAll('.practice-opt-btn[data-multiindex]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (hasEvaluated) return;
          const idx = Number(btn.dataset.multiindex);
          const currentList = Array.isArray(selectedOption) ? [...selectedOption] : [];
          const pos = currentList.indexOf(idx);
          if (pos > -1) currentList.splice(pos, 1);
          else currentList.push(idx);
          selectedOption = currentList;
          renderContent();
        });
      });

      // Numerical input change
      const pNumInput = container.querySelector('#pNumInput');
      if (pNumInput) {
        pNumInput.addEventListener('input', (e) => {
          selectedOption = e.target.value;
        });
      }

      // Check Answer Button
      const checkBtn = container.querySelector('#checkAnswerBtn');
      if (checkBtn) {
        checkBtn.addEventListener('click', () => {
          if (selectedOption === null || selectedOption === undefined || (Array.isArray(selectedOption) && selectedOption.length === 0)) {
            alert("Please select or enter an answer before checking.");
            return;
          }
          hasEvaluated = true;
          evalResult = evaluateQuestionScore(currentQuestion, selectedOption);
          renderContent();
        });
      }

      // Next / Try Another Question
      const nextBtn = container.querySelector('#nextPracticeQBtn');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          loadRandomPracticeQuestion();
          renderContent();
        });
      }

      const skipBtn = container.querySelector('#skipQuestionBtn');
      if (skipBtn) {
        skipBtn.addEventListener('click', () => {
          loadRandomPracticeQuestion();
          renderContent();
        });
      }
    } else {
      // Generator Form
      const form = container.querySelector('#generatorForm');
      const genSubjSelect = container.querySelector('#genSubjSelect');
      const genCountSelect = container.querySelector('#genCountSelect');
      const genDurationSelect = container.querySelector('#genDurationSelect');

      if (genSubjSelect) {
        genSubjSelect.addEventListener('change', (e) => {
          genSubject = e.target.value;
          renderContent();
        });
      }

      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();

          const examVal = container.querySelector('#genExamSelect').value;
          const subjVal = genSubjSelect.value;
          const diffVal = container.querySelector('#genDiffSelect').value;
          const countVal = Number(genCountSelect.value);
          const durVal = Number(genDurationSelect.value);
          const chapVal = container.querySelector('#genChapterSelect').value;

          // Build dynamic question pool
          let pool = filterQuestions({
            exam: examVal !== 'All' ? examVal : undefined,
            subject: subjVal !== 'All' ? subjVal : undefined,
            chapter: chapVal !== 'All' ? chapVal : undefined,
            difficulty: diffVal !== 'Mixed' ? diffVal : undefined
          });

          // Shuffle pool without repeating questions
          const shuffled = [...pool].sort(() => 0.5 - Math.random());
          let selectedQuestions = shuffled.slice(0, countVal);

          if (selectedQuestions.length === 0) {
            selectedQuestions = QUESTION_DATABASE.slice(0, countVal);
          }

          const customTestMeta = {
            id: 'custom_mock_' + Date.now(),
            name: `Custom ${examVal} Mock (${subjVal})`,
            exam: examVal,
            category: chapVal !== 'All' ? 'Chapter Test' : 'Full Test',
            subject: subjVal,
            difficulty: diffVal,
            durationMinutes: durVal,
            maxMarks: selectedQuestions.length * 4,
            questionCount: selectedQuestions.length,
            negativeMarkingText: '+4 / -1 configured'
          };

          cbtEngine.startTest(customTestMeta, selectedQuestions);
          setCurrentView('cbt-exam');
        });
      }
    }
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
    .replace(/([A-Za-z0-9]+)\^([0-9\/\-\+a-z]+)/g, '$1<sup>$2</sup>')
    .replace(/([A-Za-z]+)_([0-9a-zA-Z]+)/g, '$1<sub>$2</sub>');
}
