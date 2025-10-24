# Database Setup & Schema Documentation

## Overview

The LUCT Reporting System uses MySQL to store all data for authentication, lecture reports, monitoring, ratings, and student management. This document describes the complete database schema and how to set it up.

## Database Tables

### Core Authentication & Users

#### `faculties`

Stores faculty/department information.

- `id` (INT, PK): Unique identifier
- `faculty_code` (VARCHAR): Unique faculty code (e.g., FICT, FABE)
- `faculty_name` (VARCHAR): Full name
- `description` (TEXT): Faculty description
- **Indexes**: `faculty_code` for quick lookups

#### `users`

Stores all user accounts across the system.

- `id` (INT, PK): Internal unique identifier
- `user_id` (VARCHAR): Display ID (e.g., LEC001, STU001)
- `first_name`, `last_name` (VARCHAR): User names
- `email` (VARCHAR): Unique email for login
- `password_hash` (VARCHAR): Bcrypt hashed password
- `role` (ENUM): One of `student`, `lecturer`, `principal_lecturer`, `program_leader`, `admin`
- `faculty_id` (FK): References faculty
- `is_approved` (BOOLEAN): Approval status for staff
- **Indexes**: `email`, `role`, `user_id`, `faculty_id` for efficient queries
- **Features**:
  - Email-based authentication
  - Bcrypt password hashing (done in application)
  - Role-based access control
  - Faculty affiliation tracking

#### `registration_codes`

Controls staff account registration via activation codes.

- `id` (INT, PK): Unique identifier
- `code` (VARCHAR): Registration code (e.g., FICT-LECT-2025)
- `role` (ENUM): `lecturer`, `principal_lecturer`, or `program_leader`
- `faculty_id` (FK): Faculty this code grants access to
- `is_active` (BOOLEAN): Code activation status
- `expires_at` (DATE): Optional expiration date
- **Indexes**: `code`, `role`, `is_active` for validation
- **Features**:
  - Prevents unauthorized account creation
  - Role-specific codes
  - Time-based expiration support

### Academic Structure

#### `programs`

Academic programs/degrees offered.

- `id` (INT, PK): Unique identifier
- `program_code` (VARCHAR): Unique code (e.g., BSC-ICT)
- `program_name` (VARCHAR): Full program name
- `level` (VARCHAR): Bachelor, Master, Diploma, etc.
- `duration_years` (INT): Program length
- `faculty_id` (FK): References faculty
- **Indexes**: `faculty_id`, `program_code`

#### `courses`

Individual courses within programs.

- `id` (INT, PK): Unique identifier
- `course_code` (VARCHAR): Unique code (e.g., SEW2101)
- `course_name` (VARCHAR): Course title
- `credits` (INT): Credit points
- `program_id` (FK): Primary program
- `faculty_id` (FK): References faculty
- `semester` (INT): Typical offering semester (1 or 2)
- **Indexes**: `faculty_id`, `course_code`, `program_id`

#### `classes`

Class sections for courses.

- `id` (INT, PK): Unique identifier
- `class_code` (VARCHAR): Unique section code (e.g., SEW2101-A)
- `course_id` (FK): References course
- `lecturer_id` (FK): Assigned lecturer (nullable)
- `academic_year` (INT): Year (e.g., 2025)
- `semester` (INT): 1 or 2
- `scheduled_time` (TIME): Class time (e.g., 09:00:00)
- `venue` (VARCHAR): Classroom/location
- `mode_of_delivery` (VARCHAR): On Campus, Hybrid, Online
- **Indexes**: `course_id`, `lecturer_id`, `class_code`

### Enrollment Management

#### `student_enrollments`

Tracks student enrollment in classes.

- `id` (INT, PK): Unique identifier
- `student_id` (FK): References student user
- `class_id` (FK): References class
- `enrollment_status` (ENUM): `active`, `withdrawn`, or `completed`
- `enrolled_at` (TIMESTAMP): Enrollment date
- **Unique Constraint**: One enrollment per student per class
- **Indexes**: `student_id`, `class_id`, `enrollment_status`
- **Features**:
  - Tracks enrollment history
  - Supports status transitions
  - Used to calculate class rosters

### Reporting & Quality Assurance

#### `reports`

Lecture reports submitted by lecturers.

- `id` (INT, PK): Unique identifier
- `faculty_id` (FK): Faculty oversight
- `class_id` (FK): References class
- `course_id` (FK): References course
- `lecturer_id` (FK): Lecturer who submitted
- `date_of_lecture` (DATE): When lecture occurred
- `week_of_reporting` (INT): Academic week number
- `actual_students_present` (INT): Attendance count
- `scheduled_lecture_time` (TIME): Originally scheduled time
- `venue` (VARCHAR): Where lecture happened
- `topic_taught` (TEXT): What was covered
- `learning_outcomes` (TEXT): Expected outcomes
- `recommendations` (TEXT): Lecturer notes
- `status` (ENUM): `draft`, `submitted`, `reviewed`, `approved`
- **Indexes**: `faculty_id`, `lecturer_id`, `date_of_lecture`, `class_id`, `status`
- **Composite Indexes**: `(faculty_id, date_of_lecture)`, `(lecturer_id, date_of_lecture)`
- **Features**:
  - Complete lesson documentation
  - Attendance tracking
  - Supports weekly reporting workflows
  - Status progression for approval workflows

#### `monitoring`

Quality assurance records on lectures (created by principal lecturers).

