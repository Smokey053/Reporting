import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

const hash = (value) => bcrypt.hashSync(value, 10);

const seedFaculties = [
  { id: "fab", code: "FABE", name: "Architecture & Built Environment" },
  { id: "fbm", code: "FBMG", name: "Business Management & Globalisation" },
  { id: "fic", code: "FICT", name: "Information & Communication Technology" },
];

const seedRegistrationCodes = [
  {
    id: nanoid(),
    code: "FICT-LECT-2025",
    role: "lecturer",
    facultyId: "fic",
    active: true,
  },
  {
    id: nanoid(),
    code: "FICT-PRL-2025",
    role: "principal_lecturer",
    facultyId: "fic",
    active: true,
  },
  {
    id: nanoid(),
    code: "FICT-PL-2025",
    role: "program_leader",
    facultyId: "fic",
    active: true,
  },
  {
    id: nanoid(),
    code: "FICT-STU-2025",
    role: "student",
    facultyId: "fic",
    active: true,
  },
  {
    id: nanoid(),
    code: "FABE-PL-2025",
    role: "program_leader",
    facultyId: "fab",
    active: true,
  },
];

const seedUsers = [
  {
    id: nanoid(),
    userId: "ADM001",
    firstName: "System",
    lastName: "Admin",
    email: "admin@luct.ac.ls",
    passwordHash: hash("admin123"),
    role: "admin",
    facultyId: null,
    approved: true,
  },
  {
    id: nanoid(),
    userId: "PL001",
    firstName: "Naledi",
    lastName: "Molefe",
    email: "naledi.molefe@luct.ac.ls",
    passwordHash: hash("secure123"),
    role: "program_leader",
    facultyId: "fic",
    approved: true,
  },
  {
    id: nanoid(),
    userId: "PRL001",
    firstName: "Thabo",
    lastName: "Makoanyane",
    email: "thabo.makoanyane@luct.ac.ls",
    passwordHash: hash("secure123"),
    role: "principal_lecturer",
    facultyId: "fic",
    approved: true,
  },
  {
    id: nanoid(),
    userId: "LEC001",
    firstName: "Boitumelo",
    lastName: "Tebello",
    email: "boitumelo.tebello@luct.ac.ls",
    passwordHash: hash("secure123"),
    role: "lecturer",
    facultyId: "fic",
    approved: true,
  },
  {
    id: nanoid(),
    userId: "STU001",
    firstName: "Lerato",
    lastName: "Sechele",
    email: "lerato.sechele@luct.ac.ls",
    passwordHash: hash("secure123"),
    role: "student",
    facultyId: "fic",
    approved: true,
  },
];

const seedPrograms = [
  {
    id: nanoid(),
    code: "BSCM",
    name: "BSc Software Engineering with Multimedia",
    level: "bachelor",
    facultyId: "fic",
    durationYears: 4,
  },
  {
    id: nanoid(),
    code: "DIT",
    name: "Diploma in Information Technology",
    level: "diploma",
    facultyId: "fic",
    durationYears: 3,
  },
];

const seedCourses = [
  {
    id: nanoid(),
    code: "SEW2101",
    name: "Advanced Web Engineering",
    credits: 4,
    programId: seedPrograms[0].id,
    facultyId: "fic",
    semester: 3,
  },
  {
    id: nanoid(),
    code: "DBS1201",
    name: "Database Systems",
    credits: 4,
    programId: seedPrograms[0].id,
    facultyId: "fic",
    semester: 2,
  },
  {
    id: nanoid(),
    code: "UXD1103",
    name: "Experience Design Studio",
    credits: 3,
    programId: seedPrograms[1].id,
    facultyId: "fic",
    semester: 2,
  },
];

const seedClasses = [
  {
    id: nanoid(),
    classCode: "SEW2101-A",
    courseId: seedCourses[0].id,
    lecturerId: seedUsers.find((u) => u.role === "lecturer").id,
    facultyId: "fic",
    academicYear: 2025,
    semester: 1,
    schedule: "Tue 10:00 - 12:00 | Lab 4",
    mode: "On Campus",
  },
  {
    id: nanoid(),
    classCode: "DBS1201-B",
    courseId: seedCourses[1].id,
    lecturerId: seedUsers.find((u) => u.role === "lecturer").id,
    facultyId: "fic",
    academicYear: 2025,
    semester: 1,
    schedule: "Thu 08:00 - 10:00 | Lab 2",
    mode: "Hybrid",
  },
];

const seedReports = [
  {
    id: nanoid(),
    lecturerId: seedUsers.find((u) => u.role === "lecturer").id,
    classId: seedClasses[0].id,
    courseId: seedCourses[0].id,
    dateOfLecture: "2025-02-10",
    attendance: 92,
    summary:
      "Covered emerging patterns in progressive web applications and assigned a group prototype.",
    actions: "Students to submit design audit by Friday.",
    status: "submitted",
    createdAt: Date.now() - 86400000,
  },
];

