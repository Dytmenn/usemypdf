/**
 * usemypdf - Main Application Controller (Stirling Ultra-Minimal Workspace)
 * 100% Client-Side, Zero-Upload, In-Memory PDF Processing Suite.
 */

// Tool Configuration Definitions (13 Tools)
const TOOL_CONFIGS = {
  // ATUR PDF
  'split': {
    title: 'Split PDF',
    shortTitle: 'Split',
    desc: 'Extract page ranges or separate all pages.',
    icon: 'scissors',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    buttonText: 'Split PDF'
  },
  'merge': {
    title: 'Merge PDF',
    shortTitle: 'Merge',
    desc: 'Combine multiple PDF files into one.',
    icon: 'folder-plus',
    accept: '.pdf',
    multiple: true,
    minFiles: 2,
    buttonText: 'Merge PDF'
  },
  'delete-pages': {
    title: 'Remove Pages',
    shortTitle: 'Remove Pages',
    desc: 'Select and remove unwanted pages.',
    icon: 'file-minus',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    buttonText: 'Remove Pages'
  },
  'organize': {
    title: 'Organize & Rotate',
    shortTitle: 'Organize',
    desc: 'Reorder pages and rotate document.',
    icon: 'layout-grid',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    buttonText: 'Save Orientation'
  },

  // OPTIMALKAN PDF
  'compress': {
    title: 'Compress PDF',
    shortTitle: 'Compress',
    desc: 'Reduce PDF file size while preserving quality.',
    icon: 'minimize-2',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    buttonText: 'Compress PDF'
  },

  // KONVERSI KE PDF
  'jpg-to-pdf': {
    title: 'JPG to PDF',
    shortTitle: 'JPG to PDF',
    desc: 'Convert JPG, PNG, or WebP images to PDF.',
    icon: 'image',
    accept: 'image/jpeg,image/png,image/webp',
    multiple: true,
    minFiles: 1,
    buttonText: 'Convert to PDF'
  },
  'word-to-pdf': {
    title: 'WORD to PDF',
    shortTitle: 'WORD to PDF',
    desc: 'Convert Word documents (.docx) to PDF.',
    icon: 'file-text',
    accept: '.docx,.doc',
    multiple: true,
    minFiles: 1,
    buttonText: 'Convert to PDF'
  },
  'ppt-to-pdf': {
    title: 'POWERPOINT to PDF',
    shortTitle: 'POWERPOINT to PDF',
    desc: 'Convert PowerPoint slides (.pptx) to PDF.',
    icon: 'presentation',
    accept: '.pptx,.ppt',
    multiple: true,
    minFiles: 1,
    buttonText: 'Convert to PDF'
  },
  'excel-to-pdf': {
    title: 'EXCEL to PDF',
    shortTitle: 'EXCEL to PDF',
    desc: 'Convert Excel spreadsheets (.xlsx) to PDF.',
    icon: 'sheet',
    accept: '.xlsx,.xls',
    multiple: true,
    minFiles: 1,
    buttonText: 'Convert to PDF'
  },

  // KONVERSI DARI PDF
  'pdf-to-jpg': {
    title: 'PDF to JPG',
    shortTitle: 'PDF to JPG',
    desc: 'Extract PDF pages as high quality images.',
    icon: 'file-image',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    buttonText: 'Extract JPG'
  },
  'pdf-to-word': {
    title: 'PDF to WORD',
    shortTitle: 'PDF to WORD',
    desc: 'Convert PDF document to editable Word docx.',
    icon: 'file-edit',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    buttonText: 'Convert to Word'
  },
  'pdf-to-ppt': {
    title: 'PDF to POWERPOINT',
    shortTitle: 'PDF to PPT',
    desc: 'Convert PDF document to PowerPoint slides.',
    icon: 'projector',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    buttonText: 'Convert to PPT'
  },
  'pdf-to-excel': {
    title: 'PDF to EXCEL',
    shortTitle: 'PDF to Excel',
    desc: 'Extract PDF tables directly into Excel sheet.',
    icon: 'table',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    buttonText: 'Convert to Excel'
  }
};

// Global State
const state = {
  activeToolId: 'split',
  selectedFiles: [],
  searchQuery: '',
  splitCuts: new Set(),
  pdfCache: {
    fileKey: null,
    gridElement: null,
    numPages: 0
  }
};

// DOM Elements
const elements = {
  // Header
  globalSearchInput: document.getElementById('globalSearchInput'),
  btnFocusSearch: document.getElementById('btnFocusSearch'),
  btnThemeToggle: document.getElementById('btnThemeToggle'),
  themeIconSun: document.getElementById('themeIconSun'),
  themeIconMoon: document.getElementById('themeIconMoon'),
  btnPrivacyInfo: document.getElementById('btnPrivacyInfo'),
  btnToggleSidebarMobile: document.getElementById('btnToggleSidebarMobile'),
  
  // Center Stage
  centerMainStage: document.getElementById('centerMainStage'),
  welcomeState: document.getElementById('welcomeState'),
  welcomeDropzoneBox: document.getElementById('welcomeDropzoneBox'),
  btnCenterAddFiles: document.getElementById('btnCenterAddFiles'),
  btnCenterChevron: document.getElementById('btnCenterChevron'),
  welcomeDropdownMenu: document.getElementById('welcomeDropdownMenu'),
  btnDropdownChooseFiles: document.getElementById('btnDropdownChooseFiles'),
  btnDropdownChooseFolder: document.getElementById('btnDropdownChooseFolder'),
  folderInput: document.getElementById('folderInput'),
  
  // Workspace Canvas
  workspaceState: document.getElementById('workspaceState'),
  activeToolIconBadge: document.getElementById('activeToolIconBadge'),
  activeDocTitle: document.getElementById('activeDocTitle'),
  activeDocPageCount: document.getElementById('activeDocPageCount'),
  btnAddMoreFiles: document.getElementById('btnAddMoreFiles'),
  btnChangeFile: document.getElementById('btnChangeFile'),
  pagesThumbnailsGrid: document.getElementById('pagesThumbnailsGrid'),
  fileInput: document.getElementById('fileInput'),
  
  // Right Sidebar
  rightToolsSidebar: document.getElementById('rightToolsSidebar'),
  toolListItems: document.querySelectorAll('.tool-list-item'),
  sidebarActiveToolBadge: document.getElementById('sidebarActiveToolBadge'),
  sidebarToolTitle: document.getElementById('sidebarToolTitle'),
  processorStatusMessage: document.getElementById('processorStatusMessage'),
  toolOptionsSection: document.getElementById('toolOptionsSection'),
  
  // Execution (In-Button Progress)
  btnProcess: document.getElementById('btnProcessTool'),
  btnProcessText: document.getElementById('btnProcessText'),
  btnProgressBar: document.getElementById('btnProgressBar'),
  btnProcessIcon: document.getElementById('btnProcessIcon'),
  
  // Privacy Popover
  privacyPopover: document.getElementById('privacyPopover')
};

// =============================================================================
// INITIALIZATION
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  setupThemeToggle();
  setupSidebarToolSelection();
  setupSearchAndShortcuts();
  setupFilePickersAndDropzone();
  setupPrivacyModal();
  setupMobileSidebar();

  // Set default tool to 'split' and initialize tool locks
  setActiveTool('split');
  updateSidebarToolLocks();
});

function initIcons() {
  if (window.lucide) {
    lucide.createIcons();
  }
}

// =============================================================================
// THEME SWITCHER (Dark / Light Mode)
// =============================================================================
function setupThemeToggle() {
  const isDark = document.documentElement.classList.contains('dark');
  updateThemeUI(isDark ? 'dark' : 'light');

  if (elements.btnThemeToggle) {
    elements.btnThemeToggle.addEventListener('click', () => {
      const currentIsDark = document.documentElement.classList.contains('dark');
      const nextTheme = currentIsDark ? 'light' : 'dark';
      applyTheme(nextTheme);
    });
  }
}

