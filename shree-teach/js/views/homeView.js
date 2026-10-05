/**
 * SHREE TEACH - Homepage View
 * High-conversion academic landing page with Hero, Exam Selection, and Features.
 */

import { setCurrentView } from '../state.js';
import { cbtEngine } from '../cbtEngine.js';
import { PRECONFIGURED_TESTS } from '../data/mockTests.js';
import { filterQuestions, getBalancedTestQuestions } from '../data/questions.js';

export function renderHomeView(container) {
  container.innerHTML = `
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-dot"></span>
          <span>NTA CBT Exam Simulation 2025 - 2026</span>
        </div>
        <h1 class="hero-title">
          Master JEE with <span class="brand-highlight">SHREE TEACH</span>
        </h1>
        <p class="hero-subtitle">
          Practice with realistic JEE Main & JEE Advanced mock tests, analyze your performance, and improve your rank.
        </p>
        <div class="hero-actions">
          <button class="btn btn-primary btn-lg" id="heroStartTestBtn">
            <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/>
            </svg>
            Start JEE Mock Test
          </button>
          <button class="btn btn-outline btn-lg" id="heroPracticeBtn">
            <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
            </svg>
            Practice Questions
          </button>
        </div>
        <div class="hero-highlights">
          <div class="highlight-item">
            <span class="highlight-icon">⏱️</span>
            <div>
              <strong>Live CBT Timer</strong>
              <span>Real Exam Clock & Auto-submit</span>
            </div>
          </div>
          <div class="highlight-item">
            <span class="highlight-icon">📊</span>
            <div>
              <strong>Rank Simulator</strong>
              <span>Historical Percentile Estimates</span>
            </div>
          </div>
          <div class="highlight-item">
            <span class="highlight-icon">🎯</span>
            <div>
              <strong>Advanced Marking</strong>
              <span>Partial & Negative Evaluation</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Academic / Technology Themed Hero Illustration -->
      <div class="hero-visual">
        <div class="cbt-preview-card">
          <div class="preview-header">
            <div class="cbt-status-pill"><span class="live-pulse"></span> LIVE EXAM MODE</div>
            <div class="preview-clock">02:54:18</div>
          </div>
          <div class="preview-body">
            <div class="preview-subject-tabs">
              <span class="tab-chip active">Physics (25)</span>
              <span class="tab-chip">Chemistry (25)</span>
              <span class="tab-chip">Mathematics (25)</span>
            </div>
            <div class="preview-q-box">
              <div class="preview-q-num">Question 04 / 75 • Single Choice (+4, -1)</div>
              <div class="preview-q-text">A solid cylinder of mass M and radius R rolls without slipping down an inclined plane...</div>
              <div class="preview-options">
                <div class="preview-opt selected"><span class="opt-key">A</span> (1/3) tan θ</div>
                <div class="preview-opt"><span class="opt-key">B</span> (1/2) tan θ</div>
                <div class="preview-opt"><span class="opt-key">C</span> (2/3) tan θ</div>
                <div class="preview-opt"><span class="opt-key">D</span> tan θ</div>
              </div>
            </div>
          </div>
          <div class="preview-palette-strip">
            <span class="p-dot answered" title="Answered">1</span>
            <span class="p-dot answered" title="Answered">2</span>
            <span class="p-dot not-answered" title="Not Answered">3</span>
            <span class="p-dot current" title="Current">4</span>
            <span class="p-dot review" title="Marked for Review">5</span>
            <span class="p-dot not-visited" title="Not Visited">6</span>
            <span class="p-dot not-visited" title="Not Visited">7</span>
          </div>
          <div class="preview-floating-badge">
            <div class="badge-avatar">🏆</div>
            <div>
              <div class="badge-title">All India Mock Series</div>
              <div class="badge-sub">Simulating NTA CBT 2025</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- JEE Exam Selection Section -->
    <section class="section exam-selection-section" id="examSelection">
      <div class="section-header text-center">
        <span class="section-tag">CHOOSE YOUR PATH</span>
        <h2 class="section-title">Select Your JEE Target Examination</h2>
        <p class="section-subtitle">Dedicated test structures modeled directly after official exam formats.</p>
      </div>

      <div class="exam-cards-grid">
        <!-- JEE Main Card -->
        <div class="exam-card jee-main-card">
          <div class="exam-card-header">
            <div class="exam-badge main-badge">NTA FORMAT</div>
            <h3 class="exam-name">JEE Main 2025 - 2026</h3>
            <p class="exam-desc">75 Questions • 300 Marks • Single Choice & Numerical Value Questions</p>
          </div>
          <div class="exam-tracks">
            <div class="track-row" data-exam="JEE Main" data-type="full">
              <div class="track-icon">📋</div>
              <div class="track-info">
                <strong>Full Mock Tests</strong>
                <span>Comprehensive 3-hour tests covering complete syllabus</span>
              </div>
              <button class="track-btn">Attempt</button>
            </div>
            <div class="track-row" data-exam="JEE Main" data-type="Physics">
              <div class="track-icon" style="color: #3b82f6;">⚡</div>
              <div class="track-info">
                <strong>Physics Sectional</strong>
                <span>Mechanics, Electrodynamics, Modern Physics drills</span>
              </div>
              <button class="track-btn">Practice</button>
            </div>
            <div class="track-row" data-exam="JEE Main" data-type="Chemistry">
              <div class="track-icon" style="color: #10b981;">🧪</div>
              <div class="track-info">
                <strong>Chemistry Sectional</strong>
                <span>Physical, Organic, Inorganic NCERT-based drills</span>
              </div>
              <button class="track-btn">Practice</button>
            </div>
            <div class="track-row" data-exam="JEE Main" data-type="Mathematics">
              <div class="track-icon" style="color: #f59e0b;">📐</div>
              <div class="track-info">
                <strong>Mathematics Sectional</strong>
                <span>Calculus, Coordinate, Algebra & Vector tests</span>
              </div>
              <button class="track-btn">Practice</button>
            </div>
            <div class="track-row" data-exam="JEE Main" data-type="chapter">
              <div class="track-icon">📑</div>
              <div class="track-info">
                <strong>Chapter-wise Tests</strong>
                <span>Deep dive into high-weightage chapters</span>
              </div>
              <button class="track-btn">Explore</button>
            </div>
            <div class="track-row" data-exam="JEE Main" data-type="pyq">
              <div class="track-icon">🎯</div>
              <div class="track-info">
                <strong>Previous Year Questions (PYQs)</strong>
                <span>Authentic papers from 2020 - 2024 shifts</span>
              </div>
              <button class="track-btn">Solve</button>
            </div>
          </div>
        </div>

        <!-- JEE Advanced Card -->
        <div class="exam-card jee-advanced-card">
          <div class="exam-card-header">
            <div class="exam-badge adv-badge">IIT RIGOR</div>
            <h3 class="exam-name">JEE Advanced 2025 - 2026</h3>
            <p class="exam-desc">Multiple-Correct (Partial Marking) • Single-Choice • Numerical Non-Negative</p>
          </div>
          <div class="exam-tracks">
            <div class="track-row" data-exam="JEE Advanced" data-type="full">
              <div class="track-icon">🏛️</div>
              <div class="track-info">
                <strong>Full Paper 1 & 2 Mocks</strong>
                <span>Multi-concept problems with realistic partial marking</span>
              </div>
              <button class="track-btn">Attempt</button>
            </div>
            <div class="track-row" data-exam="JEE Advanced" data-type="Physics">
              <div class="track-icon" style="color: #3b82f6;">⚡</div>
              <div class="track-info">
                <strong>Advanced Physics</strong>
                <span>Challenging multi-correct & rotational electrodynamics</span>
              </div>
              <button class="track-btn">Practice</button>
            </div>
            <div class="track-row" data-exam="JEE Advanced" data-type="Chemistry">
              <div class="track-icon" style="color: #10b981;">🧪</div>
              <div class="track-info">
                <strong>Advanced Chemistry</strong>
                <span>Reaction mechanisms & complex equilibria</span>
              </div>
              <button class="track-btn">Practice</button>
            </div>
            <div class="track-row" data-exam="JEE Advanced" data-type="Mathematics">
              <div class="track-icon" style="color: #f59e0b;">📐</div>
              <div class="track-info">
                <strong>Advanced Mathematics</strong>
                <span>Rigorous calculus proofs, matrices & conics</span>
              </div>
              <button class="track-btn">Practice</button>
            </div>
            <div class="track-row" data-exam="JEE Advanced" data-type="chapter">
              <div class="track-icon">🔬</div>
              <div class="track-info">
                <strong>Advanced Chapter Drills</strong>
                <span>High-rigor multi-step problem sets</span>
              </div>
              <button class="track-btn">Explore</button>
            </div>
            <div class="track-row" data-exam="JEE Advanced" data-type="pyq">
              <div class="track-icon">📜</div>
              <div class="track-info">
                <strong>IIT JEE Advanced Archives</strong>
                <span>Curated authentic previous year problems</span>
              </div>
              <button class="track-btn">Solve</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Why SHREE TEACH Section -->
    <section class="section features-section">
      <div class="section-header text-center">
        <span class="section-tag">ENGINEERED FOR ASPIRANTS</span>
        <h2 class="section-title">Why Serious JEE Aspirants Choose SHREE TEACH</h2>
        <p class="section-subtitle">Beyond simple quizzes — an authentic computer-based testing ecosystem.</p>
      </div>

      <div class="features-grid">
        <div class="feature-box">
          <div class="feature-icon">🖥️</div>
          <h3>Authentic CBT Interface</h3>
          <p>Exact color-coded palette matching official NTA exam screens: Not Visited, Not Answered, Answered, and Marked for Review.</p>
        </div>
        <div class="feature-box">
          <div class="feature-icon">⚖️</div>
          <h3>Dynamic Marking Scheme</h3>
          <p>Configurable scoring per question: standard +4/-1, JEE Advanced partial marking (+1 per option, -2 penalty), and integer bounds.</p>
        </div>
        <div class="feature-box">
          <div class="feature-icon">📈</div>
          <h3>Rank & Percentile Simulator</h3>
          <p>Understand where your score stands with unofficial practice percentile estimates based on real historical score distributions.</p>
        </div>
        <div class="feature-box">
          <div class="feature-icon">💡</div>
          <h3>In-Depth Solutions & Concepts</h3>
          <p>Detailed step-by-step mathematical reasoning, shortcut tricks, and core conceptual takeaways for every single problem.</p>
        </div>
        <div class="feature-box">
          <div class="feature-icon">🎲</div>
          <h3>Custom Test Generator</h3>
          <p>Create your own targeted mock test on the fly: choose your chapters, difficulty level, duration, and question count.</p>
        </div>
        <div class="feature-box">
          <div class="feature-icon">🔍</div>
          <h3>Chapter-wise Diagnostics</h3>
          <p>Pinpoint exact weak areas in your preparation across 45+ chapters in Physics, Chemistry, and Mathematics.</p>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section class="section about-section" id="about">
      <div class="about-card">
        <div class="about-content">
          <span class="section-tag">ABOUT SHREE TEACH</span>
          <h2>Prepare Smart. Practice Hard. Crack JEE.</h2>
          <p>
            SHREE TEACH was created with a singular focus: to empower every JEE aspirant across India with realistic, high-quality test-taking practice without unnecessary noise or distractions.
          </p>
          <p>
            We bridge the gap between classroom coaching and final exam day. By combining authentic computer-based test conditions, rigorous question curation, and detailed diagnostic analytics, SHREE TEACH helps you master exam temperament and secure your seat in your dream IIT, NIT, or IIIT.
          </p>
          <div class="about-stats">
            <div class="stat-item">
              <span class="stat-number">100%</span>
              <span class="stat-label">CBT Realism</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">45+</span>
              <span class="stat-label">JEE Chapters</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">Instant</span>
              <span class="stat-label">Analytics & Solutions</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Quick CTA Banner -->
    <section class="cta-banner">
      <div class="cta-content">
        <h2>Ready to Test Your Real JEE Standing?</h2>
        <p>Take the JEE Main Full Mock Test #01 right now. Experience the real timer, question palette, and detailed score breakdown.</p>
        <button class="btn btn-gold btn-lg" id="ctaStartBtn">Start Full Mock Test Now</button>
      </div>
    </section>
  `;

  // Attach event handlers
  setupHomeEvents(container);
}

