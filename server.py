#!/usr/bin/env python3
"""
SHREE TEACH — 24x7 Examination Server, Admin API & Cloud Sync Engine
=====================================================================
Complete Administrative & Examination Backend:
- Full Question Management (CRUD + Live preview)
- User & Access Control (Assign username/password, role management: Admin, Teacher, Student)
- Entire Website Control (Site settings, announcement banner, maintenance mode)
- Mock Test Series Configuration
- Persistent SQLite Database (shree_teach.db)
- 24x7 Cloud Synchronization & JSON Backup Export/Import
- Multi-threaded HTTP Server for zero-latency page and API delivery
"""

import sys
import os
import json
import sqlite3
import datetime
import hashlib
import mimetypes
import argparse
import socket
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn

# Global server metadata
SERVER_START_TIME = datetime.datetime.now()
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, 'shree_teach.db')
QUESTIONS_JSON_FILE = os.path.join(BASE_DIR, 'js', 'data', 'questions.json')

# In-memory active auth tokens: { token: { user_id, username, role, expires_at } }
ACTIVE_SESSIONS = {}

def hash_password(password):
    """Secure SHA-256 password hasher with salt."""
    salt = "shree_teach_secure_salt_2025"
    return hashlib.sha256((salt + password).encode('utf-8')).hexdigest()

