# SHREE TEACH — Modern JEE Main & JEE Advanced Preparation Platform

> **“Prepare Smart. Practice Hard. Crack JEE.”**

A dedicated, realistic computer-based examination (CBT) and diagnostic practice platform engineered specifically for students preparing for **JEE Main** and **JEE Advanced**.

---

## 🌟 Key Features

1. **Authentic JEE Computer-Based Test (CBT) Interface**:
   - Exact replica of the official exam screen with top test bar, candidate profile, and live countdown timer.
   - Multi-subject section tabs (Physics, Chemistry, Mathematics) with real-time answered count.
   - Comprehensive question palette with official color indicators:
     - ⚪ **Not Visited**
     - 🔴 **Not Answered**
     - 🟢 **Answered**
     - 🟣 **Marked for Review**
     - 🟣 **Answered & Marked for Review** (with green indicator badge)
     - 🔵 **Current Question** highlight
   - Supports **Single-Correct MCQs**, **Multiple-Correct Questions** (with partial marking tips), and **Numerical Value Questions** with an on-screen virtual keypad.
   - Automatic submission on time expiration and confirmation summary modal for manual submission.

2. **Configurable JEE Marking Scheme**:
   - Dynamic scoring per question type:
     - **Single Choice**: $+4$ for correct, $-1$ for incorrect, $0$ unattempted.
     - **Multiple Choice (JEE Advanced)**: $+4$ for all correct, partial marks ($+1$ per correct option if no incorrect option is selected), $-2$ penalty for wrong selection.
     - **Numerical**: $+4$ for correct (with configurable floating-point tolerance $\pm 0.05$), $0$ or $-1$ penalty.

3. **Complete JEE Syllabus Hierarchy**:
   - **Physics**: 16 chapters (Kinematics, Laws of Motion, Rotational Motion, Thermodynamics, Electrostatics, Optics, Modern Physics, etc.).
   - **Chemistry**: Divided into **Physical**, **Organic**, and **Inorganic** branches across 22 chapters.
   - **Mathematics**: 17 chapters (Calculus, Conics, Matrices & Determinants, Vectors, 3D Geometry, Probability, etc.).

4. **Detailed Post-Test Diagnostic Results**:
   - Overall score, accuracy, percentage, and circular score progress gauge.
   - Individual subject cards for Physics, Chemistry, and Mathematics.
   - **Visual Performance Charts**: Normalized subject score bars and accuracy metrics.
   - **Diagnostic Feedback**: Identifies strong and weak subjects, strong and weak chapters, and suggests prioritized chapters to practice next.
   - **Question-by-Question Solution Review**: Filter by All, Correct, Incorrect, or Unattempted with step-by-step mathematical reasoning.

5. **JEE Performance / Rank & Percentile Simulator**:
   - Provides an estimated percentile range and rank bracket based on mock test score and historical NTA/IIT curves.
   - Transparently labelled as an unofficial practice estimate for diagnostic guidance.

6. **Random Mock Test Generator**:
   - Dynamically builds custom practice tests based on Exam (JEE Main / Advanced), Subject focus, specific Chapter, Question count ($10$, $15$, $25$, $30$), and Duration ($30$, $45$, $60$, $90$ minutes) without repeating questions.

7. **Instant Practice Mode**:
   - Topic-wise question drills with immediate answer verification, correctness feedback, and complete mathematical derivations.

8. **Previous Year Questions (PYQ) Archive**:
   - Filter authentic JEE questions by Exam, Year, Subject, Chapter, and Difficulty.
   - Clearly distinguishes verified authentic PYQs from curated practice benchmark problems.

9. **Student Dashboard & Authentication**:
   - Quick metrics: Tests Attempted, Average Score, Best Score, Overall Accuracy, and Practice Streak (🔥 6 Days).
   - Recent test attempts table with instant scorecard access.
   - Simulated local storage for user profile, authentication, and test history.

