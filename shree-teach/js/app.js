/**
 * SHREE TEACH - Main Application Controller & Router
 * Manages routing between views, header state, mobile drawer, toasts, and exam lifecycle.
 */

import { getState, subscribe, setCurrentView, logoutUser } from './state.js';
import { renderHomeView } from './views/homeView.js';
import { renderDashboardView } from './views/dashboardView.js';
import { renderCBTView } from './views/cbtView.js';
import { renderResultView } from './views/resultView.js';
import { renderPracticeView } from './views/practiceView.js';
import { renderPYQView } from './views/pyqView.js';
import { setupAuthModal, openAuthModal } from './views/authModal.js';
import { renderAdminView } from './views/adminView.js';
import { cbtEngine } from './cbtEngine.js';
import { PRECONFIGURED_TESTS } from './data/mockTests.js';
import { filterQuestions, getBalancedTestQuestions } from './data/questions.js';
import { checkServerHealth, syncAttemptsFromServer, fetchSiteSettings } from './apiService.js';

// Global Toast System
window.showAppToast = function(message, type = 'info') {
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `app-toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-indicator"></span>
    <span class="toast-msg">${message}</span>
    <button class="toast-close">&times;</button>
  `;

  toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 400);
  }, 4500);
};

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Auth Modal
  setupAuthModal();

  // Check 24x7 Server Connectivity & sync database
  checkServerHealth().then(() => {
    syncAttemptsFromServer();
  });

  // Load and display global site announcement banner
  fetchSiteSettings().then(settings => {
    if (settings && (settings.announcement_enabled === 'true' || settings.announcement_enabled === true)) {
      const banner = document.getElementById('globalAnnouncementBanner');
      if (banner) {
        banner.innerHTML = `
          <span>📢 <strong>Announcement:</strong> <span id="announcementText">${settings.announcement_text || 'Welcome to SHREE TEACH - JEE Exam Platform'}</span></span>
          <button class="banner-close" id="closeAnnouncementBtn" title="Dismiss announcement">&times;</button>
        `;
        banner.style.display = 'flex';
        banner.querySelector('#closeAnnouncementBtn')?.addEventListener('click', () => {
          banner.style.display = 'none';
        });
      }
    }
  }).catch(e => console.log('Site settings load deferred:', e));

  // Root view container
  const appRoot = document.getElementById('appViewRoot');
  const mainHeader = document.getElementById('mainHeader');
  const mainFooter = document.getElementById('mainFooter');

  function updateAppUI(state) {
    const view = state.currentView;
    const params = state.viewParams || {};

    // Update active nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      const targetView = link.dataset.view;
      if (targetView === view) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // In CBT Exam Mode: Hide standard platform header & footer for authentic CBT immersion
    if (view === 'cbt-exam') {
      if (mainHeader) mainHeader.style.display = 'none';
      if (mainFooter) mainFooter.style.display = 'none';
      document.body.classList.add('in-cbt-mode');
    } else {
      if (mainHeader) mainHeader.style.display = 'block';
      if (mainFooter) mainFooter.style.display = 'block';
      document.body.classList.remove('in-cbt-mode');
    }

    // Update user display in header
    updateHeaderUserStatus(state.user);

    // Render corresponding view
    switch (view) {
      case 'home':
        renderHomeView(appRoot);
        break;
      case 'mock-tests':
        renderDashboardView(appRoot, params);
        break;
      case 'practice':
        renderPracticeView(appRoot, params);
        break;
      case 'pyq':
        renderPYQView(appRoot, params);
        break;
      case 'cbt-exam':
        renderCBTView(appRoot);
        break;
      case 'results':
        renderResultView(appRoot, params);
        break;
      case 'performance':
        // Performance is part of dashboard view
        renderDashboardView(appRoot, params);
        break;
      case 'admin':
        renderAdminView(appRoot, params);
        break;
      default:
        renderHomeView(appRoot);
        break;
    }
  }

  function updateHeaderUserStatus(user) {
    const authContainer = document.getElementById('headerAuthArea');
    if (!authContainer) return;

    if (user && user.isLoggedIn) {
      authContainer.innerHTML = `
        <div class="user-profile-menu">
          <div class="user-chip" id="userMenuToggleBtn">
            <span class="user-avatar-circle">${user.name.charAt(0)}</span>
            <div class="user-chip-text">
              <span class="user-name">${user.name}</span>
              <span class="user-badge">${user.targetYear || '2025'}</span>
            </div>
            <span class="dropdown-chevron">▼</span>
          </div>

          <div class="user-dropdown-card" id="userDropdownCard" style="display: none;">
            <div class="dropdown-header">
              <strong>${user.name}</strong>
              <span>${user.email}</span>
            </div>
            <div class="dropdown-item" id="navMyDashboard">
              <span>📊</span> Student Dashboard
            </div>
            <div class="dropdown-item" id="navMyAttempts">
              <span>📋</span> Test History
            </div>
            ${(user.role === 'admin' || user.role === 'teacher') ? `
            <div class="dropdown-item" id="navAdminPortal" style="color: #FF6B00; font-weight: 600;">
              <span>⚙️</span> Admin Portal
            </div>
            ` : ''}
            <div class="dropdown-divider"></div>
            <div class="dropdown-item logout-item" id="userLogoutBtn">
              <span>🚪</span> Sign Out
            </div>
          </div>
        </div>
      `;

      // Profile dropdown toggle
      const toggleBtn = authContainer.querySelector('#userMenuToggleBtn');
      const dropdownCard = authContainer.querySelector('#userDropdownCard');
      if (toggleBtn && dropdownCard) {
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdownCard.style.display = dropdownCard.style.display === 'none' ? 'block' : 'none';
        });

        document.addEventListener('click', () => {
          dropdownCard.style.display = 'none';
        });
      }

      authContainer.querySelector('#navMyDashboard')?.addEventListener('click', () => {
        setCurrentView('mock-tests');
      });
      authContainer.querySelector('#navMyAttempts')?.addEventListener('click', () => {
        setCurrentView('mock-tests');
      });
      authContainer.querySelector('#navAdminPortal')?.addEventListener('click', () => {
        setCurrentView('admin');
      });
      authContainer.querySelector('#userLogoutBtn')?.addEventListener('click', () => {
        logoutUser();
        window.showAppToast('You have signed out.', 'info');
      });

    } else {
      authContainer.innerHTML = `
        <button class="btn btn-outline btn-sm" id="headerLoginBtn">
          Login / Register
        </button>
      `;
      authContainer.querySelector('#headerLoginBtn')?.addEventListener('click', () => {
        openAuthModal('login');
      });
    }
  }

  // Subscribe to state updates
  subscribe(updateAppUI);

  // Setup navigation click handlers
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = link.dataset.view;

      if (targetView === 'jee-main') {
        setCurrentView('mock-tests', { examFilter: 'JEE Main' });
      } else if (targetView === 'jee-advanced') {
        setCurrentView('mock-tests', { examFilter: 'JEE Advanced' });
      } else if (targetView === 'about') {
        setCurrentView('home');
        setTimeout(() => {
          const el = document.getElementById('about');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else if (targetView === 'performance') {
        setCurrentView('performance', { focus: 'performance' });
      } else {
        setCurrentView(targetView);
      }

      // Close mobile menu if open
      document.getElementById('mobileNavDrawer')?.classList.remove('open');
    });
  });

  // Start JEE Mock Test prominent header button
  const topStartMockBtn = document.getElementById('topStartMockBtn');
  if (topStartMockBtn) {
    topStartMockBtn.addEventListener('click', () => {
      const defaultTest = PRECONFIGURED_TESTS[0];
      const questions = getBalancedTestQuestions(defaultTest);
      cbtEngine.startTest(defaultTest, questions);
      setCurrentView('cbt-exam');
    });
  }

  // Mobile menu hamburger toggle
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const mobileDrawer = document.getElementById('mobileNavDrawer');
  const closeDrawer = document.getElementById('closeMobileNav');

  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      mobileDrawer.classList.add('open');
    });
  }
  if (closeDrawer && mobileDrawer) {
    closeDrawer.addEventListener('click', () => {
      mobileDrawer.classList.remove('open');
    });
  }

  // Logo click -> Home
  document.querySelectorAll('.nav-logo-group').forEach(logo => {
    logo.addEventListener('click', () => setCurrentView('home'));
  });

  // Initial render
  updateAppUI(getState());
});
