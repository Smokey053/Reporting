import pool from "./pool.js";

async function verifyBSCSM() {
  try {
    console.log("=".repeat(60));
    console.log("Verifying BSCSM Program Data");
    console.log("=".repeat(60));

    // Check program
    const [programs] = await pool.execute(
      `SELECT p.id, p.program_code, p.program_name, p.level, p.duration_years, f.faculty_name
       FROM programs p
       JOIN faculties f ON f.id = p.faculty_id
       WHERE p.program_code = 'BSCSM'`
    );

    if (programs.length > 0) {
      console.log("\n✅ Program Found:");
      console.log(`   ID: ${programs[0].id}`);
      console.log(`   Code: ${programs[0].program_code}`);
      console.log(`   Name: ${programs[0].program_name}`);
      console.log(`   Level: ${programs[0].level}`);
      console.log(`   Duration: ${programs[0].duration_years} years`);
      console.log(`   Faculty: ${programs[0].faculty_name}`);

      const programId = programs[0].id;

      // Check courses
      const [courses] = await pool.execute(
        `SELECT id, course_code, course_name, credits, semester
         FROM courses
         WHERE program_id = ?
         ORDER BY course_code`,
        [programId]
      );

      console.log(`\n✅ Courses (${courses.length} found):`);
      courses.forEach((course, index) => {
        console.log(
          `   ${index + 1}. ${course.course_code} - ${course.course_name} (${
            course.credits
          } credits, Semester ${course.semester})`
        );
      });

      // Check classes
      const [classes] = await pool.execute(
        `SELECT cl.id, cl.class_code, c.course_name, cl.scheduled_time, cl.venue, cl.mode_of_delivery,
                CONCAT(u.first_name, ' ', u.last_name) AS lecturer_name
         FROM classes cl
         JOIN courses c ON c.id = cl.course_id
         LEFT JOIN users u ON u.id = cl.lecturer_id
         WHERE c.program_id = ?
         ORDER BY cl.scheduled_time`,
        [programId]
      );

      console.log(`\n✅ Classes (${classes.length} found):`);
      classes.forEach((cls, index) => {
        const lecturer = cls.lecturer_name || "Not assigned";
        console.log(`   ${index + 1}. ${cls.class_code} - ${cls.course_name}`);
        console.log(`      Time: ${cls.scheduled_time}, Venue: ${cls.venue}`);
        console.log(
          `      Lecturer: ${lecturer}, Mode: ${cls.mode_of_delivery}`
        );
      });

      // Check course offerings
      const [offerings] = await pool.execute(
        `SELECT co.id, c.course_code, co.semester, co.year_level, co.academic_year
         FROM course_offerings co
         JOIN courses c ON c.id = co.course_id
         WHERE co.program_id = ?
         ORDER BY co.year_level, co.semester, c.course_code`,
        [programId]
      );

      console.log(`\n✅ Course Offerings (${offerings.length} found):`);
      offerings.forEach((offering, index) => {
        console.log(
          `   ${index + 1}. ${offering.course_code} - Year ${
            offering.year_level
          }, Semester ${offering.semester} (${offering.academic_year})`
        );
      });

      // Get available lecturers
      const [lecturers] = await pool.execute(
        `SELECT id, user_id, CONCAT(first_name, ' ', last_name) AS full_name, email, role
         FROM users
         WHERE role IN ('lecturer', 'principal_lecturer') AND is_approved = TRUE
         ORDER BY first_name, last_name`
      );

      console.log(
        `\n✅ Available Lecturers for Assignment (${lecturers.length} found):`
      );
      lecturers.forEach((lec, index) => {
        console.log(
          `   ${index + 1}. ${lec.user_id} - ${lec.full_name} (${lec.email}) [${
            lec.role
          }]`
        );
      });

      console.log("\n" + "=".repeat(60));
      console.log("Summary:");
      console.log("=".repeat(60));
      console.log(`✅ Program: BSCSM successfully created`);
      console.log(
        `✅ Courses: ${courses.length} courses added for Year 2, Semester 1`
      );
      console.log(
        `✅ Classes: ${classes.length} classes created (1 per course)`
      );
      console.log(`✅ Course Offerings: ${offerings.length} linked to program`);
      console.log(`✅ Lecturers: ${lecturers.length} available for assignment`);
      console.log("\n📝 Admin can now assign lecturers to classes via:");
      console.log("   PUT /api/admin/classes/:id/assign-lecturer");
      console.log("   Body: { lecturerId: <lecturer_id> }");
    } else {
      console.log("\n❌ BSCSM Program not found!");
    }

    console.log("\n" + "=".repeat(60));
  } catch (error) {
    console.error("Error verifying data:", error);
  } finally {
    await pool.end();
  }
}

verifyBSCSM();
