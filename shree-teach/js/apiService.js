/**
 * SHREE TEACH - 24x7 Server API & Admin Cloud Synchronization Service
 * Complete client interface for Question Management, User Access Control,
 * Site Configuration, and Cloud Data Synchronization.
 */

import { getState, saveCompletedAttempt, setUser } from './state.js';

let isServerOnline = false;
let serverInfo = null;

// Auth Session Storage key
const AUTH_TOKEN_KEY = 'shree_teach_auth_token';
const AUTH_USER_KEY = 'shree_teach_auth_user';

export function getIsServerOnline() {
  return isServerOnline;
}

export function getServerInfo() {
  return serverInfo;
}

export function getStoredAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) || '';
}

export function getStoredAuthUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setStoredAuth(token, user) {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  else localStorage.removeItem(AUTH_TOKEN_KEY);

  if (user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(AUTH_USER_KEY);
}

function getAuthHeaders() {
  const token = getStoredAuthToken();
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Pings 24x7 Server Health Endpoint
 */
export async function checkServerHealth() {
  try {
    const response = await fetch('/api/health', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      isServerOnline = true;
      serverInfo = data;
      updateServerStatusBadge(true, data);
      return { online: true, data };
    }
  } catch (err) {
    isServerOnline = false;
    serverInfo = null;
    updateServerStatusBadge(false);
  }

  return { online: false };
}

/**
 * Updates UI server status badge in header
 */
function updateServerStatusBadge(online, data = {}) {
  let badge = document.getElementById('serverStatusBadge');
  if (!badge) {
    const headerActions = document.querySelector('.header-actions');
    if (headerActions) {
      badge = document.createElement('div');
      badge.id = 'serverStatusBadge';
      badge.className = 'server-status-chip';
      headerActions.prepend(badge);
    }
  }

  if (badge) {
    if (online) {
      badge.className = 'server-status-chip online';
      badge.innerHTML = `
        <span class="status-pulse-dot"></span>
        <span class="status-text">Cloud & 24x7 Server Active</span>
        <span class="status-port-pill">:${data.port || '8000'}</span>
      `;
      badge.title = `Connected to SHREE TEACH Cloud Database (Uptime: ${data.uptime_formatted || 'Active'}, Questions: ${data.total_questions || 75})`;
    } else {
      badge.className = 'server-status-chip offline';
      badge.innerHTML = `
        <span class="status-offline-dot"></span>
        <span class="status-text">Offline / Local Mode</span>
      `;
      badge.title = 'Running in standalone browser mode. Start server.py for 24x7 cloud persistence.';
    }
  }
}

// ==========================================
// ADMIN AUTHENTICATION
// ==========================================

export async function loginUser(username, password) {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success && data.token) {
      setStoredAuth(data.token, data.user);
      return { success: true, user: data.user, token: data.token };
    }
    return { success: false, error: data.error || 'Authentication failed' };
  } catch (e) {
    return { success: false, error: 'Network error connecting to authentication server.' };
  }
}

export async function logoutUser() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: getAuthHeaders()
    });
  } catch (e) {}
  setStoredAuth('', null);
}

export async function fetchCurrentUser() {
  try {
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        setStoredAuth(getStoredAuthToken(), data.user);
        return data.user;
      }
    }
  } catch (e) {}
  return getStoredAuthUser();
}

// ==========================================
// QUESTION MANAGEMENT (CRUD)
// ==========================================

