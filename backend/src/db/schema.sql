-- ============================================================================
-- LUCT Reporting System - Complete MySQL Database Schema
-- ============================================================================
-- This script creates all tables required for the LUCT Reporting System
-- supporting authentication, role-based dashboards, lecture reports, 
-- monitoring, ratings, and student enrollment management.
-- ============================================================================

-- Drop existing tables (optional - comment out after first run)
-- DROP TABLE IF EXISTS ratings;
-- DROP TABLE IF EXISTS monitoring;
-- DROP TABLE IF EXISTS reports;
-- DROP TABLE IF EXISTS student_enrollments;
-- DROP TABLE IF EXISTS classes;
-- DROP TABLE IF EXISTS programs;
-- DROP TABLE IF EXISTS courses;
-- DROP TABLE IF EXISTS registration_codes;
-- DROP TABLE IF EXISTS users;
-- DROP TABLE IF EXISTS faculties;

-- ============================================================================
-- TABLE: faculties
-- Purpose: Store faculty/department information
-- ============================================================================
CREATE TABLE IF NOT EXISTS faculties (
  id INT AUTO_INCREMENT PRIMARY KEY,
  faculty_code VARCHAR(10) UNIQUE NOT NULL COMMENT 'Faculty code (e.g., FICT, FABE)',
  faculty_name VARCHAR(255) NOT NULL COMMENT 'Full faculty name',
  description TEXT COMMENT 'Faculty description',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_faculty_code (faculty_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: users
-- Purpose: Store all user accounts (lecturers, students, admin, etc.)
-- Features: 
--   - Support multiple roles (lecturer, student, principal_lecturer, program_leader, admin)
--   - Email-based authentication
--   - Bcrypt password hashing
--   - Faculty affiliation
--   - Approval workflow
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(20) UNIQUE NOT NULL COMMENT 'Display user ID (e.g., LEC001, STU001)',
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL COMMENT 'Bcrypt hashed password',
  role ENUM('student', 'lecturer', 'principal_lecturer', 'program_leader', 'admin') NOT NULL,
  faculty_id INT COMMENT 'Foreign key to faculties table',
  is_approved BOOLEAN DEFAULT FALSE COMMENT 'Approval status for staff accounts',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (faculty_id) REFERENCES faculties (id) ON DELETE SET NULL,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_user_id (user_id),
  INDEX idx_faculty_id (faculty_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: registration_codes
-- Purpose: Control access to staff registration via registration codes
-- Features:
--   - Role-based codes (lecturer, principal_lecturer, program_leader)
--   - Faculty-specific codes
--   - Expiration dates
--   - Activation/deactivation
-- ============================================================================
CREATE TABLE IF NOT EXISTS registration_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  role ENUM('lecturer', 'principal_lecturer', 'program_leader') NOT NULL,
  faculty_id INT COMMENT 'Faculty this code grants access to',
  is_active BOOLEAN DEFAULT TRUE,
  expires_at DATE COMMENT 'Code expiration date',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (faculty_id) REFERENCES faculties (id) ON DELETE SET NULL,
  INDEX idx_code (code),
  INDEX idx_role (role),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: programs
-- Purpose: Store academic programs/degrees
-- Features:
--   - Program codes and names
--   - Level (e.g., Bachelor, Master)
--   - Duration in years
--   - Faculty affiliation
-- ============================================================================
CREATE TABLE IF NOT EXISTS programs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  program_code VARCHAR(20) UNIQUE NOT NULL,
  program_name VARCHAR(255) NOT NULL,
  level VARCHAR(50) COMMENT 'e.g., Bachelor, Master, Diploma',
  duration_years INT,
  description TEXT,
  faculty_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (faculty_id) REFERENCES faculties (id) ON DELETE CASCADE,
  INDEX idx_faculty_id (faculty_id),
  INDEX idx_program_code (program_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: courses
-- Purpose: Store course information
-- Features:
--   - Course codes and names
--   - Credit points
--   - Semester information
--   - Faculty and program association
-- ============================================================================
CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_code VARCHAR(20) UNIQUE NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  credits INT DEFAULT 3,
  program_id INT COMMENT 'Primary program for this course',
  faculty_id INT NOT NULL,
  semester INT COMMENT 'Typical semester offering (1 or 2)',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (faculty_id) REFERENCES faculties (id) ON DELETE CASCADE,
  FOREIGN KEY (program_id) REFERENCES programs (id) ON DELETE SET NULL,
  INDEX idx_faculty_id (faculty_id),
  INDEX idx_course_code (course_code),
  INDEX idx_program_id (program_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: classes
-- Purpose: Store class/section information for courses
-- Features:
--   - Class codes and sections
--   - Academic year and semester
--   - Scheduled time and venue
--   - Delivery mode (On Campus, Hybrid, Online)
--   - Lecturer assignment
-- ============================================================================
CREATE TABLE IF NOT EXISTS classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_code VARCHAR(30) UNIQUE NOT NULL,
  course_id INT NOT NULL,
  lecturer_id INT COMMENT 'Assigned lecturer',
  academic_year INT,
  semester INT COMMENT '1 or 2',
  scheduled_time TIME COMMENT 'e.g., 09:00:00',
  venue VARCHAR(100),
  mode_of_delivery VARCHAR(50) COMMENT 'On Campus, Hybrid, Online',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
  FOREIGN KEY (lecturer_id) REFERENCES users (id) ON DELETE SET NULL,
  INDEX idx_course_id (course_id),
  INDEX idx_lecturer_id (lecturer_id),
  INDEX idx_class_code (class_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: student_enrollments
-- Purpose: Track student enrollment in classes
-- Features:
--   - Enrollment status tracking (active, withdrawn, completed)
--   - Enrollment date tracking
--   - Supports inactive/historical records
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  class_id INT NOT NULL,
  enrollment_status ENUM('active', 'withdrawn', 'completed') DEFAULT 'active',
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE,
  UNIQUE KEY unique_enrollment (student_id, class_id),
  INDEX idx_student_id (student_id),
  INDEX idx_class_id (class_id),
  INDEX idx_enrollment_status (enrollment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: reports
-- Purpose: Store lecture reports submitted by lecturers
-- Features:
--   - Lecture attendance tracking
--   - Topic and learning outcomes documentation
--   - Weekly reporting structure
--   - Status tracking (submitted, reviewed, etc.)
--   - Faculty oversight
-- ============================================================================
CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  faculty_id INT NOT NULL,
  class_id INT,
  course_id INT,
  lecturer_id INT NOT NULL,
  date_of_lecture DATE NOT NULL,
  week_of_reporting INT COMMENT 'Week number in academic year',
  actual_students_present INT DEFAULT 0,
  scheduled_lecture_time TIME COMMENT 'Originally scheduled time',
  venue VARCHAR(100),
  topic_taught TEXT NOT NULL COMMENT 'What was taught',
  learning_outcomes TEXT NOT NULL COMMENT 'Expected learning outcomes',
  recommendations TEXT COMMENT 'Lecturer recommendations',
  status ENUM('draft', 'submitted', 'reviewed', 'approved') DEFAULT 'submitted',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (faculty_id) REFERENCES faculties (id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE SET NULL,
  FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE SET NULL,
  FOREIGN KEY (lecturer_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_faculty_id (faculty_id),
  INDEX idx_lecturer_id (lecturer_id),
  INDEX idx_date_of_lecture (date_of_lecture),
  INDEX idx_class_id (class_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: monitoring
-- Purpose: Store monitoring/quality assurance records on lectures
-- Features:
--   - Principal lecturer monitoring of reports
--   - Findings and recommendations documentation
--   - Status tracking (pending, in_progress, satisfactory, needs_improvement)
--   - Audit trail with timestamps
-- ============================================================================
CREATE TABLE IF NOT EXISTS monitoring (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  monitor_user_id INT COMMENT 'Principal lecturer who created this record',
  findings TEXT NOT NULL COMMENT 'What was observed/identified',
  recommendations TEXT COMMENT 'Recommendations for improvement',
  status ENUM('pending', 'in_progress', 'satisfactory', 'needs_improvement') DEFAULT 'pending',
  follow_up_date DATE COMMENT 'Scheduled follow-up date',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports (id) ON DELETE CASCADE,
  FOREIGN KEY (monitor_user_id) REFERENCES users (id) ON DELETE SET NULL,
  INDEX idx_report_id (report_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: ratings
-- Purpose: Store student ratings/feedback on lectures
-- Features:
--   - Star ratings (1-5)
--   - Student comments
--   - Linked to specific reports
--   - Timestamps for audit trail
-- ============================================================================
CREATE TABLE IF NOT EXISTS ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  student_id INT NOT NULL,
  rating INT NOT NULL COMMENT '1-5 star rating',
  comments TEXT COMMENT 'Student comments/feedback',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports (id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_report_rating (student_id, report_id),
  INDEX idx_report_id (report_id),
  INDEX idx_student_id (student_id),
  INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
-- Additional composite indexes for common query patterns

-- For dashboard queries
ALTER TABLE reports ADD INDEX idx_faculty_date (faculty_id, date_of_lecture);
ALTER TABLE reports ADD INDEX idx_lecturer_date (lecturer_id, date_of_lecture);

-- For enrollment queries
ALTER TABLE student_enrollments ADD INDEX idx_class_status (class_id, enrollment_status);

-- For monitoring queries
ALTER TABLE monitoring ADD INDEX idx_report_created (report_id, created_at);

-- For search and lookup
ALTER TABLE users ADD INDEX idx_email_role (email, role);
ALTER TABLE courses ADD INDEX idx_faculty_program (faculty_id, program_id);
ALTER TABLE classes ADD INDEX idx_course_lecturer (course_id, lecturer_id);

-- ============================================================================
-- SAMPLE DATA (Optional - for development/testing)
-- ============================================================================
-- Insert sample faculties
INSERT IGNORE INTO faculties (faculty_code, faculty_name, description) VALUES
('FICT', 'Faculty of Information & Communication Technology', 'ICT programs and courses'),
('FABE', 'Faculty of Architecture & Built Environment', 'Architecture and built environment programs'),
('FBMG', 'Faculty of Business Management & Globalisation', 'Business and management programs');

-- Note: Demo users are seeded via ensureDemoData.js during application startup
-- to ensure consistent password hashing and user ID generation

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
