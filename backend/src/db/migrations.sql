-- ============================================================================
-- LUCT Reporting System - Enhanced Schema with Semester/Year Structure
-- ============================================================================
-- Migration script to add academic year and semester support
-- Academic Year: August to May (next year)
-- Each academic year has 2 semesters
-- ============================================================================

-- ============================================================================
-- ALTER TABLE: programs
-- Add academic year and semester tracking
-- ============================================================================
ALTER TABLE programs ADD COLUMN academic_year VARCHAR(10) DEFAULT '2024-2025' COMMENT 'e.g., 2024-2025';

-- ============================================================================
-- ALTER TABLE: courses  
-- Update to support semester and academic year per program
-- ============================================================================
ALTER TABLE courses ADD COLUMN academic_year VARCHAR(10) DEFAULT '2024-2025' COMMENT 'Academic year (e.g., 2024-2025)';

-- ============================================================================
-- CREATE TABLE: course_offerings
-- Purpose: Track course offerings per program, semester, and academic year
-- This provides flexibility for courses offered in different semesters/years
-- ============================================================================
CREATE TABLE IF NOT EXISTS course_offerings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  program_id INT NOT NULL,
  academic_year VARCHAR(10) NOT NULL COMMENT 'e.g., 2024-2025',
  semester INT NOT NULL COMMENT '1 or 2',
  year_level INT COMMENT 'Year of program (1, 2, 3, 4)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
  FOREIGN KEY (program_id) REFERENCES programs (id) ON DELETE CASCADE,
  UNIQUE KEY unique_offering (course_id, program_id, academic_year, semester),
  INDEX idx_program_year (program_id, academic_year),
  INDEX idx_academic_year (academic_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ALTER TABLE: classes
-- Ensure proper semester and academic year tracking
-- ============================================================================
ALTER TABLE classes ADD COLUMN academic_year VARCHAR(10) DEFAULT '2024-2025' COMMENT 'Academic year';
ALTER TABLE classes MODIFY COLUMN semester INT COMMENT '1 or 2';

-- ============================================================================
-- CREATE TABLE: export_logs
-- Purpose: Track export activities for audit trail
-- ============================================================================
CREATE TABLE IF NOT EXISTS export_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  export_type VARCHAR(50) COMMENT 'PDF, Excel, CSV',
  export_module VARCHAR(100) COMMENT 'Reports, Users, etc.',
  filter_criteria JSON COMMENT 'Filters applied during export',
  record_count INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- CREATE TABLE: analytics_snapshots
-- Purpose: Store pre-calculated analytics for performance
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  snapshot_date DATE NOT NULL,
  metric_type VARCHAR(100) COMMENT 'users_by_role, report_trends, etc.',
  metric_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_snapshot (snapshot_date, metric_type),
  INDEX idx_snapshot_date (snapshot_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- CREATE TABLE: audit_logs
-- Purpose: Track all admin actions for accountability
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  action VARCHAR(100) COMMENT 'CREATE, UPDATE, DELETE, APPROVE, etc.',
  entity_type VARCHAR(100) COMMENT 'User, Faculty, Program, Course, etc.',
  entity_id INT,
  old_values JSON COMMENT 'Previous values',
  new_values JSON COMMENT 'New values',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_admin_id (admin_id),
  INDEX idx_created_at (created_at),
  INDEX idx_entity_type (entity_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- INSERT DEMO DATA: BSCSM Program and Courses
-- ============================================================================

-- Insert BSCSM Program (BSc in Software Engineering with Multimedia)
-- Only insert if it doesn't already exist
INSERT INTO programs (program_code, program_name, level, duration_years, faculty_id, academic_year, description)
SELECT 'BSCSM', 'BSc in Software Engineering with Multimedia', 'Bachelor', 4, f.id, '2024-2025', 
       'Bachelor of Science in Software Engineering with Multimedia - 4-year degree program'
FROM faculties f
WHERE f.faculty_code = 'FICT'
  AND NOT EXISTS (SELECT 1 FROM programs WHERE program_code = 'BSCSM')
LIMIT 1;

-- Get the program ID for use in subsequent inserts
SET @program_id = (SELECT id FROM programs WHERE program_code = 'BSCSM' LIMIT 1);
SET @faculty_id = (SELECT id FROM faculties WHERE faculty_code = 'FICT' LIMIT 1);

-- Insert Year 2, Semester 1 Courses (only if they don't exist)
-- 1. BIWD2110 - Introduction to Web Design
INSERT INTO courses (course_code, course_name, credits, program_id, faculty_id, semester, academic_year, description)
SELECT 'BIWD2110', 'Introduction to Web Design', 3, @program_id, @faculty_id, 1, '2024-2025', 
        'Fundamentals of web design including HTML, CSS, and basic responsive design principles'
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE course_code = 'BIWD2110');

-- 2. DCM101 - Data Communication
INSERT INTO courses (course_code, course_name, credits, program_id, faculty_id, semester, academic_year, description)
SELECT 'DCM101', 'Data Communication', 3, @program_id, @faculty_id, 1, '2024-2025', 
        'Principles of data communication, networking fundamentals, and transmission media'
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE course_code = 'DCM101');

-- 3. PRG101 - OOP 1
INSERT INTO courses (course_code, course_name, credits, program_id, faculty_id, semester, academic_year, description)
SELECT 'PRG101', 'OOP 1', 3, @program_id, @faculty_id, 1, '2024-2025', 
        'Object-Oriented Programming fundamentals including classes, objects, inheritance, and polymorphism'
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE course_code = 'PRG101');

-- 4. DCML201 - Data Communication LAB
INSERT INTO courses (course_code, course_name, credits, program_id, faculty_id, semester, academic_year, description)
SELECT 'DCML201', 'Data Communication LAB', 2, @program_id, @faculty_id, 1, '2024-2025', 
        'Practical laboratory sessions for data communication concepts and networking tools'
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE course_code = 'DCML201');

