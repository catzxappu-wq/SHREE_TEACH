module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const body = req.body || {};
  const username = (body.username || '').trim().toLowerCase();
  const password = (body.password || '').trim();

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password required.' });
  }

  const USERS = [
    { username: 'admin', password: 'admin123', fullName: 'Platform Administrator', email: 'admin@shreeteach.in', role: 'admin' },
    { username: 'teacher', password: 'teach123', fullName: 'Senior Faculty (Kota)', email: 'faculty@shreeteach.in', role: 'teacher' },
    { username: 'aman', password: 'student123', fullName: 'Aman Sharma', email: 'aman.jee@shreeteach.in', role: 'student' },
    { username: 'priya', password: 'priya123', fullName: 'Priya Patel', email: 'priya.jee@gmail.com', role: 'student' }
  ];

  const matched = USERS.find(u => u.username === username && u.password === password);
  if (matched) {
    const token = 'st_jwt_' + Buffer.from(username + ':' + Date.now()).toString('base64');
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: username === 'admin' ? 1 : 2,
        username: matched.username,
        fullName: matched.fullName,
        email: matched.email,
        role: matched.role
      }
    });
  }

  return res.status(401).json({ success: false, error: 'Invalid username or password.' });
};
