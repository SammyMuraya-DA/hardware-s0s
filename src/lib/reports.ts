import jsPDF from 'jspdf';
import autoTable, { type RowInput } from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import logoUrl from '@/assets/logo.png';

const BRAND = {
  name: 'SOS Hardware & Glassmart',
  tagline: 'Glassmart Kenya Ltd',
};

let cachedLogo: string | null = null;

const loadLogoDataUrl = async (): Promise<string | null> => {
  if (cachedLogo) return cachedLogo;
  try {
    const res = await fetch(logoUrl);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onloadend = () => { cachedLogo = String(r.result); resolve(cachedLogo); };
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

export interface PdfReportOptions {
  title: string;
  subtitle?: string;
  filename: string;
  columns: string[];
  rows: (string | number)[][];
  summary?: { label: string; value: string }[];
}

export const exportBrandedPDF = async (opts: PdfReportOptions) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const logo = await loadLogoDataUrl();

  if (logo) {
    try { doc.addImage(logo, 'PNG', 40, 30, 70, 70); } catch { /* ignore */ }
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(BRAND.name, 125, 55);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(BRAND.tagline, 125, 72);
  doc.setFontSize(14);
  doc.setTextColor(20);
  doc.setFont('helvetica', 'bold');
  doc.text(opts.title, 125, 92);
  if (opts.subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(opts.subtitle, 125, 108);
  }

  let cursorY = 130;
  if (opts.summary?.length) {
    doc.setFillColor(245, 245, 245);
    doc.rect(40, cursorY, pageW - 80, 30 + Math.ceil(opts.summary.length / 3) * 18, 'F');
    doc.setFontSize(10);
    doc.setTextColor(40);
    opts.summary.forEach((s, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 50 + col * ((pageW - 100) / 3);
      const y = cursorY + 18 + row * 18;
      doc.setFont('helvetica', 'normal'); doc.text(`${s.label}:`, x, y);
      doc.setFont('helvetica', 'bold'); doc.text(s.value, x + 90, y);
    });
    cursorY += 30 + Math.ceil(opts.summary.length / 3) * 18 + 10;
  }

  autoTable(doc, {
    startY: cursorY,
    head: [opts.columns],
    body: opts.rows as RowInput[],
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [26, 107, 60], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 248] },
    margin: { left: 40, right: 40 },
  });

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      `${BRAND.name} · Generated ${new Date().toLocaleString()} · Page ${i}/${pages}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 20,
      { align: 'center' }
    );
  }

  doc.save(opts.filename);
};

export interface XlsxReportOptions {
  title: string;
  subtitle?: string;
  filename: string;
  columns: string[];
  rows: (string | number)[][];
  summary?: { label: string; value: string }[];
}

export const exportBrandedXLSX = async (opts: XlsxReportOptions) => {
  const wb = XLSX.utils.book_new();
  const aoa: (string | number)[][] = [];
  aoa.push([BRAND.name]);
  aoa.push([BRAND.tagline]);
  aoa.push([opts.title]);
  if (opts.subtitle) aoa.push([opts.subtitle]);
  aoa.push([`Generated: ${new Date().toLocaleString()}`]);
  aoa.push([]);
  if (opts.summary?.length) {
    opts.summary.forEach((s) => aoa.push([s.label, s.value]));
    aoa.push([]);
  }
  aoa.push(opts.columns);
  opts.rows.forEach((r) => aoa.push(r));

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = opts.columns.map(() => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Report');

  // Embed logo metadata note (xlsx js-only doesn't support image embed easily;
  // include logo URL in a Branding sheet so the file ships with brand context).
  const branding = XLSX.utils.aoa_to_sheet([
    ['Brand', BRAND.name],
    ['Entity', BRAND.tagline],
    ['Logo', window.location.origin + '/logo.png'],
  ]);
  XLSX.utils.book_append_sheet(wb, branding, 'Branding');

  XLSX.writeFile(wb, opts.filename);
};