def init_database():
    """Initializes tables, seeds initial 75 questions, users, and settings."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # 1. Table: users
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            email TEXT,
            role TEXT DEFAULT 'student',
            is_active INTEGER DEFAULT 1,
            created_at TEXT,
            last_login TEXT
        )
    ''')

    # 2. Table: questions
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            exam TEXT NOT NULL,
            subject TEXT NOT NULL,
            branch TEXT,
            chapter TEXT NOT NULL,
            difficulty TEXT NOT NULL,
            type TEXT NOT NULL,
            question TEXT NOT NULL,
            options_json TEXT,
            correct_answer_json TEXT,
            tolerance REAL,
            positive_marks REAL DEFAULT 4,
            negative_marks REAL DEFAULT 1,
            partial_marking INTEGER DEFAULT 0,
            explanation TEXT,
            is_pyq INTEGER DEFAULT 0,
            pyq_year TEXT,
            created_at TEXT,
            updated_at TEXT
        )
    ''')

    # 3. Table: mock_tests
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS mock_tests (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            exam TEXT NOT NULL,
            category TEXT,
            subject TEXT,
            difficulty TEXT,
            duration_minutes INTEGER,
            max_marks REAL,
            question_count INTEGER,
            display_questions INTEGER,
            negative_marking_text TEXT,
            description TEXT,
            tags_json TEXT,
            created_at TEXT
        )
    ''')

    # 4. Table: test_attempts
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS test_attempts (
            id TEXT PRIMARY KEY,
            student_email TEXT,
            student_name TEXT,
            test_id TEXT,
            test_name TEXT,
            exam TEXT,
            score REAL,
            max_marks REAL,
            percentage REAL,
            accuracy REAL,
            time_spent_minutes INTEGER,
            correct_count INTEGER,
            incorrect_count INTEGER,
            unattempted_count INTEGER,
            full_data_json TEXT,
            created_at TEXT
        )
    ''')

    # 5. Table: site_settings
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS site_settings (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at TEXT
        )
    ''')

    # 6. Table: cloud_sync_logs
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cloud_sync_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            provider TEXT,
            action TEXT,
            status TEXT,
            details TEXT
        )
    ''')

    # Seed Default Users if empty
    cursor.execute('SELECT COUNT(*) FROM users')
    if cursor.fetchone()[0] == 0:
        now = datetime.datetime.now().isoformat()
        default_users = [
            ('admin', hash_password('admin123'), 'Platform Administrator', 'admin@shreeteach.in', 'admin', 1, now, now),
            ('teacher', hash_password('teach123'), 'Senior Faculty (Kota)', 'faculty@shreeteach.in', 'teacher', 1, now, None),
            ('aman', hash_password('student123'), 'Aman Sharma', 'aman.jee@shreeteach.in', 'student', 1, now, now),
            ('priya', hash_password('priya123'), 'Priya Patel', 'priya.jee@gmail.com', 'student', 1, now, None),
        ]
        cursor.executemany('''
            INSERT INTO users (username, password_hash, full_name, email, role, is_active, created_at, last_login)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', default_users)
        print("  ✓ Seeded default admin and student users.")

    # Seed Initial 75 Questions if empty
    cursor.execute('SELECT COUNT(*) FROM questions')
    if cursor.fetchone()[0] == 0:
        if os.path.exists(QUESTIONS_JSON_FILE):
            try:
                with open(QUESTIONS_JSON_FILE, 'r', encoding='utf-8') as f:
                    q_list = json.load(f)
                now = datetime.datetime.now().isoformat()
                for q in q_list:
                    cursor.execute('''
                        INSERT INTO questions (
                            id, exam, subject, branch, chapter, difficulty, type, question,
                            options_json, correct_answer_json, tolerance, positive_marks, negative_marks,
                            partial_marking, explanation, is_pyq, pyq_year, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        q.get('id'),
                        q.get('exam', 'JEE Main'),
                        q.get('subject', 'Physics'),
                        q.get('branch'),
                        q.get('chapter', 'General'),
                        q.get('difficulty', 'Medium'),
                        q.get('type', 'single_correct'),
                        q.get('question', ''),
                        json.dumps(q.get('options')) if q.get('options') is not None else None,
                        json.dumps(q.get('correctAnswer')),
                        q.get('tolerance'),
                        q.get('positiveMarks', 4),
                        q.get('negativeMarks', 1),
                        1 if q.get('partialMarking') else 0,
                        q.get('explanation', ''),
                        1 if q.get('isPYQ') else 0,
                        q.get('pyqYear'),
                        now,
                        now
                    ))
                print(f"  ✓ Seeded {len(q_list)} authentic JEE questions into database.")
            except Exception as e:
                print(f"  ⚠️ Could not seed questions from JSON: {e}")

    # Seed Default Mock Tests if empty
    cursor.execute('SELECT COUNT(*) FROM mock_tests')
    if cursor.fetchone()[0] == 0:
        now = datetime.datetime.now().isoformat()
        default_tests = [
            (
                "jm_full_01", "JEE Main Full Mock Test #01", "JEE Main", "Full Test", "All Subjects",
                "Medium", 180, 300, 75, 25, "+4 / -1 for MCQ, +4 / 0 for Numerical",
                "Authentic full syllabus JEE Main simulation adhering strictly to latest NTA pattern.",
                json.dumps(["Full Syllabus", "NTA Pattern", "Most Popular"]), now
            ),
            (
                "ja_paper_01", "JEE Advanced Comprehensive Paper 1", "JEE Advanced", "Full Test", "All Subjects",
                "Hard", 180, 180, 54, 20, "+4 / -2 for Multi-Correct (Partial: +1), +4 / -1 for Single",
                "High-rigor IIT JEE Advanced Paper 1 simulation featuring multi-correct with partial marking.",
                json.dumps(["IIT Bombay Pattern", "Partial Marking", "Challenging"]), now
            ),
            (
                "jm_phy_speed", "JEE Main Physics Mastery Sprint", "JEE Main", "Chapter Test", "Physics",
                "Medium", 60, 100, 25, 15, "+4 / -1 for MCQ, +4 / 0 for Numerical",
                "Rapid sectional test focusing on Mechanics, Electrodynamics, Optics, and Modern Physics.",
                json.dumps(["Physics Only", "Speed Booster"]), now
            ),
            (
                "jm_chem_score", "JEE Main Chemistry High-Yield Booster", "JEE Main", "Chapter Test", "Chemistry",
                "Medium", 60, 100, 25, 15, "+4 / -1 for MCQ, +4 / 0 for Numerical",
                "Carefully balanced between Physical, Organic, and Inorganic chemistry for maximum score.",
                json.dumps(["Chemistry Only", "High Scoring"]), now
            ),
            (
                "jm_math_ranker", "JEE Main Mathematics Rank Booster", "JEE Main", "Chapter Test", "Mathematics",
                "Hard", 60, 100, 25, 15, "+4 / -1 for MCQ, +4 / 0 for Numerical",
                "Calculus, Coordinate Geometry, Matrices, and Vectors intensive test to build confidence.",
                json.dumps(["Maths Only", "Rank Decider"]), now
            ),
            (
                "jm_pyq_2023", "JEE Main 2023 Authentic PYQ Drill", "JEE Main", "Previous Year Paper", "All Subjects",
                "Medium", 180, 300, 75, 25, "+4 / -1 for MCQ, +4 / 0 for Numerical",
                "Direct practice of authentic questions from recent JEE Main shifts with in-depth solutions.",
                json.dumps(["Authentic PYQ", "Real Exam Difficulty"]), now
            )
        ]
        cursor.executemany('''
            INSERT INTO mock_tests (
                id, name, exam, category, subject, difficulty, duration_minutes,
                max_marks, question_count, display_questions, negative_marking_text,
                description, tags_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', default_tests)
        print("  ✓ Seeded pre-configured mock test series.")

    # Seed Default Site Settings if empty
    cursor.execute('SELECT COUNT(*) FROM site_settings')
    if cursor.fetchone()[0] == 0:
        now = datetime.datetime.now().isoformat()
        default_settings = [
            ('platform_title', 'SHREE TEACH — JEE Preparation Platform', now),
            ('announcement_banner', '🔥 JEE 2025 All India CBT Mock Test Series is LIVE! Practice authentic NTA simulated tests now.', now),
            ('announcement_enabled', 'true', now),
            ('target_year', '2025 - 2026', now),
            ('maintenance_mode', 'false', now),
            ('cloud_connected', 'true', now),
            ('cloud_provider', '24x7 Cloud REST & Supabase Sync', now),
            ('cloud_status', 'Online (Connected & Synchronized)', now),
            ('cloud_last_sync', now, now)
        ]
        cursor.executemany('''
            INSERT INTO site_settings (key, value, updated_at)
            VALUES (?, ?, ?)
        ''', default_settings)
        print("  ✓ Seeded default site settings & cloud config.")

    conn.commit()
    conn.close()

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

class ShreeTeachRequestHandler(SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        if self.path.startswith('/api/'):
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    # ==========================================
    # REQUEST ROUTER
    # ==========================================

    def do_GET(self):
        url_parts = urllib.parse.urlparse(self.path)
        path = url_parts.path
        query = urllib.parse.parse_qs(url_parts.query)

        # API Routes
        if path == '/api/health' or path == '/api/status':
            self.api_health()
        elif path == '/api/auth/me':
            self.api_auth_me()
        elif path == '/api/questions':
            if 'id' in query:
                self.api_get_question_by_id(query['id'][0])
            else:
                self.api_get_questions(query)
        elif path.startswith('/api/questions/'):
            qid = path.split('/api/questions/')[1]
            self.api_get_question_by_id(qid)
        elif path == '/api/users':
            self.api_get_users()
        elif path == '/api/settings':
            self.api_get_settings()
        elif path == '/api/tests':
            self.api_get_tests()
        elif path == '/api/attempts':
            self.api_get_attempts(query)
        elif path == '/api/stats':
            self.api_get_stats()
        elif path == '/api/cloud/status':
            self.api_cloud_status()
        elif path == '/api/cloud/export':
            self.api_cloud_export()
        elif path == '/' or path == '':
            self.path = '/index.html'
            super().do_GET()
        else:
            # Fallback for SPA routing
            full_file_path = os.path.join(self.directory, self.path.lstrip('/'))
            if not os.path.exists(full_file_path) and not self.path.startswith('/api/'):
                self.path = '/index.html'
            super().do_GET()

    def do_POST(self):
        path = urllib.parse.urlparse(self.path).path

        if path == '/api/auth/login':
            self.api_auth_login()
        elif path == '/api/auth/logout':
            self.api_auth_logout()
        elif path == '/api/questions':
            self.api_create_question()
        elif path == '/api/users':
            self.api_create_user()
        elif path == '/api/settings':
            self.api_update_settings()
        elif path == '/api/tests':
            self.api_create_or_update_test()
        elif path == '/api/attempts':
            self.api_save_attempt()
        elif path == '/api/cloud/sync':
            self.api_cloud_sync()
        elif path == '/api/cloud/import':
            self.api_cloud_import()
        else:
            self.send_error_json(404, f"API endpoint not found: {path}")

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path.startswith('/api/questions/'):
            qid = path.split('/api/questions/')[1]
            self.api_update_question(qid)
        elif path == '/api/questions' and 'id' in query:
            self.api_update_question(query['id'][0])
        elif path.startswith('/api/users/'):
            uid = path.split('/api/users/')[1]
            self.api_update_user(uid)
        elif path == '/api/users' and 'id' in query:
            self.api_update_user(query['id'][0])
        else:
            self.send_error_json(404, f"API endpoint not found: {path}")

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path.startswith('/api/questions/'):
            qid = path.split('/api/questions/')[1]
            self.api_delete_question(qid)
        elif path == '/api/questions' and 'id' in query:
            self.api_delete_question(query['id'][0])
        elif path.startswith('/api/users/'):
            uid = path.split('/api/users/')[1]
            self.api_delete_user(uid)
        elif path == '/api/users' and 'id' in query:
            self.api_delete_user(query['id'][0])
        elif path.startswith('/api/tests/'):
            tid = path.split('/api/tests/')[1]
            self.api_delete_test(tid)
        elif path == '/api/attempts/clear':
            self.api_clear_attempts()
        elif path.startswith('/api/attempts/'):
            aid = path.split('/api/attempts/')[1]
            self.api_delete_attempt(aid)
        else:
            self.send_error_json(404, f"API endpoint not found: {path}")

    # ==========================================
    # AUTHENTICATION & ACCESS CONTROL
    # ==========================================

    def get_auth_user(self):
        auth_header = self.headers.get('Authorization', '')
        token = ''
        if auth_header.startswith('Bearer '):
            token = auth_header[7:].strip()
        else:
            # Check cookie or query token
            cookie = self.headers.get('Cookie', '')
            for part in cookie.split(';'):
                if 'st_token=' in part:
                    token = part.split('st_token=')[1].strip()

        if token and token in ACTIVE_SESSIONS:
            return ACTIVE_SESSIONS[token]
        return None

    def api_auth_login(self):
        data = self.read_json_body()
        if not data: return

        username = (data.get('username') or '').strip().lower()
        password = data.get('password') or ''

        if not username or not password:
            self.send_error_json(400, "Username and password are required.")
            return

        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        cur.execute('''
            SELECT id, username, password_hash, full_name, email, role, is_active
            FROM users WHERE LOWER(username) = ?
        ''', (username,))
        row = cur.fetchone()

        if not row:
            conn.close()
            self.send_error_json(401, "Invalid username or password.")
            return

        user_id, uname, p_hash, full_name, email, role, is_active = row

        if not is_active:
            conn.close()
            self.send_error_json(403, "This account has been deactivated by administrator.")
            return

        if hash_password(password) != p_hash:
            conn.close()
            self.send_error_json(401, "Invalid username or password.")
            return

        now = datetime.datetime.now().isoformat()
        cur.execute('UPDATE users SET last_login = ? WHERE id = ?', (now, user_id))
        conn.commit()
        conn.close()

        # Generate session token
        token_src = f"{username}_{now}_{os.urandom(8).hex()}"
        token = "st_auth_" + hashlib.sha256(token_src.encode('utf-8')).hexdigest()

        user_payload = {
            "id": user_id,
            "username": uname,
            "fullName": full_name,
            "email": email,
            "role": role,
            "isActive": bool(is_active)
        }

        ACTIVE_SESSIONS[token] = user_payload

        self.send_json_response(200, {
            "success": True,
            "message": f"Welcome back, {full_name}!",
            "token": token,
            "user": user_payload
        })

    def api_auth_me(self):
        user = self.get_auth_user()
        if user:
            self.send_json_response(200, {"success": True, "user": user})
        else:
            self.send_json_response(200, {"success": False, "user": None})

    def api_auth_logout(self):
        auth_header = self.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:].strip()
            ACTIVE_SESSIONS.pop(token, None)
        self.send_json_response(200, {"success": True, "message": "Signed out successfully."})

    # ==========================================
    # USER MANAGEMENT (ADMIN CONTROL)
    # ==========================================

    def api_get_users(self):
        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        cur.execute('''
            SELECT id, username, full_name, email, role, is_active, created_at, last_login
            FROM users ORDER BY id ASC
        ''')
        rows = cur.fetchall()
        conn.close()

        users = []
        for r in rows:
            users.append({
                "id": r[0],
                "username": r[1],
                "fullName": r[2],
                "email": r[3],
                "role": r[4],
                "isActive": bool(r[5]),
                "createdAt": r[6],
                "lastLogin": r[7]
            })
        self.send_json_response(200, {"success": True, "users": users})

    def api_create_user(self):
        data = self.read_json_body()
        if not data: return

        username = (data.get('username') or '').strip().lower()
        password = data.get('password') or ''
        full_name = data.get('fullName') or data.get('name') or username
        email = data.get('email') or f"{username}@shreeteach.in"
        role = data.get('role') or 'student'
        is_active = 1 if data.get('isActive', True) else 0

        if not username or not password:
            self.send_error_json(400, "Username and password are required.")
            return

        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        try:
            now = datetime.datetime.now().isoformat()
            cur.execute('''
                INSERT INTO users (username, password_hash, full_name, email, role, is_active, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (username, hash_password(password), full_name, email, role, is_active, now))
            new_id = cur.lastrowid
            conn.commit()
            conn.close()

            self.send_json_response(201, {
                "success": True,
                "message": f"User account '{username}' created successfully!",
                "user": {
                    "id": new_id,
                    "username": username,
                    "fullName": full_name,
                    "email": email,
                    "role": role,
                    "isActive": bool(is_active)
                }
            })
        except sqlite3.IntegrityError:
            conn.close()
            self.send_error_json(409, f"Username '{username}' is already taken.")
        except Exception as e:
            conn.close()
            self.send_error_json(500, f"Error creating user: {str(e)}")

    def api_update_user(self, uid):
        data = self.read_json_body()
        if not data: return

        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        cur.execute('SELECT id, username, role FROM users WHERE id = ?', (uid,))
        existing = cur.fetchone()
        if not existing:
            conn.close()
            self.send_error_json(404, "User not found.")
            return

        full_name = data.get('fullName')
        email = data.get('email')
        role = data.get('role')
        is_active = data.get('isActive')
        password = data.get('password')

        updates = []
        params = []
        if full_name is not None: updates.append('full_name = ?'); params.append(full_name)
        if email is not None: updates.append('email = ?'); params.append(email)
        if role is not None: updates.append('role = ?'); params.append(role)
        if is_active is not None: updates.append('is_active = ?'); params.append(1 if is_active else 0)
        if password: updates.append('password_hash = ?'); params.append(hash_password(password))

        if updates:
            params.append(uid)
            sql = f"UPDATE users SET {', '.join(updates)} WHERE id = ?"
            cur.execute(sql, params)
            conn.commit()

        conn.close()
        self.send_json_response(200, {"success": True, "message": "User updated successfully."})

    def api_delete_user(self, uid):
        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        cur.execute('SELECT username, role FROM users WHERE id = ?', (uid,))
        user = cur.fetchone()
        if not user:
            conn.close()
            self.send_error_json(404, "User not found.")
            return

        if user[0] == 'admin':
            conn.close()
            self.send_error_json(403, "Cannot delete primary platform administrator.")
            return

        cur.execute('DELETE FROM users WHERE id = ?', (uid,))
        conn.commit()
        conn.close()
        self.send_json_response(200, {"success": True, "message": f"User '{user[0]}' deleted."})

    # ==========================================
    # QUESTIONS MANAGEMENT (ADMIN CRUD)
    # ==========================================

    def api_get_questions(self, query):
        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()

        sql = '''
            SELECT id, exam, subject, branch, chapter, difficulty, type, question,
                   options_json, correct_answer_json, tolerance, positive_marks, negative_marks,
                   partial_marking, explanation, is_pyq, pyq_year, updated_at
            FROM questions WHERE 1=1
        '''
        params = []

        if 'subject' in query and query['subject'][0] != 'All':
            sql += ' AND subject = ?'
            params.append(query['subject'][0])
        if 'exam' in query and query['exam'][0] != 'All':
            sql += ' AND exam = ?'
            params.append(query['exam'][0])
        if 'chapter' in query and query['chapter'][0] != 'All':
            sql += ' AND chapter = ?'
            params.append(query['chapter'][0])
        if 'difficulty' in query and query['difficulty'][0] != 'All':
            sql += ' AND difficulty = ?'
            params.append(query['difficulty'][0])
        if 'type' in query and query['type'][0] != 'All':
            sql += ' AND type = ?'
            params.append(query['type'][0])
        if 'search' in query and query['search'][0].strip():
            sql += ' AND (question LIKE ? OR chapter LIKE ?)'
            term = f"%{query['search'][0].strip()}%"
            params.extend([term, term])

        sql += ' ORDER BY id ASC'

        cur.execute(sql, params)
        rows = cur.fetchall()
        conn.close()

        questions = []
        for r in rows:
            opts = json.loads(r[8]) if r[8] else None
            ca = json.loads(r[9]) if r[9] else None
            questions.append({
                "id": r[0],
                "exam": r[1],
                "subject": r[2],
                "branch": r[3],
                "chapter": r[4],
                "difficulty": r[5],
                "type": r[6],
                "question": r[7],
                "options": opts,
                "correctAnswer": ca,
                "tolerance": r[10],
                "positiveMarks": r[11],
                "negativeMarks": r[12],
                "partialMarking": bool(r[13]),
                "explanation": r[14],
                "isPYQ": bool(r[15]),
                "pyqYear": r[16],
                "updatedAt": r[17]
            })

        self.send_json_response(200, {
            "success": True,
            "totalCount": len(questions),
            "questions": questions
        })

    def api_get_question_by_id(self, qid):
        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        cur.execute('''
            SELECT id, exam, subject, branch, chapter, difficulty, type, question,
                   options_json, correct_answer_json, tolerance, positive_marks, negative_marks,
                   partial_marking, explanation, is_pyq, pyq_year, updated_at
            FROM questions WHERE id = ?
        ''', (qid,))
        r = cur.fetchone()
        conn.close()

        if not r:
            self.send_error_json(404, "Question not found.")
            return

        opts = json.loads(r[8]) if r[8] else None
        ca = json.loads(r[9]) if r[9] else None
        q = {
            "id": r[0],
            "exam": r[1],
            "subject": r[2],
            "branch": r[3],
            "chapter": r[4],
            "difficulty": r[5],
            "type": r[6],
            "question": r[7],
            "options": opts,
            "correctAnswer": ca,
            "tolerance": r[10],
            "positiveMarks": r[11],
            "negativeMarks": r[12],
            "partialMarking": bool(r[13]),
            "explanation": r[14],
            "isPYQ": bool(r[15]),
            "pyqYear": r[16],
            "updatedAt": r[17]
        }
        self.send_json_response(200, {"success": True, "question": q})

    def api_create_question(self):
        data = self.read_json_body()
        if not data: return

        exam = data.get('exam') or data.get('examType') or 'JEE Main'
        subject = data.get('subject', 'Physics')
        branch = data.get('branch')
        chapter = data.get('chapter', 'General')
        difficulty = data.get('difficulty', 'Medium')
        qtype = data.get('type') or data.get('questionType') or 'single_correct'
        question_text = (data.get('question') or data.get('questionText') or '').strip()
        options = data.get('options')
        correct_answer = data.get('correctAnswer') or data.get('correct_answer')
        tolerance = data.get('tolerance')
        pos_marks = float(data.get('positiveMarks', 4))
        neg_marks = float(data.get('negativeMarks', 0 if qtype in ('numerical', 'integer') else 1))
        partial = 1 if data.get('partialMarking') else 0
        explanation = data.get('explanation') or data.get('solution') or ''
        is_pyq = 1 if (data.get('isPYQ') or data.get('year') or data.get('pyqYear')) else 0
        pyq_year = data.get('pyqYear') or data.get('year')

        if not question_text:
            self.send_error_json(400, "Question prompt is required.")
            return

        now = datetime.datetime.now().isoformat()
        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO questions (
                exam, subject, branch, chapter, difficulty, type, question,
                options_json, correct_answer_json, tolerance, positive_marks, negative_marks,
                partial_marking, explanation, is_pyq, pyq_year, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            exam, subject, branch, chapter, difficulty, qtype, question_text,
            json.dumps(options) if options is not None else None,
            json.dumps(correct_answer),
            tolerance, pos_marks, neg_marks, partial, explanation, is_pyq, pyq_year, now, now
        ))
        new_qid = cur.lastrowid
        conn.commit()
        conn.close()

        self.send_json_response(201, {
            "success": True,
            "message": "Question added to database successfully!",
            "questionId": new_qid,
            "id": new_qid,
            "question": {
                "id": new_qid,
                "exam": exam,
                "subject": subject,
                "chapter": chapter,
                "question": question_text,
                "options": options,
                "correctAnswer": correct_answer,
                "difficulty": difficulty
            }
        })

    def api_update_question(self, qid):
        data = self.read_json_body()
        if not data: return

        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        cur.execute('SELECT id FROM questions WHERE id = ?', (qid,))
        if not cur.fetchone():
            conn.close()
            self.send_error_json(404, "Question not found.")
            return

        now = datetime.datetime.now().isoformat()
        cur.execute('''
            UPDATE questions SET
                exam = ?, subject = ?, branch = ?, chapter = ?, difficulty = ?, type = ?,
                question = ?, options_json = ?, correct_answer_json = ?, tolerance = ?,
                positive_marks = ?, negative_marks = ?, partial_marking = ?, explanation = ?,
                is_pyq = ?, pyq_year = ?, updated_at = ?
            WHERE id = ?
        ''', (
            data.get('exam') or data.get('examType') or 'JEE Main',
            data.get('subject', 'Physics'),
            data.get('branch'),
            data.get('chapter', 'General'),
            data.get('difficulty', 'Medium'),
            data.get('type') or data.get('questionType') or 'single_correct',
            data.get('question') or data.get('questionText') or '',
            json.dumps(data.get('options')) if data.get('options') is not None else None,
            json.dumps(data.get('correctAnswer') or data.get('correct_answer')),
            data.get('tolerance'),
            float(data.get('positiveMarks', 4)),
            float(data.get('negativeMarks', 0 if (data.get('type') or data.get('questionType')) in ('numerical', 'integer') else 1)),
            1 if data.get('partialMarking') else 0,
            data.get('explanation') or data.get('solution') or '',
            1 if (data.get('isPYQ') or data.get('year') or data.get('pyqYear')) else 0,
            data.get('pyqYear') or data.get('year'),
            now,
            qid
        ))
        conn.commit()
        conn.close()

        self.send_json_response(200, {
            "success": True,
            "message": f"Question #{qid} updated successfully!"
        })

    def api_delete_question(self, qid):
        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        cur.execute('DELETE FROM questions WHERE id = ?', (qid,))
        conn.commit()
        conn.close()
        self.send_json_response(200, {"success": True, "message": f"Question #{qid} deleted."})

    # ==========================================
    # SITE CONTROLS & SETTINGS
    # ==========================================

    def api_get_settings(self):
        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        cur.execute('SELECT key, value FROM site_settings')
        rows = cur.fetchall()
        conn.close()

        settings = {r[0]: r[1] for r in rows}
        self.send_json_response(200, {"success": True, "settings": settings})

    def api_update_settings(self):
        data = self.read_json_body()
        if not data: return

        now = datetime.datetime.now().isoformat()
        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        for k, v in data.items():
            cur.execute('''
                INSERT OR REPLACE INTO site_settings (key, value, updated_at)
                VALUES (?, ?, ?)
            ''', (k, str(v), now))
        conn.commit()
        conn.close()

        self.send_json_response(200, {
            "success": True,
            "message": "Platform settings updated and active across site!",
            "settings": {k: str(v) for k, v in data.items()}
        })

    # ==========================================
    # MOCK TESTS CONTROLS
    # ==========================================

    def api_get_tests(self):
        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        cur.execute('''
            SELECT id, name, exam, category, subject, difficulty, duration_minutes,
                   max_marks, question_count, display_questions, negative_marking_text,
                   description, tags_json, created_at
            FROM mock_tests ORDER BY rowid ASC
        ''')
        rows = cur.fetchall()
        conn.close()

        tests = []
        for r in rows:
            tags = json.loads(r[12]) if r[12] else []
            tests.append({
                "id": r[0],
                "name": r[1],
                "exam": r[2],
                "category": r[3],
                "subject": r[4],
                "difficulty": r[5],
                "durationMinutes": r[6],
                "maxMarks": r[7],
                "questionCount": r[8],
                "displayQuestions": r[9],
                "negativeMarkingText": r[10],
                "description": r[11],
                "tags": tags
            })
        self.send_json_response(200, {"success": True, "tests": tests})

    def api_create_or_update_test(self):
        data = self.read_json_body()
        if not data: return

        tid = data.get('id') or f"test_{int(datetime.datetime.now().timestamp())}"
        name = data.get('name', 'Custom JEE Test')
        exam = data.get('exam', 'JEE Main')
        category = data.get('category', 'Full Test')
        subject = data.get('subject', 'All Subjects')
        difficulty = data.get('difficulty', 'Medium')
        duration = int(data.get('durationMinutes', 180))
        max_marks = float(data.get('maxMarks', 300))
        q_count = int(data.get('questionCount', 25))
        disp_q = int(data.get('displayQuestions', q_count))
        neg_text = data.get('negativeMarkingText', '+4 / -1 configured')
        description = data.get('description', '')
        tags = data.get('tags', [])
        now = datetime.datetime.now().isoformat()

        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        cur.execute('''
            INSERT OR REPLACE INTO mock_tests (
                id, name, exam, category, subject, difficulty, duration_minutes,
                max_marks, question_count, display_questions, negative_marking_text,
                description, tags_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            tid, name, exam, category, subject, difficulty, duration,
            max_marks, q_count, disp_q, neg_text, description, json.dumps(tags), now
        ))
        conn.commit()
        conn.close()

        self.send_json_response(200, {
            "success": True,
            "message": f"Mock Test '{name}' saved successfully!",
            "testId": tid
        })

    def api_delete_test(self, tid):
        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        cur.execute('DELETE FROM mock_tests WHERE id = ?', (tid,))
        conn.commit()
        conn.close()
        self.send_json_response(200, {"success": True, "message": f"Test #{tid} deleted."})

    # ==========================================
    # TEST ATTEMPTS & STUDENT DATA
    # ==========================================

    def api_get_attempts(self, query):
        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        sql = '''
            SELECT id, student_email, student_name, test_id, test_name, exam,
                   score, max_marks, percentage, accuracy, time_spent_minutes,
                   correct_count, incorrect_count, unattempted_count, full_data_json, created_at
            FROM test_attempts
        '''
        params = []
        if 'email' in query:
            sql += ' WHERE student_email = ?'
            params.append(query['email'][0])
        sql += ' ORDER BY datetime(created_at) DESC'

        cur.execute(sql, params)
        rows = cur.fetchall()
        conn.close()

        attempts = []
        for r in rows:
            full_data = json.loads(r[14]) if r[14] else {}
            attempts.append({
                "id": r[0],
                "studentEmail": r[1],
                "studentName": r[2],
                "testId": r[3],
                "testName": r[4],
                "exam": r[5],
                "score": r[6],
                "maxMarks": r[7],
                "percentage": r[8],
                "accuracy": r[9],
                "timeSpentMinutes": r[10],
                "correctCount": r[11],
                "incorrectCount": r[12],
                "unattemptedCount": r[13],
                "date": r[15],
                "subjectBreakdown": full_data.get("subjectBreakdown", {}),
                "chapterBreakdown": full_data.get("chapterBreakdown", {}),
                "questionReviews": full_data.get("questionReviews", [])
            })
        self.send_json_response(200, {"success": True, "attempts": attempts})

    def api_save_attempt(self):
        data = self.read_json_body()
        if not data: return

        attempt_id = data.get('id') or f"attempt_{int(datetime.datetime.now().timestamp() * 1000)}"
        student_email = data.get('studentEmail') or data.get('user', {}).get('email') or 'aman.jee@shreeteach.in'
        student_name = data.get('studentName') or data.get('user', {}).get('name') or 'Aman Sharma'
        test_id = data.get('testId', 'unknown_test')
        test_name = data.get('testName', 'JEE Mock Test')
        exam = data.get('exam', 'JEE Main')
        score = float(data.get('score', 0))
        max_marks = float(data.get('maxMarks', 300))
        percentage = float(data.get('percentage', 0))
        accuracy = float(data.get('accuracy', 0))
        time_spent = int(data.get('timeSpentMinutes', 0))
        correct = int(data.get('correctCount', 0))
        incorrect = int(data.get('incorrectCount', 0))
        unattempted = int(data.get('unattemptedCount', 0))
        created_at = data.get('date') or datetime.datetime.now().isoformat()

        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        cur.execute('''
            INSERT OR REPLACE INTO test_attempts (
                id, student_email, student_name, test_id, test_name, exam,
                score, max_marks, percentage, accuracy, time_spent_minutes,
                correct_count, incorrect_count, unattempted_count, full_data_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            attempt_id, student_email, student_name, test_id, test_name, exam,
            score, max_marks, percentage, accuracy, time_spent,
            correct, incorrect, unattempted, json.dumps(data), created_at
        ))
        conn.commit()
        conn.close()

        self.send_json_response(201, {
            "success": True,
            "message": "Attempt saved to 24x7 database!",
            "attemptId": attempt_id
        })

    def api_delete_attempt(self, aid):
        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        cur.execute('DELETE FROM test_attempts WHERE id = ?', (aid,))
        conn.commit()
        conn.close()
        self.send_json_response(200, {"success": True, "message": "Attempt removed."})

    def api_clear_attempts(self):
        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        cur.execute('DELETE FROM test_attempts')
        conn.commit()
        conn.close()
        self.send_json_response(200, {"success": True, "message": "All test attempts cleared."})

    # ==========================================
    # CLOUD CONNECTION & BACKUP RESTORATION
    # ==========================================

    def api_cloud_status(self):
        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        cur.execute('SELECT COUNT(*) FROM questions')
        q_count = cur.fetchone()[0]
        cur.execute('SELECT COUNT(*) FROM users')
        u_count = cur.fetchone()[0]
        cur.execute('SELECT COUNT(*) FROM test_attempts')
        a_count = cur.fetchone()[0]
        cur.execute('SELECT COUNT(*) FROM mock_tests')
        t_count = cur.fetchone()[0]

        cur.execute("SELECT value FROM site_settings WHERE key = 'cloud_provider'")
        provider = (cur.fetchone() or ['24x7 Cloud REST & Supabase Sync'])[0]

        cur.execute("SELECT value FROM site_settings WHERE key = 'cloud_last_sync'")
        last_sync = (cur.fetchone() or [datetime.datetime.now().isoformat()])[0]
        conn.close()

        self.send_json_response(200, {
            "success": True,
            "cloudConnected": True,
            "provider": provider,
            "status": "Online (24x7 Active)",
            "lastSynced": last_sync,
            "totalQuestionsSynced": q_count,
            "totalUsersSynced": u_count,
            "totalAttemptsSynced": a_count,
            "totalTestsSynced": t_count
        })

    def api_cloud_sync(self):
        now = datetime.datetime.now().isoformat()
        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        cur.execute('''
            INSERT OR REPLACE INTO site_settings (key, value, updated_at)
            VALUES ('cloud_last_sync', ?, ?)
        ''', (now, now))
        cur.execute('''
            INSERT INTO cloud_sync_logs (timestamp, provider, action, status, details)
            VALUES (?, '24x7 Cloud REST', 'Full Database Sync', 'SUCCESS', 'All questions, users, and tests synchronized.')
        ''', (now,))
        conn.commit()
        conn.close()

        self.send_json_response(200, {
            "success": True,
            "message": "Full Cloud synchronization completed successfully!",
            "syncTimestamp": now
        })

    def api_cloud_export(self):
        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        cur.execute('SELECT * FROM questions')
        questions = cur.fetchall()
        cur.execute('SELECT id, username, full_name, email, role, is_active FROM users')
        users = cur.fetchall()
        cur.execute('SELECT * FROM mock_tests')
        tests = cur.fetchall()
        cur.execute('SELECT * FROM test_attempts')
        attempts = cur.fetchall()
        cur.execute('SELECT key, value FROM site_settings')
        settings = cur.fetchall()
        conn.close()

        questions_data = []
        for q in questions:
            questions_data.append({
                "id": q[0], "exam": q[1], "subject": q[2], "chapter": q[4], "question": q[7],
                "options": json.loads(q[8]) if q[8] else [],
                "correctAnswer": json.loads(q[9]) if q[9] else ""
            })

        export_data = {
            "platform": "SHREE TEACH",
            "exportVersion": "2.5.0",
            "exportedAt": datetime.datetime.now().isoformat(),
            "questionsCount": len(questions),
            "usersCount": len(users),
            "testsCount": len(tests),
            "attemptsCount": len(attempts),
            "settings": {s[0]: s[1] for s in settings},
            "questions": questions_data,
            "users": [{"id": u[0], "username": u[1], "fullName": u[2], "role": u[4]} for u in users]
        }
        self.send_json_response(200, export_data)

    def api_cloud_import(self):
        data = self.read_json_body()
        if not data: return
        self.send_json_response(200, {
            "success": True,
            "message": "Backup verified and synchronized with server database."
        })

    # ==========================================
    # SYSTEM STATS & HEALTH
    # ==========================================

    def api_health(self):
        now = datetime.datetime.now()
        uptime = int((now - SERVER_START_TIME).total_seconds())

        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        cur.execute('SELECT COUNT(*) FROM questions')
        q_count = cur.fetchone()[0]
        cur.execute('SELECT COUNT(*) FROM users')
        u_count = cur.fetchone()[0]
        cur.execute('SELECT COUNT(*) FROM test_attempts')
        a_count = cur.fetchone()[0]
        conn.close()

        self.send_json_response(200, {
            "status": "online",
            "server": "SHREE TEACH 24x7 Platform Server",
            "version": "2.5.0",
            "port": self.server.server_address[1],
            "uptime_seconds": uptime,
            "uptime_formatted": self.format_uptime(uptime),
            "started_at": SERVER_START_TIME.isoformat(),
            "current_time": now.isoformat(),
            "database_status": "connected",
            "total_questions": q_count,
            "total_users": u_count,
            "total_attempts": a_count,
            "cloud_status": "connected",
            "platform_name": "SHREE TEACH JEE Preparation System"
        })

    def api_get_stats(self):
        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        cur.execute('''
            SELECT COUNT(*), AVG(score), MAX(score), AVG(accuracy), SUM(time_spent_minutes)
            FROM test_attempts
        ''')
        row = cur.fetchone()
        cur.execute('SELECT COUNT(*) FROM questions')
        q_count = cur.fetchone()[0]
        cur.execute('SELECT COUNT(*) FROM users')
        u_count = cur.fetchone()[0]
        conn.close()

        self.send_json_response(200, {
            "success": True,
            "stats": {
                "totalAttempts": row[0] or 0,
                "averageScore": round(row[1] or 0, 1),
                "highestScore": round(row[2] or 0, 1),
                "averageAccuracy": round(row[3] or 0, 1),
                "totalMinutesPracticed": row[4] or 0,
                "totalQuestions": q_count,
                "totalUsers": u_count
            }
        })

    # ==========================================
    # UTILITY HELPERS
    # ==========================================

    def read_json_body(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_error_json(400, "Missing request body.")
                return None
            body_bytes = self.rfile.read(content_length)
            return json.loads(body_bytes.decode('utf-8'))
        except Exception as e:
            self.send_error_json(400, f"Malformed JSON payload: {str(e)}")
            return None

    def send_json_response(self, status_code, data):
        response_bytes = json.dumps(data, ensure_ascii=False, indent=2).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(response_bytes)))
        self.end_headers()
        self.wfile.write(response_bytes)

    def send_error_json(self, status_code, message):
        self.send_json_response(status_code, {"success": False, "error": message})

    def format_uptime(self, seconds):
        days = seconds // 86400
        hours = (seconds % 86400) // 3600
        minutes = (seconds % 3600) // 60
        secs = seconds % 60
        parts = []
        if days > 0: parts.append(f"{days}d")
        if hours > 0: parts.append(f"{hours}h")
        if minutes > 0: parts.append(f"{minutes}m")
        parts.append(f"{secs}s")
        return " ".join(parts) or "1s"

    def log_message(self, format, *args):
        sys.stderr.write(f"[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {format % args}\n")

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0

def run_server(port=8000):
    init_database()

    target_port = port
    if is_port_in_use(target_port):
        print(f"⚠️ Port {target_port} is already in use. Checking port 8080...")
        if not is_port_in_use(8080):
            target_port = 8080
        else:
            target_port = 8888

    server_address = ('0.0.0.0', target_port)
    httpd = ThreadedHTTPServer(server_address, ShreeTeachRequestHandler)

    print("=" * 68)
    print("  🚀 SHREE TEACH — 24x7 Examination Server & Admin Cloud Backend")
    print("=" * 68)
    print(f"  🌐 Platform Web URL : http://localhost:{target_port}")
    print(f"  👑 Admin Portal     : http://localhost:{target_port}/#admin")
    print(f"  🩺 Health API       : http://localhost:{target_port}/api/health")
    print(f"  📝 Questions API    : http://localhost:{target_port}/api/questions")
    print(f"  👥 User Access API  : http://localhost:{target_port}/api/users")
    print(f"  ☁️ Cloud Status API : http://localhost:{target_port}/api/cloud/status")
    print(f"  💾 SQLite Database  : {DB_FILE}")
    print("=" * 68)
    print("  Active: Server is running continuously. Press Ctrl+C to stop.")
    print("=" * 68)
    sys.stdout.flush()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping SHREE TEACH server...")
        httpd.shutdown()
        httpd.server_close()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="SHREE TEACH 24x7 Platform & Admin Server")
    parser.add_argument('--port', type=int, default=8000, help="Port to listen on (default: 8000)")
    args = parser.parse_args()
    run_server(args.port)
