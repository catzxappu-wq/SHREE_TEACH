/**
 * SHREE TEACH - 24x7 Cloud Database & Backend Service Manager
 * Provides 24/7 persistence via Supabase (Cloud PostgreSQL) / REST Cloud Backend.
 * Ensures data is available 24/7/365 across all student devices without relying on a local PC.
 */

const CLOUD_CONFIG_KEY = 'shree_teach_cloud_config';

// Default / saved cloud credentials
export function getCloudConfig() {
  try {
    const raw = localStorage.getItem(CLOUD_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  return {
    provider: 'supabase', // 'supabase' | 'firebase' | 'custom_api'
    supabaseUrl: '',
    supabaseAnonKey: '',
    isConnected: false,
    lastSynced: null
  };
}

export function saveCloudConfig(config) {
  try {
    localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {}
}

/**
 * Initializes Cloud Database connection
 */
export async function testCloudConnection(supabaseUrl, supabaseKey) {
  if (!supabaseUrl || !supabaseKey) {
    return { success: false, message: "Missing Cloud Database URL or API Key." };
  }

  try {
    // Sanitize URL
    const url = supabaseUrl.replace(/\/+$/, '');
    const res = await fetch(`${url}/rest/v1/?apikey=${supabaseKey}`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (res.ok || res.status === 200 || res.status === 404) {
      const newConfig = {
        provider: 'supabase',
        supabaseUrl: url,
        supabaseAnonKey: supabaseKey,
        isConnected: true,
        lastSynced: new Date().toISOString()
      };
      saveCloudConfig(newConfig);
      return { success: true, message: "24x7 Cloud Database connected successfully!" };
    } else {
      return { success: false, message: `Cloud rejected connection (HTTP ${res.status}). Verify your Supabase URL & Anon Key.` };
    }
  } catch (err) {
    return { success: false, message: `Network error connecting to Cloud Database: ${err.message}` };
  }
}

/**
 * Saves a test attempt to the 24x7 Cloud Database
 */
export async function saveAttemptToCloud(attemptData, user) {
  const config = getCloudConfig();
  if (!config.isConnected || !config.supabaseUrl || !config.supabaseAnonKey) {
    // Return false silently or inform fallback
    return { cloudSaved: false, reason: "Cloud DB not configured (saved locally)." };
  }

  try {
    const url = `${config.supabaseUrl}/rest/v1/test_attempts`;
    const payload = {
      attempt_id: attemptData.id,
      student_email: user?.email || 'guest@shreeteach.in',
      student_name: user?.name || 'Anonymous Aspirant',
      test_id: attemptData.testId,
      test_name: attemptData.testName,
      exam: attemptData.exam,
      score: attemptData.score,
      max_marks: attemptData.maxMarks,
      percentage: attemptData.percentage,
      accuracy: attemptData.accuracy,
      time_spent_minutes: attemptData.timeSpentMinutes,
      correct_count: attemptData.correctCount,
      incorrect_count: attemptData.incorrectCount,
      unattempted_count: attemptData.unattemptedCount,
      subject_breakdown: attemptData.subjectBreakdown,
      chapter_breakdown: attemptData.chapterBreakdown,
      completed_at: attemptData.date || new Date().toISOString()
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.supabaseAnonKey,
        'Authorization': `Bearer ${config.supabaseAnonKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok || response.status === 201) {
      return { cloudSaved: true, message: "Saved to 24x7 Cloud Database!" };
    } else {
      console.warn("Cloud DB response error:", await response.text());
      return { cloudSaved: false, reason: `Cloud HTTP ${response.status}` };
    }
  } catch (e) {
    console.warn("Cloud DB sync failed, data saved in browser:", e);
    return { cloudSaved: false, reason: e.message };
  }
}

/**
 * Syncs student profile to 24x7 Cloud Database
 */
export async function syncUserProfileToCloud(userData) {
  const config = getCloudConfig();
  if (!config.isConnected || !config.supabaseUrl || !config.supabaseAnonKey) {
    return { cloudSaved: false };
  }

  try {
    const url = `${config.supabaseUrl}/rest/v1/students`;
    const payload = {
      email: userData.email,
      name: userData.name,
      mobile: userData.mobile,
      target_exam: userData.targetExam,
      target_year: userData.targetYear,
      last_active: new Date().toISOString()
    };

    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.supabaseAnonKey,
        'Authorization': `Bearer ${config.supabaseAnonKey}`,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(payload)
    });

    return { cloudSaved: true };
  } catch (e) {
    return { cloudSaved: false, error: e.message };
  }
}
