const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { complaintOperations } = require('./database');

/**
 * Generate PDF report for complaints
 */
async function generatePDFReport(filters = {}) {
  return new Promise(async (resolve, reject) => {
    try {
      const complaints = await complaintOperations.getAll(filters);
      
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Add header
      doc.fontSize(20).text('Cyber Crime Portal - Complaint Report', { align: 'center' });
      doc.moveDown();
      
      // Add date range if specified
      if (filters.created_at_gte || filters.created_at_lte) {
        doc.fontSize(10).text(
          `Date Range: ${filters.created_at_gte || 'Start'} to ${filters.created_at_lte || 'End'}`,
          { align: 'center' }
        );
        doc.moveDown();
      }

      // Add summary
      doc.fontSize(12).text(`Total Complaints: ${complaints.length}`);
      doc.moveDown();

      // Add table header
      const tableTop = doc.y;
      const tableLeft = 50;
      const colWidths = [80, 150, 100, 80, 80];
      const headers = ['ID', 'Title', 'Status', 'Category', 'Date'];
      
      doc.fontSize(10).font('Helvetica-Bold');
      headers.forEach((header, i) => {
        doc.text(header, tableLeft + colWidths.slice(0, i).reduce((a, b) => a + b, 0), tableTop);
      });
      
      doc.moveDown(0.5);
      doc.moveTo(tableLeft, doc.y).lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), doc.y).stroke();
      doc.moveDown(0.5);

      // Add table rows
      doc.fontSize(9).font('Helvetica');
      complaints.forEach((complaint, index) => {
        const rowTop = doc.y;
        const rowData = [
          complaint.tracking_id || 'N/A',
          (complaint.title || '').substring(0, 30),
          complaint.status || 'N/A',
          complaint.category?.name || 'N/A',
          new Date(complaint.created_at).toLocaleDateString()
        ];
        
        rowData.forEach((data, i) => {
          doc.text(
            data,
            tableLeft + colWidths.slice(0, i).reduce((a, b) => a + b, 0),
            rowTop
          );
        });
        
        doc.moveDown(0.7);
        
        // Add page break if needed
        if (doc.y > 700) {
          doc.addPage();
        }
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Excel report for complaints
 */
async function generateExcelReport(filters = {}) {
  try {
    const complaints = await complaintOperations.getAll(filters);
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Complaints');
    
    // Add headers
    worksheet.columns = [
      { header: 'Tracking ID', key: 'tracking_id', width: 20 },
      { header: 'Title', key: 'title', width: 40 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Severity', key: 'severity', width: 15 },
      { header: 'Location', key: 'location', width: 25 },
      { header: 'Created Date', key: 'created_at', width: 20 },
      { header: 'Assigned Officer', key: 'officer', width: 25 }
    ];
    
    // Style header row
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4472C4' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    
    // Add data
    complaints.forEach(complaint => {
      worksheet.addRow({
        tracking_id: complaint.tracking_id || 'N/A',
        title: complaint.title || 'N/A',
        description: complaint.description || 'N/A',
        status: complaint.status || 'N/A',
        category: complaint.category?.name || 'N/A',
        severity: complaint.severity || 'N/A',
        location: complaint.location || 'N/A',
        created_at: new Date(complaint.created_at).toLocaleString(),
        officer: complaint.officer_profile?.full_name || complaint.officer_profile?.name || 'Unassigned'
      });
    });
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const cellLength = cell.value ? cell.value.toString().length : 10;
        if (cellLength > maxLength) {
          maxLength = cellLength;
        }
      });
      column.width = Math.min(maxLength + 2, 50);
    });
    
    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  } catch (error) {
    throw new Error(`Excel generation failed: ${error.message}`);
  }
}

module.exports = {
  generatePDFReport,
  generateExcelReport
};