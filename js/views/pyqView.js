/**
 * SHREE TEACH - Previous Year Questions (PYQ) Explorer
 * Filter authentic past paper questions with verified answers, year tags, and detailed solutions.
 */

import { QUESTION_DATABASE } from '../data/questions.js';
import { getAllChapters } from '../data/chapters.js';

export function renderPYQView(container, viewParams = {}) {
  let selectedExam = viewParams.examFilter || 'All';
  let selectedSubject = viewParams.subjectFilter || 'All';
  let selectedChapter = 'All';
  let selectedDifficulty = 'All';

  // State to track which questions have solution revealed
  const revealedSolutions = new Set();

  function renderContent() {
    // Filter PYQs
    const pyqList = QUESTION_DATABASE.filter(q => {
      if (selectedExam !== 'All' && q.exam !== selectedExam) return false;
      if (selectedSubject !== 'All' && q.subject !== selectedSubject) return false;
      if (selectedChapter !== 'All' && q.chapter !== selectedChapter) return false;
      if (selectedDifficulty !== 'All' && q.difficulty !== selectedDifficulty) return false;
      return true;
    });

    const chapters = getAllChapters(selectedSubject !== 'All' ? selectedSubject : null);
    const letters = ['A', 'B', 'C', 'D'];

    container.innerHTML = `
      <div class="pyq-page">
        <!-- PYQ Header -->
        <div class="pyq-header-banner">
          <div class="pyq-header-text">
            <span class="pyq-badge">AUTHENTIC ARCHIVE</span>
            <h1>JEE Previous Year Questions (PYQs)</h1>
            <p>Direct practice of curated JEE Main & JEE Advanced questions with verified step-by-step solutions.</p>
          </div>
          <div class="pyq-count-badge">
            <strong>${pyqList.length}</strong> Questions Available
          </div>
        </div>

        <div class="pyq-disclaimer-callout">
          ℹ️ <strong>Authenticity Notice:</strong> All questions in this section are verified authentic previous year problems or official pattern benchmarks. Questions without an official shift tag are marked as curated JEE benchmark questions.
        </div>

        <!-- Filters Bar -->
        <div class="pyq-filters-card">
          <div class="filter-col">
            <label>Target Exam</label>
            <select id="pyqExamSelect" class="form-select">
              <option value="All" ${selectedExam === 'All' ? 'selected' : ''}>All Exams (Main & Advanced)</option>
              <option value="JEE Main" ${selectedExam === 'JEE Main' ? 'selected' : ''}>JEE Main</option>
              <option value="JEE Advanced" ${selectedExam === 'JEE Advanced' ? 'selected' : ''}>JEE Advanced</option>
            </select>
          </div>

          <div class="filter-col">
            <label>Subject</label>
            <select id="pyqSubjSelect" class="form-select">
              <option value="All" ${selectedSubject === 'All' ? 'selected' : ''}>All Subjects</option>
              <option value="Physics" ${selectedSubject === 'Physics' ? 'selected' : ''}>Physics</option>
              <option value="Chemistry" ${selectedSubject === 'Chemistry' ? 'selected' : ''}>Chemistry</option>
              <option value="Mathematics" ${selectedSubject === 'Mathematics' ? 'selected' : ''}>Mathematics</option>
            </select>
          </div>

          <div class="filter-col">
            <label>Chapter</label>
            <select id="pyqChapSelect" class="form-select">
              <option value="All">All Chapters</option>
              ${chapters.map(ch => `
                <option value="${ch.name}" ${selectedChapter === ch.name ? 'selected' : ''}>${ch.name}</option>
              `).join('')}
            </select>
          </div>

          <div class="filter-col">
            <label>Difficulty</label>
            <select id="pyqDiffSelect" class="form-select">
              <option value="All" ${selectedDifficulty === 'All' ? 'selected' : ''}>All Difficulties</option>
              <option value="Easy" ${selectedDifficulty === 'Easy' ? 'selected' : ''}>Easy</option>
              <option value="Medium" ${selectedDifficulty === 'Medium' ? 'selected' : ''}>Medium</option>
              <option value="Hard" ${selectedDifficulty === 'Hard' ? 'selected' : ''}>Hard</option>
            </select>
          </div>
        </div>

        <!-- Questions List -->
        <div class="pyq-questions-list">
          ${pyqList.length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon">📂</div>
              <h3>No Questions Match Selected Criteria</h3>
              <p>Try resetting the subject or chapter filter above to view more questions.</p>
            </div>
          ` : pyqList.map((q, idx) => {
            const isRevealed = revealedSolutions.has(q.id);

            let correctText = '';
            if (q.type === 'single_correct') {
              correctText = `Option ${letters[q.correctAnswer]} : ${q.options[q.correctAnswer]}`;
            } else if (q.type === 'multiple_correct') {
              correctText = q.correctAnswer.map(i => `Option ${letters[i]}`).join(', ');
            } else if (q.type === 'numerical') {
              correctText = `${q.correctAnswer} (Tolerance: ±${q.tolerance || 0.05})`;
            }

            return `
              <div class="pyq-question-card" data-qid="${q.id}">
                <div class="pyq-card-top">
                  <div class="pyq-meta-badges">
                    <span class="pyq-index-pill">#${idx + 1}</span>
                    <span class="badge ${q.exam === 'JEE Main' ? 'badge-main' : 'badge-adv'}">${q.exam}</span>
                    <span class="badge ${q.subject === 'Physics' ? 'badge-phy' : q.subject === 'Chemistry' ? 'badge-chem' : 'badge-math'}">${q.subject}</span>
                    <span class="pyq-chap-badge">${q.chapter}</span>
                    <span class="badge badge-diff ${q.difficulty.toLowerCase()}">${q.difficulty}</span>
                  </div>

                  <div class="pyq-provenance">
                    ${q.isPYQ ? `
                      <span class="tag-authentic">🏷️ ${q.pyqYear || 'Official JEE Paper'}</span>
                    ` : `
                      <span class="tag-sample">Curated JEE Practice Benchmark</span>
                    `}
                  </div>
                </div>

                <div class="pyq-prompt">
                  ${escapeMath(q.question)}
                </div>

                ${q.options ? `
                  <div class="pyq-options-grid">
                    ${q.options.map((opt, oIdx) => `
                      <div class="pyq-opt-item ${isRevealed && (Array.isArray(q.correctAnswer) ? q.correctAnswer.includes(oIdx) : q.correctAnswer === oIdx) ? 'opt-highlight-correct' : ''}">
                        <span class="opt-label">${letters[oIdx]}</span>
                        <span class="opt-content">${escapeMath(opt)}</span>
                      </div>
                    `).join('')}
                  </div>
                ` : `
                  <div class="pyq-numerical-box">
                    <span class="num-tag">Type: Integer / Decimal Numerical Question</span>
                  </div>
                `}

                <div class="pyq-action-row">
                  <button class="btn btn-sm btn-outline toggle-solution-btn" data-qid="${q.id}">
                    ${isRevealed ? 'Hide Solution ▲' : 'Show Answer & Solution ▼'}
                  </button>
                  <div class="pyq-marks-info">
                    Marking: +${q.positiveMarks} / -${q.negativeMarks}
                  </div>
                </div>

                ${isRevealed ? `
                  <div class="pyq-solution-reveal">
                    <div class="pyq-key-row">
                      <strong>Correct Answer Key:</strong> <span class="text-green">${correctText}</span>
                    </div>
                    <div class="pyq-solution-body">
                      <strong>Detailed Step-by-Step Solution:</strong>
                      <p>${escapeMath(q.explanation)}</p>
                    </div>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    // Dropdown filters
    const examSelect = container.querySelector('#pyqExamSelect');
    const subjSelect = container.querySelector('#pyqSubjSelect');
    const chapSelect = container.querySelector('#pyqChapSelect');
    const diffSelect = container.querySelector('#pyqDiffSelect');

    if (examSelect) examSelect.addEventListener('change', (e) => { selectedExam = e.target.value; renderContent(); });
    if (subjSelect) subjSelect.addEventListener('change', (e) => { selectedSubject = e.target.value; selectedChapter = 'All'; renderContent(); });
    if (chapSelect) chapSelect.addEventListener('change', (e) => { selectedChapter = e.target.value; renderContent(); });
    if (diffSelect) diffSelect.addEventListener('change', (e) => { selectedDifficulty = e.target.value; renderContent(); });

    // Toggle solution buttons
    container.querySelectorAll('.toggle-solution-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const qid = Number(btn.dataset.qid);
        if (revealedSolutions.has(qid)) {
          revealedSolutions.delete(qid);
        } else {
          revealedSolutions.add(qid);
        }
        renderContent();
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