function applyTheme(theme) {
  // Ultra-lightweight Zero-Lag Theme Switching (next-themes pattern)
  // Temporarily disables all CSS transitions to avoid frame drop when many pages are open
  const css = document.createElement('style');
  css.appendChild(
    document.createTextNode(
      `*, *::before, *::after {
        -webkit-transition: none !important;
        -moz-transition: none !important;
        -o-transition: none !important;
        -ms-transition: none !important;
        transition: none !important;
      }`
    )
  );
  document.head.appendChild(css);

  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    localStorage.setItem('usemypdf-theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('usemypdf-theme', 'light');
  }
  updateThemeUI(theme);

  // Force synchronous layout recalculation so the theme applies instantaneously in 1 frame
  (() => window.getComputedStyle(document.body))();

  // Re-enable normal CSS transitions in the next animation frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (document.head.contains(css)) {
        document.head.removeChild(css);
      }
    });
  });
}

function updateThemeUI(theme) {
  if (!elements.themeIconSun || !elements.themeIconMoon) return;
  if (theme === 'dark') {
    elements.themeIconSun.classList.remove('hidden');
    elements.themeIconMoon.classList.add('hidden');
  } else {
    elements.themeIconSun.classList.add('hidden');
    elements.themeIconMoon.classList.remove('hidden');
  }
}

// =============================================================================
// FILE TYPE LOCKING & COMPATIBILITY GUARD
// =============================================================================
function getActiveFileCategory() {
  if (!state.selectedFiles || state.selectedFiles.length === 0) {
    return 'none';
  }
  const firstFile = state.selectedFiles[0];
  const ext = firstFile.name.split('.').pop().toLowerCase();

  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return 'image';
  if (['doc', 'docx'].includes(ext)) return 'word';
  if (['xls', 'xlsx'].includes(ext)) return 'excel';
  if (['ppt', 'pptx'].includes(ext)) return 'ppt';

  return 'other';
}

function isToolCompatibleWithCategory(toolId, category) {
  if (category === 'none') {
    return true; // No file opened: all tools freely accessible
  }
  const config = TOOL_CONFIGS[toolId];
  if (!config) return true;

  if (category === 'pdf') {
    return config.accept === '.pdf';
  }
  if (category === 'image') {
    return toolId === 'jpg-to-pdf';
  }
  if (category === 'word') {
    return toolId === 'word-to-pdf';
  }
  if (category === 'excel') {
    return toolId === 'excel-to-pdf';
  }
  if (category === 'ppt') {
    return toolId === 'ppt-to-pdf';
  }

  return false;
}

function isFileAcceptedByTool(file, toolId) {
  const config = TOOL_CONFIGS[toolId];
  if (!config) return false;

  const ext = file.name.split('.').pop().toLowerCase();

  if (config.accept === '.pdf') {
    return ext === 'pdf';
  }
  if (toolId === 'jpg-to-pdf') {
    return ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
  }
  if (toolId === 'word-to-pdf') {
    return ['docx', 'doc'].includes(ext);
  }
  if (toolId === 'excel-to-pdf') {
    return ['xlsx', 'xls'].includes(ext);
  }
  if (toolId === 'ppt-to-pdf') {
    return ['pptx', 'ppt'].includes(ext);
  }

  return false;
}

function isDragDataCompatibleWithTool(dataTransfer, toolId) {
  if (!dataTransfer) return true;

  const config = TOOL_CONFIGS[toolId];
  if (!config) return true;

  // Inspect dataTransfer.items if available
  if (dataTransfer.items && dataTransfer.items.length > 0) {
    for (let i = 0; i < dataTransfer.items.length; i++) {
      const item = dataTransfer.items[i];
      if (item.kind !== 'file') continue;

      const mime = (item.type || '').toLowerCase();
      // If MIME type is empty, let it pass to drop handler for final validation
      if (!mime) continue;

      // Active tool expects PDF:
      if (config.accept === '.pdf') {
        if (mime !== 'application/pdf') {
          return false;
        }
      }
      // Active tool is JPG to PDF:
      else if (toolId === 'jpg-to-pdf') {
        if (!mime.startsWith('image/')) {
          return false;
        }
      }
      // Active tool is Word to PDF:
      else if (toolId === 'word-to-pdf') {
        if (!mime.includes('word') && !mime.includes('officedocument.wordprocessingml')) {
          return false;
        }
      }
      // Active tool is Excel to PDF:
      else if (toolId === 'excel-to-pdf') {
        if (!mime.includes('excel') && !mime.includes('spreadsheetml')) {
          return false;
        }
      }
      // Active tool is PPT to PDF:
      else if (toolId === 'ppt-to-pdf') {
        if (!mime.includes('presentation') && !mime.includes('powerpoint')) {
          return false;
        }
      }
    }
  }

  return true;
}

