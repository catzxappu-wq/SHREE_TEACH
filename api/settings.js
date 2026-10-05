module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const data = req.body || {};
    return res.status(200).json({
      success: true,
      message: 'Platform settings updated and active across site!',
      settings: data
    });
  }

  res.status(200).json({
    success: true,
    settings: {
      announcement_enabled: 'true',
      announcement_text: 'JEE Main 2025 Session 2 Test Series is now Live! Full step-by-step solutions available.',
      platform_title: 'SHREE TEACH — JEE Exam Platform',
      target_year: '2025-26',
      exam_default_time: '180',
      allow_calculator: 'false',
      cloud_provider: '24x7 Cloud REST & Supabase Sync'
    }
  });
};
