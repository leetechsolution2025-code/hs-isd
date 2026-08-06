const XLSX = require('xlsx');

// Create a new workbook
const wb = XLSX.utils.book_new();

// Add a worksheet with headers
const wsData = [
  ["Tên kênh", "Lý trình", "Chiều dài (m)", "Diện tích lúa (ha)", "Diện tích cây ăn quả (ha)", "Bờ trích nước (trái/phải)", "Kích thước cửa (m)", "Loại công trình (mới/sửa/đã có)"],
  ["N1", 1000, 500, 10, 5, "trái", 1.5, "mới"],
  ["N2", 2000, 800, 15, 2, "phải", 1.2, "sửa"]
];
const ws = XLSX.utils.aoa_to_sheet(wsData);

// Set column widths
ws['!cols'] = [
  {wch: 15}, {wch: 15}, {wch: 15}, {wch: 20}, {wch: 25}, {wch: 25}, {wch: 20}, {wch: 25}
];

// Add the worksheet to the workbook
XLSX.utils.book_append_sheet(wb, ws, "Danh sach kenh nhanh");

// Write to the public folder
XLSX.writeFile(wb, "public/template.xlsx");
console.log("Template created at public/template.xlsx");