- `id` (INT, PK): Unique identifier
- `report_id` (FK): References report being monitored
- `monitor_user_id` (FK): Principal lecturer creating record
- `findings` (TEXT): Observations and findings
- `recommendations` (TEXT): Improvement recommendations
- `status` (ENUM): `pending`, `in_progress`, `satisfactory`, `needs_improvement`
- `follow_up_date` (DATE): Next scheduled review
- **Indexes**: `report_id`, `status`
- **Features**:
  - Tracks monitoring activities
  - Links observations to reports
  - Supports follow-up scheduling

#### `ratings`

Student feedback and ratings on lectures.

- `id` (INT, PK): Unique identifier
- `report_id` (FK): References report being rated
- `student_id` (FK): Student providing feedback
- `rating` (INT): 1-5 star rating
- `comments` (TEXT): Student comments
- **Unique Constraint**: One rating per student per report
- **Indexes**: `report_id`, `student_id`, `rating`
- **Features**:
  - Captures student satisfaction
  - Aggregable for trend analysis
  - Links feedback to specific lectures

## Setup Instructions

### 1. Create Database

```sql
CREATE DATABASE luct_reporting CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Run Schema Script

```bash
mysql -u [username] -p luct_reporting < backend/src/db/schema.sql
```

Or execute the SQL file through MySQL client:

```sql
USE luct_reporting;
SOURCE backend/src/db/schema.sql;
```

### 3. Configure Environment Variables

Create `.env` in the backend directory:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=luct_reporting
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=http://localhost:5173
```

### 4. Start Application

The `ensureDemoData.js` script automatically seeds demo user accounts during startup:

```bash
cd backend
npm install
npm start
```

Demo credentials:

- **Program Leader**: `pl.demo@luct.ac.ls` / `secure123`
- **Principal Lecturer**: `thabo.makoanyane@luct.ac.ls` / `secure123`
- **Lecturer**: `boitumelo.tebello@luct.ac.ls` / `secure123`
- **Student**: `lerato.sechele@luct.ac.ls` / `learn123`

## Key Design Decisions

### 1. Composite Primary Keys

Used `(student_id, class_id)` unique constraint to prevent duplicate enrollments.

### 2. Role-Based Access

- Roles stored as ENUM for efficiency
- Combined with faculty_id for role-scoped access
- Principal lecturers see faculty reports; lecturers see their own

### 3. Reporting Status Workflow

- `draft`: In progress
- `submitted`: Pending review
- `reviewed`: Acknowledged by PRL
- `approved`: Final status
- Allows workflow tracking and follow-up management

### 4. Soft Deletions vs Hard Deletes

- Used CASCADE deletes on foreign keys for simplicity
- Historical data preserved via created_at/updated_at timestamps
- Consider soft deletes for audit requirements

### 5. Week Number Tracking

- `week_of_reporting` calculated in application (ISO week)
- Allows filtering reports by academic week
- Supports weekly reporting requirements

### 6. Attendance Calculation

- Actual attendance in `reports` table
- Total enrolled via subquery on `student_enrollments`
- Attendance % calculated in application or via CASE in queries

## Common Queries

### Get Lecturer's Reports for This Month

```sql
SELECT r.* FROM reports r
WHERE r.lecturer_id = ?
  AND YEAR(r.date_of_lecture) = YEAR(CURDATE())
  AND MONTH(r.date_of_lecture) = MONTH(CURDATE());
```

### Get Faculty Monitoring Records

```sql
SELECT m.*, r.topic_taught, c.class_code
FROM monitoring m
JOIN reports r ON r.id = m.report_id
LEFT JOIN classes c ON c.id = r.class_id
WHERE r.faculty_id = ?
ORDER BY m.created_at DESC;
```

### Get Student's Enrolled Classes

```sql
SELECT c.* FROM classes c
JOIN student_enrollments se ON se.class_id = c.id
WHERE se.student_id = ?
  AND se.enrollment_status = 'active';
```

### Calculate Faculty Report Statistics

```sql
SELECT
  COUNT(*) as total_reports,
  AVG(actual_students_present) as avg_attendance,
  DATE_FORMAT(date_of_lecture, '%Y-%m') as month
FROM reports
WHERE faculty_id = ?
GROUP BY DATE_FORMAT(date_of_lecture, '%Y-%m');
```

## Performance Optimization

### Indexes in Place

- ✅ Email for user lookups (frequent in auth)
- ✅ Role for dashboard role checks
- ✅ Date fields for range queries
- ✅ Foreign keys for JOIN operations
- ✅ Composite indexes for common query patterns

### Query Optimization Tips

1. Always use indexed columns in WHERE clauses
2. Avoid OR conditions with different indexed columns
3. Use EXPLAIN to analyze slow queries
4. Consider caching faculty/program data that changes infrequently

## Maintenance

### Regular Backups

```bash
mysqldump -u [user] -p luct_reporting > backup_$(date +%Y%m%d).sql
```

### Cleanup Old Data

```sql
-- Archive old reports (optional)
DELETE FROM reports WHERE date_of_lecture < DATE_SUB(CURDATE(), INTERVAL 5 YEAR);
```

## Troubleshooting

### Foreign Key Constraint Errors

- Ensure referenced records exist before insert/update
- Check CASCADE rules on delete operations
- Verify data types match between FK and referenced columns

### Duplicate Entry Errors

- Check UNIQUE constraints (email, course_code, class_code, user_id)
- Verify unique enrollment constraint on (student_id, class_id)

### Slow Queries

- Check EXPLAIN plan
- Verify indexes are being used
- Consider adding composite indexes for complex queries
