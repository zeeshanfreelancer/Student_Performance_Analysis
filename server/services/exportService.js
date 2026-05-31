import ExcelJS from 'exceljs';

export const exportToExcel = async (res, data, columns, filename) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Export');
  sheet.columns = columns;
  data.forEach((row) => sheet.addRow(row));
  sheet.getRow(1).font = { bold: true };

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
  await workbook.xlsx.write(res);
  res.end();
};

export const exportMonthlyAttendanceExcel = async (res, sheets, filename) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'School ERP';

  sheets.forEach(({ sheetName, columns, rows, classLabel, monthName, year }) => {
    const sheet = workbook.addWorksheet(sheetName || 'Attendance');
    sheet.mergeCells(1, 1, 1, Math.min(columns.length, 10));
    sheet.getCell(1, 1).value = `${classLabel} — ${monthName} ${year}`;
    sheet.getCell(1, 1).font = { bold: true, size: 12 };
    sheet.addRow([]);
    const headerRow = sheet.addRow(columns.map((c) => c.header));
    headerRow.font = { bold: true };
    rows.forEach((row) => {
      sheet.addRow(columns.map((c) => row[c.key] ?? ''));
    });
    columns.forEach((col, idx) => {
      sheet.getColumn(idx + 1).width = col.width || 10;
    });
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
  await workbook.xlsx.write(res);
  res.end();
};

export const exportToCSV = (res, data, columns, filename) => {
  const headers = columns.map((c) => c.header).join(',');
  const rows = data.map((row) =>
    columns.map((c) => `"${String(row[c.key] ?? '').replace(/"/g, '""')}"`).join(',')
  );
  const csv = [headers, ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
  res.send(csv);
};