const seedMonitoring = [
  {
    id: nanoid(),
    monitoredBy: seedUsers.find((u) => u.role === "principal_lecturer").id,
    classId: seedClasses[0].id,
    focusArea: "Student engagement",
    highlights: "Interactive code review session kept the class energised.",
    actionItems: [
      "Refine assessment rubric",
      "Share best practices with faculty",
    ],
    followUpDate: "2025-03-01",
  },
];

const seedRatings = [
  {
    id: nanoid(),
    reportId: seedReports[0].id,
    studentId: seedUsers.find((u) => u.role === "student").id,
    clarity: 4,
    preparedness: 5,
    engagement: 4,
    comment: "Loved the real-world case studies shared today.",
  },
];

const seedAnnouncements = [
  {
    id: nanoid(),
    title: "Academic Integrity Refresh",
    body: "All teaching staff should review the updated digital submission policy before Week 8.",
    audience: ["lecturer", "principal_lecturer", "program_leader"],
    createdAt: Date.now() - 3600000,
  },
  {
    id: nanoid(),
    title: "FICT Showcase",
    body: "Student demo day scheduled for 28 March. Submit nominees by 10 March.",
    audience: ["student", "lecturer", "program_leader"],
    createdAt: Date.now() - 7200000,
  },
];

class DataStore {
  constructor() {
    this.faculties = [...seedFaculties];
    this.registrationCodes = [...seedRegistrationCodes];
    this.users = [...seedUsers];
    this.programs = [...seedPrograms];
    this.courses = [...seedCourses];
    this.classes = [...seedClasses];
    this.reports = [...seedReports];
    this.monitoring = [...seedMonitoring];
    this.ratings = [...seedRatings];
    this.announcements = [...seedAnnouncements];
  }

  findUserByEmail(email) {
    return this.users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  findUserById(id) {
    return this.users.find((user) => user.id === id);
  }

  createUser({ firstName, lastName, email, password, role, facultyId }) {
    const userId = `${role.slice(0, 3).toUpperCase()}-${Math.floor(
      Math.random() * 900 + 100
    )}`;
    const newUser = {
      id: nanoid(),
      userId,
      firstName,
      lastName,
      email,
      passwordHash: hash(password),
      role,
      facultyId: facultyId || null,
      approved: role !== "student" ? false : true,
    };
    this.users.push(newUser);
    return newUser;
  }

  verifyRegistrationCode(code, role) {
    const record = this.registrationCodes.find(
      (entry) => entry.code === code && entry.active && entry.role === role
    );
    if (!record) return null;
    return record;
  }

  createReport({
    lecturerId,
    classId,
    courseId,
    dateOfLecture,
    attendance,
    summary,
    actions,
  }) {
    const report = {
      id: nanoid(),
      lecturerId,
      classId,
      courseId,
      dateOfLecture,
      attendance,
      summary,
      actions,
      status: "submitted",
      createdAt: Date.now(),
    };
    this.reports.unshift(report);
    return report;
  }

  getClassesForLecturer(lecturerId) {
    return this.classes
      .filter((cls) => cls.lecturerId === lecturerId)
      .map((cls) => ({
        ...cls,
        course: this.courses.find((course) => course.id === cls.courseId),
      }));
  }

  getReportsForLecturer(lecturerId) {
    return this.reports
      .filter((report) => report.lecturerId === lecturerId)
      .map((report) => ({
        ...report,
        classInfo: this.classes.find((cls) => cls.id === report.classId),
        course: this.courses.find((course) => course.id === report.courseId),
        rating: this.ratings.filter((rating) => rating.reportId === report.id),
      }));
  }

  getMonitoringForFaculty(facultyId) {
    return this.monitoring
      .map((record) => ({
        ...record,
        classInfo: this.classes.find((cls) => cls.id === record.classId),
        monitoredByUser: this.findUserById(record.monitoredBy),
      }))
      .filter(
        (record) => record.classInfo && record.classInfo.facultyId === facultyId
      );
  }

  getRatingsForFaculty(facultyId) {
    return this.ratings
      .map((rating) => ({
        ...rating,
        report: this.reports.find((report) => report.id === rating.reportId),
        student: this.findUserById(rating.studentId),
      }))
      .filter(
        (rating) =>
          rating.report &&
          this.classes.find((cls) => cls.id === rating.report.classId)
            ?.facultyId === facultyId
      );
  }

  getStudentClasses(studentId) {
    const student = this.findUserById(studentId);
    if (!student) return [];
    return this.classes
      .filter((cls) => cls.facultyId === student.facultyId)
      .map((cls) => ({
        ...cls,
        course: this.courses.find((course) => course.id === cls.courseId),
      }));
  }
}

export const store = new DataStore();
