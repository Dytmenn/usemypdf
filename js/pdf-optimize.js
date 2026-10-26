/**
 * usemypdf - PDF Optimize Module
 * Handles client-side: PDF Compression with visual quality balancing.
 * 100% processed in browser memory (RAM).
 */

// Helper: Format bytes to human readable string (KB / MB)
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// =============================================================================
// KOMPRES PDF (COMPRESS) - DUAL-TIER ADAPTIVE ENGINE
// =============================================================================
async function handleCompressPDF({ files, updateProgress, showToast }) {
  if (!files || files.length === 0) throw new Error('Please select 1 PDF file to compress.');
  const file = files[0];
  const originalSize = file.size;

  // Determine compression quality level from UI (1: Extreme, 2: Recommended, 3: Less)
  const checkedRadio = document.querySelector('input[name="compressionLevel"]:checked');
  const rangeInput = document.getElementById('compressQualityRange');
  const level = checkedRadio ? parseInt(checkedRadio.value, 10) : (rangeInput ? parseInt(rangeInput.value, 10) : 2);

  updateProgress(10, 'Analyzing document pages...');
  const arrayBuffer = await file.arrayBuffer();

  // ---------------------------------------------------------------------------
  // PASS 1: Lossless Structural & Stream Optimization Candidate
  // ---------------------------------------------------------------------------
  updateProgress(20, 'Optimizing PDF object streams & structure...');
  let structBytes = null;
  try {
    const docStruct = await PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    // Strip redundant metadata streams and properties
    docStruct.setTitle('');
    docStruct.setAuthor('');
    docStruct.setSubject('');
    docStruct.setKeywords([]);
    docStruct.setProducer('');
    docStruct.setCreator('');
    structBytes = await docStruct.save({ useObjectStreams: true, addDefaultPage: false });
  } catch (err) {
    console.warn('[Compress] Structural optimization skipped:', err);
  }

  // ---------------------------------------------------------------------------
  // PASS 2: Adaptive Visual Compression Candidate
  // ---------------------------------------------------------------------------
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
  const pdfDocument = await loadingTask.promise;
  const numPages = pdfDocument.numPages;

  // Dynamically calibrate baseScale and baseQuality based on user level & page count
  // to strictly prevent canvas byte inflation
  let baseScale = 0.95;
  let baseQuality = 0.58;

  if (level === 1) {
    // Extreme compression (smallest size)
    baseScale = 0.80;
    baseQuality = 0.44;
  } else if (level === 3) {
    // High visual fidelity (light compression)
    baseScale = 1.05;
    baseQuality = 0.70;
  }

  // Multi-page documents require tighter page budgets
  if (numPages > 5) {
    baseScale = Math.min(baseScale, 0.88);
    baseQuality = Math.min(baseQuality, 0.52);
  }
  if (numPages > 12) {
    baseScale = Math.min(baseScale, 0.78);
    baseQuality = Math.min(baseQuality, 0.45);
  }

  // Helper: Render pages to canvas at given scale & JPEG quality
  async function renderCompressedPdf(scale, quality, progressStart, progressEnd) {
    const newPdf = await PDFLib.PDFDocument.create();
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const pPercent = Math.round(progressStart + (pageNum / numPages) * (progressEnd - progressStart));
      updateProgress(pPercent, `Compressing page ${pageNum} of ${numPages}...`);

      const page = await pdfDocument.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      const ctx = canvas.getContext('2d');

      // White background for transparent pages
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: ctx, viewport }).promise;

      const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
      canvas.width = 0;
      canvas.height = 0;
      const embeddedJpg = await newPdf.embedJpg(jpegDataUrl);

      const origViewport = page.getViewport({ scale: 1.0 });
      const newPage = newPdf.addPage([origViewport.width, origViewport.height]);

      newPage.drawImage(embeddedJpg, {
        x: 0,
        y: 0,
        width: origViewport.width,
        height: origViewport.height
      });
    }
    return await newPdf.save({ useObjectStreams: true, addDefaultPage: false });
  }

  updateProgress(25, `Preparing compression for ${numPages} page(s)...`);
  let visualBytes = await renderCompressedPdf(baseScale, baseQuality, 30, 80);

  // ---------------------------------------------------------------------------
  // PROGRESSIVE AUTO-DOWNSCALE LOOP:
  // If visual compression is still >= originalSize, automatically refine parameters
  // to guarantee that the output size is strictly smaller than input
  // ---------------------------------------------------------------------------
  let autoRetries = 0;
  let curScale = baseScale;
  let curQuality = baseQuality;
  while (visualBytes.length >= originalSize && autoRetries < 2) {
    autoRetries++;
    updateProgress(82, 'Refining resolution for maximum size optimization...');
    curScale = Math.max(0.65, curScale * 0.82);
    curQuality = Math.max(0.32, curQuality * 0.78);
    visualBytes = await renderCompressedPdf(curScale, curQuality, 82, 88);
  }

  // ---------------------------------------------------------------------------
  // CANDIDATE SELECTION:
  // Choose the candidate that guarantees size reduction and respects user level
  // ---------------------------------------------------------------------------
  updateProgress(90, 'Verifying compressed file size...');

  const validCandidates = [];
  if (structBytes && structBytes.length < originalSize) {
    validCandidates.push({ type: 'structural', bytes: structBytes, size: structBytes.length });
  }
  if (visualBytes && visualBytes.length < originalSize) {
    validCandidates.push({ type: 'visual', bytes: visualBytes, size: visualBytes.length });
  }

  let finalCandidate = null;

  if (validCandidates.length > 0) {
    // Sort by size ascending (smallest file first)
    validCandidates.sort((a, b) => a.size - b.size);

    if (level === 1) {
      // Extreme: always pick smallest size
      finalCandidate = validCandidates[0];
    } else if (level === 3) {
      // Less: if structural is valid, prefer structural (vector sharpness)
      const struct = validCandidates.find(c => c.type === 'structural');
      finalCandidate = struct || validCandidates[0];
    } else {
      // Recommended: pick smallest valid
      finalCandidate = validCandidates[0];
    }
  } else {
    // Failsafe: if neither candidate was smaller (e.g. ultra-compact small vector PDF)
    // Run an emergency downscale pass to force reduction
    updateProgress(92, 'Optimizing file compactness...');
    const emergencyBytes = await renderCompressedPdf(0.70, 0.35, 92, 95);
    if (emergencyBytes.length < originalSize) {
      finalCandidate = { type: 'emergency_visual', bytes: emergencyBytes, size: emergencyBytes.length };
    } else if (structBytes && structBytes.length <= originalSize) {
      finalCandidate = { type: 'structural', bytes: structBytes, size: structBytes.length };
    } else {
      // Absolute guarantee: never produce a file larger than original
      finalCandidate = { type: 'original', bytes: new Uint8Array(arrayBuffer), size: originalSize };
    }
  }

  const finalBytes = finalCandidate.bytes;
  const finalSize = finalCandidate.size;

  // Prepare download
  updateProgress(96, 'Packaging compressed PDF file...');
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const outFilename = `${baseName}_compressed.pdf`;

  window.downloadFile(finalBytes, outFilename);

  // Calculate savings percentage
  const origFormatted = formatBytes(originalSize);
  const compFormatted = formatBytes(finalSize);
  const savedBytes = originalSize - finalSize;
  const savedPercent = originalSize > 0 ? Math.max(0, Math.round((savedBytes / originalSize) * 100)) : 0;

  updateProgress(100, `Done! Reduced from ${origFormatted} to ${compFormatted}`);

  if (savedPercent > 0) {
    showToast(`Compression complete! Saved ${savedPercent}% (${origFormatted} → ${compFormatted})`, 'success');
  } else {
    showToast(`Document optimized successfully (${compFormatted})!`, 'success');
  }
}

// Register Handlers to Global Object
window.pdfHandlers = window.pdfHandlers || {};
window.pdfHandlers['compress'] = handleCompressPDF;