export async function fetchQuestions(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.subject && params.subject !== 'All') query.append('subject', params.subject);
    if (params.exam && params.exam !== 'All') query.append('exam', params.exam);
    if (params.chapter && params.chapter !== 'All') query.append('chapter', params.chapter);
    if (params.difficulty && params.difficulty !== 'All') query.append('difficulty', params.difficulty);
    if (params.type && params.type !== 'All') query.append('type', params.type);
    if (params.search) query.append('search', params.search);

    const url = `/api/questions${query.toString() ? '?' + query.toString() : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (res.ok) {
      const data = await res.json();
      return data.questions || [];
    }
  } catch (e) {
    console.warn("Failed to fetch questions from server:", e);
  }
  return null;
}

export async function fetchQuestionById(qid) {
  try {
    const res = await fetch(`/api/questions/${qid}`, { headers: getAuthHeaders() });
    if (res.ok) {
      const data = await res.json();
      return data.question;
    }
  } catch (e) {}
  return null;
}

export async function createQuestion(questionData) {
  try {
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(questionData)
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function updateQuestion(qid, questionData) {
  try {
    const res = await fetch(`/api/questions/${qid}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(questionData)
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function deleteQuestion(qid) {
  try {
    const res = await fetch(`/api/questions/${qid}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ==========================================
// USER & ACCESS CONTROL (ADMIN)
// ==========================================

export async function fetchUsers() {
  try {
    const res = await fetch('/api/users', { headers: getAuthHeaders() });
    if (res.ok) {
      const data = await res.json();
      return data.users || [];
    }
  } catch (e) {
    console.warn("Failed to fetch users:", e);
  }
  return [];
}

export async function createUser(userData) {
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function updateUser(uid, userData) {
  try {
    const res = await fetch(`/api/users/${uid}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function deleteUser(uid) {
  try {
    const res = await fetch(`/api/users/${uid}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ==========================================
// SITE CONTROLS & SETTINGS
// ==========================================

export async function fetchSiteSettings() {
  try {
    const res = await fetch('/api/settings', { headers: getAuthHeaders() });
    if (res.ok) {
      const data = await res.json();
      return data.settings || {};
    }
  } catch (e) {}
  return {};
}

export async function updateSiteSettings(settings) {
  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings)
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ==========================================
// CLOUD CONNECTION & BACKUP
// ==========================================

export async function fetchCloudStatus() {
  try {
    const res = await fetch('/api/cloud/status', { headers: getAuthHeaders() });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {}
  return { success: false, cloudConnected: false };
}

export async function triggerCloudSync() {
  try {
    const res = await fetch('/api/cloud/sync', {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function exportCloudBackup() {
  try {
    const res = await fetch('/api/cloud/export', { headers: getAuthHeaders() });
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shree_teach_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      return { success: true };
    }
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ==========================================
// TEST ATTEMPTS SYNCHRONIZATION
// ==========================================

export async function saveAttemptToServer(attemptData) {
  if (!isServerOnline) return { success: false, localOnly: true };

  try {
    const response = await fetch('/api/attempts', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(attemptData)
    });

    if (response.ok) {
      const result = await response.json();
      if (window.showAppToast) {
        window.showAppToast("✓ Test result saved to Cloud & Server Database!", "success");
      }
      return { success: true, result };
    }
  } catch (e) {
    console.warn("Could not sync attempt to server, saved locally:", e);
  }
  return { success: false };
}

export async function syncAttemptsFromServer() {
  if (!isServerOnline) return;

  try {
    const res = await fetch('/api/attempts', {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.attempts) && data.attempts.length > 0) {
        const state = getState();
        const localAttempts = state.attempts || [];
        const existingIds = new Set(localAttempts.map(a => a.id));

        let newSyncedCount = 0;
        data.attempts.forEach(remoteAttempt => {
          if (!existingIds.has(remoteAttempt.id)) {
            localAttempts.unshift(remoteAttempt);
            newSyncedCount++;
          }
        });

        if (newSyncedCount > 0) {
          try {
            localStorage.setItem('shree_teach_attempts', JSON.stringify(localAttempts));
          } catch (e) {}
        }
      }
    }
  } catch (e) {
    console.warn("Attempts sync skipped:", e);
  }
}

export async function fetchPlatformStats() {
  try {
    const res = await fetch('/api/stats', { headers: getAuthHeaders() });
    if (res.ok) {
      const data = await res.json();
      return data.stats;
    }
  } catch (e) {}
  return null;
}