function updateSidebarToolLocks() {
  const category = getActiveFileCategory();

  elements.toolListItems.forEach(item => {
    const toolId = item.dataset.toolId;
    const compatible = isToolCompatibleWithCategory(toolId, category);
    let lockIcon = item.querySelector('.tool-lock-indicator');

    if (compatible) {
      item.classList.remove('locked');
      item.removeAttribute('aria-disabled');
      item.removeAttribute('title');
      if (lockIcon) {
        lockIcon.remove();
      }
    } else {
      item.classList.add('locked');
      item.setAttribute('aria-disabled', 'true');
      item.title = `Fitur ini terkunci untuk dokumen ${category.toUpperCase()} yang sedang aktif.`;

      if (!lockIcon) {
        lockIcon = document.createElement('span');
        lockIcon.className = 'tool-lock-indicator ml-auto pl-2 text-zinc-400 dark:text-zinc-600 flex items-center shrink-0';
        lockIcon.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        `;
        item.appendChild(lockIcon);
      }
    }
  });
}

// =============================================================================
// TOOL SELECTION & SWITCHING
// =============================================================================
function setupSidebarToolSelection() {
  elements.toolListItems.forEach(item => {
    item.addEventListener('click', () => {
      // Guard: If tool is locked for the current file type, block selection!
      if (item.classList.contains('locked')) {
        return;
      }

      const toolId = item.dataset.toolId;
      setActiveTool(toolId);
      
      // On mobile, close sidebar after picking tool
      if (window.innerWidth < 1024 && elements.rightToolsSidebar) {
        elements.rightToolsSidebar.classList.remove('mobile-sidebar-open');
      }
    });
  });

  // Action process button click
  elements.btnProcess.addEventListener('click', handleProcessTool);

  // Change file button click
  elements.btnChangeFile.addEventListener('click', () => {
    state.selectedFiles = [];
    showWelcomeState();
  });
}

function setActiveTool(toolId) {
  const config = TOOL_CONFIGS[toolId];
  if (!config) return;

  state.activeToolId = toolId;

  // 1. Highlight active tool item in sidebar
  elements.toolListItems.forEach(item => {
    if (item.dataset.toolId === toolId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // 2. Update Sidebar text
  if (elements.sidebarActiveToolBadge) elements.sidebarActiveToolBadge.textContent = config.title;
  if (elements.sidebarToolTitle) elements.sidebarToolTitle.textContent = config.title;

  // 3. Update Workspace Active Banner
  if (elements.activeToolIconBadge) {
    elements.activeToolIconBadge.innerHTML = `<i data-lucide="${config.icon}" class="w-3.5 h-3.5"></i>`;
  }

  // 4. Configure native file input
  elements.fileInput.accept = config.accept;
  elements.fileInput.multiple = config.multiple;

  // 5. Render dynamic options for tool
  renderToolOptions(toolId);

  // 6. Update process CTA button label
  updateProcessButtonState();

  // 7. If files are already loaded, refresh workspace view
  if (state.selectedFiles.length > 0) {
    showWorkspaceState();
  }

  initIcons();
}

// =============================================================================
// SEARCH & KEYBOARD SHORTCUTS (⌘K / Ctrl+K)
// =============================================================================
function setupSearchAndShortcuts() {
  function handleFilter(query) {
    query = query.trim().toLowerCase();
    
    elements.toolListItems.forEach(item => {
      const toolId = item.dataset.toolId;
      const title = item.querySelector('span')?.textContent.toLowerCase() || '';
      const keywords = (item.dataset.keywords || '').toLowerCase();
      
      const matches = !query || title.includes(query) || keywords.includes(query) || toolId.includes(query);
      if (matches) {
        item.classList.remove('hidden');
      } else {
        item.classList.add('hidden');
      }
    });

    // Hide empty category headings
    document.querySelectorAll('.tool-category-block').forEach(block => {
      const visibleTools = block.querySelectorAll('.tool-list-item:not(.hidden)');
      if (visibleTools.length === 0) {
        block.classList.add('hidden');
      } else {
        block.classList.remove('hidden');
      }
    });
  }

  if (elements.globalSearchInput) {
    elements.globalSearchInput.addEventListener('input', (e) => {
      handleFilter(e.target.value);
    });
  }

  if (elements.btnFocusSearch) {
    elements.btnFocusSearch.addEventListener('click', () => {
      if (elements.globalSearchInput) {
        elements.globalSearchInput.focus();
        elements.globalSearchInput.select();
      }
    });
  }

  // Keyboard shortcut Ctrl+K or ⌘K
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (elements.globalSearchInput) {
        elements.globalSearchInput.focus();
        elements.globalSearchInput.select();
      }
    }
  });
}

// =============================================================================
// FILE PICKERS & DRAG AND DROP
// =============================================================================
function setupFilePickersAndDropzone() {
  if (elements.btnCenterAddFiles) {
    elements.btnCenterAddFiles.addEventListener('click', (e) => {
      e.stopPropagation();
      elements.fileInput.click();
    });
  }
  if (elements.btnCenterChevron && elements.welcomeDropdownMenu) {
    elements.btnCenterChevron.addEventListener('click', (e) => {
      e.stopPropagation();
      elements.welcomeDropdownMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (elements.welcomeDropdownMenu && !elements.welcomeDropdownMenu.classList.contains('hidden')) {
        if (!elements.welcomeDropdownMenu.contains(e.target) && e.target !== elements.btnCenterChevron) {
          elements.welcomeDropdownMenu.classList.add('hidden');
        }
      }
    });
  }
  if (elements.btnDropdownChooseFiles) {
    elements.btnDropdownChooseFiles.addEventListener('click', (e) => {
      e.stopPropagation();
      if (elements.welcomeDropdownMenu) elements.welcomeDropdownMenu.classList.add('hidden');
      elements.fileInput.click();
    });
  }
  if (elements.btnDropdownChooseFolder && elements.folderInput) {
    elements.btnDropdownChooseFolder.addEventListener('click', (e) => {
      e.stopPropagation();
      if (elements.welcomeDropdownMenu) elements.welcomeDropdownMenu.classList.add('hidden');
      elements.folderInput.click();
    });
  }
  if (elements.folderInput) {
    elements.folderInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleIncomingFiles(e.target.files);
      }
      elements.folderInput.value = '';
    });
  }
  if (elements.welcomeDropzoneBox) {
    elements.welcomeDropzoneBox.addEventListener('click', (e) => {
      if (e.target.closest('#welcomeCtaWrapper') || e.target.closest('#welcomeDropdownMenu')) {
        return;
      }
      elements.fileInput.click();
    });
  }

  if (elements.btnAddMoreFiles) {
    elements.btnAddMoreFiles.addEventListener('click', () => {
      elements.fileInput.click();
    });
  }

  // File input change
  elements.fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleIncomingFiles(e.target.files);
    }
    elements.fileInput.value = '';
  });

  // Drag and Drop onto Center Stage
  const stage = elements.centerMainStage;
  if (!stage) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    stage.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();

      const isCompatible = isDragDataCompatibleWithTool(e.dataTransfer, state.activeToolId);

      if (!isCompatible) {
        // Wrong file type: block animation response completely and show prohibited cursor
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'none';
        stage.classList.remove('dropzone-active');
        return;
      }

      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
      stage.classList.add('dropzone-active');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    stage.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      stage.classList.remove('dropzone-active');
    }, false);
  });

  stage.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length > 0) {
      handleIncomingFiles(dt.files);
    }
  });
}

// =============================================================================
// INCOMING FILES PROCESSOR
// =============================================================================
async function handleIncomingFiles(fileList) {
  const incoming = Array.from(fileList);
  if (incoming.length === 0) return;

  // File size limit: 100MB per file guard
  const MAX_FILE_SIZE = 100 * 1024 * 1024;
  const oversized = incoming.find(f => f.size > MAX_FILE_SIZE);
  if (oversized) {
    showToast(`Batas ukuran berkas maksimal 100MB per berkas untuk stabilitas browser.`, 'error');
    return;
  }

  const config = TOOL_CONFIGS[state.activeToolId] || TOOL_CONFIGS['split'];

  // Silent Block: Strictly filter out any files that do NOT match the active tool
  const validFiles = incoming.filter(file => isFileAcceptedByTool(file, state.activeToolId));

  // If no files match the active tool, silently block completely
  if (validFiles.length === 0) {
    return;
  }

  state.splitCuts.clear();
  if (config.multiple) {
    state.selectedFiles.push(...validFiles);
  } else {
    state.selectedFiles = [validFiles[0]];
  }

  showWorkspaceState();
  showToast(`${state.selectedFiles.length} berkas berhasil dimuat di memori RAM`, 'info');
}

// Canvas Memory Leak Guard: Reclaim GPU / RAM resources before clearing
function destroyCanvases(container, forceAll = false) {
  if (!container) return;
  const canvases = container.querySelectorAll('canvas');
  canvases.forEach(canvas => {
    // Never destroy canvases that belong to the active cached single-PDF grid during tool switching
    if (!forceAll && state.pdfCache && state.pdfCache.gridElement && state.pdfCache.gridElement.contains(canvas)) {
      return;
    }
    canvas.width = 0;
    canvas.height = 0;
  });
}

// =============================================================================
// WORKSPACE VIEW STATE SWITCHER
// =============================================================================
function showWelcomeState() {
  destroyCanvases(elements.pagesThumbnailsGrid, true);
  if (state.pdfCache && state.pdfCache.gridElement) {
    destroyCanvases(state.pdfCache.gridElement, true);
  }
  state.selectedFiles = [];
  state.splitCuts.clear();
  state.pdfCache = { fileKey: null, gridElement: null, numPages: 0 };
  elements.welcomeState.classList.remove('hidden');
  elements.welcomeState.classList.add('flex');
  elements.workspaceState.classList.add('hidden');
  elements.workspaceState.classList.remove('flex');
  
  elements.pagesThumbnailsGrid.innerHTML = '';
  if (elements.processorStatusMessage) elements.processorStatusMessage.textContent = 'Ready';
  updateSidebarToolLocks();
  renderToolOptions(state.activeToolId);
  updateProcessButtonState();
  initIcons();
}

function showWorkspaceState() {
  elements.welcomeState.classList.add('hidden');
  elements.welcomeState.classList.remove('flex');
  elements.workspaceState.classList.remove('hidden');
  elements.workspaceState.classList.add('flex');

  const config = TOOL_CONFIGS[state.activeToolId];
  if (config && config.multiple) {
    elements.btnAddMoreFiles.classList.remove('hidden');
    elements.btnAddMoreFiles.classList.add('flex');
  } else {
    elements.btnAddMoreFiles.classList.add('hidden');
    elements.btnAddMoreFiles.classList.remove('flex');
  }

  if (elements.processorStatusMessage) elements.processorStatusMessage.textContent = 'Ready';
  updateSidebarToolLocks();
  renderWorkspaceCanvas();
  renderToolOptions(state.activeToolId);
  updateProcessButtonState();
  initIcons();
}

// =============================================================================
// UNIVERSAL WORKSPACE CANVAS PAGE PREVIEWS (All Tools Supported)
// =============================================================================
async function renderWorkspaceCanvas() {
  if (state.selectedFiles.length === 0) return;

  const toolId = state.activeToolId;
  const firstFile = state.selectedFiles[0];

  // Set active header title
  if (state.selectedFiles.length === 1) {
    elements.activeDocTitle.textContent = firstFile.name;
  } else {
    elements.activeDocTitle.textContent = `${state.selectedFiles.length} Documents Selected`;
  }

  try {
    if (toolId === 'jpg-to-pdf') {
      renderImagesWorkspace();
    } else if (['word-to-pdf', 'excel-to-pdf', 'ppt-to-pdf'].includes(toolId) && !firstFile.name.toLowerCase().endsWith('.pdf')) {
      renderOfficeDocWorkspace();
    } else if (['split', 'organize', 'delete-pages'].includes(toolId)) {
      // Page-by-page visual grid tools (split, organize, delete-pages)
      const currentKey = `${firstFile.name}_${firstFile.size}_${firstFile.lastModified}`;

      // 1. Instant in-place adaptation if already mounted in DOM (0ms, Zero Loading!)
      if (state.pdfCache.fileKey === currentKey && state.pdfCache.gridElement && elements.pagesThumbnailsGrid.contains(state.pdfCache.gridElement)) {
        elements.activeDocPageCount.textContent = `${state.pdfCache.numPages} Pages`;
        adaptSinglePdfGridForActiveTool();
        return;
      }

      // 2. Instant restore if cached in RAM but unmounted (e.g. returning from merge/office)
      if (state.pdfCache.fileKey === currentKey && state.pdfCache.gridElement) {
        elements.pagesThumbnailsGrid.innerHTML = '';
        elements.pagesThumbnailsGrid.appendChild(state.pdfCache.gridElement);
        elements.activeDocPageCount.textContent = `${state.pdfCache.numPages} Pages`;
        adaptSinglePdfGridForActiveTool();
        return;
      }

      // 3. New file: Render into cache once
      if (state.pdfCache && state.pdfCache.gridElement) {
        destroyCanvases(state.pdfCache.gridElement, true);
      }
      elements.pagesThumbnailsGrid.innerHTML = `
        <div class="col-span-full py-16 text-center text-xs text-zinc-400 dark:text-zinc-500 flex flex-col items-center justify-center space-y-2">
          <span class="w-5 h-5 rounded-full border-2 border-zinc-600 dark:border-zinc-400 border-t-transparent animate-spin"></span>
          <span class="font-medium">Loading document preview in RAM...</span>
        </div>
      `;
      await renderAndCacheSinglePdfWorkspace(firstFile, currentKey);
    } else {
      // Document-level tools: merge, compress, pdf-to-jpg, pdf-to-word, pdf-to-excel, pdf-to-ppt, etc.
      // Previews single or multi document cards like Merge (Page 1 cover thumbnail only)
      await renderDocumentCardsWorkspace();
    }
  } catch (err) {
    console.error('Error rendering workspace canvas:', err);
    renderGenericFallback(err.message);
  }
}

// In-Place Ultra-Fast Single PDF Tool Adaptation (0ms, No Canvas Re-render)
function adaptSinglePdfGridForActiveTool() {
  const toolId = state.activeToolId;
  const grid = state.pdfCache.gridElement;
  if (!grid) return;

  const numPages = state.pdfCache.numPages;

  // 1. Split Scissor Cutters (Strictly only visible in Split PDF)
  const isSplit = toolId === 'split';
  grid.querySelectorAll('.split-divider-col').forEach(div => {
    if (isSplit) {
      div.classList.remove('hidden');
      div.style.display = 'flex';
    } else {
      div.classList.add('hidden');
      div.style.display = 'none';
    }
  });

  if (isSplit) {
    updateSplitRangesFromCuts(numPages);
  }

  // 2. Action Buttons in Card Headers (Rotate in Organize, Trash in Delete Pages)
  grid.querySelectorAll('.card-tool-action').forEach(actionContainer => {
    const pageNum = actionContainer.dataset.pageNum;
    if (toolId === 'organize') {
      actionContainer.classList.remove('hidden');
      actionContainer.innerHTML = `
        <button type="button" title="Rotate 90°" onclick="rotateThumbnailCard(this, event)" class="w-5 h-5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center justify-center transition">
          <i data-lucide="rotate-cw" class="w-3 h-3"></i>
        </button>
      `;
    } else if (toolId === 'delete-pages') {
      actionContainer.classList.remove('hidden');
      actionContainer.innerHTML = `
        <button type="button" title="Remove Page" class="w-5 h-5 rounded hover:bg-rose-100 dark:hover:bg-rose-900/30 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition">
          <i data-lucide="trash-2" class="w-3 h-3"></i>
        </button>
      `;
    } else {
      actionContainer.classList.add('hidden');
      actionContainer.innerHTML = '';
    }
  });

  // 3. Page Selection Highlights (Delete Pages)
  if (toolId === 'delete-pages') {
    const deleteInput = document.getElementById('deletePagesInput');
    const deleteSelected = deleteInput && deleteInput.value
      ? deleteInput.value.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    grid.querySelectorAll('.page-thumbnail-card').forEach(card => {
      const p = card.dataset.pageNum;
      if (deleteSelected.includes(p)) {
        card.classList.add('to-delete');
      } else {
        card.classList.remove('to-delete');
      }
    });
  } else {
    grid.querySelectorAll('.page-thumbnail-card.to-delete').forEach(card => {
      card.classList.remove('to-delete');
    });
  }

  initIcons();
}

// Single PDF Page Visual Thumbnail Grid (Cached in RAM for instant tool switching)
async function renderAndCacheSinglePdfWorkspace(file, currentKey) {
  if (!window.pdfjsLib) {
    throw new Error('PDF.js library belum siap');
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;

  elements.activeDocPageCount.textContent = `${numPages} Pages`;

  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-3.5 w-full';

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const rawViewport = page.getViewport({ scale: 1 });
    const targetWidth = 160;
    const scale = targetWidth / rawViewport.width;
    const viewport = page.getViewport({ scale });

    // Grid Cell wrapper
    const cell = document.createElement('div');
    cell.className = 'split-grid-cell relative w-full';

    const card = document.createElement('div');
    card.className = 'page-thumbnail-card relative p-2 rounded-xl border bg-white dark:bg-[#0d0d0d] border-zinc-200 dark:border-[#222222] flex flex-col items-center justify-between shadow-2xs select-none overflow-hidden w-full cursor-pointer';
    card.dataset.pageNum = pageNum;

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.className = 'rounded bg-white shadow-2xs max-w-full max-h-[210px] h-auto object-contain block mx-auto';

    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;

    const headerDiv = document.createElement('div');
    headerDiv.className = 'w-full flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mb-1 px-0.5';
    headerDiv.innerHTML = `
      <span class="font-bold">#${pageNum}</span>
      <div class="card-tool-action flex items-center space-x-1" data-page-num="${pageNum}"></div>
    `;

    const labelDiv = document.createElement('div');
    labelDiv.className = 'mt-1 text-[10px] font-medium text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 transition text-center';
    labelDiv.textContent = `Page ${pageNum}`;

    card.appendChild(headerDiv);
    card.appendChild(canvas);
    card.appendChild(labelDiv);
    cell.appendChild(card);

    // Click card selection logic
    card.addEventListener('click', () => {
      const pStr = String(pageNum);
      if (state.activeToolId === 'delete-pages') {
        const input = document.getElementById('deletePagesInput');
        if (input) {
          let pages = input.value ? input.value.split(',').map(s => s.trim()).filter(Boolean) : [];
          if (pages.includes(pStr)) {
            pages = pages.filter(p => p !== pStr);
            card.classList.remove('to-delete');
          } else {
            pages.push(pStr);
            card.classList.add('to-delete');
          }
          input.value = pages.join(', ');
        }
      }
    });

    // Scissor divider between pages (only between page 1 and numPages - 1)
    if (pageNum < numPages) {
      const dividerCol = document.createElement('div');
      dividerCol.className = 'split-divider-col';
      if (state.activeToolId !== 'split') {
        dividerCol.classList.add('hidden');
        dividerCol.style.display = 'none';
      }
      dividerCol.dataset.boundary = pageNum;
      if (state.splitCuts.has(pageNum)) {
        dividerCol.classList.add('active');
      }

      const dividerLine = document.createElement('div');
      dividerLine.className = 'split-divider-line';

      const scissorBtn = document.createElement('button');
      scissorBtn.type = 'button';
      scissorBtn.className = 'split-scissor-btn tap-scale';
      scissorBtn.title = `Cut after Page ${pageNum}`;
      scissorBtn.innerHTML = `<i data-lucide="scissors" class="w-3 h-3"></i>`;

      dividerCol.appendChild(dividerLine);
      dividerCol.appendChild(scissorBtn);

      dividerCol.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state.activeToolId !== 'split') return;
        if (state.splitCuts.has(pageNum)) {
          state.splitCuts.delete(pageNum);
          dividerCol.classList.remove('active');
        } else {
          state.splitCuts.add(pageNum);
          dividerCol.classList.add('active');
        }
        updateSplitRangesFromCuts(numPages);
      });

      cell.appendChild(dividerCol);
    }

    grid.appendChild(cell);
  }

  // Cache in RAM
  state.pdfCache = {
    fileKey: currentKey,
    gridElement: grid,
    numPages: numPages
  };

  elements.pagesThumbnailsGrid.innerHTML = '';
  elements.pagesThumbnailsGrid.appendChild(grid);
  adaptSinglePdfGridForActiveTool();
}

function updateSplitRangesFromCuts(totalPages) {
  const input = document.getElementById('splitRangeInput');
  if (!input) return;

  const cuts = Array.from(state.splitCuts)
    .filter(c => c >= 1 && c < totalPages)
    .sort((a, b) => a - b);

  if (cuts.length === 0) {
    input.value = `1-${totalPages}`;
    return;
  }

  const parts = [];
  let start = 1;
  for (const cut of cuts) {
    if (start === cut) {
      parts.push(String(cut));
    } else {
      parts.push(`${start}-${cut}`);
    }
    start = cut + 1;
  }
  if (start <= totalPages) {
    if (start === totalPages) {
      parts.push(String(totalPages));
    } else {
      parts.push(`${start}-${totalPages}`);
    }
  }
  input.value = parts.join(', ');
}

// Universal Document-Level Workspace Preview (Merge, Compress, PDF to JPG, PDF to Word, etc.)
// Previews each document with its Page 1 cover thumbnail (instant, lightweight, zero memory bloat)
async function renderDocumentCardsWorkspace() {
  if (!window.pdfjsLib) {
    throw new Error('PDF.js library belum siap');
  }

  // Detach cached single PDF grid safely so its rendered canvases remain intact in RAM
  if (state.pdfCache && state.pdfCache.gridElement && elements.pagesThumbnailsGrid.contains(state.pdfCache.gridElement)) {
    state.pdfCache.gridElement.remove();
  }

  destroyCanvases(elements.pagesThumbnailsGrid);
  elements.pagesThumbnailsGrid.innerHTML = '';
  const totalFiles = state.selectedFiles.length;
  const config = TOOL_CONFIGS[state.activeToolId] || {};
  const isMerge = state.activeToolId === 'merge';

  elements.activeDocPageCount.textContent = totalFiles === 1 ? '1 Document' : `${totalFiles} Documents`;

  const cardsContainer = document.createElement('div');
  cardsContainer.className = 'flex flex-wrap items-center justify-center sm:justify-start gap-6 w-full p-4';

  let totalPagesCount = 0;

  for (let fileIdx = 0; fileIdx < totalFiles; fileIdx++) {
    const file = state.selectedFiles[fileIdx];
    const sizeKB = (file.size / 1024).toFixed(1);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const displaySize = file.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;

    const card = document.createElement('div');
    card.className = 'merge-drag-card p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-between shadow-xs transition hover:shadow-md';
    card.dataset.fileIndex = fileIdx;

    if (isMerge) {
      card.setAttribute('draggable', 'true');
    }

    // Tooltip info on hover
    const tooltip = document.createElement('div');
    tooltip.className = 'doc-info-tooltip';
    tooltip.id = `tooltip_${fileIdx}`;
    tooltip.textContent = displaySize;
    card.appendChild(tooltip);

    // Top-right 'X' delete button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'card-close-btn tap-scale';
    closeBtn.title = 'Hapus berkas ini';
    closeBtn.innerHTML = `<i data-lucide="x" class="w-3.5 h-3.5"></i>`;
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeSelectedFile(fileIdx);
    });
    card.appendChild(closeBtn);

    // Preview Canvas container (Page 1)
    const previewContainer = document.createElement('div');
    previewContainer.className = 'w-36 h-48 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center overflow-hidden';
    previewContainer.innerHTML = `
      <span class="w-4 h-4 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin"></span>
    `;
    card.appendChild(previewContainer);

    // Document title label
    const titleLabel = document.createElement('div');
    titleLabel.className = 'text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-2.5 truncate max-w-[140px] text-center';
    titleLabel.textContent = file.name;
    titleLabel.title = file.name;
    card.appendChild(titleLabel);

    // Subtitle label (Size & Pages count)
    const subLabel = document.createElement('div');
    subLabel.className = 'text-[11px] font-mono text-zinc-400 dark:text-zinc-500 mt-0.5 text-center';
    subLabel.textContent = displaySize;
    card.appendChild(subLabel);

    if (isMerge) {
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', String(fileIdx));
        card.classList.add('dragging');
      });
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        card.classList.add('drag-over');
      });
      card.addEventListener('dragleave', () => {
        card.classList.remove('drag-over');
      });
      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('drag-over');
        const sourceIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (!isNaN(sourceIdx) && sourceIdx !== fileIdx) {
          reorderMergeFiles(sourceIdx, fileIdx);
        }
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        document.querySelectorAll('.merge-drag-card').forEach(c => c.classList.remove('drag-over', 'dragging'));
      });
    }

    cardsContainer.appendChild(card);

    // Asynchronously render Page 1 thumbnail
    (async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;
        totalPagesCount += numPages;

        tooltip.textContent = `${displaySize} - ${numPages} pages`;
        subLabel.textContent = `${numPages} Pages • ${displaySize}`;

        if (totalFiles === 1) {
          elements.activeDocPageCount.textContent = `${numPages} Pages`;
        } else {
          elements.activeDocPageCount.textContent = `${totalFiles} Documents (${totalPagesCount} Pages)`;
        }

        const page = await pdf.getPage(1);
        const rawViewport = page.getViewport({ scale: 1 });
        const targetHeight = 180;
        const scale = targetHeight / rawViewport.height;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.className = 'rounded bg-white max-h-[180px] w-auto shadow-2xs';

        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        previewContainer.innerHTML = '';
        previewContainer.appendChild(canvas);
      } catch (err) {
        console.warn('Gagal pratinjau lembar 1:', err);
        previewContainer.innerHTML = `<span class="text-[10px] text-zinc-400 text-center p-2">PDF Document</span>`;
      }
    })();
  }

  // Only show "+" circular add button if the tool supports multiple files (e.g. Merge)
  if (config.multiple) {
    const addBtnCol = document.createElement('div');
    addBtnCol.className = 'flex flex-col items-center justify-center p-4';
    addBtnCol.innerHTML = `
      <button onclick="document.getElementById('fileInput').click()" class="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-md transition tap-scale hover:scale-105" title="Tambah Berkas PDF">
        <i data-lucide="plus" class="w-6 h-6"></i>
      </button>
    `;
    cardsContainer.appendChild(addBtnCol);
  }

  elements.pagesThumbnailsGrid.appendChild(cardsContainer);
  initIcons();
}
const renderMergeWorkspace = renderDocumentCardsWorkspace;

window.reorderMergeFiles = function(fromIdx, toIdx) {
  if (fromIdx === toIdx || isNaN(fromIdx) || isNaN(toIdx)) return;
  if (fromIdx < 0 || fromIdx >= state.selectedFiles.length) return;
  if (toIdx < 0 || toIdx >= state.selectedFiles.length) return;
  const moved = state.selectedFiles.splice(fromIdx, 1)[0];
  state.selectedFiles.splice(toIdx, 0, moved);
  renderWorkspaceCanvas();
  showToast('Urutan dokumen berhasil diubah', 'info');
};

// 3. Images Visual Preview Grid (for jpg-to-pdf)
function renderImagesWorkspace() {
  // Detach cached single PDF grid safely so its rendered canvases remain intact in RAM
  if (state.pdfCache && state.pdfCache.gridElement && elements.pagesThumbnailsGrid.contains(state.pdfCache.gridElement)) {
    state.pdfCache.gridElement.remove();
  }

  destroyCanvases(elements.pagesThumbnailsGrid);
  elements.pagesThumbnailsGrid.innerHTML = '';
  const total = state.selectedFiles.length;
  elements.activeDocPageCount.textContent = `${total} Images`;

  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-3.5 w-full';

  state.selectedFiles.forEach((file, index) => {
    const card = document.createElement('div');
    card.className = 'page-thumbnail-card relative p-2 rounded-xl border flex flex-col items-center justify-between group shadow-2xs select-none overflow-hidden';

    const sizeKB = (file.size / 1024).toFixed(1);
    const imgUrl = URL.createObjectURL(file);

    card.innerHTML = `
      <div class="w-full flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mb-1 px-0.5">
        <span class="font-bold">#${index + 1}</span>
        <button onclick="removeSelectedFile(${index})" title="Remove Image" class="w-5 h-5 rounded hover:bg-rose-100 dark:hover:bg-rose-900/30 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition">
          <i data-lucide="trash-2" class="w-3 h-3"></i>
        </button>
      </div>
      <div class="w-full h-32 rounded bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center overflow-hidden border border-zinc-100 dark:border-zinc-800">
        <img src="${imgUrl}" alt="${file.name}" class="max-h-full max-w-full object-contain rounded" onload="URL.revokeObjectURL('${imgUrl}')">
      </div>
      <div class="mt-1.5 w-full text-center">
        <div class="text-[10px] font-semibold text-zinc-800 dark:text-zinc-200 truncate" title="${file.name}">
          ${file.name}
        </div>
        <div class="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">
          ${sizeKB} KB
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  elements.pagesThumbnailsGrid.appendChild(grid);
  initIcons();
}

// 4. Office Document Visual Preview Grid (Word, Excel, PPT) - Minimalist 6-col cards matching all other features
function renderOfficeDocWorkspace() {
  // Detach cached single PDF grid safely so its rendered canvases remain intact in RAM
  if (state.pdfCache && state.pdfCache.gridElement && elements.pagesThumbnailsGrid.contains(state.pdfCache.gridElement)) {
    state.pdfCache.gridElement.remove();
  }

  destroyCanvases(elements.pagesThumbnailsGrid);
  elements.pagesThumbnailsGrid.innerHTML = '';
  const total = state.selectedFiles.length;
  elements.activeDocPageCount.textContent = `${total} Document${total > 1 ? 's' : ''}`;

  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-3.5 w-full';

  state.selectedFiles.forEach((file, index) => {
    const card = document.createElement('div');
    card.className = 'page-thumbnail-card relative p-2.5 rounded-xl border flex flex-col items-center justify-between group shadow-2xs select-none overflow-hidden h-[180px] bg-white dark:bg-[#0d0d0d] border-zinc-200 dark:border-[#222222]';

    const ext = file.name.split('.').pop().toLowerCase();
    let iconName = 'file-text';
    let badgeColor = 'text-blue-500 bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50';

    if (['xlsx', 'xls'].includes(ext)) {
      iconName = 'sheet';
      badgeColor = 'text-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50';
    } else if (['pptx', 'ppt'].includes(ext)) {
      iconName = 'presentation';
      badgeColor = 'text-amber-500 bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50';
    }

    const sizeKB = (file.size / 1024).toFixed(1);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const displaySize = file.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;

    card.innerHTML = `
      <div class="w-full flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mb-1 px-0.5">
        <span class="font-bold">#${index + 1}</span>
        <button onclick="removeSelectedFile(${index})" title="Remove Document" class="w-5 h-5 rounded hover:bg-rose-100 dark:hover:bg-rose-900/30 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition">
          <i data-lucide="trash-2" class="w-3 h-3"></i>
        </button>
      </div>

      <div class="w-full flex-1 flex flex-col items-center justify-center py-2">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center border ${badgeColor} mb-2">
          <i data-lucide="${iconName}" class="w-6 h-6"></i>
        </div>
        <span class="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">${ext.toUpperCase()}</span>
      </div>

      <div class="mt-1 w-full text-center">
        <div class="text-[10px] font-semibold text-zinc-800 dark:text-zinc-200 truncate" title="${file.name}">
          ${file.name}
        </div>
        <div class="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">
          ${displaySize}
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  elements.pagesThumbnailsGrid.appendChild(grid);
  initIcons();
}

function renderGenericFallback(errMsg) {
  elements.pagesThumbnailsGrid.innerHTML = `
    <div class="w-full max-w-md mx-auto text-center py-8 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121214]">
      <div class="text-xs font-semibold text-zinc-800 dark:text-zinc-200">${state.selectedFiles.length} Berkas Siap Diproses</div>
      <div class="text-[11px] text-zinc-400 mt-1">${errMsg || 'Pratinjau visual selesai disiapkan'}</div>
    </div>
  `;
}

window.moveMergeFile = function(index, direction) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= state.selectedFiles.length) return;
  const temp = state.selectedFiles[index];
  state.selectedFiles[index] = state.selectedFiles[newIndex];
  state.selectedFiles[newIndex] = temp;
  renderWorkspaceCanvas();
};

window.rotateThumbnailCard = function(btn, event) {
  event.stopPropagation();
  const card = btn.closest('.page-thumbnail-card');
  if (!card) return;
  const canvas = card.querySelector('canvas');
  if (!canvas) return;

  const currentRotation = parseInt(canvas.dataset.rotation || '0', 10);
  const nextRotation = (currentRotation + 90) % 360;
  canvas.dataset.rotation = nextRotation;
  canvas.style.transform = `rotate(${nextRotation}deg)`;
  canvas.style.transition = 'transform 0.2s ease';
};

window.removeSelectedFile = function(index) {
  state.selectedFiles.splice(index, 1);
  if (state.selectedFiles.length === 0) {
    showWelcomeState();
  } else {
    updateSidebarToolLocks();
    renderWorkspaceCanvas();
    renderToolOptions(state.activeToolId);
    updateProcessButtonState();
  }
};

function updateProcessButtonState() {
  if (!state.activeToolId) {
    elements.btnProcess.disabled = true;
    elements.btnProcessText.textContent = 'Select Tool';
    return;
  }

  const config = TOOL_CONFIGS[state.activeToolId];
  const fileCount = state.selectedFiles.length;

  if (fileCount === 0) {
    elements.btnProcess.disabled = true;
    elements.btnProcessText.textContent = `Choose File (${config.buttonText})`;
  } else if (fileCount < config.minFiles) {
    elements.btnProcess.disabled = true;
    elements.btnProcessText.textContent = `Select at least ${config.minFiles} files`;
  } else {
    elements.btnProcess.disabled = false;
    elements.btnProcessText.textContent = config.buttonText;
  }
}

// =============================================================================
// DYNAMIC TOOL PARAMETERS SECTION (Dual Dark/Light Mode)
// =============================================================================
function renderToolOptions(toolId) {
  elements.toolOptionsSection.innerHTML = '';

  if (toolId === 'split') {
    elements.toolOptionsSection.innerHTML = `
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-2" id="splitModeGroup">
          <label class="split-mode-card active p-2 rounded-lg border border-zinc-200 dark:border-[#272727] bg-white dark:bg-[#111111] text-zinc-700 dark:text-zinc-300 font-semibold text-xs flex items-center justify-center cursor-pointer transition text-center select-none">
            <input type="radio" name="splitMode" value="range" checked class="sr-only">
            <span>Visual Range</span>
          </label>
          <label class="split-mode-card p-2 rounded-lg border border-zinc-200 dark:border-[#272727] bg-white dark:bg-[#111111] text-zinc-700 dark:text-zinc-300 font-semibold text-xs flex items-center justify-center cursor-pointer transition text-center select-none hover:border-zinc-400 dark:hover:border-zinc-500">
            <input type="radio" name="splitMode" value="all" class="sr-only">
            <span>All Pages</span>
          </label>
        </div>
        <div id="splitRangeInputWrapper" class="space-y-1.5">
          <label class="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Page Range</label>
          <input type="text" id="splitRangeInput" placeholder="e.g. 1-7, 8-21" class="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#272727] bg-white dark:bg-[#111111] text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white font-mono">
        </div>
      </div>
    `;

    const modeCards = elements.toolOptionsSection.querySelectorAll('.split-mode-card');
    modeCards.forEach(card => {
      card.addEventListener('click', () => {
        modeCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const inp = card.querySelector('input');
        if (inp) inp.checked = true;
      });
    });
  } else if (toolId === 'merge') {
    elements.toolOptionsSection.innerHTML = `
      <div class="p-3 rounded-xl bg-zinc-50 dark:bg-[#111111] border border-zinc-200 dark:border-[#222222] text-xs text-zinc-600 dark:text-zinc-300 flex items-start space-x-2.5 leading-relaxed">
        <i data-lucide="info" class="w-4 h-4 text-zinc-600 dark:text-zinc-400 shrink-0 mt-0.5"></i>
        <span>Drag and drop cards on the canvas to reorder files.</span>
      </div>
    `;
    initIcons();
  } else if (toolId === 'compress') {
    const activeFile = state.selectedFiles && state.selectedFiles.length > 0 ? state.selectedFiles[0] : null;
    const fileSize = activeFile ? activeFile.size : null;

    const formatBytesLocal = (bytes) => {
      if (!bytes || bytes <= 0) return '';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const estExtreme = fileSize ? `~${formatBytesLocal(fileSize * 0.40)}` : '';
    const estRecommended = fileSize ? `~${formatBytesLocal(fileSize * 0.65)}` : '';
    const estLess = fileSize ? `~${formatBytesLocal(fileSize * 0.80)}` : '';

    elements.toolOptionsSection.innerHTML = `
      <div class="space-y-2">
        <div class="space-y-2" id="compressionOptionsGroup">
          <label class="compression-radio-card p-2.5 rounded-lg border flex items-center justify-between text-xs transition tap-scale select-none cursor-pointer" data-level="1">
            <div class="flex items-center space-x-2.5 min-w-0">
              <input type="radio" name="compressionLevel" id="compExtreme" value="1" class="accent-black dark:accent-white cursor-pointer shrink-0">
              <span class="text-xs font-medium text-zinc-900 dark:text-white cursor-pointer truncate">Extreme Compression</span>
            </div>
            ${fileSize ? `<span class="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2 whitespace-nowrap">${estExtreme}</span>` : ''}
          </label>
          <label class="compression-radio-card active p-2.5 rounded-lg border flex items-center justify-between text-xs transition tap-scale select-none cursor-pointer" data-level="2">
            <div class="flex items-center space-x-2.5 min-w-0">
              <input type="radio" name="compressionLevel" id="compRecommended" value="2" checked class="accent-black dark:accent-white cursor-pointer shrink-0">
              <span class="text-xs font-medium text-zinc-900 dark:text-white cursor-pointer truncate">Recommended Compression</span>
            </div>
            ${fileSize ? `<span class="text-[11px] font-mono font-bold text-sky-600 dark:text-sky-400 shrink-0 ml-2 whitespace-nowrap">${estRecommended}</span>` : ''}
          </label>
          <label class="compression-radio-card p-2.5 rounded-lg border flex items-center justify-between text-xs transition tap-scale select-none cursor-pointer" data-level="3">
            <div class="flex items-center space-x-2.5 min-w-0">
              <input type="radio" name="compressionLevel" id="compLess" value="3" class="accent-black dark:accent-white cursor-pointer shrink-0">
              <span class="text-xs font-medium text-zinc-900 dark:text-white cursor-pointer truncate">Less Compression</span>
            </div>
            ${fileSize ? `<span class="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 shrink-0 ml-2 whitespace-nowrap">${estLess}</span>` : ''}
          </label>
        </div>
      </div>
    `;

    const compCards = elements.toolOptionsSection.querySelectorAll('.compression-radio-card');
    compCards.forEach(card => {
      card.addEventListener('click', () => {
        const radio = card.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          compCards.forEach(c => c.classList.remove('active'));
          card.classList.add('active');
        }
      });
    });
  } else if (toolId === 'pdf-to-jpg') {
    elements.toolOptionsSection.innerHTML = `
      <div class="space-y-3">
        <div>
          <label class="block font-semibold text-zinc-700 dark:text-zinc-300 text-xs mb-1.5">Image Quality</label>
          <div class="grid grid-cols-3 gap-1.5" id="imageQualityGroup">
            <label class="quality-card p-2 rounded-lg border border-zinc-200 dark:border-[#272727] bg-white dark:bg-[#111111] text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center justify-center cursor-pointer transition text-center select-none hover:border-zinc-400 dark:hover:border-zinc-500">
              <input type="radio" name="imageQuality" value="standard" class="sr-only">
              <span>Standard</span>
            </label>
            <label class="quality-card active p-2 rounded-lg border border-zinc-200 dark:border-[#272727] bg-white dark:bg-[#111111] text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center justify-center cursor-pointer transition text-center select-none">
              <input type="radio" name="imageQuality" value="hd" checked class="sr-only">
              <span>HD</span>
            </label>
            <label class="quality-card p-2 rounded-lg border border-zinc-200 dark:border-[#272727] bg-white dark:bg-[#111111] text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center justify-center cursor-pointer transition text-center select-none hover:border-zinc-400 dark:hover:border-zinc-500">
              <input type="radio" name="imageQuality" value="ultrahd" class="sr-only">
              <span>Ultra HD</span>
            </label>
          </div>
        </div>
        <div>
          <label class="block font-semibold text-zinc-700 dark:text-zinc-300 text-xs mb-1.5">Image Format</label>
          <div class="grid grid-cols-2 gap-2" id="imageFormatGroup">
            <label class="format-card active p-2 rounded-lg border border-zinc-200 dark:border-[#272727] bg-white dark:bg-[#111111] text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center justify-center cursor-pointer transition text-center select-none">
              <input type="radio" name="imageFormat" value="jpeg" checked class="sr-only">
              <span>JPG</span>
            </label>
            <label class="format-card p-2 rounded-lg border border-zinc-200 dark:border-[#272727] bg-white dark:bg-[#111111] text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center justify-center cursor-pointer transition text-center select-none hover:border-zinc-400 dark:hover:border-zinc-500">
              <input type="radio" name="imageFormat" value="png" class="sr-only">
              <span>PNG</span>
            </label>
          </div>
        </div>
      </div>
    `;

    const qualityCards = elements.toolOptionsSection.querySelectorAll('.quality-card');
    qualityCards.forEach(card => {
      card.addEventListener('click', () => {
        qualityCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const inp = card.querySelector('input');
        if (inp) inp.checked = true;
      });
    });

    const formatCards = elements.toolOptionsSection.querySelectorAll('.format-card');
    formatCards.forEach(card => {
      card.addEventListener('click', () => {
        formatCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const inp = card.querySelector('input');
        if (inp) inp.checked = true;
      });
    });
  } else if (toolId === 'delete-pages') {
    elements.toolOptionsSection.innerHTML = `
      <div class="space-y-2">
        <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Pages to Remove</label>
        <input type="text" id="deletePagesInput" placeholder="e.g. 1, 3, 5-7" class="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#272727] bg-white dark:bg-[#111111] text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white">
      </div>
    `;
  } else if (toolId === 'organize') {
    elements.toolOptionsSection.innerHTML = `
      <div class="space-y-2">
        <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Rotate Document</label>
        <select id="globalRotateSelect" class="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#272727] bg-white dark:bg-[#111111] text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white">
          <option value="90">Rotate 90° CW</option>
          <option value="180">Rotate 180°</option>
          <option value="270">Rotate 270° CCW</option>
        </select>
      </div>
    `;
  } else if (toolId === 'jpg-to-pdf') {
    elements.toolOptionsSection.innerHTML = `
      <div class="space-y-2">
        <label class="block font-semibold text-zinc-700 dark:text-zinc-300 text-xs">Page Size</label>
        <select id="jpgPdfPageSize" class="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#272727] bg-white dark:bg-[#111111] text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white">
          <option value="A4">A4 Standard</option>
          <option value="FIT">Fit to Image</option>
          <option value="LETTER">Letter</option>
        </select>
      </div>
    `;
  } else {
    elements.toolOptionsSection.innerHTML = `
      <div class="p-3 rounded-xl bg-zinc-50 dark:bg-[#111111] border border-zinc-200 dark:border-[#222222] text-xs text-zinc-500 dark:text-zinc-400">
        Ready to process locally in browser RAM.
      </div>
    `;
  }

  // Parameters lock guard: Inaccessible before a file is loaded/active (like on Merge)
  const hasActiveFile = state.selectedFiles && state.selectedFiles.length > 0;
  if (!hasActiveFile) {
    elements.toolOptionsSection.classList.add('parameters-locked');
    elements.toolOptionsSection.setAttribute('aria-disabled', 'true');
    const formElements = elements.toolOptionsSection.querySelectorAll('input, select, button');
    formElements.forEach(el => {
      el.disabled = true;
      el.tabIndex = -1;
    });
  } else {
    elements.toolOptionsSection.classList.remove('parameters-locked');
    elements.toolOptionsSection.removeAttribute('aria-disabled');
    const formElements = elements.toolOptionsSection.querySelectorAll('input, select, button');
    formElements.forEach(el => {
      el.disabled = false;
      el.removeAttribute('tabindex');
    });
  }
}

// =============================================================================
// PROGRESS & EXECUTION DISPATCHER (In-Button Progress Fill - Satset)
// =============================================================================
function showProgress(statusText, percent = 0) {
  const bar = document.getElementById('btnProgressBar');
  if (bar) bar.style.width = `${percent}%`;
  if (elements.btnProcessText) {
    elements.btnProcessText.textContent = `${statusText} (${percent}%)`;
  }
}

function updateProgress(percent, statusText) {
  const bar = document.getElementById('btnProgressBar');
  if (bar) bar.style.width = `${percent}%`;
  if (elements.btnProcessText) {
    elements.btnProcessText.textContent = statusText ? `${statusText} (${percent}%)` : `Processing (${percent}%)`;
  }
}

function hideProgress() {
  const bar = document.getElementById('btnProgressBar');
  if (bar) bar.style.width = '0%';
  updateProcessButtonState();
}

// Router to invoke registered handlers
async function handleProcessTool() {
  const toolId = state.activeToolId;
  if (!toolId || state.selectedFiles.length === 0) return;

  elements.btnProcess.disabled = true;
  showProgress('Processing...', 10);

  try {
    if (window.pdfHandlers && typeof window.pdfHandlers[toolId] === 'function') {
      await window.pdfHandlers[toolId]({
        files: state.selectedFiles,
        showProgress,
        updateProgress,
        showToast
      });
    } else {
      console.warn('Handler missing for toolId:', toolId, window.pdfHandlers);
      showToast(`Handler for "${toolId}" not available`, 'error');
    }
  } catch (error) {
    console.error(`Error executing tool [${toolId}]:`, error);
    showToast(`Error processing: ${error.message}`, 'error');
  } finally {
    setTimeout(() => {
      hideProgress();
      updateProcessButtonState();
    }, 250);
  }
}

// =============================================================================
// PRIVACY POPOVER (SMS Speech Bubble Style)
// =============================================================================
function setupPrivacyModal() {
  const btn = document.getElementById('btnPrivacyInfo');
  const popover = document.getElementById('privacyPopover');
  if (!btn || !popover) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = popover.classList.contains('hidden');
    popover.classList.toggle('hidden', !isHidden);
    btn.setAttribute('aria-expanded', String(isHidden));
    if (isHidden) initIcons();
  });

  popover.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  document.addEventListener('click', () => {
    if (!popover.classList.contains('hidden')) {
      popover.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !popover.classList.contains('hidden')) {
      popover.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}

function setupMobileSidebar() {
  if (elements.btnToggleSidebarMobile && elements.rightToolsSidebar) {
    elements.btnToggleSidebarMobile.addEventListener('click', () => {
      elements.rightToolsSidebar.classList.toggle('mobile-sidebar-open');
    });
  }
}

function showToast(message, type = 'success') {
  // Notifications completely disabled as per user instruction
}

// Preserved Global APIs & Universal Download helper
window.pdfHandlers = window.pdfHandlers || {};
window.openToolModal = function(toolId) { setActiveTool(toolId); };
window.handleIncomingFiles = handleIncomingFiles;
window.downloadFile = window.downloadFile || function(data, filename, mimeType = 'application/pdf') {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};
