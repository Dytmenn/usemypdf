/**
 * usemypdf - PDF Conversion Module
 * Handles client-side: JPG/PNG/WebP to PDF & PDF to high-resolution JPG images.
 * 100% processed in browser memory (RAM).
 */

// Helper: Convert any image (including WebP, BMP) to JPEG Data URL via HTML Canvas
function imageToJpegDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        // Fill white background for transparent PNG/WebP
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        resolve({ dataUrl, width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// =============================================================================
// 1. JPG / GAMBAR KE PDF (IMAGES TO PDF)
// =============================================================================
async function handleJpgToPdf({ files, updateProgress, showToast }) {
  if (files.length === 0) throw new Error('Pilih minimal 1 berkas gambar.');

  updateProgress(10, 'Mempersiapkan pembuatan dokumen PDF...');
  const pdfDoc = await PDFLib.PDFDocument.create();

  // Read options from UI if available
  const sizeSelect = document.getElementById('jpgPdfPageSize');
  const orientationSelect = document.getElementById('jpgPdfOrientation');

  const pageSizeOpt = sizeSelect ? sizeSelect.value : 'A4';
  const orientationOpt = orientationSelect ? orientationSelect.value : 'portrait';

  const total = files.length;
  for (let i = 0; i < total; i++) {
    const file = files[i];
    const percent = Math.round(15 + ((i + 1) / total) * 70);
    updateProgress(percent, `Mengonversi gambar ${i + 1} dari ${total}: ${file.name}...`);

    // Normalize image to JPEG bytes
    const { dataUrl, width: imgWidth, height: imgHeight } = await imageToJpegDataUrl(file);
    const embeddedImage = await pdfDoc.embedJpg(dataUrl);

    let pageWidth, pageHeight;

    if (pageSizeOpt === 'FIT') {
      pageWidth = imgWidth;
      pageHeight = imgHeight;
    } else if (pageSizeOpt === 'LETTER') {
      pageWidth = orientationOpt === 'portrait' ? 612 : 792;
      pageHeight = orientationOpt === 'portrait' ? 792 : 612;
    } else {
      // Default A4 (595.28 x 841.89 points)
      pageWidth = orientationOpt === 'portrait' ? 595.28 : 841.89;
      pageHeight = orientationOpt === 'portrait' ? 841.89 : 595.28;
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Calculate aspect ratio fit with 20pt margin
    const margin = pageSizeOpt === 'FIT' ? 0 : 20;
    const availWidth = pageWidth - margin * 2;
    const availHeight = pageHeight - margin * 2;

    const scale = Math.min(availWidth / imgWidth, availHeight / imgHeight);
    const drawWidth = imgWidth * scale;
    const drawHeight = imgHeight * scale;

    const x = (pageWidth - drawWidth) / 2;
    const y = (pageHeight - drawHeight) / 2;

    page.drawImage(embeddedImage, {
      x,
      y,
      width: drawWidth,
      height: drawHeight
    });
  }

  updateProgress(90, 'Menyusun berkas PDF akhir...');
  const pdfBytes = await pdfDoc.save();

  const defaultName = `usemypdf_gambar_${Date.now()}.pdf`;
  window.downloadFile(pdfBytes, defaultName);

  updateProgress(100, 'Selesai! PDF berhasil diunduh.');
  showToast(`${total} gambar berhasil diubah menjadi PDF!`, 'success');
}

// =============================================================================
// 2. PDF KE JPG / GAMBAR (PDF TO IMAGES WITH HD & ULTRA HD OPTIONS)
// =============================================================================
async function handlePdfToJpg({ files, updateProgress, showToast }) {
  if (files.length === 0) throw new Error('Pilih 1 berkas PDF.');
  const file = files[0];

  updateProgress(15, 'Membaca struktur halaman PDF...');
  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDocument = await loadingTask.promise;
  const numPages = pdfDocument.numPages;

  const baseName = file.name.replace(/\.[^/.]+$/, '');

  // Read selected quality & format from Parameter options
  const qualityRadio = document.querySelector('input[name="imageQuality"]:checked');
  const qualityVal = qualityRadio ? qualityRadio.value : 'hd';

  let scale = 2.5; // Default: HD (300 DPI)
  let encoderQuality = 0.95;
  let qualityLabel = 'HD';

  if (qualityVal === 'standard') {
    scale = 1.5; // Standard (150 DPI)
    encoderQuality = 0.85;
    qualityLabel = 'Standard';
  } else if (qualityVal === 'ultrahd') {
    scale = 3.5; // Ultra HD (600 DPI)
    encoderQuality = 0.99;
    qualityLabel = 'Ultra HD';
  }

  const formatRadio = document.querySelector('input[name="imageFormat"]:checked');
  const isPng = formatRadio && formatRadio.value === 'png';
  const mimeType = isPng ? 'image/png' : 'image/jpeg';
  const ext = isPng ? 'png' : 'jpg';

  if (numPages === 1) {
    // Single page download directly as image
    updateProgress(50, `Merender halaman 1 resolusi ${qualityLabel} (${ext.toUpperCase()})...`);
    const page = await pdfDocument.getPage(1);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport }).promise;

    canvas.toBlob((blob) => {
      canvas.width = 0;
      canvas.height = 0;
      window.downloadFile(blob, `${baseName}_hal_1_${qualityVal}.${ext}`, mimeType);
      updateProgress(100, `Selesai! Gambar ${qualityLabel} berhasil diunduh.`);
    }, mimeType, encoderQuality);

  } else {
    // Multiple pages: package all rendered images into a ZIP
    if (typeof JSZip === 'undefined') {
      throw new Error('Komponen pengarsipan ZIP belum siap.');
    }

    const zip = new JSZip();

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const percent = Math.round(20 + (pageNum / numPages) * 65);
      updateProgress(percent, `Merender lembar ${pageNum} dari ${numPages} (${qualityLabel})...`);

      const page = await pdfDocument.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: ctx, viewport }).promise;

      const pageDataUrl = canvas.toDataURL(mimeType, encoderQuality);
      canvas.width = 0;
      canvas.height = 0;
      const base64Prefix = isPng ? /^data:image\/png;base64,/ : /^data:image\/jpeg;base64,/;
      const base64Data = pageDataUrl.replace(base64Prefix, '');
      zip.file(`${baseName}_hal_${pageNum}_${qualityVal}.${ext}`, base64Data, { base64: true });
    }

    updateProgress(88, `Mengemas seluruh gambar ${qualityLabel} ke format .zip...`);
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    window.downloadFile(zipBlob, `${baseName}_${ext}_${qualityVal}_lengkap.zip`, 'application/zip');

    updateProgress(100, `Selesai! Berkas ZIP gambar ${qualityLabel} berhasil diunduh.`);
  }
}

// Register Handlers to Global Object
window.pdfHandlers = window.pdfHandlers || {};
window.pdfHandlers['jpg-to-pdf'] = handleJpgToPdf;
window.pdfHandlers['pdf-to-jpg'] = handlePdfToJpg;
