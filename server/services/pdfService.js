import PDFDocument from 'pdfkit';

export const generateStudentReportPDF = (res, { student, user, stats, schoolName = 'School ERP' }) => {
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=student-report-${student.rollNo}.pdf`);
  doc.pipe(res);

  doc.fontSize(22).text(schoolName, { align: 'center' });
  doc.moveDown();
  doc.fontSize(16).text('Student Performance Report', { align: 'center' });
  doc.moveDown(2);

  doc.fontSize(12).text(`Name: ${user.name}`);
  doc.text(`Roll No: ${student.rollNo}`);
  doc.text(`Class: ${student.class?.name || 'N/A'}`);
  doc.text(`GPA: ${student.gpa}`);
  doc.text(`Attendance: ${student.attendancePercentage}%`);
  doc.moveDown();

  if (stats?.subjects?.length) {
    doc.fontSize(14).text('Subject-wise Marks');
    stats.subjects.forEach((s) => {
      doc.fontSize(11).text(`${s.name}: ${s.marks}/${s.maxMarks}`);
    });
  }

  doc.moveDown(3);
  doc.text('_________________________', { align: 'right' });
  doc.text('Principal Signature', { align: 'right' });
  doc.end();
};
