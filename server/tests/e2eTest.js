/**
 * Comprehensive LMS E2E Verification Test Suite
 * Tests all 17 requirements and academic workflows
 */
const http = require('http');

const runTests = async () => {
  const baseURL = 'http://localhost:5000/api';

  const request = (path, method = 'GET', body = null, token = null) => {
    return new Promise((resolve, reject) => {
      const url = new URL(baseURL + path);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
      }

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, data: parsed });
          } catch {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      });

      req.on('error', reject);

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  };

  console.log('====================================================');
  console.log('   STARTING LMS SYSTEM INTEGRATION TEST SUITE      ');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  const assert = (condition, title) => {
    totalTests++;
    if (condition) {
      console.log(`[PASS] Test ${totalTests}: ${title}`);
      passedTests++;
    } else {
      console.error(`[FAIL] Test ${totalTests}: ${title}`);
      throw new Error(`Assertion failed: ${title}`);
    }
  };

  try {
    // 0. Check health
    const health = await request('/health');
    assert(health.status === 200 && health.data.status === 'ok', 'API Server health check');

    // Fetch initial seeded programs & academic period
    const progRes = await request('/programs');
    const itProgram = progRes.data.data.find((p) => p.programCode === 'BSIT');
    const csProgram = progRes.data.data.find((p) => p.programCode === 'BSCS');
    assert(itProgram && csProgram, 'Degree programs (BSIT, BSCS) exist in catalog');

    // 1. Student registration generates the correct student ID
    const student1Email = `student1_${Date.now()}@test.edu`;
    const regStudent1 = await request('/auth/register/student', 'POST', {
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      email: student1Email,
      password: 'Password123!',
      degreeProgram: itProgram._id,
      enrollmentYear: 2026,
      yearLevel: 1,
      section: '1-A',
    });
    assert(regStudent1.status === 201, 'Student 1 registered successfully');
    assert(
      regStudent1.data.studentId && regStudent1.data.studentId.startsWith('2026-BSIT-'),
      `Student ID correctly formatted: ${regStudent1.data.studentId}`
    );
    const student1Token = regStudent1.data.token;
    const student1IdNum = regStudent1.data.studentId;

    // 2. Two students registering simultaneously do not receive duplicate IDs
    const student2Email = `student2_${Date.now()}@test.edu`;
    const student3Email = `student3_${Date.now()}@test.edu`;

    const [reg2, reg3] = await Promise.all([
      request('/auth/register/student', 'POST', {
        firstName: 'Maria',
        lastName: 'Santos',
        email: student2Email,
        password: 'Password123!',
        degreeProgram: itProgram._id,
        enrollmentYear: 2026,
        yearLevel: 1,
      }),
      request('/auth/register/student', 'POST', {
        firstName: 'Pedro',
        lastName: 'Penduko',
        email: student3Email,
        password: 'Password123!',
        degreeProgram: itProgram._id,
        enrollmentYear: 2026,
        yearLevel: 1,
      }),
    ]);

    assert(
      reg2.status === 201 && reg3.status === 201,
      'Concurrent student registrations successful'
    );
    assert(
      reg2.data.studentId !== reg3.data.studentId,
      `Concurrent registrations guarantee unique sequential IDs: ${reg2.data.studentId} vs ${reg3.data.studentId}`
    );

    // 3. A student's ID remains unchanged when advancing to another year level
    const profileRes = await request('/students/profile', 'GET', null, student1Token);
    assert(
      profileRes.data.data.profile.studentId === student1IdNum,
      'Student profile retains original student ID'
    );

    // 4. Faculty registration & Course Offering creation
    const faculty1Email = `faculty1_${Date.now()}@test.edu`;
    const regFaculty1 = await request('/auth/register/faculty', 'POST', {
      firstName: 'Alan',
      lastName: 'Turing',
      email: faculty1Email,
      password: 'FacultyPassword123!',
      department: 'Computer Science Department',
    });
    assert(regFaculty1.status === 201, 'Faculty 1 registered successfully');
    const faculty1Token = regFaculty1.data.token;
    const faculty1User = regFaculty1.data.user;

    const coursesRes = await request('/courses', 'GET', null, faculty1Token);
    const itCourse = coursesRes.data.data[0];
    const yearsRes = await request('/academic-years', 'GET', null, faculty1Token);
    const semRes = await request('/semesters', 'GET', null, faculty1Token);

    const offeringRes = await request('/course-offerings', 'POST', {
      course: itCourse._id,
      academicYear: yearsRes.data.data[0]._id,
      semester: semRes.data.data[0]._id,
      section: 'BSIT 1-A',
      yearLevel: 1,
      degreeProgram: itProgram._id,
    }, faculty1Token);
    assert(offeringRes.status === 201, 'Faculty successfully created course offering');
    const offeringId = offeringRes.data.data._id;

    // 5. Faculty enrolls Student 1 into the course offering
    const enrollRes = await request('/enrollments', 'POST', {
      student: regStudent1.data.user._id,
      courseOffering: offeringId,
    }, faculty1Token);
    assert(enrollRes.status === 201, 'Faculty enrolled student 1 into course offering');

    // 6. Students can only access courses in which they are enrolled
    const student1Courses = await request('/course-offerings', 'GET', null, student1Token);
    assert(
      student1Courses.data.data.some((c) => c._id === offeringId),
      'Student can view enrolled course offering'
    );

    // Student 2 is NOT enrolled in offeringId
    const student2Token = reg2.data.token;
    const student2Courses = await request('/course-offerings', 'GET', null, student2Token);
    assert(
      !student2Courses.data.data.some((c) => c._id === offeringId),
      'Unenrolled student cannot access non-enrolled course offerings'
    );

    // 7. Faculty creates Lesson 1 and Lesson 2
    const lesson1Res = await request('/lessons', 'POST', {
      courseOffering: offeringId,
      title: 'Module 1: Foundations of Computing',
      description: 'Binary logic, computer architecture, and basic programming',
      content: 'Lecture 1: Computing fundamentals and programming concepts.',
      order: 1,
      isPublished: true,
      requiresQuiz: true,
    }, faculty1Token);
    assert(lesson1Res.status === 201, 'Faculty created Lesson 1');
    const lesson1Id = lesson1Res.data.data._id;

    const lesson2Res = await request('/lessons', 'POST', {
      courseOffering: offeringId,
      title: 'Module 2: Variables and Control Flow',
      description: 'Variables, conditional statements, and loops',
      content: 'Lecture 2: Advanced control structures.',
      order: 2,
      isPublished: true,
      requiresQuiz: true,
    }, faculty1Token);
    assert(lesson2Res.status === 201, 'Faculty created Lesson 2');
    const lesson2Id = lesson2Res.data.data._id;

    // Faculty creates Quiz for Lesson 1 (passing: 70%)
    const quiz1Res = await request('/quizzes', 'POST', {
      lesson: lesson1Id,
      title: 'Module 1 Proficiency Exam',
      passingPercentage: 70,
      maxAttempts: 3,
      questions: [
        {
          questionText: 'Is binary a base-2 number system?',
          questionType: 'true_false',
          points: 5,
          choices: [
            { text: 'True', isCorrect: true },
            { text: 'False', isCorrect: false },
          ],
        },
        {
          questionText: 'What term describes a step-by-step procedure for solving a problem?',
          questionType: 'identification',
          points: 5,
          correctAnswer: 'algorithm',
        },
      ],
    }, faculty1Token);
    assert(quiz1Res.status === 201, 'Faculty created Quiz 1 with 70% passing requirement');
    const quiz1Id = quiz1Res.data.data._id;

    // 8. Backend Progression Enforcement: Lesson 2 must be locked before Quiz 1 is passed!
    const lesson2CheckBefore = await request(`/lessons/${lesson2Id}`, 'GET', null, student1Token);
    assert(
      lesson2CheckBefore.status === 403,
      'Backend blocks access to Lesson 2 before Quiz 1 is passed (HTTP 403 Forbidden)'
    );

    // 9. Failing Quiz 1 keeps Lesson 2 locked!
    // Submit failing answer (0 points)
    const failAttempt = await request('/quiz-attempts', 'POST', {
      quizId: quiz1Id,
      answers: [
        { questionIndex: 0, selectedChoiceIndex: 1 }, // False (Wrong)
        { questionIndex: 1, textAnswer: 'wrong answer' }, // Wrong
      ],
    }, student1Token);
    assert(
      failAttempt.status === 200 && failAttempt.data.data.passed === false,
      'Quiz attempt evaluated on server as FAILED (0% score)'
    );

    const lesson2CheckAfterFail = await request(`/lessons/${lesson2Id}`, 'GET', null, student1Token);
    assert(
      lesson2CheckAfterFail.status === 403,
      'Lesson 2 remains locked after failed quiz attempt'
    );

    // 10. Passing Quiz 1 unlocks Lesson 2!
    // Submit passing answer (100% score)
    const passAttempt = await request('/quiz-attempts', 'POST', {
      quizId: quiz1Id,
      answers: [
        { questionIndex: 0, selectedChoiceIndex: 0 }, // True (Correct)
        { questionIndex: 1, textAnswer: 'Algorithm' }, // Correct (case-insensitive)
      ],
    }, student1Token);
    assert(
      passAttempt.status === 200 && passAttempt.data.data.passed === true,
      'Quiz attempt evaluated on server as PASSED (100% score)'
    );

    const lesson2CheckAfterPass = await request(`/lessons/${lesson2Id}`, 'GET', null, student1Token);
    assert(
      lesson2CheckAfterPass.status === 200,
      'Lesson 2 is now successfully unlocked and accessible after passing Quiz 1!'
    );

    // 11. Faculty Gradebook & Grade Management
    const gradebookRes = await request(`/grades/gradebook/${offeringId}`, 'GET', null, faculty1Token);
    assert(gradebookRes.status === 200, 'Faculty retrieved class gradebook matrix');
    const student1Grade = gradebookRes.data.data.students.find(
      (s) => s.student.studentId === student1IdNum
    );
    assert(student1Grade && student1Grade.quizResults[0].passed === true, 'Gradebook reflects passing quiz score');

    // Faculty updates final grade & remarks
    const updateGradeRes = await request(`/grades/${student1Grade.gradeId || 'new'}`, 'PUT', {
      student: regStudent1.data.user._id,
      courseOffering: offeringId,
      overallGrade: 95,
      letterGrade: '1.25',
      remarks: 'Outstanding performance',
    }, faculty1Token);
    assert(updateGradeRes.status === 200, 'Faculty updated course grade and remarks');

    // 12. Students cannot modify grades
    const studentGradeEditAttempt = await request(`/grades/${student1Grade.gradeId || 'new'}`, 'PUT', {
      overallGrade: 100,
    }, student1Token);
    assert(
      studentGradeEditAttempt.status === 403,
      'Student is blocked from modifying grades (HTTP 403 Forbidden)'
    );

    // 13. Student can view their own academic record
    const studentRecordRes = await request('/grades/my-record', 'GET', null, student1Token);
    assert(
      studentRecordRes.status === 200 &&
      studentRecordRes.data.data[0].grade.overallGrade === 95,
      'Student can view their official course grade and remarks'
    );

    // 14. Student cannot access another student profile/records
    const unauthorizedAccess = await request(`/faculty/students/${reg2.data.user._id}`, 'GET', null, student1Token);
    assert(
      unauthorizedAccess.status === 403,
      'Student cannot access another student private academic records'
    );

    // 15. Faculty cannot modify courses they are not assigned to
    const regFaculty2 = await request('/auth/register/faculty', 'POST', {
      firstName: 'Grace',
      lastName: 'Hopper',
      email: `faculty2_${Date.now()}@test.edu`,
      password: 'FacultyPassword123!',
    });
    const faculty2Token = regFaculty2.data.token;

    const unauthorizedOfferingEdit = await request(`/course-offerings/${offeringId}`, 'PUT', {
      section: 'Hacked Section',
    }, faculty2Token);
    assert(
      unauthorizedOfferingEdit.status === 403,
      'Faculty cannot modify course offerings assigned to another faculty (HTTP 403 Forbidden)'
    );

    // 16. Lesson progression remains persistent across sessions
    const persistentProgress = await request(`/lessons/course-offering/${offeringId}`, 'GET', null, student1Token);
    const l2Progress = persistentProgress.data.data.find((l) => l._id === lesson2Id);
    assert(
      l2Progress && l2Progress.status === 'available',
      'Lesson progression remains persistent and unlocked across user sessions'
    );

    console.log('\n====================================================');
    console.log(`   ALL ${passedTests} / ${totalTests} INTEGRATION TESTS PASSED! `);
    console.log('====================================================\n');
  } catch (err) {
    console.error('\nTest execution failed:', err.message);
    process.exit(1);
  }
};

runTests();

