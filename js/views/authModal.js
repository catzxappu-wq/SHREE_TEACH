/**
 * SHREE TEACH - Student Authentication Modal (Simulation)
 * Provides attractive Login and Registration UI with honest client-side storage simulation.
 */

import { getState, setUser, logoutUser } from '../state.js';

export function setupAuthModal() {
  const existingModal = document.getElementById('authModalRoot');
  if (existingModal) existingModal.remove();

  const modalHtml = `
    <div class="modal-overlay auth-modal-overlay" id="authModalRoot" style="display: none;">
      <div class="auth-modal-card">
        <button class="modal-close-btn" id="closeAuthModalBtn">&times;</button>

        <div class="auth-card-header">
          <div class="auth-brand-logo">ST</div>
          <h2>SHREE TEACH</h2>
          <p class="auth-tagline">“Prepare Smart. Practice Hard. Crack JEE.”</p>
        </div>

        <div class="auth-tabs">
          <button class="auth-tab-btn active" id="authTabLogin">Student Login</button>
          <button class="auth-tab-btn" id="authTabRegister">New Registration</button>
        </div>

        <div class="auth-notice-pill">
          🔒 <strong>Browser Simulation Mode:</strong> Authenticates instantly and saves your test attempts in your browser storage.
        </div>

        <!-- Login Form -->
        <form id="authLoginForm" class="auth-form">
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" id="loginEmail" class="form-control" placeholder="e.g. student@shreeteach.in" value="aman.jee@shreeteach.in" required />
          </div>

          <div class="form-group">
            <label>Password</label>
            <input type="password" id="loginPassword" class="form-control" placeholder="Enter password" value="password123" required />
          </div>

          <div class="form-row-actions">
            <label class="remember-label">
              <input type="checkbox" checked /> Remember session
            </label>
            <a href="#" class="forgot-link" onclick="event.preventDefault(); alert('Demo Mode: Any password works for simulation.');">Forgot password?</a>
          </div>

          <button type="submit" class="btn btn-primary btn-block btn-lg">
            Login to Dashboard
          </button>

          <div class="auth-demo-helper">
            <button type="button" class="btn-demo-quick" id="quickDemoLoginBtn">
              ⚡ Quick Fill: Aman Sharma (JEE 2025 Aspirant)
            </button>
          </div>
        </form>

        <!-- Register Form -->
        <form id="authRegisterForm" class="auth-form" style="display: none;">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" id="regName" class="form-control" placeholder="e.g. Priya Patel" required />
          </div>

          <div class="form-group">
            <label>Email Address</label>
            <input type="email" id="regEmail" class="form-control" placeholder="e.g. priya.jee@gmail.com" required />
          </div>

          <div class="form-group">
            <label>Mobile Number</label>
            <input type="tel" id="regMobile" class="form-control" placeholder="+91 98765 43210" required />
          </div>

          <div class="form-group">
            <label>Password</label>
            <input type="password" id="regPassword" class="form-control" placeholder="Create a password" required />
          </div>

          <div class="form-row">
            <div class="form-group col-half">
              <label>Target Exam</label>
              <select id="regTargetExam" class="form-select">
                <option value="JEE Main & Advanced 2025">JEE Main & Adv 2025</option>
                <option value="JEE Main 2025">JEE Main 2025 Only</option>
                <option value="JEE Main & Advanced 2026">JEE Main & Adv 2026</option>
              </select>
            </div>

            <div class="form-group col-half">
              <label>Target Year</label>
              <select id="regTargetYear" class="form-select">
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-block btn-lg">
            Complete Registration
          </button>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  attachAuthEvents();
}

function attachAuthEvents() {
  const modalRoot = document.getElementById('authModalRoot');
  const closeBtn = document.getElementById('closeAuthModalBtn');
  const tabLogin = document.getElementById('authTabLogin');
  const tabRegister = document.getElementById('authTabRegister');
  const formLogin = document.getElementById('authLoginForm');
  const formRegister = document.getElementById('authRegisterForm');

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modalRoot.style.display = 'none';
    });
  }

  // Click outside to close
  modalRoot?.addEventListener('click', (e) => {
    if (e.target === modalRoot) modalRoot.style.display = 'none';
  });

  // Tab switching
  if (tabLogin && tabRegister) {
    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      formLogin.style.display = 'block';
      formRegister.style.display = 'none';
    });

    tabRegister.addEventListener('click', () => {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      formRegister.style.display = 'block';
      formLogin.style.display = 'none';
    });
  }

  // Quick Demo Login
  const quickBtn = document.getElementById('quickDemoLoginBtn');
  if (quickBtn) {
    quickBtn.addEventListener('click', () => {
      setUser({
        name: "Aman Sharma",
        email: "aman.jee@shreeteach.in",
        mobile: "+91 98765 43210",
        targetExam: "JEE Main & Advanced 2025",
        targetYear: "2025"
      });
      modalRoot.style.display = 'none';
      if (window.showAppToast) window.showAppToast('Welcome back, Aman Sharma! Logged in successfully.', 'success');
    });
  }

  // Submit Login
  if (formLogin) {
    formLogin.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const name = email.split('@')[0].replace('.', ' ').toUpperCase();
      setUser({
        name: name || "Student",
        email: email,
        mobile: "+91 98765 43210",
        targetExam: "JEE Main & Advanced 2025",
        targetYear: "2025"
      });
      modalRoot.style.display = 'none';
      if (window.showAppToast) window.showAppToast(`Logged in successfully as ${name}`, 'success');
    });
  }

  // Submit Registration
  if (formRegister) {
    formRegister.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('regName').value;
      const email = document.getElementById('regEmail').value;
      const mobile = document.getElementById('regMobile').value;
      const targetExam = document.getElementById('regTargetExam').value;
      const targetYear = document.getElementById('regTargetYear').value;

      setUser({
        name,
        email,
        mobile,
        targetExam,
        targetYear
      });

      modalRoot.style.display = 'none';
      if (window.showAppToast) window.showAppToast(`Welcome to SHREE TEACH, ${name}! Your JEE journey begins.`, 'success');
    });
  }
}

export function openAuthModal(initialTab = 'login') {
  const modalRoot = document.getElementById('authModalRoot');
  if (!modalRoot) return;

  const tabLogin = document.getElementById('authTabLogin');
  const tabRegister = document.getElementById('authTabRegister');
  const formLogin = document.getElementById('authLoginForm');
  const formRegister = document.getElementById('authRegisterForm');

  if (initialTab === 'register') {
    tabRegister?.click();
  } else {
    tabLogin?.click();
  }

  modalRoot.style.display = 'flex';
}
