/**
 * usemypdf - PDF Office Module
 * Handles client-side conversions:
 * - Word (.docx) <-> PDF
 * - Excel (.xlsx) <-> PDF
 * - PowerPoint (.pptx) <-> PDF
 * 100% processed in browser memory (RAM) via JSZip, SheetJS, PDF-Lib, and PDF.js.
 */

// Dynamic Lazy-Loader for SheetJS (xlsx.full.min.js)
async function ensureXlsxLoaded() {
  if (typeof XLSX !== 'undefined') return;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load SheetJS library. Check internet connection.'));
    document.head.appendChild(script);
  });
}

// Unicode and character sanitizer for PDF-Lib standard Helvetica fonts
function sanitizeWinAnsi(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, '-')
    .replace(/[•·]/g, '*')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[^\x00-\xFF]/g, ' ');
}

// =============================================================================
// 1. EXCEL KE PDF (EXCEL TO PDF - Supports Multi-file Merge & Convert)
// =============================================================================
async function handleExcelToPdf({ files, updateProgress, showToast }) {
  if (files.length === 0) throw new Error('Please select at least 1 Excel spreadsheet (.xlsx / .xls).');

  updateProgress(5, 'Preparing Excel module...');
  await ensureXlsxLoaded();

  const pdfDoc = await PDFLib.PDFDocument.create();
  const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

  // Landscape A4 for optimal table display (841.89 x 595.28 points)
  const pageWidth = 841.89;
  const pageHeight = 595.28;
  const margin = 36;
  const usableWidth = pageWidth - (margin * 2);
  const rowHeight = 22;
  const maxRowsPerPage = Math.floor((pageHeight - margin * 2 - 50) / rowHeight);

  let currentPage = null;
  let currentY = 0;
  let pageNum = 0;

  for (let fIdx = 0; fIdx < files.length; fIdx++) {
    const file = files[fIdx];
    const pct = Math.round(15 + ((fIdx / files.length) * 65));
    updateProgress(pct, `Reading spreadsheet (${fIdx + 1}/${files.length}): ${file.name}...`);

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      if (!rawRows || rawRows.length === 0) continue;

      const maxCols = Math.min(12, Math.max(...rawRows.map(r => r.length)));
      if (maxCols === 0) continue;
      const colWidth = usableWidth / maxCols;

      function addNewPage() {
        pageNum++;
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - margin;

        currentPage.drawText(sanitizeWinAnsi(`${file.name.replace(/\.[^/.]+$/, '')} (${sheetName})`), {
          x: margin,
          y: currentY - 14,
          size: 11,
          font: fontBold,
          color: PDFLib.rgb(0.1, 0.1, 0.1)
        });

        currentPage.drawText(`Page ${pageNum}`, {
          x: pageWidth - margin - 70,
          y: margin / 2,
          size: 9,
          font: font,
          color: PDFLib.rgb(0.5, 0.5, 0.5)
        });

        currentY -= 36;
      }

      addNewPage();

      for (let r = 0; r < rawRows.length; r++) {
        if (r > 0 && r % maxRowsPerPage === 0) {
          addNewPage();
        }

        const row = rawRows[r];
        const isHeader = (r === 0);
        const rowFont = isHeader ? fontBold : font;
        const fontSize = isHeader ? 9 : 8;

        if (isHeader) {
          currentPage.drawRectangle({
            x: margin,
            y: currentY - rowHeight + 4,
            width: usableWidth,
            height: rowHeight,
            color: PDFLib.rgb(0.92, 0.94, 0.98)
          });
        } else if (r % 2 === 1) {
          currentPage.drawRectangle({
            x: margin,
            y: currentY - rowHeight + 4,
            width: usableWidth,
            height: rowHeight,
            color: PDFLib.rgb(0.98, 0.98, 0.98)
          });
        }

        for (let c = 0; c < maxCols; c++) {
          let cellText = (row[c] !== undefined && row[c] !== null) ? String(row[c]).trim() : '';
          if (cellText.length > 25) cellText = cellText.substring(0, 22) + '...';

          const cellX = margin + (c * colWidth);
          currentPage.drawText(sanitizeWinAnsi(cellText), {
            x: cellX + 4,
            y: currentY - 12,
            size: fontSize,
            font: rowFont,
            color: isHeader ? PDFLib.rgb(0.1, 0.1, 0.2) : PDFLib.rgb(0.2, 0.2, 0.2)
          });
        }

        currentPage.drawLine({
          start: { x: margin, y: currentY - rowHeight + 4 },
          end: { x: pageWidth - margin, y: currentY - rowHeight + 4 },
          thickness: 0.5,
          color: PDFLib.rgb(0.85, 0.85, 0.85)
        });

        currentY -= rowHeight;
      }
    }
  }

  if (pageNum === 0) {
    throw new Error('Spreadsheet is empty or has no data.');
  }

  updateProgress(88, 'Saving PDF table document...');
  const pdfBytes = await pdfDoc.save();

  const outName = files.length > 1
    ? `excel_merged_${Date.now()}.pdf`
    : `${files[0].name.replace(/\.[^/.]+$/, '')}_usemypdf.pdf`;

  window.downloadFile(pdfBytes, outName);
  updateProgress(100, 'Done! Excel converted to PDF.');
  showToast(files.length > 1 ? `${files.length} Excel files merged & converted to PDF!` : 'Excel converted to PDF successfully!', 'success');
}