-- 5. MMT301 - Multimedia Technology
INSERT INTO courses (course_code, course_name, credits, program_id, faculty_id, semester, academic_year, description)
SELECT 'MMT301', 'Multimedia Technology', 3, @program_id, @faculty_id, 1, '2024-2025', 
        'Digital multimedia concepts including graphics, audio, video, and interactive media'
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE course_code = 'MMT301');

-- 6. CGD401 - Computer Graphics
INSERT INTO courses (course_code, course_name, credits, program_id, faculty_id, semester, academic_year, description)
SELECT 'CGD401', 'Computer Graphics', 3, @program_id, @faculty_id, 1, '2024-2025', 
        'Fundamentals of computer graphics, 2D/3D graphics, rendering, and visualization techniques'
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE course_code = 'CGD401');

-- Create Course Offerings (Link courses to program for Year 2, Semester 1)
-- The UNIQUE constraint on course_offerings will prevent duplicates
INSERT IGNORE INTO course_offerings (course_id, program_id, academic_year, semester, year_level)
SELECT c.id, @program_id, '2024-2025', 1, 2
FROM courses c
WHERE c.course_code IN ('BIWD2110', 'DCM101', 'PRG101', 'DCML201', 'MMT301', 'CGD401')
  AND c.id IS NOT NULL;

-- Get course IDs
SET @course_biwd = (SELECT id FROM courses WHERE course_code = 'BIWD2110' LIMIT 1);
SET @course_dcm = (SELECT id FROM courses WHERE course_code = 'DCM101' LIMIT 1);
SET @course_prg = (SELECT id FROM courses WHERE course_code = 'PRG101' LIMIT 1);
SET @course_dcml = (SELECT id FROM courses WHERE course_code = 'DCML201' LIMIT 1);
SET @course_mmt = (SELECT id FROM courses WHERE course_code = 'MMT301' LIMIT 1);
SET @course_cgd = (SELECT id FROM courses WHERE course_code = 'CGD401' LIMIT 1);

-- Create Classes (1 class per course per week)
-- Only insert if class doesn't already exist
-- Note: lecturer_id will be NULL initially, admin can assign lecturers later
INSERT INTO classes (class_code, course_id, lecturer_id, academic_year, semester, scheduled_time, venue, mode_of_delivery)
SELECT 'BIWD2110-W1', @course_biwd, NULL, '2024-2025', 1, '09:00:00', 'Lab 101', 'On Campus'
WHERE NOT EXISTS (SELECT 1 FROM classes WHERE class_code = 'BIWD2110-W1');

INSERT INTO classes (class_code, course_id, lecturer_id, academic_year, semester, scheduled_time, venue, mode_of_delivery)
SELECT 'DCM101-W1', @course_dcm, NULL, '2024-2025', 1, '10:00:00', 'Room 201', 'On Campus'
WHERE NOT EXISTS (SELECT 1 FROM classes WHERE class_code = 'DCM101-W1');

INSERT INTO classes (class_code, course_id, lecturer_id, academic_year, semester, scheduled_time, venue, mode_of_delivery)
SELECT 'PRG101-W1', @course_prg, NULL, '2024-2025', 1, '11:00:00', 'Lab 102', 'On Campus'
WHERE NOT EXISTS (SELECT 1 FROM classes WHERE class_code = 'PRG101-W1');

INSERT INTO classes (class_code, course_id, lecturer_id, academic_year, semester, scheduled_time, venue, mode_of_delivery)
SELECT 'DCML201-W1', @course_dcml, NULL, '2024-2025', 1, '14:00:00', 'Lab 103', 'On Campus'
WHERE NOT EXISTS (SELECT 1 FROM classes WHERE class_code = 'DCML201-W1');

INSERT INTO classes (class_code, course_id, lecturer_id, academic_year, semester, scheduled_time, venue, mode_of_delivery)
SELECT 'MMT301-W1', @course_mmt, NULL, '2024-2025', 1, '15:00:00', 'Lab 104', 'On Campus'
WHERE NOT EXISTS (SELECT 1 FROM classes WHERE class_code = 'MMT301-W1');

INSERT INTO classes (class_code, course_id, lecturer_id, academic_year, semester, scheduled_time, venue, mode_of_delivery)
SELECT 'CGD401-W1', @course_cgd, NULL, '2024-2025', 1, '16:00:00', 'Lab 105', 'On Campus'
WHERE NOT EXISTS (SELECT 1 FROM classes WHERE class_code = 'CGD401-W1');

-- ============================================================================
-- Additional functionality: Update classes table to ensure academic_year column
-- ============================================================================
ALTER TABLE classes MODIFY COLUMN academic_year VARCHAR(10) DEFAULT '2024-2025' COMMENT 'Academic year format: YYYY-YYYY';
