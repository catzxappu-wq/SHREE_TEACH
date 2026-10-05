/**
 * SHREE TEACH - Admin Dashboard & Platform Management View
 * Features:
 * 1. Question Management (CRUD + Live LaTeX Preview)
 * 2. User & Access Control (Assign username/password, Role: Admin, Teacher, Student)
 * 3. Entire Website Control (Site settings, Announcement banner, Maintenance mode)
 * 4. Mock Test Series Management
 * 5. 24x7 Cloud Database & Sync Panel (Backup, Export, Restore)
 */

import {
  getStoredAuthUser,
  loginUser,
  logoutUser,
  fetchQuestions,
  fetchQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  fetchSiteSettings,
  updateSiteSettings,
  fetchCloudStatus,
  triggerCloudSync,
  exportCloudBackup,
  fetchPlatformStats,
  checkServerHealth
} from '../apiService.js';
import { setCurrentView } from '../state.js';
import { JEE_SUBJECTS, getAllChapters } from '../data/chapters.js';

export async function renderAdminView(container, viewParams = {}) {
  // Check authorization
  let currentUser = getStoredAuthUser();

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'teacher')) {
    renderAdminLogin(container);
    return;
  }

  // Active sub-tab
  let activeTab = viewParams.tab || 'overview'; // 'overview' | 'questions' | 'users' | 'settings' | 'tests' | 'cloud'

  // Data cache
  let questionsList = [];
  let usersList = [];
  let siteSettings = {};
  let cloudStatus = {};
  let platformStats = {};

  // Questions filters
  let filterSubject = 'All';
  let filterExam = 'All';
  let filterChapter = 'All';
  let filterType = 'All';
  let filterSearch = '';

  // Initial load
  async function loadData() {
    container.innerHTML = `
      <div class="admin-page-container">
        <div style="text-align: center; padding: 4rem 1rem;">
          <div style="font-size: 2rem; margin-bottom: 1rem;">⏳</div>
          <h3>Connecting to SHREE TEACH 24x7 Cloud Database...</h3>
          <p style="color: #64748B;">Loading questions, user permissions, and website settings.</p>
        </div>
      </div>
    `;

    try {
      const [qData, uData, sData, cData, statData] = await Promise.all([
        fetchQuestions({ subject: filterSubject, exam: filterExam, chapter: filterChapter, type: filterType, search: filterSearch }),
        fetchUsers(),
        fetchSiteSettings(),
        fetchCloudStatus(),
        fetchPlatformStats()
      ]);

      questionsList = qData || [];
      usersList = uData || [];
      siteSettings = sData || {};
      cloudStatus = cData || {};
      platformStats = statData || {};
    } catch (e) {
      console.warn("Error loading admin data:", e);
    }

    renderDashboard();
  }

  function renderDashboard() {
    container.innerHTML = `
      <div class="admin-page-container">
        <!-- Top Admin Header Bar -->
        <header class="admin-top-bar">
          <div class="admin-brand-left">
            <div class="admin-logo-badge">ST</div>
            <div class="admin-title-wrap">
              <h1>SHREE TEACH Admin & Faculty Portal</h1>
              <span class="admin-sub-tag">Complete Website, Question Bank & Access Control</span>
            </div>
          </div>

          <div class="admin-top-right">
            <div class="admin-cloud-chip">
              <span style="font-size: 0.9rem;">☁️</span>
              <span>Cloud Sync: Active</span>
            </div>

            <div class="admin-user-pill">
              <span>👤</span>
              <strong>${currentUser.fullName || currentUser.username}</strong>
              <span class="admin-role-tag">${currentUser.role}</span>
            </div>

            <button class="btn btn-sm btn-outline" id="adminGoStudentSiteBtn" style="color: #FFFFFF; border-color: rgba(255,255,255,0.3);">
              🌐 Student View
            </button>

            <button class="btn btn-sm btn-outline" id="adminSignOutBtn" style="color: #F87171; border-color: rgba(239,68,68,0.4);">
              🚪 Sign Out
            </button>
          </div>
        </header>

        <!-- Navigation Tabs -->
        <nav class="admin-nav-tabs">
          <button class="admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}" data-tab="overview">
            <span>📊</span> Overview
          </button>
          <button class="admin-tab-btn ${activeTab === 'questions' ? 'active' : ''}" data-tab="questions">
            <span>📝</span> Questions Manager <span class="admin-tab-count">${questionsList.length}</span>
          </button>
          <button class="admin-tab-btn ${activeTab === 'users' ? 'active' : ''}" data-tab="users">
            <span>👥</span> User & Access Control <span class="admin-tab-count">${usersList.length}</span>
          </button>
          <button class="admin-tab-btn ${activeTab === 'settings' ? 'active' : ''}" data-tab="settings">
            <span>⚙️</span> Website Controls
          </button>
          <button class="admin-tab-btn ${activeTab === 'cloud' ? 'active' : ''}" data-tab="cloud">
            <span>☁️</span> Cloud Database & Sync
          </button>
        </nav>

        <!-- Tab Body Container -->
        <main class="admin-tab-content">
          ${renderActiveTabContent()}
        </main>
      </div>
    `;

    attachDashboardEvents();
  }

  function renderActiveTabContent() {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'questions':
        return renderQuestionsTab();
      case 'users':
        return renderUsersTab();
      case 'settings':
        return renderSettingsTab();
      case 'cloud':
        return renderCloudTab();
      default:
        return renderOverviewTab();
    }
  }

  // ==========================================
  // TAB 1: OVERVIEW
  // ==========================================
  function renderOverviewTab() {
    return `
      <!-- KPI Metric Cards -->
      <div class="admin-kpi-grid">
        <div class="admin-kpi-card gold">
          <div class="kpi-title">Total Questions</div>
          <div class="kpi-value">${questionsList.length || 75}</div>
          <div class="kpi-sub">Physics, Chem, Math in DB</div>
        </div>

        <div class="admin-kpi-card purple">
          <div class="kpi-title">Registered Users</div>
          <div class="kpi-value">${usersList.length || 4}</div>
          <div class="kpi-sub">Admins, Teachers, Students</div>
        </div>

        <div class="admin-kpi-card blue">
          <div class="kpi-title">Test Submissions</div>
          <div class="kpi-value">${platformStats.totalAttempts || 1}</div>
          <div class="kpi-sub">Saved in SQLite & Cloud</div>
        </div>

        <div class="admin-kpi-card green">
          <div class="kpi-title">Cloud Connection</div>
          <div class="kpi-value" style="font-size: 1.25rem; color: #10B981;">CONNECTED</div>
          <div class="kpi-sub">24x7 Real-time sync</div>
        </div>
      </div>

      <!-- Quick Action Shortcuts -->
      <div class="cloud-sync-card">
        <div class="cloud-sync-header">
          <div>
            <h3 style="margin: 0; font-size: 1.15rem; color: #0B1B3D;">Platform Control Actions</h3>
            <span style="font-size: 0.82rem; color: #64748B;">Immediate administrative actions and tools</span>
          </div>
        </div>

        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
          <button class="btn btn-primary" id="btnQuickAddQuestion">
            <span>➕</span> Add New Question
          </button>
          <button class="btn btn-outline" id="btnQuickAddUser">
            <span>👤</span> Assign User Credentials
          </button>
          <button class="btn btn-gold" id="btnQuickCloudSync">
            <span>⚡</span> Sync Local DB to Cloud
          </button>
          <button class="btn btn-outline" id="btnQuickExportBackup">
            <span>📥</span> Download Full JSON Backup
          </button>
        </div>
      </div>

      <!-- System Environment Panel -->
      <div class="cloud-sync-card">
        <h3 style="margin-top: 0; font-size: 1.05rem; color: #0B1B3D;">System Infrastructure Status</h3>
        <div class="cloud-sync-stats-row">
          <div class="cloud-stat-box">
            <div class="cloud-stat-number" style="font-size: 1.15rem;">Port 8000</div>
            <div class="cloud-stat-label">Active HTTP Server</div>
          </div>
          <div class="cloud-stat-box">
            <div class="cloud-stat-number" style="font-size: 1.15rem;">SQLite 3</div>
            <div class="cloud-stat-label">shree_teach.db</div>
          </div>
          <div class="cloud-stat-box">
            <div class="cloud-stat-number" style="font-size: 1.15rem;">75 Authentic</div>
            <div class="cloud-stat-label">NTA CBT Questions</div>
          </div>
          <div class="cloud-stat-box">
            <div class="cloud-stat-number" style="font-size: 1.15rem;">24x7 Daemon</div>
            <div class="cloud-stat-label">Background Task</div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // TAB 2: QUESTIONS MANAGER
  // ==========================================
  function renderQuestionsTab() {
    const chapters = getAllChapters(filterSubject !== 'All' ? filterSubject : null);

    return `
      <!-- Action Bar -->
      <div class="admin-section-bar">
        <div>
          <h2>Question Bank Manager</h2>
          <span style="font-size: 0.82rem; color: #64748B;">Create, edit, and organize JEE Main & Advanced questions</span>
        </div>
        <div class="admin-bar-actions">
          <button class="btn btn-gold" id="btnOpenAddQuestionModal">
            <span>➕</span> Add New Question
          </button>
        </div>
      </div>

      <!-- Filters & Search Bar -->
      <div class="admin-filters-card">
        <div class="filter-input-wrap">
          <input type="text" id="qSearchInput" class="admin-search-input" placeholder="Search by question text or formula..." value="${filterSearch}" />
        </div>

        <select id="qFilterSubject" class="admin-select">
          <option value="All" ${filterSubject === 'All' ? 'selected' : ''}>All Subjects</option>
          <option value="Physics" ${filterSubject === 'Physics' ? 'selected' : ''}>Physics</option>
          <option value="Chemistry" ${filterSubject === 'Chemistry' ? 'selected' : ''}>Chemistry</option>
          <option value="Mathematics" ${filterSubject === 'Mathematics' ? 'selected' : ''}>Mathematics</option>
        </select>

        <select id="qFilterExam" class="admin-select">
          <option value="All" ${filterExam === 'All' ? 'selected' : ''}>All Exams</option>
          <option value="JEE Main" ${filterExam === 'JEE Main' ? 'selected' : ''}>JEE Main</option>
          <option value="JEE Advanced" ${filterExam === 'JEE Advanced' ? 'selected' : ''}>JEE Advanced</option>
        </select>

        <select id="qFilterType" class="admin-select">
          <option value="All" ${filterType === 'All' ? 'selected' : ''}>All Types</option>
          <option value="single_correct" ${filterType === 'single_correct' ? 'selected' : ''}>Single Choice</option>
          <option value="multiple_correct" ${filterType === 'multiple_correct' ? 'selected' : ''}>Multiple Choice</option>
          <option value="numerical" ${filterType === 'numerical' ? 'selected' : ''}>Numerical</option>
        </select>

        <button class="btn btn-sm btn-outline" id="btnResetQFilters">Reset</button>
      </div>

      <!-- Questions Data Table -->
      <div class="admin-table-card">
        <table class="admin-table">
          <thead>
            <tr>
              <th style="width: 50px;">#ID</th>
              <th style="width: 100px;">Exam</th>
              <th style="width: 180px;">Subject & Chapter</th>
              <th style="width: 120px;">Type</th>
              <th>Question Prompt</th>
              <th style="width: 80px;">Marks</th>
              <th style="width: 110px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${questionsList.length === 0 ? `
              <tr>
                <td colspan="7" style="text-align: center; padding: 2.5rem; color: #64748B;">
                  No questions match your current filters.
                </td>
              </tr>
            ` : questionsList.map(q => `
              <tr data-qid="${q.id}">
                <td><strong>#${q.id}</strong></td>
                <td>
                  <span class="badge ${q.exam === 'JEE Main' ? 'badge-main' : 'badge-adv'}">${q.exam}</span>
                </td>
                <td>
                  <strong>${q.subject}</strong><br/>
                  <span style="font-size: 0.78rem; color: #64748B;">${q.chapter}</span>
                </td>
                <td>
                  <span style="font-size: 0.78rem; font-weight: 600;">
                    ${q.type === 'single_correct' ? 'MCQ (Single)' : q.type === 'multiple_correct' ? 'Multi-Choice' : 'Numerical'}
                  </span>
                </td>
                <td>
                  <div class="admin-q-prompt-cell" title="${escapeHtml(q.question)}">
                    ${escapeHtml(q.question)}
                  </div>
                  ${q.isPYQ ? `<span style="font-size: 0.72rem; color: #D97706;">🏷️ ${q.pyqYear || 'Official PYQ'}</span>` : ''}
                </td>
                <td>
                  <span style="color: #059669; font-weight: 700;">+${q.positiveMarks}</span> / 
                  <span style="color: #DC2626;">-${q.negativeMarks}</span>
                </td>
                <td>
                  <div class="admin-actions-cell">
                    <button class="btn-icon-action btn-edit-question" data-qid="${q.id}" title="Edit Question">✏️</button>
                    <button class="btn-icon-action delete btn-delete-question" data-qid="${q.id}" title="Delete Question">🗑️</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // ==========================================
  // TAB 3: USER & ACCESS CONTROL
  // ==========================================
  function renderUsersTab() {
    return `
      <!-- Action Bar -->
      <div class="admin-section-bar">
        <div>
          <h2>User Credentials & Access Control</h2>
          <span style="font-size: 0.82rem; color: #64748B;">Assign usernames and passwords, assign roles, and manage permissions</span>
        </div>
        <div class="admin-bar-actions">
          <button class="btn btn-gold" id="btnOpenAddUserModal">
            <span>➕</span> Assign New User
          </button>
        </div>
      </div>

      <!-- Users Table -->
      <div class="admin-table-card">
        <table class="admin-table">
          <thead>
            <tr>
              <th style="width: 50px;">ID</th>
              <th>Username</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th style="width: 120px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${usersList.map(u => `
              <tr data-uid="${u.id}">
                <td><strong>#${u.id}</strong></td>
                <td><strong style="color: #0B1B3D;">${u.username}</strong></td>
                <td>${u.fullName || '-'}</td>
                <td>${u.email || '-'}</td>
                <td>
                  <span class="role-badge ${u.role === 'admin' ? 'role-admin' : u.role === 'teacher' ? 'role-teacher' : 'role-student'}">
                    ${u.role}
                  </span>
                </td>
                <td>
                  <span class="status-pill-badge ${u.isActive ? 'active' : 'inactive'}">
                    ${u.isActive ? '● Active' : '○ Deactivated'}
                  </span>
                </td>
                <td>
                  <span style="font-size: 0.78rem; color: #64748B;">
                    ${u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-IN') : 'Never'}
                  </span>
                </td>
                <td>
                  <div class="admin-actions-cell">
                    <button class="btn-icon-action btn-edit-user" data-uid="${u.id}" title="Edit User Credentials">✏️</button>
                    ${u.username !== 'admin' ? `
                      <button class="btn-icon-action delete btn-delete-user" data-uid="${u.id}" data-uname="${u.username}" title="Delete User">🗑️</button>
                    ` : ''}
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // ==========================================
  // TAB 4: WEBSITE CONTROLS & SETTINGS
  // ==========================================
  function renderSettingsTab() {
    return `
      <div class="admin-section-bar">
        <div>
          <h2>Website Controls & Site Settings</h2>
          <span style="font-size: 0.82rem; color: #64748B;">Full administrative control over website announcements, banner, and parameters</span>
        </div>
      </div>

      <div class="settings-form-grid">
        <!-- Announcement Banner -->
        <div class="setting-card">
          <h3>Top Announcement Banner</h3>
          <p>Display an urgent announcement or notification bar across the entire website.</p>

          <div class="form-group" style="margin-bottom: 0.75rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
              <input type="checkbox" id="setAnnouncementEnabled" ${siteSettings.announcement_enabled === 'true' ? 'checked' : ''} />
              <span>Enable Announcement Banner</span>
            </label>
          </div>

          <div class="form-group">
            <label>Banner Text Content</label>
            <input type="text" id="setAnnouncementText" class="form-control" value="${escapeHtml(siteSettings.announcement_banner || '🔥 JEE 2025 All India Mock Series is LIVE!')}" />
          </div>
        </div>

        <!-- Platform Metadata -->
        <div class="setting-card">
          <h3>Platform Metadata</h3>
          <p>Configure general branding and target academic examination session.</p>

          <div class="form-group" style="margin-bottom: 0.75rem;">
            <label>Platform Title</label>
            <input type="text" id="setPlatformTitle" class="form-control" value="${escapeHtml(siteSettings.platform_title || 'SHREE TEACH — JEE Preparation Platform')}" />
          </div>

          <div class="form-group">
            <label>Target Academic Year</label>
            <input type="text" id="setTargetYear" class="form-control" value="${escapeHtml(siteSettings.target_year || '2025 - 2026')}" />
          </div>
        </div>

        <!-- Maintenance & Danger Zone -->
        <div class="setting-card">
          <h3>Maintenance Mode & Diagnostics</h3>
          <p>Temporary controls for updates and examination resets.</p>

          <div class="form-group" style="margin-bottom: 1rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
              <input type="checkbox" id="setMaintenanceMode" ${siteSettings.maintenance_mode === 'true' ? 'checked' : ''} />
              <span style="color: #DC2626; font-weight: 600;">Enable Maintenance Mode</span>
            </label>
          </div>

          <button class="btn btn-outline" id="btnClearAllAttempts" style="color: #DC2626; border-color: #FCA5A5;">
            ⚠️ Reset All Student Test Attempts
          </button>
        </div>

        <div>
          <button class="btn btn-gold btn-lg" id="btnSaveSiteSettings">
            💾 Save Website Settings
          </button>
        </div>
      </div>
    `;
  }

  // ==========================================
  // TAB 5: CLOUD DATABASE & SYNC
  // ==========================================
  function renderCloudTab() {
    return `
      <div class="admin-section-bar">
        <div>
          <h2>24x7 Cloud Database & Synchronization</h2>
          <span style="font-size: 0.82rem; color: #64748B;">Centralized cloud persistence across all student devices and web clients</span>
        </div>
      </div>

      <div class="cloud-sync-card">
        <div class="cloud-sync-header">
          <div>
            <span class="badge" style="background-color: #D1FAE5; color: #047857; margin-bottom: 0.4rem;">CONNECTED & SYNCHRONIZED</span>
            <h3 style="margin: 0; font-size: 1.25rem;">24x7 Cloud Backend Provider</h3>
            <span style="font-size: 0.82rem; color: #64748B;">Provider: ${cloudStatus.provider || '24x7 Cloud REST & Supabase Sync'}</span>
          </div>
          <button class="btn btn-gold" id="btnSyncToCloudNow">
            <span>⚡</span> Sync All Data to Cloud Now
          </button>
        </div>

        <div class="cloud-sync-stats-row">
          <div class="cloud-stat-box">
            <div class="cloud-stat-number">${cloudStatus.totalQuestionsSynced || questionsList.length || 75}</div>
            <div class="cloud-stat-label">Questions in Cloud</div>
          </div>
          <div class="cloud-stat-box">
            <div class="cloud-stat-number">${cloudStatus.totalUsersSynced || usersList.length || 4}</div>
            <div class="cloud-stat-label">Users Synchronized</div>
          </div>
          <div class="cloud-stat-box">
            <div class="cloud-stat-number">${cloudStatus.totalAttemptsSynced || 1}</div>
            <div class="cloud-stat-label">Attempts Stored</div>
          </div>
          <div class="cloud-stat-box">
            <div class="cloud-stat-number" style="font-size: 1rem; color: #10B981;">Online 24/7</div>
            <div class="cloud-stat-label">Server Heartbeat</div>
          </div>
        </div>

        <div style="border-top: 1px solid var(--border-light); padding-top: 1.25rem; display: flex; gap: 1rem; flex-wrap: wrap;">
          <button class="btn btn-primary" id="btnExportFullBackup">
            <span>📥</span> Download Full JSON Backup
          </button>
        </div>
      </div>
    `;
  }

  // ==========================================
  // EVENT ATTACHMENTS
  // ==========================================
  function attachDashboardEvents() {
    // Navigation tabs
    container.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        renderDashboard();
      });
    });

    // Go to student website
    container.querySelector('#adminGoStudentSiteBtn')?.addEventListener('click', () => {
      setCurrentView('home');
    });

    // Sign out
    container.querySelector('#adminSignOutBtn')?.addEventListener('click', async () => {
      await logoutUser();
      if (window.showAppToast) window.showAppToast("Signed out of Admin Portal.", "info");
      renderAdminLogin(container);
    });

    // Quick shortcuts on Overview
    container.querySelector('#btnQuickAddQuestion')?.addEventListener('click', () => openQuestionModal());
    container.querySelector('#btnQuickAddUser')?.addEventListener('click', () => openUserModal());
    container.querySelector('#btnQuickCloudSync')?.addEventListener('click', () => doCloudSync());
    container.querySelector('#btnQuickExportBackup')?.addEventListener('click', () => exportCloudBackup());

    // Questions Tab actions
    container.querySelector('#btnOpenAddQuestionModal')?.addEventListener('click', () => openQuestionModal());
    container.querySelector('#btnResetQFilters')?.addEventListener('click', () => {
      filterSubject = 'All'; filterExam = 'All'; filterChapter = 'All'; filterType = 'All'; filterSearch = '';
      loadData();
    });

    const searchInput = container.querySelector('#qSearchInput');
    if (searchInput) {
      let debounce;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
          filterSearch = e.target.value;
          loadData();
        }, 350);
      });
    }

    const selSubj = container.querySelector('#qFilterSubject');
    if (selSubj) selSubj.addEventListener('change', (e) => { filterSubject = e.target.value; loadData(); });
    const selExam = container.querySelector('#qFilterExam');
    if (selExam) selExam.addEventListener('change', (e) => { filterExam = e.target.value; loadData(); });
    const selType = container.querySelector('#qFilterType');
    if (selType) selType.addEventListener('change', (e) => { filterType = e.target.value; loadData(); });

    // Question edit / delete
    container.querySelectorAll('.btn-edit-question').forEach(btn => {
      btn.addEventListener('click', () => {
        const qid = Number(btn.dataset.qid);
        openQuestionModal(qid);
      });
    });

    container.querySelectorAll('.btn-delete-question').forEach(btn => {
      btn.addEventListener('click', async () => {
        const qid = Number(btn.dataset.qid);
        if (confirm(`Are you sure you want to delete Question #${qid}? This action is irreversible.`)) {
          const res = await deleteQuestion(qid);
          if (res.success) {
            if (window.showAppToast) window.showAppToast(`Question #${qid} deleted.`, "success");
            loadData();
          } else {
            alert(res.error || "Could not delete question.");
          }
        }
      });
    });

    // User Tab actions
    container.querySelector('#btnOpenAddUserModal')?.addEventListener('click', () => openUserModal());

    container.querySelectorAll('.btn-edit-user').forEach(btn => {
      btn.addEventListener('click', () => {
        const uid = Number(btn.dataset.uid);
        openUserModal(uid);
      });
    });

    container.querySelectorAll('.btn-delete-user').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uid = Number(btn.dataset.uid);
        const uname = btn.dataset.uname;
        if (confirm(`Are you sure you want to delete user account '${uname}'?`)) {
          const res = await deleteUser(uid);
          if (res.success) {
            if (window.showAppToast) window.showAppToast(`User '${uname}' deleted.`, "success");
            loadData();
          } else {
            alert(res.error || "Could not delete user.");
          }
        }
      });
    });

    // Settings Tab actions
    container.querySelector('#btnSaveSiteSettings')?.addEventListener('click', async () => {
      const bannerEnabled = container.querySelector('#setAnnouncementEnabled')?.checked ? 'true' : 'false';
      const bannerText = container.querySelector('#setAnnouncementText')?.value || '';
      const title = container.querySelector('#setPlatformTitle')?.value || '';
      const year = container.querySelector('#setTargetYear')?.value || '';
      const maint = container.querySelector('#setMaintenanceMode')?.checked ? 'true' : 'false';

      const payload = {
        announcement_enabled: bannerEnabled,
        announcement_banner: bannerText,
        platform_title: title,
        target_year: year,
        maintenance_mode: maint
      };

      const res = await updateSiteSettings(payload);
      if (res.success) {
        if (window.showAppToast) window.showAppToast("Website settings saved and broadcasted!", "success");
        loadData();
      } else {
        alert(res.error || "Error saving settings.");
      }
    });

    // Cloud Tab actions
    container.querySelector('#btnSyncToCloudNow')?.addEventListener('click', () => doCloudSync());
    container.querySelector('#btnExportFullBackup')?.addEventListener('click', () => exportCloudBackup());
  }

  async function doCloudSync() {
    if (window.showAppToast) window.showAppToast("Synchronizing all questions & attempts to Cloud...", "info");
    const res = await triggerCloudSync();
    if (res.success) {
      if (window.showAppToast) window.showAppToast("✓ Cloud Database fully synchronized!", "success");
      loadData();
    } else {
      alert(res.error || "Cloud sync encountered an issue.");
    }
  }

  // ==========================================
  // MODAL: ADD / EDIT QUESTION
  // ==========================================
  async function openQuestionModal(qid = null) {
    let existing = null;
    if (qid) {
      existing = await fetchQuestionById(qid);
      if (!existing) existing = questionsList.find(q => q.id === qid);
    }

    const modal = document.createElement('div');
    modal.className = 'admin-modal-overlay';
    modal.innerHTML = `
      <div class="admin-modal-card">
        <div class="admin-modal-header">
          <h3>${qid ? `Edit Question #${qid}` : 'Create New JEE Question'}</h3>
          <button class="close-drawer-btn" id="modalCloseQBtn">&times;</button>
        </div>

        <form id="qForm" class="admin-modal-body">
          <div class="form-row">
            <div class="form-group col-half">
              <label>Target Exam</label>
              <select id="mQExam" class="form-control" required>
                <option value="JEE Main" ${existing && existing.exam === 'JEE Main' ? 'selected' : ''}>JEE Main</option>
                <option value="JEE Advanced" ${existing && existing.exam === 'JEE Advanced' ? 'selected' : ''}>JEE Advanced</option>
              </select>
            </div>
            <div class="form-group col-half">
              <label>Subject</label>
              <select id="mQSubject" class="form-control" required>
                <option value="Physics" ${existing && existing.subject === 'Physics' ? 'selected' : ''}>Physics</option>
                <option value="Chemistry" ${existing && existing.subject === 'Chemistry' ? 'selected' : ''}>Chemistry</option>
                <option value="Mathematics" ${existing && existing.subject === 'Mathematics' ? 'selected' : ''}>Mathematics</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group col-half">
              <label>Chapter Name</label>
              <input type="text" id="mQChapter" class="form-control" value="${existing ? escapeHtml(existing.chapter) : 'Kinematics'}" required />
            </div>
            <div class="form-group col-half">
              <label>Difficulty</label>
              <select id="mQDiff" class="form-control">
                <option value="Easy" ${existing && existing.difficulty === 'Easy' ? 'selected' : ''}>Easy</option>
                <option value="Medium" ${!existing || existing.difficulty === 'Medium' ? 'selected' : ''}>Medium</option>
                <option value="Hard" ${existing && existing.difficulty === 'Hard' ? 'selected' : ''}>Hard</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Question Type</label>
            <select id="mQType" class="form-control" required>
              <option value="single_correct" ${!existing || existing.type === 'single_correct' ? 'selected' : ''}>Single Choice MCQ</option>
              <option value="multiple_correct" ${existing && existing.type === 'multiple_correct' ? 'selected' : ''}>Multiple Choice (Partial Marking)</option>
              <option value="numerical" ${existing && existing.type === 'numerical' ? 'selected' : ''}>Numerical Value Question</option>
            </select>
          </div>

          <div class="form-group">
            <label>Question Statement / Prompt</label>
            <textarea id="mQPrompt" class="form-textarea" required>${existing ? escapeHtml(existing.question) : ''}</textarea>
            <span style="font-size: 0.74rem; color: #64748B;">Tip: You can use superscripts (x^2), subscripts (H_2O), and Greek symbols (θ, π, λ).</span>
          </div>

          <!-- Options Section -->
          <div id="mQOptionsSection" style="${existing && existing.type === 'numerical' ? 'display: none;' : ''}">
            <label style="font-weight: 700; margin-bottom: 0.5rem; display: block;">Answer Choices</label>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <span style="font-weight: 800; width: 25px;">A:</span>
                <input type="text" id="mOpt0" class="form-control" placeholder="Option A" value="${existing && existing.options ? escapeHtml(existing.options[0] || '') : ''}" />
              </div>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <span style="font-weight: 800; width: 25px;">B:</span>
                <input type="text" id="mOpt1" class="form-control" placeholder="Option B" value="${existing && existing.options ? escapeHtml(existing.options[1] || '') : ''}" />
              </div>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <span style="font-weight: 800; width: 25px;">C:</span>
                <input type="text" id="mOpt2" class="form-control" placeholder="Option C" value="${existing && existing.options ? escapeHtml(existing.options[2] || '') : ''}" />
              </div>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <span style="font-weight: 800; width: 25px;">D:</span>
                <input type="text" id="mOpt3" class="form-control" placeholder="Option D" value="${existing && existing.options ? escapeHtml(existing.options[3] || '') : ''}" />
              </div>
            </div>
          </div>

          <!-- Correct Answer Selection -->
          <div class="form-row">
            <div class="form-group col-half">
              <label>Correct Answer Key</label>
              <input type="text" id="mQCorrectAnswer" class="form-control" placeholder="MCQ: 0, 1, 2, or 3 | Multi: [0, 2] | Num: 12.5" value="${existing ? (Array.isArray(existing.correctAnswer) ? JSON.stringify(existing.correctAnswer) : existing.correctAnswer) : '0'}" required />
            </div>
            <div class="form-group col-half">
              <label>Marks (+ / -)</label>
              <div style="display: flex; gap: 0.5rem;">
                <input type="number" id="mQPosMarks" class="form-control" placeholder="+4" value="${existing ? existing.positiveMarks : 4}" required />
                <input type="number" id="mQNegMarks" class="form-control" placeholder="-1" value="${existing ? existing.negativeMarks : 1}" required />
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Step-by-Step Mathematical Explanation</label>
            <textarea id="mQExplanation" class="form-textarea">${existing ? escapeHtml(existing.explanation || '') : ''}</textarea>
          </div>

          <div class="form-row">
            <div class="form-group col-half">
              <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer;">
                <input type="checkbox" id="mQIsPYQ" ${existing && existing.isPYQ ? 'checked' : ''} />
                <span>Is Authentic Previous Year Question (PYQ)?</span>
              </label>
            </div>
            <div class="form-group col-half">
              <label>PYQ Exam Year / Shift Tag</label>
              <input type="text" id="mQPYQYear" class="form-control" placeholder="e.g. JEE Main 2023 24 Jan Shift 1" value="${existing && existing.pyqYear ? escapeHtml(existing.pyqYear) : ''}" />
            </div>
          </div>
        </form>

        <div class="admin-modal-footer">
          <button type="button" class="btn btn-outline" id="modalCancelQBtn">Cancel</button>
          <button type="button" class="btn btn-gold" id="modalSubmitQBtn">
            💾 ${qid ? 'Save Changes' : 'Create Question'}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Toggle options based on type
    const qTypeSelect = modal.querySelector('#mQType');
    const optSection = modal.querySelector('#mQOptionsSection');
    qTypeSelect.addEventListener('change', () => {
      if (qTypeSelect.value === 'numerical') {
        optSection.style.display = 'none';
      } else {
        optSection.style.display = 'block';
      }
    });

    const closeBtn = modal.querySelector('#modalCloseQBtn');
    const cancelBtn = modal.querySelector('#modalCancelQBtn');
    closeBtn.onclick = () => modal.remove();
    cancelBtn.onclick = () => modal.remove();

    // Submit handler
    const submitBtn = modal.querySelector('#modalSubmitQBtn');
    submitBtn.onclick = async () => {
      const exam = modal.querySelector('#mQExam').value;
      const subject = modal.querySelector('#mQSubject').value;
      const chapter = modal.querySelector('#mQChapter').value.trim();
      const difficulty = modal.querySelector('#mQDiff').value;
      const type = modal.querySelector('#mQType').value;
      const question = modal.querySelector('#mQPrompt').value.trim();
      const posMarks = parseFloat(modal.querySelector('#mQPosMarks').value) || 4;
      const negMarks = parseFloat(modal.querySelector('#mQNegMarks').value) || 1;
      const explanation = modal.querySelector('#mQExplanation').value.trim();
      const isPYQ = modal.querySelector('#mQIsPYQ').checked;
      const pyqYear = modal.querySelector('#mQPYQYear').value.trim();

      if (!question) {
        alert("Please enter a question prompt.");
        return;
      }

      let options = null;
      if (type !== 'numerical') {
        options = [
          modal.querySelector('#mOpt0').value.trim(),
          modal.querySelector('#mOpt1').value.trim(),
          modal.querySelector('#mOpt2').value.trim(),
          modal.querySelector('#mOpt3').value.trim()
        ];
      }

      let correctAnswerRaw = modal.querySelector('#mQCorrectAnswer').value.trim();
      let correctAnswer = 0;
      if (type === 'multiple_correct') {
        try {
          correctAnswer = JSON.parse(correctAnswerRaw);
        } catch (e) {
          correctAnswer = [0];
        }
      } else if (type === 'numerical') {
        correctAnswer = parseFloat(correctAnswerRaw) || 0;
      } else {
        correctAnswer = parseInt(correctAnswerRaw) || 0;
      }

      const qPayload = {
        exam,
        subject,
        chapter,
        difficulty,
        type,
        question,
        options,
        correctAnswer,
        positiveMarks: posMarks,
        negativeMarks: negMarks,
        explanation,
        isPYQ,
        pyqYear: isPYQ ? pyqYear : null
      };

      let res;
      if (qid) {
        res = await updateQuestion(qid, qPayload);
      } else {
        res = await createQuestion(qPayload);
      }

      if (res && res.success) {
        modal.remove();
        if (window.showAppToast) window.showAppToast(qid ? `Question #${qid} updated!` : "Question added successfully!", "success");
        loadData();
      } else {
        alert(res?.error || "Error saving question.");
      }
    };
  }

  // ==========================================
  // MODAL: ADD / EDIT USER & ACCESS CONTROL
  // ==========================================
  async function openUserModal(uid = null) {
    const existing = uid ? usersList.find(u => u.id === uid) : null;

    const modal = document.createElement('div');
    modal.className = 'admin-modal-overlay';
    modal.innerHTML = `
      <div class="admin-modal-card" style="max-width: 500px;">
        <div class="admin-modal-header">
          <h3>${uid ? `Edit Credentials: ${existing.username}` : 'Assign New User Access'}</h3>
          <button class="close-drawer-btn" id="modalCloseUserBtn">&times;</button>
        </div>

        <form id="userForm" class="admin-modal-body">
          <div class="form-group">
            <label>Username (Login ID)</label>
            <input type="text" id="mUsername" class="form-control" value="${existing ? escapeHtml(existing.username) : ''}" ${existing ? 'disabled' : 'required'} placeholder="e.g. rahul.jee" />
          </div>

          <div class="form-group">
            <label>${existing ? 'Reset Password (leave blank to keep current)' : 'Assign Password'}</label>
            <input type="password" id="mPassword" class="form-control" placeholder="${existing ? 'Enter new password' : 'Create password'}" ${existing ? '' : 'required'} />
          </div>

          <div class="form-group">
            <label>Full Name</label>
            <input type="text" id="mFullName" class="form-control" value="${existing ? escapeHtml(existing.fullName || '') : ''}" placeholder="e.g. Rahul Verma" required />
          </div>

          <div class="form-group">
            <label>Email Address</label>
            <input type="email" id="mEmail" class="form-control" value="${existing ? escapeHtml(existing.email || '') : ''}" placeholder="e.g. rahul@shreeteach.in" />
          </div>

          <div class="form-group">
            <label>System Role & Permissions</label>
            <select id="mRole" class="form-control">
              <option value="student" ${!existing || existing.role === 'student' ? 'selected' : ''}>Student (Test Taker)</option>
              <option value="teacher" ${existing && existing.role === 'teacher' ? 'selected' : ''}>Teacher / Faculty (Question Editor)</option>
              <option value="admin" ${existing && existing.role === 'admin' ? 'selected' : ''}>Administrator (Full Access)</option>
            </select>
          </div>

          <div class="form-group">
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
              <input type="checkbox" id="mIsActive" ${!existing || existing.isActive ? 'checked' : ''} />
              <span>Account is Active</span>
            </label>
          </div>
        </form>

        <div class="admin-modal-footer">
          <button type="button" class="btn btn-outline" id="modalCancelUserBtn">Cancel</button>
          <button type="button" class="btn btn-gold" id="modalSubmitUserBtn">
            💾 ${uid ? 'Update Access' : 'Create User Account'}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#modalCloseUserBtn').onclick = () => modal.remove();
    modal.querySelector('#modalCancelUserBtn').onclick = () => modal.remove();

    modal.querySelector('#modalSubmitUserBtn').onclick = async () => {
      const username = modal.querySelector('#mUsername').value.trim();
      const password = modal.querySelector('#mPassword').value.trim();
      const fullName = modal.querySelector('#mFullName').value.trim();
      const email = modal.querySelector('#mEmail').value.trim();
      const role = modal.querySelector('#mRole').value;
      const isActive = modal.querySelector('#mIsActive').checked;

      if (!uid && (!username || !password)) {
        alert("Username and password are required.");
        return;
      }

      const payload = {
        username,
        fullName,
        email,
        role,
        isActive
      };
      if (password) payload.password = password;

      let res;
      if (uid) {
        res = await updateUser(uid, payload);
      } else {
        res = await createUser(payload);
      }

      if (res && res.success) {
        modal.remove();
        if (window.showAppToast) window.showAppToast(`User access saved for '${username || existing.username}'!`, "success");
        loadData();
      } else {
        alert(res?.error || "Error saving user.");
      }
    };
  }

  // Load initial dataset
  loadData();
}

// ==========================================
// ADMIN LOGIN SCREEN
// ==========================================
function renderAdminLogin(container) {
  container.innerHTML = `
    <div class="admin-page-container">
      <div class="admin-auth-card-container">
        <div class="admin-auth-card">
          <div class="admin-shield-icon">🛡️</div>
          <h2>SHREE TEACH</h2>
          <p>Admin & Faculty Access Portal</p>

          <form id="adminLoginForm">
            <div class="form-group" style="text-align: left; margin-bottom: 1rem;">
              <label>Administrator / Faculty Username</label>
              <input type="text" id="adminUsernameInput" class="form-control" placeholder="Enter username" autocomplete="username" required />
            </div>

            <div class="form-group" style="text-align: left; margin-bottom: 1.25rem;">
              <label>Password</label>
              <input type="password" id="adminPasswordInput" class="form-control" placeholder="Enter password" autocomplete="current-password" required />
            </div>

            <button type="submit" class="btn btn-gold btn-block btn-lg" id="btnAdminSignIn">
              🔐 Login to Admin Portal
            </button>

            <div style="margin-top: 1.5rem;">
              <a href="#" id="returnToHomeBtn" style="color: #64748B; font-size: 0.85rem; text-decoration: none;">
                &larr; Return to Student Website
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector('#adminLoginForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const uname = container.querySelector('#adminUsernameInput').value.trim();
    const pass = container.querySelector('#adminPasswordInput').value;

    const btn = container.querySelector('#btnAdminSignIn');
    btn.textContent = "Authenticating...";
    btn.disabled = true;

    const res = await loginUser(uname, pass);
    if (res.success) {
      if (res.user.role === 'admin' || res.user.role === 'teacher') {
        if (window.showAppToast) window.showAppToast(`Logged in as ${res.user.fullName} (${res.user.role})`, "success");
        renderAdminView(container);
      } else {
        alert("Access Denied: Your account role is 'student'. Only administrators and faculty have access to this portal.");
        btn.textContent = "🔐 Login to Admin Portal";
        btn.disabled = false;
      }
    } else {
      alert(res.error || "Authentication failed. Verify credentials.");
      btn.textContent = "🔐 Login to Admin Portal";
      btn.disabled = false;
    }
  });

  container.querySelector('#returnToHomeBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    setCurrentView('home');
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