// =============================================================================
// 2. PDF KE EXCEL (PDF TO EXCEL)
// =============================================================================
async function handlePdfToExcel({ files, updateProgress, showToast }) {
  if (files.length === 0) throw new Error('Please select 1 PDF file.');
  const file = files[0];

  updateProgress(10, 'Preparing Excel module...');
  await ensureXlsxLoaded();

  updateProgress(20, 'Analyzing text and table rows in PDF...');
  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const allRows = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const percent = Math.round(15 + (pageNum / numPages) * 65);
    updateProgress(percent, `Extracting table rows on page ${pageNum} of ${numPages}...`);

    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Group text items by approximate vertical Y coordinate
    const rowsMap = new Map();
    for (const item of textContent.items) {
      if (!item.str || !item.str.trim()) continue;
      const y = Math.round(item.transform[5]); // Y coordinate
      const x = Math.round(item.transform[4]); // X coordinate

      // Find closest existing Y within 4pt tolerance
      let foundY = null;
      for (const existingY of rowsMap.keys()) {
        if (Math.abs(existingY - y) <= 4) {
          foundY = existingY;
          break;
        }
      }

      const targetY = foundY !== null ? foundY : y;
      if (!rowsMap.has(targetY)) {
        rowsMap.set(targetY, []);
      }
      rowsMap.get(targetY).push({ x, text: item.str });
    }

    // Sort rows from top to bottom (descending Y)
    const sortedY = Array.from(rowsMap.keys()).sort((a, b) => b - a);
    for (const y of sortedY) {
      const itemsInRow = rowsMap.get(y).sort((a, b) => a.x - b.x);
      const rowStrings = itemsInRow.map(it => it.text);
      allRows.push(rowStrings);
    }

    // Add empty separator row between pages
    if (pageNum < numPages) {
      allRows.push([`--- End of Page ${pageNum} ---`]);
    }
  }

  updateProgress(85, 'Assembling Excel spreadsheet (.xlsx)...');
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(allRows);
  XLSX.utils.book_append_sheet(wb, ws, 'PDF Extract');

  const xlsxBytes = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  window.downloadFile(new Uint8Array(xlsxBytes), `${baseName}_usemypdf.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  updateProgress(100, 'Done! Excel spreadsheet downloaded successfully.');
  showToast('PDF extracted to Excel (.xlsx) successfully!', 'success');
}

// =============================================================================
// 3. WORD KE PDF (WORD TO PDF - Supports Multi-file Merge & Convert)
// =============================================================================
async function handleWordToPdf({ files, updateProgress, showToast }) {
  if (files.length === 0) throw new Error('Please select at least 1 Word document (.docx).');

  const pdfDoc = await PDFLib.PDFDocument.create();
  const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

  const pageWidth = 595.28; // A4 Portrait
  const pageHeight = 841.89;
  const margin = 45;
  const maxLineWidth = pageWidth - (margin * 2);
  const lineHeight = 16;

  let currentPage = null;
  let currentY = 0;

  function addNewPage() {
    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    currentY = pageHeight - margin;
  }

  const parser = new DOMParser();

  for (let fIdx = 0; fIdx < files.length; fIdx++) {
    const file = files[fIdx];
    const pct = Math.round(15 + ((fIdx / files.length) * 65));
    updateProgress(pct, `Reading Word document (${fIdx + 1}/${files.length}): ${file.name}...`);

    const zip = await JSZip.loadAsync(file);
    const docXmlFile = zip.file('word/document.xml');
    if (!docXmlFile) {
      continue;
    }

    const docXmlText = await docXmlFile.async('text');
    const xmlDoc = parser.parseFromString(docXmlText, 'application/xml');

    const paragraphs = xmlDoc.getElementsByTagName('w:p');
    const paragraphTexts = [];

    for (let i = 0; i < paragraphs.length; i++) {
      const textNodes = paragraphs[i].getElementsByTagName('w:t');
      let pText = '';
      for (let j = 0; j < textNodes.length; j++) {
        pText += textNodes[j].textContent;
      }
      if (pText.trim()) {
        paragraphTexts.push(pText.trim());
      }
    }

    if (paragraphTexts.length === 0) continue;

    // Start each document on a new page
    addNewPage();

    // Draw Document Title
    const docTitle = file.name.replace(/\.[^/.]+$/, '');
    currentPage.drawText(sanitizeWinAnsi(docTitle), {
      x: margin,
      y: currentY - 14,
      size: 15,
      font: fontBold,
      color: PDFLib.rgb(0.1, 0.1, 0.1)
    });
    currentY -= 38;

    for (const para of paragraphTexts) {
      const cleanPara = sanitizeWinAnsi(para);
      const words = cleanPara.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        let textWidth = 0;
        try {
          textWidth = font.widthOfTextAtSize(testLine, 10);
        } catch (e) {
          textWidth = testLine.length * 6;
        }

        if (textWidth > maxLineWidth && currentLine) {
          if (currentY <= margin + lineHeight) {
            addNewPage();
          }
          currentPage.drawText(currentLine, {
            x: margin,
            y: currentY,
            size: 10,
            font: font,
            color: PDFLib.rgb(0.15, 0.15, 0.15)
          });
          currentY -= lineHeight;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        if (currentY <= margin + lineHeight) {
          addNewPage();
        }
        currentPage.drawText(currentLine, {
          x: margin,
          y: currentY,
          size: 10,
          font: font,
          color: PDFLib.rgb(0.15, 0.15, 0.15)
        });
        currentY -= lineHeight + 6;
      }
    }
  }

  if (pdfDoc.getPageCount() === 0) {
    throw new Error('No readable text found in selected Word file(s).');
  }

  updateProgress(88, 'Saving PDF file...');
  const pdfBytes = await pdfDoc.save();

  const outName = files.length > 1
    ? `word_merged_${Date.now()}.pdf`
    : `${files[0].name.replace(/\.[^/.]+$/, '')}_usemypdf.pdf`;

  window.downloadFile(pdfBytes, outName);
  updateProgress(100, 'Done! Word converted to PDF.');
  showToast(files.length > 1 ? `${files.length} Word files merged & converted to PDF!` : 'Word converted to PDF successfully!', 'success');
}

// =============================================================================
// 4. PDF KE WORD (PDF TO WORD DOCX)
// =============================================================================
async function handlePdfToWord({ files, updateProgress, showToast }) {
  if (files.length === 0) throw new Error('Please select 1 PDF file.');
  const file = files[0];

  updateProgress(20, 'Extracting text & paragraphs from PDF...');
  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  let docxParagraphsXml = '';

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const percent = Math.round(20 + (pageNum / numPages) * 60);
    updateProgress(percent, `Reading text on page ${pageNum} of ${numPages}...`);

    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Group items into lines
    const lineMap = new Map();
    for (const item of textContent.items) {
      if (!item.str || !item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      let foundY = null;
      for (const ey of lineMap.keys()) {
        if (Math.abs(ey - y) <= 3) {
          foundY = ey;
          break;
        }
      }
      const targetY = foundY !== null ? foundY : y;
      if (!lineMap.has(targetY)) lineMap.set(targetY, []);
      lineMap.get(targetY).push(item);
    }

    const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a);
    for (const y of sortedY) {
      const items = lineMap.get(y).sort((a, b) => a.transform[4] - b.transform[4]);
      const lineText = items.map(it => it.str).join(' ');

      // Escape XML characters
      const escapedText = lineText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      docxParagraphsXml += `<w:p><w:r><w:t>${escapedText}</w:t></w:r></w:p>`;
    }

    // Page break in Word OpenXML
    if (pageNum < numPages) {
      docxParagraphsXml += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
    }
  }

  updateProgress(85, 'Building clean Word document (.docx)...');
  const zip = new JSZip();

  // OpenXML Core Structure
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${docxParagraphsXml}
    <w:sectPr/>
  </w:body>
</w:document>`);

  const docxBlob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });

  const baseName = file.name.replace(/\.[^/.]+$/, '');
  window.downloadFile(docxBlob, `${baseName}_usemypdf.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

  updateProgress(100, 'Done! Word document (.docx) downloaded successfully.');
  showToast('PDF converted to Word (.docx) successfully!', 'success');
}

// =============================================================================
// 5. POWERPOINT KE PDF (PPT TO PDF - Supports Multi-file Merge & Convert)
// =============================================================================
async function handlePptToPdf({ files, updateProgress, showToast }) {
  if (files.length === 0) throw new Error('Please select at least 1 presentation file (.pptx).');

  const pdfDoc = await PDFLib.PDFDocument.create();
  const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

  // 16:9 Landscape standard presentation slide (960 x 540 points)
  const slideWidth = 960;
  const slideHeight = 540;
  const margin = 50;
  const parser = new DOMParser();

  let totalSlidesCount = 0;

  for (let fIdx = 0; fIdx < files.length; fIdx++) {
    const file = files[fIdx];
    const pct = Math.round(15 + ((fIdx / files.length) * 65));
    updateProgress(pct, `Reading PowerPoint slides (${fIdx + 1}/${files.length}): ${file.name}...`);

    const zip = await JSZip.loadAsync(file);
    const slidePaths = Object.keys(zip.files).filter(path => /^ppt\/slides\/slide\d+\.xml$/.test(path));
    slidePaths.sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)[0], 10);
      const numB = parseInt(b.match(/\d+/)[0], 10);
      return numA - numB;
    });

    if (slidePaths.length === 0) continue;

    for (let s = 0; s < slidePaths.length; s++) {
      totalSlidesCount++;
      const path = slidePaths[s];
      const slideXml = await zip.files[path].async('text');
      const xmlDoc = parser.parseFromString(slideXml, 'application/xml');

      const textNodes = xmlDoc.getElementsByTagName('a:t');
      const slideTexts = [];
      for (let t = 0; t < textNodes.length; t++) {
        const txt = textNodes[t].textContent.trim();
        if (txt) slideTexts.push(txt);
      }

      const page = pdfDoc.addPage([slideWidth, slideHeight]);

      page.drawRectangle({
        x: 0,
        y: 0,
        width: slideWidth,
        height: slideHeight,
        color: PDFLib.rgb(0.97, 0.98, 1.0)
      });

      page.drawLine({
        start: { x: margin, y: slideHeight - 70 },
        end: { x: slideWidth - margin, y: slideHeight - 70 },
        thickness: 1.5,
        color: PDFLib.rgb(0.2, 0.4, 0.8)
      });

      const titleText = slideTexts.length > 0 ? slideTexts[0] : `${file.name.replace(/\.[^/.]+$/, '')} - Slide ${s + 1}`;
      page.drawText(sanitizeWinAnsi(titleText.substring(0, 70)), {
        x: margin,
        y: slideHeight - 55,
        size: 20,
        font: fontBold,
        color: PDFLib.rgb(0.1, 0.15, 0.25)
      });

      let bodyY = slideHeight - 110;
      const bodyTexts = slideTexts.slice(1);

      for (const point of bodyTexts) {
        if (bodyY <= margin + 30) break;
        page.drawText(sanitizeWinAnsi(`*  ${point.substring(0, 100)}`), {
          x: margin + 15,
          y: bodyY,
          size: 13,
          font: font,
          color: PDFLib.rgb(0.2, 0.2, 0.2)
        });
        bodyY -= 26;
      }

      page.drawText(sanitizeWinAnsi(`${file.name.replace(/\.[^/.]+$/, '')} - Slide ${s + 1} / ${slidePaths.length}`), {
        x: slideWidth - margin - 220,
        y: margin / 2,
        size: 10,
        font: font,
        color: PDFLib.rgb(0.5, 0.5, 0.5)
      });
    }
  }

  if (totalSlidesCount === 0) {
    throw new Error('No slides found in the selected PowerPoint file(s).');
  }

  updateProgress(88, 'Saving presentation PDF...');
  const pdfBytes = await pdfDoc.save();

  const outName = files.length > 1
    ? `presentation_merged_${Date.now()}.pdf`
    : `${files[0].name.replace(/\.[^/.]+$/, '')}_usemypdf.pdf`;

  window.downloadFile(pdfBytes, outName);
  updateProgress(100, 'Done! PowerPoint converted to PDF.');
  showToast(files.length > 1 ? `${files.length} Presentations merged & converted to PDF!` : 'PowerPoint converted to PDF successfully!', 'success');
}

// =============================================================================
// 6. PDF KE POWERPOINT (PDF TO PPTX)
// =============================================================================
async function handlePdfToPpt({ files, updateProgress, showToast }) {
  if (files.length === 0) throw new Error('Please select 1 PDF file.');
  const file = files[0];

  updateProgress(15, 'Rendering PDF pages for presentation slides...');
  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const zip = new JSZip();

  // Create presentation folder structure
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  ${Array.from({ length: numPages }, (_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('\n  ')}
</Types>`);

  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`);

  // ppt/presentation.xml
  const sldIdList = Array.from({ length: numPages }, (_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 1}"/>`).join('');
  zip.file('ppt/presentation.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:sldMasterIdLst/>
  <p:sldIdLst>${sldIdList}</p:sldIdLst>
  <p:sldSz cx="9144000" cy="5143500" type="screen16x9"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`);

  // ppt/_rels/presentation.xml.rels
  const presRels = Array.from({ length: numPages }, (_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`).join('');
  zip.file('ppt/_rels/presentation.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${presRels}
</Relationships>`);

  // Render each page into slide image and slide XML
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const percent = Math.round(20 + (pageNum / numPages) * 65);
    updateProgress(percent, `Creating presentation slide ${pageNum} of ${numPages}...`);

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.8 }); // Sharp presentation image

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport }).promise;

    const pageDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    canvas.width = 0;
    canvas.height = 0;
    const base64Data = pageDataUrl.replace(/^data:image\/jpeg;base64,/, '');

    zip.file(`ppt/media/image${pageNum}.jpeg`, base64Data, { base64: true });

    // Slide XML with full image shape
    zip.file(`ppt/slides/slide${pageNum}.xml`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      <p:pic>
        <p:nvPicPr>
          <p:cNvPr id="2" name="Slide Image ${pageNum}"/>
          <p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr>
          <p:nvPr/>
        </p:nvPicPr>
        <p:blipFill>
          <a:blip r:embed="rId1"/>
          <a:stretch><a:fillRect/></a:stretch>
        </p:blipFill>
        <p:spPr>
          <a:xfrm><a:off x="0" y="0"/><a:ext cx="9144000" cy="5143500"/></a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        </p:spPr>
      </p:pic>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`);

    // Slide relationship linking image
    zip.file(`ppt/slides/_rels/slide${pageNum}.xml.rels`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image${pageNum}.jpeg"/>
</Relationships>`);
  }

  updateProgress(88, 'Packaging PowerPoint presentation (.pptx)...');
  const pptxBlob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  });

  const baseName = file.name.replace(/\.[^/.]+$/, '');
  window.downloadFile(pptxBlob, `${baseName}_usemypdf.pptx`, 'application/vnd.openxmlformats-officedocument.presentationml.presentation');

  updateProgress(100, 'Done! PowerPoint presentation (.pptx) downloaded successfully.');
  showToast('PDF converted to PowerPoint (.pptx) successfully!', 'success');
}

// Register Handlers to Global Object
window.pdfHandlers = window.pdfHandlers || {};
window.pdfHandlers['excel-to-pdf'] = handleExcelToPdf;
window.pdfHandlers['pdf-to-excel'] = handlePdfToExcel;
window.pdfHandlers['word-to-pdf'] = handleWordToPdf;
window.pdfHandlers['pdf-to-word'] = handlePdfToWord;
window.pdfHandlers['ppt-to-pdf'] = handlePptToPdf;
window.pdfHandlers['pdf-to-ppt'] = handlePdfToPpt;
