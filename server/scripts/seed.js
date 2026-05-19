import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Parent from '../models/Parent.js';
import Department from '../models/Department.js';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';
import Attendance from '../models/Attendance.js';
import Assignment from '../models/Assignment.js';
import Result from '../models/Result.js';
import { connectDB } from '../config/db.js';

const DEMO_PASSWORD = '12345678';

const ensureUser = async ({ name, email, role }) => {
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ name, email, password: DEMO_PASSWORD, role });
    console.log(`  Created user: ${email} (${role})`);
  }
  return user;
};

const seed = async () => {
  await connectDB();
  console.log('Seeding database...\n');

  const dept = await Department.findOneAndUpdate(
    { code: 'CS' },
    { name: 'Computer Science', code: 'CS', description: 'CS Department', status: 'active' },
    { upsert: true, new: true }
  );

  const class10 = await Class.findOneAndUpdate(
    { name: '10', section: 'A', academicYear: '2025-26' },
    {
      name: '10',
      section: 'A',
      department: dept._id,
      academicYear: '2025-26',
      capacity: 40,
      status: 'active',
    },
    { upsert: true, new: true }
  );

  const subjects = await Promise.all(
    [
      { name: 'Mathematics', code: 'MATH10' },
      { name: 'Science', code: 'SCI10' },
      { name: 'English', code: 'ENG10' },
    ].map((s) =>
      Subject.findOneAndUpdate(
        { code: s.code },
        { ...s, department: dept._id, class: class10._id, credits: 3, status: 'active' },
        { upsert: true, new: true }
      )
    )
  );

  const adminUser = await ensureUser({
    name: 'Admin User',
    email: 'admin@gmail.com',
    role: 'admin',
  });

  const teacherUser = await ensureUser({
    name: 'John Teacher',
    email: 'teacher@gmail.com',
    role: 'teacher',
  });

  let teacher = await Teacher.findOne({ user: teacherUser._id });
  if (!teacher) {
    teacher = await Teacher.create({
      user: teacherUser._id,
      employeeId: 'TCH001',
      department: dept._id,
      subjects: subjects.map((s) => s._id),
      classes: [class10._id],
      qualification: 'M.Ed',
      experience: 8,
      status: 'active',
    });
    console.log('  Created teacher profile');
  }

  await Class.findByIdAndUpdate(class10._id, { classTeacher: teacher._id });
  await Subject.updateMany({ _id: { $in: subjects.map((s) => s._id) } }, { teacher: teacher._id });

  const parentUser = await ensureUser({
    name: 'Sarah Parent',
    email: 'parent@gmail.com',
    role: 'parent',
  });

  let parent = await Parent.findOne({ user: parentUser._id });
  if (!parent) {
    parent = await Parent.create({
      user: parentUser._id,
      occupation: 'Engineer',
      relation: 'mother',
      status: 'active',
      children: [],
    });
    console.log('  Created parent profile');
  }

  const studentDefs = [
    { name: 'Alex Student', email: 'student@gmail.com', rollNo: 'STU001', gpa: 3.6, attendance: 92 },
    { name: 'Emma Wilson', email: 'emma@school.com', rollNo: 'STU002', gpa: 3.9, attendance: 96 },
    { name: 'James Brown', email: 'james@school.com', rollNo: 'STU003', gpa: 2.1, attendance: 68 },
    { name: 'Mia Davis', email: 'mia@school.com', rollNo: 'STU004', gpa: 3.2, attendance: 81 },
    { name: 'Noah Miller', email: 'noah@school.com', rollNo: 'STU005', gpa: 1.8, attendance: 72 },
    { name: 'Olivia Taylor', email: 'olivia@school.com', rollNo: 'STU006', gpa: 3.5, attendance: 88 },
  ];

  const studentIds = [];

  for (const def of studentDefs) {
    const user = await ensureUser({ name: def.name, email: def.email, role: 'student' });
    let student = await Student.findOne({ user: user._id });
    if (!student) {
      student = await Student.create({
        user: user._id,
        rollNo: def.rollNo,
        class: class10._id,
        department: dept._id,
        semester: 1,
        parentId: def.email === 'student@gmail.com' ? parent._id : undefined,
        gpa: def.gpa,
        attendancePercentage: def.attendance,
        status: 'active',
        academicTimeline: [{ title: 'Enrolled', description: 'Student enrolled', type: 'enrollment' }],
      });
      console.log(`  Created student: ${def.rollNo} - ${def.name}`);
    } else {
      await Student.findByIdAndUpdate(student._id, {
        gpa: def.gpa,
        attendancePercentage: def.attendance,
        class: class10._id,
        department: dept._id,
        status: 'active',
      });
    }
    studentIds.push(student._id);
  }

  await Parent.findByIdAndUpdate(parent._id, {
    $set: { children: [studentIds[0]] },
  });

  const existingAttendance = await Attendance.countDocuments();
  if (existingAttendance < 20) {
    const statuses = ['present', 'present', 'present', 'absent', 'late', 'present', 'leave'];
    const today = new Date();
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      date.setHours(0, 0, 0, 0);
      for (const studentId of studentIds) {
        const status = statuses[(dayOffset + studentId.toString().length) % statuses.length];
        await Attendance.findOneAndUpdate(
          { student: studentId, date },
          {
            student: studentId,
            class: class10._id,
            date,
            status,
            markedBy: adminUser._id,
          },
          { upsert: true }
        );
      }
    }
    console.log('  Seeded attendance records');
  }

  const existingResults = await Result.countDocuments();
  if (existingResults < 10) {
    for (const studentId of studentIds) {
      for (const subject of subjects) {
        const marks = 55 + Math.floor(Math.random() * 40);
        await Result.findOneAndUpdate(
          {
            student: studentId,
            subject: subject._id,
            semester: 1,
            examType: 'internal',
          },
          {
            student: studentId,
            subject: subject._id,
            class: class10._id,
            semester: 1,
            examType: 'internal',
            marks,
            maxMarks: 100,
            grade: marks >= 90 ? 'A' : marks >= 75 ? 'B' : marks >= 60 ? 'C' : 'D',
            recordedBy: teacherUser._id,
          },
          { upsert: true }
        );
      }
    }
    console.log('  Seeded exam results');
  }

  const existingAssignments = await Assignment.countDocuments();
  if (existingAssignments < 2) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 3);

    await Assignment.create({
      title: 'Algebra Problem Set',
      description: 'Complete exercises 1-20 from chapter 5',
      deadline: nextWeek,
      class: class10._id,
      subject: subjects[0]._id,
      teacher: teacher._id,
      status: 'active',
      maxMarks: 100,
    });
    await Assignment.create({
      title: 'Science Lab Report',
      description: 'Submit lab report for photosynthesis experiment',
      deadline: lastWeek,
      class: class10._id,
      subject: subjects[1]._id,
      teacher: teacher._id,
      status: 'active',
      maxMarks: 50,
    });
    console.log('  Seeded assignments');
  }

  console.log('\nSeed complete!');
  console.log('Login: admin@gmail.com / teacher@gmail.com / student@gmail.com / parent@gmail.com');
  console.log(`Password: ${DEMO_PASSWORD}`);
  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