10. **Responsive Design**:
    - Optimized for mobile phones, tablets, laptops, and desktop monitors.
    - Slide-over question palette drawer on smaller screens with sticky countdown clock.

---

---

## 🚀 Running the 24x7 Examination Server

The platform runs continuously via a multi-threaded Python server with SQLite database persistence:
```bash
# Served at:
http://localhost:8000
```

### Options to Run the Server:

1. **Option A: Quick Double-Click (Recommended on Windows)**:
   Double-click `start-server.bat` in the project directory.

2. **Option B: PowerShell Launcher**:
   ```powershell
   cd C:\Users\shrin\.gemini\antigravity\scratch\shree-teach
   .\start-server.ps1
   ```

3. **Option C: Run Silently in Background (24x7 Hidden)**:
   Double-click `start-hidden.vbs`. The server runs quietly in the background without keeping a terminal window open.

4. **Option D: Auto-Start on Windows Boot (True 24x7)**:
   Double-click `install-startup.bat`. This automatically registers the server into your Windows Startup directory so it is always active every time Windows boots.

### REST API Endpoints:
- `GET  /api/health` — 24x7 Server heartbeat, uptime, active port & database status
- `GET  /api/attempts` — Retrieve all completed mock test records from SQLite
- `POST /api/attempts` — Persistently save test results and diagnostic stats
- `GET  /api/user` — Student profile and practice streak
- `POST /api/user` — Update student profile
- `GET  /api/stats` — Platform-wide performance metrics

---

## 📁 Project Architecture

```
shree-teach/
├── index.html                 # App shell, navigation header, mobile drawer, and footer
├── server.py                  # 24x7 Multi-threaded Python HTTP Server & REST API
├── shree_teach.db             # Persistent SQLite database for student test attempts
├── start-server.bat           # Double-click Windows batch launcher
├── start-server.ps1           # PowerShell interactive runner
├── start-hidden.vbs           # Silent background runner for 24x7 active duty
├── install-startup.bat        # Windows Startup installer for boot persistence
├── css/
│   ├── main.css              # Brand colors, typography, buttons, header, toast, server badge
│   ├── landing.css           # Hero section, academic preview card, exam cards, features
│   ├── dashboard.css         # Student stats, test filter pills, mock test cards, recent attempts
│   ├── cbt-exam.css          # Authentic JEE CBT exam screen, palette, keypad, timer, modals
│   ├── results.css           # Post-test report, score SVG, rank simulator, solution reviews
│   ├── practice.css          # Practice mode & custom test generator form
│   └── modals.css            # Student login/register dialog & local storage badges
├── js/
│   ├── data/
│   │   ├── chapters.js       # Complete chapter syllabus hierarchy (45+ chapters)
│   │   ├── questions.js      # 75 authentic JEE questions (Physics, Chemistry, Maths)
│   │   └── mockTests.js      # Pre-configured full mocks, sectional tests, and PYQs
│   ├── apiService.js         # 24x7 server synchronization client module
│   ├── state.js              # Central application store (user, session, attempts, streak)
│   ├── cbtEngine.js          # CBT examination engine (timer, palette, auto-submit)
│   ├── markingScheme.js      # Configurable JEE scoring engine with partial marking
│   ├── analytics.js          # Diagnostics, weak/strong chapters, percentile simulator
│   ├── views/
│   │   ├── homeView.js       # Homepage, hero, target exam picker
│   │   ├── dashboardView.js  # Mock test series directory with multi-filters
│   │   ├── cbtView.js        # CBT examination view with question palette
│   │   ├── resultView.js     # Detailed scorecard and question solutions review
│   │   ├── practiceView.js   # Practice mode & custom mock generator
│   │   ├── pyqView.js        # PYQ explorer with filters and reveal solutions
│   │   └── authModal.js      # Simulated authentication modal
│   └── app.js                # App bootstrap, view router, and event listeners
└── README.md
```
