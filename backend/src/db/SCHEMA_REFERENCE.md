# Database Schema Reference - Complete Table Documentation

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Detailed Table Definitions](#detailed-table-definitions)
3. [Column Mappings](#column-mappings)
4. [Indexes Summary](#indexes-summary)
5. [Relationships](#relationships)

---

## Quick Reference

| #   | Table Name            | Rows/Year   | Purpose              | Key Fields                           |
| --- | --------------------- | ----------- | -------------------- | ------------------------------------ |
| 1   | `faculties`           | 5-10        | Faculty/departments  | faculty_code, faculty_name           |
| 2   | `users`               | 200-500     | All accounts         | user_id, email, role, faculty_id     |
| 3   | `registration_codes`  | 20-50       | Staff access control | code, role, expires_at               |
| 4   | `programs`            | 20-40       | Academic programs    | program_code, program_name, level    |
| 5   | `courses`             | 50-150      | Individual courses   | course_code, course_name, credits    |
| 6   | `classes`             | 100-300     | Class sections       | class_code, lecturer_id, schedule    |
| 7   | `student_enrollments` | 2,000-5,000 | Enrollment records   | student_id, class_id, status         |
| 8   | `reports`             | 300-1,000   | Lecture reports      | lecturer_id, date_of_lecture, status |
| 9   | `monitoring`          | 50-200      | QA records           | report_id, findings, status          |
| 10  | `ratings`             | 1,000-3,000 | Student feedback     | report_id, student_id, rating        |

---

## Detailed Table Definitions

### 1. TABLE: `faculties`

**Purpose**: Store organizational units/departments

**Physical Specifications**:

- Engine: InnoDB
- Charset: utf8mb4
- Collation: utf8mb4_unicode_ci
- Estimated Size: < 1 KB
- Grow Rate: Negligible

**Columns**:

| Column         | Type         | Constraints             | Default           | Purpose                       |
| -------------- | ------------ | ----------------------- | ----------------- | ----------------------------- |
| `id`           | INT          | PK, AI                  | -                 | Unique identifier             |
| `faculty_code` | VARCHAR(10)  | UNIQUE, NOT NULL, INDEX | -                 | Short code (FICT, FABE, FBMG) |
| `faculty_name` | VARCHAR(255) | NOT NULL                | -                 | Full faculty name             |
| `description`  | TEXT         | -                       | NULL              | Optional description          |
| `created_at`   | TIMESTAMP    | -                       | CURRENT_TIMESTAMP | Record creation               |
| `updated_at`   | TIMESTAMP    | -                       | CURRENT_TIMESTAMP | Last update                   |

**Indexes**:

- PRIMARY KEY: `id`
- UNIQUE: `faculty_code`
- INDEX: `idx_faculty_code`

**Sample Data**:

```
id | faculty_code | faculty_name
1  | FICT         | Faculty of Information & Communication Technology
2  | FABE         | Faculty of Architecture & Built Environment
3  | FBMG         | Faculty of Business Management & Globalisation
```

**Relationships**:

- Used by: `users`, `programs`, `courses`, `registration_codes`

---

### 2. TABLE: `users`

**Purpose**: All user accounts (lecturers, students, admin)

**Physical Specifications**:

- Engine: InnoDB
- Charset: utf8mb4
- Rows: 200-500
- Size: ~200-500 KB
- Grow Rate: 50-200 per semester

**Columns**:

| Column          | Type         | Constraints             | Default           | Purpose                                                      |
| --------------- | ------------ | ----------------------- | ----------------- | ------------------------------------------------------------ |
| `id`            | INT          | PK, AI                  | -                 | Internal ID (used in FKs)                                    |
| `user_id`       | VARCHAR(20)  | UNIQUE, NOT NULL, INDEX | -                 | Display ID (LEC001, STU001)                                  |
| `first_name`    | VARCHAR(100) | NOT NULL                | -                 | First name                                                   |
| `last_name`     | VARCHAR(100) | NOT NULL                | -                 | Last name                                                    |
| `email`         | VARCHAR(255) | UNIQUE, NOT NULL, INDEX | -                 | Login email                                                  |
| `password_hash` | VARCHAR(255) | NOT NULL                | -                 | Bcrypt hash (not plain text!)                                |
| `role`          | ENUM         | NOT NULL, INDEX         | -                 | student, lecturer, principal_lecturer, program_leader, admin |
| `faculty_id`    | INT          | FK, INDEX               | NULL              | References faculties                                         |
| `is_approved`   | BOOLEAN      | -                       | FALSE             | Approval status for staff                                    |
| `created_at`    | TIMESTAMP    | -                       | CURRENT_TIMESTAMP | Account creation date                                        |
| `updated_at`    | TIMESTAMP    | -                       | CURRENT_TIMESTAMP | Last update                                                  |

**Indexes**:

- PRIMARY KEY: `id`
- UNIQUE: `user_id`, `email`
- INDEX: `idx_email`, `idx_role`, `idx_user_id`, `idx_faculty_id`
- COMPOSITE: `idx_email_role`

**Foreign Keys**:

- `faculty_id` → `faculties(id)` ON DELETE SET NULL

**Roles Explained**:

- `student`: Enrolls in classes, submits ratings
- `lecturer`: Creates class reports, tracks attendance
- `principal_lecturer`: Monitors lecturer reports, creates monitoring records
- `program_leader`: Oversees program, classes, reports
- `admin`: System administrator

---

### 3. TABLE: `registration_codes`

**Purpose**: Control staff registration via codes

**Physical Specifications**:

- Engine: InnoDB
- Charset: utf8mb4
- Rows: 20-50
- Size: < 50 KB

**Columns**:

| Column       | Type         | Constraints             | Default           | Purpose                                                        |
| ------------ | ------------ | ----------------------- | ----------------- | -------------------------------------------------------------- |
| `id`         | INT          | PK, AI                  | -                 | Unique identifier                                              |
| `code`       | VARCHAR(100) | UNIQUE, NOT NULL, INDEX | -                 | Registration code string                                       |
| `role`       | ENUM         | NOT NULL, INDEX         | -                 | Restricted role (lecturer, principal_lecturer, program_leader) |
| `faculty_id` | INT          | FK, INDEX               | NULL              | Faculty this grants access to                                  |
| `is_active`  | BOOLEAN      | NOT NULL, INDEX         | TRUE              | Whether code is usable                                         |
| `expires_at` | DATE         | -                       | NULL              | Expiration date (NULL = never)                                 |
| `created_at` | TIMESTAMP    | -                       | CURRENT_TIMESTAMP | Code creation                                                  |
| `updated_at` | TIMESTAMP    | -                       | CURRENT_TIMESTAMP | Last update                                                    |

**Indexes**:

- PRIMARY KEY: `id`
- UNIQUE: `code`
- INDEX: `idx_code`, `idx_role`, `idx_is_active`

**Foreign Keys**:

- `faculty_id` → `faculties(id)` ON DELETE SET NULL

**Usage Example**:

```
code                | role              | faculty_id | is_active | expires_at
FICT-LECT-2025      | lecturer          | 1          | 1         | 2025-12-31
FICT-PRL-2025       | principal_lecturer| 1          | 1         | 2025-12-31
FICT-PL-2025        | program_leader    | 1          | 1         | 2025-12-31
```

---

### 4. TABLE: `programs`

**Purpose**: Academic degree programs

**Physical Specifications**:

- Engine: InnoDB
- Charset: utf8mb4
- Rows: 20-40
- Size: ~50-100 KB

**Columns**:

| Column           | Type         | Constraints         | Default           | Purpose                   |
| ---------------- | ------------ | ------------------- | ----------------- | ------------------------- |
| `id`             | INT          | PK, AI              | -                 | Unique identifier         |
| `program_code`   | VARCHAR(20)  | UNIQUE, NOT NULL    | -                 | Code (BSC-ICT)            |
| `program_name`   | VARCHAR(255) | NOT NULL            | -                 | Full name                 |
| `level`          | VARCHAR(50)  | -                   | NULL              | Bachelor, Master, Diploma |
| `duration_years` | INT          | -                   | NULL              | Program length            |
| `description`    | TEXT         | -                   | NULL              | Program description       |
| `faculty_id`     | INT          | FK, NOT NULL, INDEX | -                 | Home faculty              |
| `created_at`     | TIMESTAMP    | -                   | CURRENT_TIMESTAMP | Creation date             |
| `updated_at`     | TIMESTAMP    | -                   | CURRENT_TIMESTAMP | Last update               |

**Indexes**:

- PRIMARY KEY: `id`
- UNIQUE: `program_code`
- INDEX: `idx_faculty_id`, `idx_program_code`

**Foreign Keys**:

- `faculty_id` → `faculties(id)` ON DELETE CASCADE

---

### 5. TABLE: `courses`

**Purpose**: Individual courses within programs

**Physical Specifications**:

- Engine: InnoDB
- Charset: utf8mb4
- Rows: 50-150
- Size: ~150-300 KB

**Columns**:

| Column        | Type         | Constraints         | Default           | Purpose                   |
| ------------- | ------------ | ------------------- | ----------------- | ------------------------- |
| `id`          | INT          | PK, AI              | -                 | Unique identifier         |
| `course_code` | VARCHAR(20)  | UNIQUE, NOT NULL    | -                 | Code (SEW2101)            |
| `course_name` | VARCHAR(255) | NOT NULL            | -                 | Course title              |
| `credits`     | INT          | -                   | 3                 | Credit points             |
| `program_id`  | INT          | FK, INDEX           | NULL              | Primary program           |
| `faculty_id`  | INT          | FK, NOT NULL, INDEX | -                 | Offering faculty          |
| `semester`    | INT          | -                   | NULL              | Typical semester (1 or 2) |
| `description` | TEXT         | -                   | NULL              | Course description        |
| `created_at`  | TIMESTAMP    | -                   | CURRENT_TIMESTAMP | Creation date             |
| `updated_at`  | TIMESTAMP    | -                   | CURRENT_TIMESTAMP | Last update               |

**Indexes**:

- PRIMARY KEY: `id`
- UNIQUE: `course_code`
- INDEX: `idx_faculty_id`, `idx_course_code`, `idx_program_id`
- COMPOSITE: `idx_faculty_program`

**Foreign Keys**:

- `faculty_id` → `faculties(id)` ON DELETE CASCADE
- `program_id` → `programs(id)` ON DELETE SET NULL

---

### 6. TABLE: `classes`

**Purpose**: Class sections for courses

**Physical Specifications**:

- Engine: InnoDB
- Charset: utf8mb4
- Rows: 100-300
- Size: ~300-600 KB

**Columns**:

| Column             | Type         | Constraints             | Default           | Purpose                   |
| ------------------ | ------------ | ----------------------- | ----------------- | ------------------------- |
| `id`               | INT          | PK, AI                  | -                 | Unique identifier         |
| `class_code`       | VARCHAR(30)  | UNIQUE, NOT NULL, INDEX | -                 | Section code (SEW2101-A)  |
| `course_id`        | INT          | FK, NOT NULL, INDEX     | -                 | Course offered            |
| `lecturer_id`      | INT          | FK, INDEX               | NULL              | Assigned lecturer         |
| `academic_year`    | INT          | -                       | NULL              | Year (2024, 2025)         |
| `semester`         | INT          | -                       | NULL              | 1 or 2                    |
| `scheduled_time`   | TIME         | -                       | NULL              | Class time (09:00:00)     |
| `venue`            | VARCHAR(100) | -                       | NULL              | Classroom/location        |
| `mode_of_delivery` | VARCHAR(50)  | -                       | NULL              | On Campus, Hybrid, Online |
| `created_at`       | TIMESTAMP    | -                       | CURRENT_TIMESTAMP | Creation date             |
| `updated_at`       | TIMESTAMP    | -                       | CURRENT_TIMESTAMP | Last update               |

**Indexes**:

- PRIMARY KEY: `id`
- UNIQUE: `class_code`
- INDEX: `idx_course_id`, `idx_lecturer_id`, `idx_class_code`
- COMPOSITE: `idx_course_lecturer`

**Foreign Keys**:

- `course_id` → `courses(id)` ON DELETE CASCADE
- `lecturer_id` → `users(id)` ON DELETE SET NULL

---

### 7. TABLE: `student_enrollments`

**Purpose**: Tracks student enrollment in classes

**Physical Specifications**:

- Engine: InnoDB
- Charset: utf8mb4
- Rows: 2,000-5,000
- Size: ~2-5 MB
- Grow Rate: 300-600 per semester

**Columns**:

| Column              | Type      | Constraints         | Default           | Purpose                      |
| ------------------- | --------- | ------------------- | ----------------- | ---------------------------- |
| `id`                | INT       | PK, AI              | -                 | Unique identifier            |
| `student_id`        | INT       | FK, NOT NULL, INDEX | -                 | Student user                 |
| `class_id`          | INT       | FK, NOT NULL, INDEX | -                 | Enrolled class               |
| `enrollment_status` | ENUM      | NOT NULL, INDEX     | active            | active, withdrawn, completed |
| `enrolled_at`       | TIMESTAMP | NOT NULL            | CURRENT_TIMESTAMP | Enrollment date              |
| `created_at`        | TIMESTAMP | -                   | CURRENT_TIMESTAMP | Record creation              |
| `updated_at`        | TIMESTAMP | -                   | CURRENT_TIMESTAMP | Last update                  |

**Indexes**:

- PRIMARY KEY: `id`
- UNIQUE: `unique_enrollment (student_id, class_id)`
- INDEX: `idx_student_id`, `idx_class_id`, `idx_enrollment_status`
- COMPOSITE: `idx_class_status`

**Foreign Keys**:

- `student_id` → `users(id)` ON DELETE CASCADE
- `class_id` → `classes(id)` ON DELETE CASCADE

**Unique Constraint**: Prevents duplicate enrollments for same student in same class

---

### 8. TABLE: `reports`

**Purpose**: Lecture reports submitted by lecturers

**Physical Specifications**:

- Engine: InnoDB
- Charset: utf8mb4
- Rows: 300-1,000
- Size: ~1-3 MB
- Grow Rate: 100-300 per semester

**Columns**:

| Column                    | Type         | Constraints         | Default           | Purpose                              |
| ------------------------- | ------------ | ------------------- | ----------------- | ------------------------------------ |
| `id`                      | INT          | PK, AI              | -                 | Unique identifier                    |
| `faculty_id`              | INT          | FK, NOT NULL, INDEX | -                 | Faculty oversight                    |
| `class_id`                | INT          | FK, INDEX           | NULL              | Class taught                         |
| `course_id`               | INT          | FK, INDEX           | NULL              | Course offered                       |
| `lecturer_id`             | INT          | FK, NOT NULL, INDEX | -                 | Lecturer who submitted               |
| `date_of_lecture`         | DATE         | NOT NULL, INDEX     | -                 | When taught                          |
| `week_of_reporting`       | INT          | -                   | NULL              | Academic week (1-52)                 |
| `actual_students_present` | INT          | -                   | 0                 | Attendance count                     |
| `scheduled_lecture_time`  | TIME         | -                   | NULL              | Originally scheduled                 |
| `venue`                   | VARCHAR(100) | -                   | NULL              | Where taught                         |
| `topic_taught`            | TEXT         | NOT NULL            | -                 | **What was taught**                  |
| `learning_outcomes`       | TEXT         | NOT NULL            | -                 | **Expected outcomes**                |
| `recommendations`         | TEXT         | -                   | NULL              | Lecturer notes                       |
| `status`                  | ENUM         | NOT NULL, INDEX     | submitted         | draft, submitted, reviewed, approved |
| `created_at`              | TIMESTAMP    | -                   | CURRENT_TIMESTAMP | Submission date                      |
| `updated_at`              | TIMESTAMP    | -                   | CURRENT_TIMESTAMP | Last update                          |

**Indexes**:

- PRIMARY KEY: `id`
- INDEX: `idx_faculty_id`, `idx_lecturer_id`, `idx_date_of_lecture`, `idx_class_id`, `idx_status`
- COMPOSITE: `idx_faculty_date`, `idx_lecturer_date`

**Foreign Keys**:

- `faculty_id` → `faculties(id)` ON DELETE CASCADE
- `class_id` → `classes(id)` ON DELETE SET NULL
- `course_id` → `courses(id)` ON DELETE SET NULL
- `lecturer_id` → `users(id)` ON DELETE CASCADE

**Status Workflow**:

```
draft → submitted → reviewed → approved
  ↓         ↓           ↓         ↓
Initial  Ready for   PRL reviews Finalized
```

---

### 9. TABLE: `monitoring`

**Purpose**: Quality assurance / monitoring records

**Physical Specifications**:

- Engine: InnoDB
- Charset: utf8mb4
- Rows: 50-200
- Size: ~200-500 KB
- Grow Rate: 20-50 per semester

**Columns**:

| Column            | Type      | Constraints         | Default           | Purpose                                               |
| ----------------- | --------- | ------------------- | ----------------- | ----------------------------------------------------- |
| `id`              | INT       | PK, AI              | -                 | Unique identifier                                     |
| `report_id`       | INT       | FK, NOT NULL, INDEX | -                 | Monitored report                                      |
| `monitor_user_id` | INT       | FK, INDEX           | NULL              | PRL who created record                                |
| `findings`        | TEXT      | NOT NULL            | -                 | **Observations/Findings**                             |
| `recommendations` | TEXT      | -                   | NULL              | Improvement recommendations                           |
| `status`          | ENUM      | NOT NULL, INDEX     | pending           | pending, in_progress, satisfactory, needs_improvement |
| `follow_up_date`  | DATE      | -                   | NULL              | Next review date                                      |
| `created_at`      | TIMESTAMP | -                   | CURRENT_TIMESTAMP | Record creation                                       |
| `updated_at`      | TIMESTAMP | -                   | CURRENT_TIMESTAMP | Last update                                           |

**Indexes**:

- PRIMARY KEY: `id`
- INDEX: `idx_report_id`, `idx_status`
- COMPOSITE: `idx_report_created`

**Foreign Keys**:

- `report_id` → `reports(id)` ON DELETE CASCADE
- `monitor_user_id` → `users(id)` ON DELETE SET NULL

**Status Values**:

- `pending`: Awaiting review
- `in_progress`: Being addressed
- `satisfactory`: Meets standards
- `needs_improvement`: Action required

---

### 10. TABLE: `ratings`

**Purpose**: Student ratings and feedback on lectures

**Physical Specifications**:

- Engine: InnoDB
- Charset: utf8mb4
- Rows: 1,000-3,000
- Size: ~1-2 MB
- Grow Rate: 300-500 per semester

**Columns**:

| Column       | Type      | Constraints         | Default           | Purpose           |
| ------------ | --------- | ------------------- | ----------------- | ----------------- |
| `id`         | INT       | PK, AI              | -                 | Unique identifier |
| `report_id`  | INT       | FK, NOT NULL, INDEX | -                 | Rated report      |
| `student_id` | INT       | FK, NOT NULL, INDEX | -                 | Rating student    |
| `rating`     | INT       | NOT NULL, INDEX     | -                 | **1-5 stars**     |
| `comments`   | TEXT      | -                   | NULL              | Optional feedback |
| `created_at` | TIMESTAMP | -                   | CURRENT_TIMESTAMP | Rating date       |
| `updated_at` | TIMESTAMP | -                   | CURRENT_TIMESTAMP | Last update       |

**Indexes**:

- PRIMARY KEY: `id`
- UNIQUE: `unique_student_report_rating (student_id, report_id)`
- INDEX: `idx_report_id`, `idx_student_id`, `idx_rating`

**Foreign Keys**:

- `report_id` → `reports(id)` ON DELETE CASCADE
- `student_id` → `users(id)` ON DELETE CASCADE

**Unique Constraint**: One rating per student per report

---

## Column Mappings

### API Request → Database Fields

**Login Request**:

```
POST /api/auth/login
{ email, password }
      ↓
SELECT * FROM users WHERE email = ?
  ↓
Check password_hash with bcrypt.compare()
```

**Create Report**:

```
POST /api/lecturer/reports
{ classId, dateOfLecture, studentsPresent, topicTaught, learningOutcomes }
  ↓
INSERT INTO reports
  (class_id, date_of_lecture, actual_students_present,
   topic_taught, learning_outcomes, lecturer_id, ...)
```

**Get Dashboard**:

```
GET /api/dashboard
  ↓
FROM reports r
JOIN classes c ON c.id = r.class_id
JOIN courses co ON co.id = r.course_id
LEFT JOIN student_enrollments se ON se.class_id = c.id
  ↓
Calculates: attendance %, reports count, week count
```

---

## Indexes Summary

### Primary Indexes (by usage)

| Index Name              | Table               | Columns           | Type   | Purpose                         |
| ----------------------- | ------------------- | ----------------- | ------ | ------------------------------- |
| `idx_email`             | users               | email             | Single | Fast login lookups              |
| `idx_faculty_id`        | users               | faculty_id        | Single | Faculty filtering               |
| `idx_lecturer_id`       | reports             | lecturer_id       | Single | Get lecturer's reports          |
| `idx_date_of_lecture`   | reports             | date_of_lecture   | Single | Range queries (this month/week) |
| `idx_class_id`          | classes             | class_id          | Single | Report creation                 |
| `idx_enrollment_status` | student_enrollments | enrollment_status | Single | Active only                     |
| `idx_faculty_code`      | faculties           | faculty_code      | Single | Lookup by code                  |

### Composite Indexes (for complex queries)

| Index Name            | Table               | Columns                        | Purpose                       |
| --------------------- | ------------------- | ------------------------------ | ----------------------------- |
| `idx_faculty_date`    | reports             | (faculty_id, date_of_lecture)  | Dashboard metrics             |
| `idx_lecturer_date`   | reports             | (lecturer_id, date_of_lecture) | Lecturer's reports this month |
| `idx_class_status`    | student_enrollments | (class_id, enrollment_status)  | Active enrollment count       |
| `idx_email_role`      | users               | (email, role)                  | Auth with role check          |
| `idx_faculty_program` | courses             | (faculty_id, program_id)       | Program courses               |
| `idx_course_lecturer` | classes             | (course_id, lecturer_id)       | Lecturer's classes            |

---

## Relationships

### Visual Relationships

```
                    faculties (hub)
                   /    |    \    \
                  /     |     \    \
            programs courses users registration_codes
              |        |       |
              |        |       |
           (many)   classes   (auth)
              |        |
              |     student_enrollments
              |     (many to many)
              |        |
              └────────┘
                   |
                reports
               /         \
              /           \
        monitoring      ratings
              ↑             ↑
              └─────────────┘
           (both join back to reports)
```

### Cardinality

| Relationship                | Cardinality | Constraint                      |
| --------------------------- | ----------- | ------------------------------- |
| Faculty → Program           | 1:N         | Many programs per faculty       |
| Faculty → Course            | 1:N         | Many courses per faculty        |
| Faculty → User              | 1:N         | Many users per faculty          |
| Program → Course            | 1:N         | Many courses per program        |
| Course → Class              | 1:N         | Many sections per course        |
| User → Class (Lecturer)     | 1:N         | Lecturer teaches many classes   |
| User → Enrollment (Student) | 1:N         | Student in many classes         |
| Class → Enrollment          | 1:N         | Many students per class         |
| Lecturer → Report           | 1:N         | Lecturer submits many reports   |
| Class → Report              | 1:N         | One report per lecture date     |
| Report → Monitoring         | 1:1 or 1:N  | Can have monitoring records     |
| Report → Rating             | 1:N         | Many student ratings per report |

---

**Version**: 1.0  
**Last Updated**: October 23, 2025  
**Status**: Production-Ready
