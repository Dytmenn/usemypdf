/**
 * usemypdf - PDF Organize Module
 * Handles client-side: Merge, Split, Delete Pages, and Organize/Rotate.
 * 100% processed in browser memory (RAM).
 */

// Helper: Trigger browser download for Blob or Uint8Array
function downloadFile(data, filename, mimeType = 'application/pdf') {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
window.downloadFile = window.downloadFile || downloadFile;

// Helper: Parse human page ranges e.g. "1-3, 5, 8-10" to 0-indexed unique integers
function parsePageRanges(rangeStr, totalPages) {
  if (!rangeStr || !rangeStr.trim()) {
    // Default to all pages if empty
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const pages = new Set();
  const parts = rangeStr.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(totalPages, Math.max(start, end));
        for (let i = min; i <= max; i++) {
          pages.add(i - 1);
        }
      }
    } else {
      const pageNum = parseInt(trimmed, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        pages.add(pageNum - 1);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

// =============================================================================
// 1. GABUNGKAN PDF (MERGE)
// =============================================================================
async function handleMergePDF({ files, updateProgress, showToast }) {
  if (files.length < 2) {
    throw new Error('Please select at least 2 PDF files to merge.');
  }

  updateProgress(15, 'Creating merged PDF document...');
  const mergedPdf = await PDFLib.PDFDocument.create();

  const totalFiles = files.length;
  for (let i = 0; i < totalFiles; i++) {
    const file = files[i];
    const percent = Math.round(15 + ((i + 1) / totalFiles) * 70);
    updateProgress(percent, `Merging file ${i + 1} of ${totalFiles}: ${file.name}...`);

    const fileBytes = await file.arrayBuffer();
    const sourcePdf = await PDFLib.PDFDocument.load(fileBytes);
    const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
    
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  updateProgress(90, 'Compressing and generating final PDF...');
  const mergedPdfBytes = await mergedPdf.save();

  const defaultName = `usemypdf_merged_${Date.now()}.pdf`;
  downloadFile(mergedPdfBytes, defaultName);

  updateProgress(100, 'Done! File downloaded successfully.');
  showToast('Documents merged successfully!', 'success');
}

// =============================================================================
// 2. PISAHKAN PDF (SPLIT)
// =============================================================================
async function handleSplitPDF({ files, updateProgress, showToast }) {
  if (files.length === 0) throw new Error('Please select 1 PDF file.');
  const file = files[0];

  updateProgress(20, 'Reading PDF document structure...');
  const fileBytes = await file.arrayBuffer();
  const sourcePdf = await PDFLib.PDFDocument.load(fileBytes);
  const totalPages = sourcePdf.getPageCount();

  const modeRadio = document.querySelector('input[name="splitMode"]:checked');
  const mode = modeRadio ? modeRadio.value : 'range';

  if (mode === 'all') {
    // Split each individual page into a separate PDF packed into a ZIP
    if (typeof JSZip === 'undefined') {
      throw new Error('ZIP packaging component not ready.');
    }

    const zip = new JSZip();
    const baseName = file.name.replace(/\.[^/.]+$/, '');

    for (let i = 0; i < totalPages; i++) {
      const percent = Math.round(20 + ((i + 1) / totalPages) * 60);
      updateProgress(percent, `Extracting page ${i + 1} of ${totalPages}...`);

      const singlePdf = await PDFLib.PDFDocument.create();
      const [copiedPage] = await singlePdf.copyPages(sourcePdf, [i]);
      singlePdf.addPage(copiedPage);

      const singleBytes = await singlePdf.save();
      zip.file(`${baseName}_page_${i + 1}.pdf`, singleBytes);
    }

    updateProgress(85, 'Packaging files into .zip archive...');
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadFile(zipBlob, `${baseName}_usemypdf_split.zip`, 'application/zip');

    updateProgress(100, 'Done! ZIP archive downloaded successfully.');
    showToast(`${totalPages} pages successfully split into ZIP!`, 'success');

  } else {
    // Mode range: extract specific page ranges or multi-part split (ZIP)
    const rangeInput = document.getElementById('splitRangeInput');
    const rangeStr = rangeInput ? rangeInput.value : '';

    // Split input by comma into individual parts (e.g. "1-7, 8-21")
    const rawSegments = (rangeStr || `1-${totalPages}`)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const segments = [];
    for (const rawSeg of rawSegments) {
      const indices = parsePageRanges(rawSeg, totalPages);
      if (indices.length > 0) {
        segments.push({
          label: rawSeg.replace(/\s+/g, ''),
          indices
        });
      }
    }

    if (segments.length === 0) {
      throw new Error('No matching page numbers found to extract.');
    }

    const baseName = file.name.replace(/\.[^/.]+$/, '');

    if (segments.length === 1) {
      // Single range: download directly as a single PDF
      const seg = segments[0];
      updateProgress(45, `Extracting pages (${seg.label})...`);

      const splitPdf = await PDFLib.PDFDocument.create();
      const copiedPages = await splitPdf.copyPages(sourcePdf, seg.indices);
      copiedPages.forEach((page) => splitPdf.addPage(page));

      updateProgress(85, 'Saving new PDF document...');
      const splitBytes = await splitPdf.save();
      downloadFile(splitBytes, `${baseName}_part_${seg.label}.pdf`);

      updateProgress(100, 'Done! File downloaded successfully.');
      showToast(`Pages (${seg.label}) split successfully!`, 'success');

    } else {
      // Multi-part split (e.g. 1-7, 8-21, or any arbitrary cut count): package into ZIP
      if (typeof JSZip === 'undefined') {
        throw new Error('ZIP packaging component not ready.');
      }

      const zip = new JSZip();

      for (let s = 0; s < segments.length; s++) {
        const seg = segments[s];
        const percent = Math.round(25 + ((s + 1) / segments.length) * 55);
        updateProgress(percent, `Extracting part ${s + 1} of ${segments.length} (${seg.label})...`);

        const partPdf = await PDFLib.PDFDocument.create();
        const copiedPages = await partPdf.copyPages(sourcePdf, seg.indices);
        copiedPages.forEach((page) => partPdf.addPage(page));

        const partBytes = await partPdf.save();
        const safeLabel = seg.label.replace(/[^0-9\-]/g, '_');
        zip.file(`${baseName}_part_${safeLabel}.pdf`, partBytes);
      }

      updateProgress(85, 'Packaging all parts into .zip archive...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadFile(zipBlob, `${baseName}_split.zip`, 'application/zip');

      updateProgress(100, 'Done! All parts split and packaged into ZIP.');
      showToast(`${segments.length} PDF parts split and packaged to ZIP!`, 'success');
    }
  }
}

// =============================================================================
// 3. HAPUS HALAMAN (DELETE PAGES)
// =============================================================================
async function handleDeletePages({ files, updateProgress, showToast }) {
  if (files.length === 0) throw new Error('Please select 1 PDF file.');
  const file = files[0];

  updateProgress(20, 'Reading PDF document...');
  const fileBytes = await file.arrayBuffer();
  const sourcePdf = await PDFLib.PDFDocument.load(fileBytes);
  const totalPages = sourcePdf.getPageCount();

  // Get delete range or visual selection
  const deleteInput = document.getElementById('deletePagesInput');
  const deleteStr = deleteInput ? deleteInput.value : '';
  const pagesToDelete = new Set(parsePageRanges(deleteStr, totalPages));

  if (pagesToDelete.size === 0) {
    throw new Error('Please specify page numbers to remove (e.g. 1, 3-5).');
  }

  if (pagesToDelete.size >= totalPages) {
    throw new Error('You cannot remove all pages in the document.');
  }

  updateProgress(50, 'Filtering and removing selected pages...');
  const cleanedPdf = await PDFLib.PDFDocument.create();
  const keepIndices = [];

  for (let i = 0; i < totalPages; i++) {
    if (!pagesToDelete.has(i)) {
      keepIndices.push(i);
    }
  }

  const copiedPages = await cleanedPdf.copyPages(sourcePdf, keepIndices);
  copiedPages.forEach((page) => cleanedPdf.addPage(page));

  updateProgress(85, 'Generating clean PDF document...');
  const cleanedBytes = await cleanedPdf.save();

  const baseName = file.name.replace(/\.[^/.]+$/, '');
  downloadFile(cleanedBytes, `${baseName}_usemypdf_removed.pdf`);

  updateProgress(100, 'Done! File downloaded successfully.');
  showToast(`${pagesToDelete.size} page(s) removed successfully!`, 'success');
}

// =============================================================================
// 4. ATUR & PUTAR PDF (ORGANIZE & ROTATE)
// =============================================================================
async function handleOrganizePDF({ files, updateProgress, showToast }) {
  if (files.length === 0) throw new Error('Please select 1 PDF file.');
  const file = files[0];

  updateProgress(20, 'Reading page layouts and orientations...');
  const fileBytes = await file.arrayBuffer();
  const sourcePdf = await PDFLib.PDFDocument.load(fileBytes);
  const totalPages = sourcePdf.getPageCount();

  // Read visual cards directly from the workspace preview (WYSIWYG)
  const cardElements = Array.from(document.querySelectorAll('#pagesThumbnailsGrid .page-thumbnail-card'));
  const organizedPdf = await PDFLib.PDFDocument.create();

  if (cardElements.length > 0) {
    updateProgress(40, `Arranging ${cardElements.length} pages matching canvas preview...`);

    for (let i = 0; i < cardElements.length; i++) {
      const card = cardElements[i];
      const pageNum = parseInt(card.dataset.pageNum, 10);
      const pageIndex = Math.max(0, Math.min(totalPages - 1, pageNum - 1));

      const canvas = card.querySelector('canvas');
      const visualRotation = canvas ? parseInt(canvas.dataset.rotation || '0', 10) : 0;

      const percent = Math.round(40 + ((i + 1) / cardElements.length) * 45);
      updateProgress(percent, `Applying orientation for page ${pageNum}...`);

      const [copiedPage] = await organizedPdf.copyPages(sourcePdf, [pageIndex]);
      const currentAngle = copiedPage.getRotation().angle;
      copiedPage.setRotation(PDFLib.degrees((currentAngle + visualRotation) % 360));
      organizedPdf.addPage(copiedPage);
    }
  } else {
    // Fallback if DOM cards are not present: rotate all pages
    const rotateSelect = document.getElementById('globalRotateSelect');
    const rotationAngle = rotateSelect ? parseInt(rotateSelect.value, 10) : 90;

    updateProgress(50, `Rotating all ${totalPages} pages by ${rotationAngle}°...`);
    const copiedPages = await organizedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
    copiedPages.forEach((page) => {
      const currentAngle = page.getRotation().angle;
      page.setRotation(PDFLib.degrees((currentAngle + rotationAngle) % 360));
      organizedPdf.addPage(page);
    });
  }

  updateProgress(90, 'Saving new PDF document...');
  const organizedBytes = await organizedPdf.save();

  const baseName = file.name.replace(/\.[^/.]+$/, '');
  downloadFile(organizedBytes, `${baseName}_usemypdf_organized.pdf`);

  updateProgress(100, 'Done! File downloaded successfully.');
  showToast('Page layout and orientations saved matching preview!', 'success');
}

// Register Handlers to Global Object
window.pdfHandlers = window.pdfHandlers || {};
window.pdfHandlers['merge'] = handleMergePDF;
window.pdfHandlers['split'] = handleSplitPDF;
window.pdfHandlers['delete-pages'] = handleDeletePages;
window.pdfHandlers['organize'] = handleOrganizePDF;
