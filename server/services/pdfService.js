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

const drawMonthlyTable = (doc, { columns, rows, startX, startY, colWidth }) => {
  let y = startY;
  const rowHeight = 16;
  const headerHeight = 18;

  doc.fontSize(8).font('Helvetica-Bold');
  let x = startX;
  columns.forEach((col) => {
    const w = col.width || colWidth;
    doc.rect(x, y, w, headerHeight).stroke();
    doc.text(col.header, x + 2, y + 4, { width: w - 4, lineBreak: false });
    x += w;
  });
  y += headerHeight;

  doc.font('Helvetica');
  rows.forEach((row) => {
    x = startX;
    if (y > doc.page.height - 60) {
      doc.addPage({ layout: 'landscape', margin: 40 });
      y = 50;
    }
    columns.forEach((col) => {
      const w = col.width || colWidth;
      doc.rect(x, y, w, rowHeight).stroke();
      const val = String(row[col.key] ?? '');
      doc.text(val.slice(0, 12), x + 2, y + 4, { width: w - 4, lineBreak: false });
      x += w;
    });
    y += rowHeight;
  });
  return y;
};

export const generateMonthlyAttendancePDF = (
  res,
  { sheets, monthName, year, month, schoolName = 'School ERP' }
) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=attendance-${year}-${String(month).padStart(2, '0')}.pdf`
  );
  doc.pipe(res);

  sheets.forEach((sheet, index) => {
    if (index > 0) doc.addPage({ layout: 'landscape', margin: 40 });

    doc.fontSize(18).font('Helvetica-Bold').text(schoolName, { align: 'center' });
    doc.moveDown(0.5);
    doc
      .fontSize(14)
      .text(`Monthly Attendance — ${sheet.classLabel}`, { align: 'center' });
    doc.fontSize(11).font('Helvetica').text(`${monthName} ${year}`, { align: 'center' });
    if (sheet.academicYear) {
      doc.text(`Academic year: ${sheet.academicYear}`, { align: 'center' });
    }
    doc.moveDown(1);

    const compactColumns = sheet.columns.map((c) => ({
      ...c,
      width: c.key?.startsWith('d') ? 18 : c.key === 'name' ? 90 : 42,
    }));

    drawMonthlyTable(doc, {
      columns: compactColumns,
      rows: sheet.rows,
      startX: 40,
      startY: doc.y,
      colWidth: 24,
    });

    doc.moveDown(2);
    doc.fontSize(8).text('Legend: P = Present, A = Absent, L = Late, LV = Leave, - = Not marked', {
      align: 'left',
    });
  });

  doc.end();
};