function setupHomeEvents(container) {
  // Hero Start Test -> Open first mock test or mock dashboard
  const heroStartBtn = container.querySelector('#heroStartTestBtn');
  if (heroStartBtn) {
    heroStartBtn.addEventListener('click', () => {
      // Start the primary full mock test directly with balanced questions
      const defaultTest = PRECONFIGURED_TESTS[0];
      const questions = getBalancedTestQuestions(defaultTest);
      cbtEngine.startTest(defaultTest, questions);
      setCurrentView('cbt-exam');
    });
  }

  // Hero Practice Questions -> Navigate to practice view
  const heroPracticeBtn = container.querySelector('#heroPracticeBtn');
  if (heroPracticeBtn) {
    heroPracticeBtn.addEventListener('click', () => {
      setCurrentView('practice');
    });
  }

  // CTA button -> Start mock test
  const ctaStartBtn = container.querySelector('#ctaStartBtn');
  if (ctaStartBtn) {
    ctaStartBtn.addEventListener('click', () => {
      const defaultTest = PRECONFIGURED_TESTS[0];
      const questions = getBalancedTestQuestions(defaultTest);
      cbtEngine.startTest(defaultTest, questions);
      setCurrentView('cbt-exam');
    });
  }

  // Exam Selection track clicks
  container.querySelectorAll('.track-row').forEach(row => {
    row.addEventListener('click', () => {
      const exam = row.dataset.exam;
      const type = row.dataset.type;

      if (type === 'full') {
        setCurrentView('mock-tests', { examFilter: exam, typeFilter: 'Full Test' });
      } else if (type === 'pyq') {
        setCurrentView('pyq', { examFilter: exam });
      } else if (type === 'chapter') {
        setCurrentView('mock-tests', { examFilter: exam, typeFilter: 'Chapter Test' });
      } else {
        // Physics, Chemistry, Mathematics
        setCurrentView('mock-tests', { examFilter: exam, subjectFilter: type });
      }
    });
  });
}
