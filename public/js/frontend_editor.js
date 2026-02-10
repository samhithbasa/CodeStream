console.log('Enhanced Frontend Editor JavaScript loaded');

class SimpleFrontendEditor {
    constructor() {
        // Multi-file project structure
        this.files = {
            html: {},
            css: {},
            js: {}
        };

        // Track which editor tab and file is active
        this.activeType = 'html';
        this.activeFile = {
            html: 'index.html',
            css: 'style.css',
            js: 'script.js'
        };

        // Which HTML file is used as the entry point for preview/deploy
        this.entryHtmlFile = 'index.html';

        // Preview visibility state
        this.previewVisible = true;

        // Assets management
        this.assets = [];
        this.currentProjectId = null;

        // Legacy single-file mirrors (kept for compatibility / debugging)
        this.html = '';
        this.css = '';
        this.js = '';
        this.isAuthenticated = false;
        this.baseUrl = window.location.origin;
        this.currentProjectId = null;
        this.init();
    }

    init() {
        console.log('Simple Editor Initialized');

        // If we landed with ?token= from Google OAuth, set cookie and clean URL
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');
        if (tokenFromUrl) {
            const isSecure = window.location.protocol === 'https:';
            if (typeof Cookies !== 'undefined') {
                Cookies.set('token', tokenFromUrl, { expires: 7, path: '/', secure: isSecure, sameSite: 'lax' });
            }
            urlParams.delete('token');
            const newSearch = urlParams.toString();
            const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
            window.history.replaceState({}, '', newUrl);
        }

        // Build initial file model from existing textarea contents
        this.initializeDefaultFilesFromEditors();

        this.bindEvents();
        this.checkAuthStatus();
        this.loadFromLocalStorage();
        this.loadPreviewVisibilityState();
        this.updatePreview();
        this.ensurePreviewIconLoaded();

        // Set initial theme
        this.applyNightTheme();
    }

    bindEvents() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Auth button
        const authToggle = document.getElementById('auth-toggle');
        if (authToggle) {
            authToggle.addEventListener('click', () => this.handleAuthToggle());
        }

        // Re-check auth when page becomes visible (e.g. after login in same or other tab)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.checkAuthStatus();
            }
        });

        // Editor listeners
        this.setupEditorListeners();

        // File management (add/rename/delete/select files)
        this.setupFileManagement();

        // Asset management
        this.setupAssetManagement();

        // Symbol click-to-preview functionality
        this.setupSymbolClickHandlers();

        // Save project
        const saveBtn = document.getElementById('save-project');
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveProject());

        // Preview controls
        const togglePreviewBtn = document.getElementById('toggle-preview');
        if (togglePreviewBtn) {
            togglePreviewBtn.addEventListener('click', () => this.togglePreviewVisibility());
        }

        const refreshBtn = document.getElementById('refresh-preview');
        if (refreshBtn) refreshBtn.addEventListener('click', () => this.updatePreview());

        const fullscreenBtn = document.getElementById('fullscreen-preview');
        if (fullscreenBtn) fullscreenBtn.addEventListener('click', () => this.toggleFullscreenPreview());

        // Add My Projects button
        const showProjectsBtn = document.createElement('button');
        showProjectsBtn.id = 'show-projects';
        showProjectsBtn.className = 'btn btn-secondary';
        showProjectsBtn.innerHTML = '📁 My Projects';
        showProjectsBtn.addEventListener('click', () => this.showProjects());

        const headerRight = document.querySelector('.header-right');
        if (headerRight) {
            const saveBtn = document.getElementById('save-project');
            headerRight.insertBefore(showProjectsBtn, saveBtn.nextSibling);
        }
    }

    setupEditorListeners() {
        const debounce = (func, delay) => {
            let timer;
            return (...args) => {
                clearTimeout(timer);
                timer = setTimeout(() => func(...args), delay);
            };
        };

        const debouncedSave = debounce(() => this.saveToLocalStorage(), 1000);
        const debouncedPreview = debounce(() => this.updatePreview(), 500);

        const htmlEditor = document.getElementById('html-editor');
        const cssEditor = document.getElementById('css-editor');
        const jsEditor = document.getElementById('js-editor');

        if (htmlEditor) {
            htmlEditor.addEventListener('input', (e) => {
                this.updateCurrentFileContent('html', e.target.value);
                debouncedSave();
                debouncedPreview();
            });
            htmlEditor.value = this.getCurrentFileContent('html');
        }

        if (cssEditor) {
            cssEditor.addEventListener('input', (e) => {
                this.updateCurrentFileContent('css', e.target.value);
                debouncedSave();
                debouncedPreview();
            });
            cssEditor.value = this.getCurrentFileContent('css');
        }

        if (jsEditor) {
            jsEditor.addEventListener('input', (e) => {
                this.updateCurrentFileContent('js', e.target.value);
                debouncedSave();
                debouncedPreview();
            });
            jsEditor.value = this.getCurrentFileContent('js');
        }
    }

    // Initialize default files based on current textarea contents
    initializeDefaultFilesFromEditors() {
        const htmlEditor = document.getElementById('html-editor');
        const cssEditor = document.getElementById('css-editor');
        const jsEditor = document.getElementById('js-editor');

        if (!this.files) {
            this.files = { html: {}, css: {}, js: {} };
        }

        if (!this.activeFile) {
            this.activeFile = {
                html: 'index.html',
                css: 'style.css',
                js: 'script.js'
            };
        }

        // Ensure at least one file per type
        if (!this.files.html || Object.keys(this.files.html).length === 0) {
            const defaultName = this.activeFile.html || 'index.html';
            const defaultContent = htmlEditor?.value || '';
            this.files.html = { [defaultName]: defaultContent };
            this.activeFile.html = defaultName;
        }

        if (!this.files.css || Object.keys(this.files.css).length === 0) {
            const defaultName = this.activeFile.css || 'style.css';
            const defaultContent = cssEditor?.value || '';
            this.files.css = { [defaultName]: defaultContent };
            this.activeFile.css = defaultName;
        }

        if (!this.files.js || Object.keys(this.files.js).length === 0) {
            const defaultName = this.activeFile.js || 'script.js';
            const defaultContent = jsEditor?.value || '';
            this.files.js = { [defaultName]: defaultContent };
            this.activeFile.js = defaultName;
        }

        // Default entry HTML is the active HTML file
        const htmlFiles = this.files.html || {};
        if (!this.entryHtmlFile || !htmlFiles[this.entryHtmlFile]) {
            this.entryHtmlFile = this.activeFile.html || Object.keys(htmlFiles)[0] || 'index.html';
        }

        this.refreshFileSelectors();
        this.syncEditorsFromFiles();
    }

    // Read current content for active file of given type
    getCurrentFileContent(type) {
        const filesOfType = this.files?.[type] || {};
        const activeName = this.activeFile?.[type];

        if (activeName && Object.prototype.hasOwnProperty.call(filesOfType, activeName)) {
            return filesOfType[activeName] || '';
        }

        const names = Object.keys(filesOfType);
        if (names.length > 0) {
            this.activeFile[type] = names[0];
            return filesOfType[names[0]] || '';
        }

        return '';
    }

    // Update in-memory content for the active file of given type
    updateCurrentFileContent(type, content) {
        if (!this.files[type]) {
            this.files[type] = {};
        }

        if (!this.activeFile[type]) {
            const fallbackName = type === 'html'
                ? 'index.html'
                : type === 'css'
                    ? 'style.css'
                    : 'script.js';
            this.activeFile[type] = fallbackName;
        }

        this.files[type][this.activeFile[type]] = content;
    }

    // Persist whatever is currently in the textarea back to files map
    persistCurrentEditorContent(type) {
        const editorId = type === 'html' ? 'html-editor' : `${type}-editor`;
        const editor = document.getElementById(editorId);
        if (!editor) return;
        this.updateCurrentFileContent(type, editor.value);
    }

    // Keep all textareas in sync with the active files
    syncEditorsFromFiles() {
        this.syncEditorForType('html');
        this.syncEditorForType('css');
        this.syncEditorForType('js');
    }

    syncEditorForType(type) {
        const editorId = type === 'html' ? 'html-editor' : `${type}-editor`;
        const editor = document.getElementById(editorId);
        if (!editor) return;
        editor.value = this.getCurrentFileContent(type);
    }

    // Populate the HTML/CSS/JS file selectors
    refreshFileSelectors() {
        this.populateFileSelect('html');
        this.populateFileSelect('css');
        this.populateFileSelect('js');
    }

    populateFileSelect(type) {
        const selectId = `${type}-file-select`;
        const selectEl = document.getElementById(selectId);
        if (!selectEl) return;

        const filesOfType = this.files?.[type] || {};
        const activeName = this.activeFile?.[type];

        selectEl.innerHTML = '';

        const names = Object.keys(filesOfType);
        if (names.length === 0) return;

        names.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            if (name === activeName) option.selected = true;
            selectEl.appendChild(option);
        });
    }

    setupFileManagement() {
        const types = ['html', 'css', 'js'];

        types.forEach(type => {
            const select = document.getElementById(`${type}-file-select`);
            const addBtn = document.getElementById(`add-${type}-file`);
            const renameBtn = document.getElementById(`rename-${type}-file`);
            const deleteBtn = document.getElementById(`delete-${type}-file`);

            if (select) {
                select.addEventListener('change', (e) => {
                    this.persistCurrentEditorContent(type);

                    const newName = e.target.value;
                    this.activeFile[type] = newName;

                    // When switching HTML file, treat it as new entry file for preview/deploy
                    if (type === 'html') {
                        this.entryHtmlFile = newName;
                    }

                    this.syncEditorForType(type);
                    this.saveToLocalStorage();
                    this.updatePreview();
                });
            }

            if (addBtn) {
                addBtn.addEventListener('click', () => this.addNewFile(type));
            }

            if (renameBtn) {
                renameBtn.addEventListener('click', () => this.renameFile(type));
            }

            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => this.deleteFile(type));
            }
        });
    }

    addNewFile(type) {
        const filesOfType = this.files?.[type] || {};
        const count = Object.keys(filesOfType).length;

        const base = type === 'html' ? 'page' : type === 'css' ? 'style' : 'script';
        const ext = type === 'html' ? '.html' : type === 'css' ? '.css' : '.js';

        let suggestedName = `${base}${count + 1}${ext}`;
        let name = prompt(`New ${type.toUpperCase()} file name`, suggestedName);
        if (!name) return;

        name = name.trim();
        if (!name.endsWith(ext)) {
            name += ext;
        }

        if (!this.files[type]) {
            this.files[type] = {};
        }

        if (this.files[type][name]) {
            alert('A file with that name already exists.');
            return;
        }

        this.files[type][name] = '';
        this.activeFile[type] = name;

        if (type === 'html') {
            this.entryHtmlFile = name;
        }

        this.refreshFileSelectors();
        this.syncEditorForType(type);
        this.saveToLocalStorage();
        this.updatePreview();
    }

    renameFile(type) {
        const currentName = this.activeFile?.[type];
        const filesOfType = this.files?.[type] || {};

        if (!currentName || !filesOfType[currentName]) {
            alert(`No ${type.toUpperCase()} file selected to rename.`);
            return;
        }

        const ext = type === 'html' ? '.html' : type === 'css' ? '.css' : '.js';
        let newName = prompt(`Rename ${type.toUpperCase()} file`, currentName);
        if (!newName || newName === currentName) return;

        newName = newName.trim();
        if (!newName.endsWith(ext)) {
            newName += ext;
        }

        if (filesOfType[newName]) {
            alert('A file with that name already exists.');
            return;
        }

        filesOfType[newName] = filesOfType[currentName];
        delete filesOfType[currentName];

        this.activeFile[type] = newName;

        if (type === 'html' && this.entryHtmlFile === currentName) {
            this.entryHtmlFile = newName;
        }

        this.refreshFileSelectors();
        this.syncEditorForType(type);
        this.saveToLocalStorage();
        this.updatePreview();
    }

    deleteFile(type) {
        const filesOfType = this.files?.[type] || {};
        const names = Object.keys(filesOfType);

        if (names.length <= 1) {
            alert(`You must have at least one ${type.toUpperCase()} file.`);
            return;
        }

        const currentName = this.activeFile?.[type];
        if (!currentName || !filesOfType[currentName]) {
            alert(`No ${type.toUpperCase()} file selected to delete.`);
            return;
        }

        if (!confirm(`Delete ${type.toUpperCase()} file "${currentName}"?`)) {
            return;
        }

        delete filesOfType[currentName];

        const remaining = Object.keys(filesOfType);
        const newActive = remaining[0];
        this.activeFile[type] = newActive;

        if (type === 'html') {
            if (this.entryHtmlFile === currentName) {
                this.entryHtmlFile = newActive;
            }
        }

        this.refreshFileSelectors();
        this.syncEditorForType(type);
        this.saveToLocalStorage();
        this.updatePreview();
    }

    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('simpleEditorData');
            if (saved) {
                const data = JSON.parse(saved);

                if (data.files) {
                    // New multi-file format
                    this.files = data.files || { html: {}, css: {}, js: {} };
                    this.activeFile = data.activeFile || this.activeFile;
                    this.activeType = data.activeType || this.activeType || 'html';
                    this.entryHtmlFile = data.entryHtmlFile || this.entryHtmlFile || 'index.html';
                } else {
                    // Legacy single-file format
                    this.files = {
                        html: {},
                        css: {},
                        js: {}
                    };

                    if (data.html) {
                        this.files.html['index.html'] = data.html;
                        this.activeFile.html = 'index.html';
                    }
                    if (data.css) {
                        this.files.css['style.css'] = data.css;
                        this.activeFile.css = 'style.css';
                    }
                    if (data.js) {
                        this.files.js['script.js'] = data.js;
                        this.activeFile.js = 'script.js';
                    }

                    this.entryHtmlFile = 'index.html';
                }

                this.refreshFileSelectors();
                this.syncEditorsFromFiles();

                // Also keep legacy mirrors updated
                const snapshot = this.getProjectContentSnapshot();
                this.html = snapshot.html;
                this.css = snapshot.css;
                this.js = snapshot.js;

                console.log('Loaded from localStorage');
            }
        } catch (error) {
            console.warn('Failed to load from localStorage:', error);
        }
    }

    saveToLocalStorage() {
        try {
            const snapshot = this.getProjectContentSnapshot();
            const data = {
                // New multi-file format
                files: this.files,
                activeFile: this.activeFile,
                activeType: this.activeType,
                entryHtmlFile: this.entryHtmlFile,

                // Legacy single-file mirrors (for safety)
                html: snapshot.html,
                css: snapshot.css,
                js: snapshot.js,

                timestamp: new Date().toISOString()
            };
            localStorage.setItem('simpleEditorData', JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save to localStorage:', error);
        }
    }

    toggleTheme() {
        const body = document.body;
        body.classList.toggle('night-mode');
        const isNightMode = body.classList.contains('night-mode');
        localStorage.setItem('editorTheme', isNightMode ? 'night' : 'light');

        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            themeBtn.innerHTML = isNightMode ? '☀️ Light Mode' : '🌙 Night Mode';
        }
    }

    applyNightTheme() {
        const savedTheme = localStorage.getItem('editorTheme') || 'night';
        const body = document.body;
        if (savedTheme === 'night') {
            body.classList.add('night-mode');
            const themeBtn = document.getElementById('theme-toggle');
            if (themeBtn) themeBtn.innerHTML = '☀️ Light Mode';
        }
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn =>
            btn.classList.toggle('active', btn.dataset.tab === tabName)
        );
        document.querySelectorAll('.tab-content').forEach(tab =>
            tab.classList.toggle('active', tab.id === `${tabName}-tab`)
        );

        if (tabName === 'html' || tabName === 'css' || tabName === 'js') {
            this.activeType = tabName;
            this.syncEditorForType(tabName);
        }

        if (tabName === 'assets') {
            this.renderAssetsList();
        }
    }

    // ========== UNIVERSAL HTML GENERATION ==========
    getEntryHtmlFileNameFromFiles(htmlFiles = this.files?.html || {}) {
        if (!htmlFiles) return null;

        if (this.entryHtmlFile && htmlFiles[this.entryHtmlFile]) {
            return this.entryHtmlFile;
        }

        if (htmlFiles['index.html']) return 'index.html';

        const names = Object.keys(htmlFiles);
        return names.length ? names[0] : null;
    }

    getProjectContentSnapshot(files = this.files) {
        const safeFiles = files || { html: {}, css: {}, js: {} };
        const htmlFiles = safeFiles.html || {};
        const cssFiles = safeFiles.css || {};
        const jsFiles = safeFiles.js || {};

        const entryFileName = this.getEntryHtmlFileNameFromFiles(htmlFiles);

        const htmlContent = entryFileName ? (htmlFiles[entryFileName] || '') : '';
        const cssContent = Object.entries(cssFiles).map(([name, content]) =>
            `/* ${name} */\n${content || ''}`
        ).join('\n\n');
        const jsContent = Object.entries(jsFiles).map(([name, content]) =>
            `// ${name}\n${content || ''}`
        ).join('\n\n');

        // Keep legacy single-file mirrors updated
        this.html = htmlContent;
        this.css = cssContent;
        this.js = jsContent;

        return {
            html: htmlContent,
            css: cssContent,
            js: jsContent,
            entryFileName
        };
    }

    // ========== ASSET PATH REPLACEMENT ==========
    replaceAssetPaths(content) {
        if (!content || !this.assets || this.assets.length === 0) return content;

        let processed = content;

        // Sort assets by filename length descending to avoid partial matches
        const sortedAssets = [...this.assets].sort((a, b) => b.filename.length - a.filename.length);

        sortedAssets.forEach(asset => {
            const fileName = asset.filename;
            const assetUrl = asset.url.startsWith('http') ? asset.url : `${this.baseUrl}${asset.url}`;

            // Escape filename for regex
            const escapedName = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            // Replace in src="...", href="...", url(...) and @import "..."
            // 1. Attributes src/href/action
            const attrRegex = new RegExp(`(src|href|action)\\s*=\\s*["']${escapedName}["']`, 'gi');
            processed = processed.replace(attrRegex, `$1="${assetUrl}"`);

            // 2. CSS url(...)
            const urlRegex = new RegExp(`url\\s*\\(\\s*["']?${escapedName}["']?\\s*\\)`, 'gi');
            processed = processed.replace(urlRegex, `url("${assetUrl}")`);

            // 3. CSS @import
            const importRegex = new RegExp(`@import\\s+["']${escapedName}["']`, 'gi');
            processed = processed.replace(importRegex, `@import "${assetUrl}"`);
        });

        return processed;
    }

    generateHTML() {
        const projectName = document.getElementById('project-name')?.value || 'My Project';
        const { html, css, js } = this.getProjectContentSnapshot();

        // 1. Replace relative asset paths in HTML and CSS with absolute URLs
        const processedHTML = this.replaceAssetPaths(html);
        const processedCSS = this.replaceAssetPaths(css);

        // 2. Auto-wrap JavaScript for preview too
        const processedJS = this.autoWrapJavaScript(js);

        // 3. Determine base URL for relative links (works for saved projects)
        let baseTag = '';
        if (this.currentProjectId) {
            const baseUrl = `http://${window.location.host}/frontend/${this.currentProjectId}/`;
            baseTag = `<base href="${baseUrl}">`;
        }

        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${baseTag}
    <title>${projectName}</title>
    <style>
        ${processedCSS}
    </style>
</head>
<body>
    ${processedHTML}
    <script>
        // UNIVERSAL PREVIEW - AUTO-WRAPPED
        (function() {
            try {
                // User's original code
                ${js}
                
                // Auto-wrapped version
                ${processedJS}
            } catch(error) {
                console.error('JavaScript error:', error);
            }
            
            // Universal event handler for preview
            document.addEventListener('click', function(e) {
                if (e.target.hasAttribute('onclick')) {
                    const onclick = e.target.getAttribute('onclick');
                    try {
                        eval(onclick);
                    } catch(err) {
                        console.error('onclick error:', err);
                    }
                }
            });
        })();
        
        console.log('Preview loaded');
    </script>
</body>
</html>`;
    }

    updatePreview() {
        // Only update if preview is visible
        if (!this.previewVisible) return;

        try {
            const html = this.generateHTML();
            const frame = document.getElementById('preview-frame');
            if (frame) {
                frame.srcdoc = html;
            }
        } catch (error) {
            console.error('Preview update error:', error);
            const frame = document.getElementById('preview-frame');
            if (frame) {
                frame.srcdoc = `<h1 style="color: red;">Preview Error</h1><p>${error.message}</p>`;
            }
        }
    }

    togglePreviewVisibility() {
        this.previewVisible = !this.previewVisible;

        // Update the UI
        this.updatePreviewToggleUI();

        // Update preview content if visible
        if (this.previewVisible) {
            this.updatePreview();
        }

        // Save state to localStorage
        localStorage.setItem('previewVisible', this.previewVisible.toString());
    }

    loadPreviewVisibilityState() {
        const saved = localStorage.getItem('previewVisible');
        if (saved !== null) {
            this.previewVisible = saved === 'true';
        } else {
            this.previewVisible = false; // Default to hidden (user clicks eye to show)
        }

        // Apply the state
        this.updatePreviewToggleUI();
    }

    ensurePreviewIconLoaded() {
        const toggleIcon = document.getElementById('preview-toggle-icon');
        if (toggleIcon) {
            // Ensure the icon is visible and loads correctly
            toggleIcon.onerror = () => {
                console.error('Preview icon failed to load:', toggleIcon.src);
                // Fallback: show text only if image fails
                toggleIcon.style.display = 'none';
            };
            toggleIcon.onload = () => {
                toggleIcon.style.display = 'inline-block';
            };

            // Force reload if needed
            const currentSrc = toggleIcon.src;
            toggleIcon.src = '';
            setTimeout(() => {
                toggleIcon.src = currentSrc;
            }, 10);
        }
    }

    updatePreviewToggleUI() {
        const previewPanel = document.getElementById('live-preview-panel');
        const frame = document.getElementById('preview-frame');
        const toggleIcon = document.getElementById('preview-toggle-icon');
        const toggleBtn = document.getElementById('toggle-preview');

        if (!previewPanel || !frame || !toggleIcon || !toggleBtn) return;

        if (!this.previewVisible) {
            // Hide preview panel
            previewPanel.style.display = 'none';
            toggleIcon.src = '/images/' + encodeURIComponent('delete.png');
            toggleIcon.alt = 'Preview Hidden';
            toggleBtn.title = 'Show Live Preview';
        } else {
            // Show preview panel
            previewPanel.style.display = 'flex';
            toggleIcon.src = '/images/eye.png';
            toggleIcon.alt = 'Preview Visible';
            toggleBtn.title = 'Hide Live Preview';
        }
    }

    // ========== SYMBOL CLICK-TO-PREVIEW FUNCTIONALITY ==========
    setupSymbolClickHandlers() {
        const htmlEditor = document.getElementById('html-editor');
        const cssEditor = document.getElementById('css-editor');
        const jsEditor = document.getElementById('js-editor');

        [htmlEditor, cssEditor, jsEditor].forEach((editor, index) => {
            if (!editor) return;

            const type = index === 0 ? 'html' : index === 1 ? 'css' : 'js';

            editor.addEventListener('click', (e) => {
                // Check if Ctrl/Cmd key is pressed (VS Code-style)
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    // Small delay to ensure selectionStart is set
                    setTimeout(() => {
                        const symbol = this.detectSymbolAtPosition(editor, e, type);
                        if (symbol) {
                            this.openSymbolPreview(symbol, type);
                        }
                    }, 10);
                }
            });

            // Also support hover tooltip for symbols
            editor.addEventListener('mousemove', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    const symbol = this.detectSymbolAtPosition(editor, e, type);
                    if (symbol) {
                        editor.style.cursor = 'pointer';
                        this.showSymbolTooltip(editor, e, symbol);
                    } else {
                        editor.style.cursor = 'text';
                        this.hideSymbolTooltip();
                    }
                } else {
                    editor.style.cursor = 'text';
                    this.hideSymbolTooltip();
                }
            });
        });
    }

    detectSymbolAtPosition(editor, event, fileType) {
        const text = editor.value;

        // Use selectionStart if available (works for textarea clicks)
        let clickPos = editor.selectionStart;

        // If selectionStart is not available, calculate from click position
        if (clickPos === undefined || clickPos === null) {
            clickPos = this.getCaretPositionFromClick(editor, event);
        }

        if (clickPos === -1 || clickPos === null) return null;

        // Find the word/symbol at the click position
        const symbols = this.extractSymbols(text, fileType);

        for (const symbol of symbols) {
            if (clickPos >= symbol.start && clickPos <= symbol.end) {
                return symbol;
            }
        }

        return null;
    }

    getCaretPositionFromClick(editor, event) {
        // For textarea, try to get selectionStart after a small delay
        // This works because the browser sets selectionStart on click
        const text = editor.value;
        const lines = text.split('\n');

        // Get computed style for better accuracy
        const style = window.getComputedStyle(editor);
        const lineHeight = parseFloat(style.lineHeight) || 20;
        const paddingTop = parseFloat(style.paddingTop) || 0;
        const paddingLeft = parseFloat(style.paddingLeft) || 0;

        const rect = editor.getBoundingClientRect();
        const x = event.clientX - rect.left - paddingLeft;
        const y = event.clientY - rect.top - paddingTop + editor.scrollTop;

        // Calculate line number
        const line = Math.floor(y / lineHeight);

        if (line < 0 || line >= lines.length) return -1;

        // Estimate column based on character width (monospace approximation)
        const charWidth = 8.4; // Average monospace character width
        const col = Math.floor(x / charWidth);

        // Calculate position
        let pos = 0;
        for (let i = 0; i < line && i < lines.length; i++) {
            pos += lines[i].length + 1; // +1 for newline
        }
        pos += Math.min(Math.max(0, col), lines[line]?.length || 0);

        return Math.min(pos, text.length);
    }

    extractSymbols(text, fileType) {
        const symbols = [];

        if (fileType === 'html') {
            // Find href="file.html" or src="file.js" references
            const hrefRegex = /(?:href|src|action)\s*=\s*["']([^"']+\.(html|css|js))["']/gi;
            let match;
            while ((match = hrefRegex.exec(text)) !== null) {
                symbols.push({
                    type: 'file-reference',
                    name: match[1],
                    start: match.index,
                    end: match.index + match[0].length,
                    fileType: match[2] || 'html'
                });
            }

            // Find onclick="functionName()" references
            const onclickRegex = /onclick\s*=\s*["']([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/gi;
            while ((match = onclickRegex.exec(text)) !== null) {
                symbols.push({
                    type: 'function-reference',
                    name: match[1],
                    start: match.index,
                    end: match.index + match[0].length
                });
            }
        } else if (fileType === 'css') {
            // Find @import "file.css" references
            const importRegex = /@import\s+["']([^"']+\.css)["']/gi;
            let match;
            while ((match = importRegex.exec(text)) !== null) {
                symbols.push({
                    type: 'file-reference',
                    name: match[1],
                    start: match.index,
                    end: match.index + match[0].length,
                    fileType: 'css'
                });
            }

            // Find url("file.css") references
            const urlRegex = /url\s*\(\s*["']?([^"')]+\.(css|png|jpg|svg))["']?\s*\)/gi;
            while ((match = urlRegex.exec(text)) !== null) {
                symbols.push({
                    type: 'file-reference',
                    name: match[1],
                    start: match.index,
                    end: match.index + match[0].length,
                    fileType: match[2] || 'css'
                });
            }
        } else if (fileType === 'js') {
            // Find import/require statements
            const importRegex = /(?:import|require)\s*\(?\s*["']([^"']+\.js)["']/gi;
            let match;
            while ((match = importRegex.exec(text)) !== null) {
                symbols.push({
                    type: 'file-reference',
                    name: match[1],
                    start: match.index,
                    end: match.index + match[0].length,
                    fileType: 'js'
                });
            }

            // Find function declarations
            const funcRegex = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
            while ((match = funcRegex.exec(text)) !== null) {
                symbols.push({
                    type: 'function-definition',
                    name: match[1],
                    start: match.index,
                    end: match.index + match[0].length
                });
            }

            // Find function calls
            const callRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
            const funcDefs = new Set();
            funcRegex.lastIndex = 0;
            while ((match = funcRegex.exec(text)) !== null) {
                funcDefs.add(match[1]);
            }

            callRegex.lastIndex = 0;
            while ((match = callRegex.exec(text)) !== null) {
                if (!funcDefs.has(match[1])) {
                    symbols.push({
                        type: 'function-call',
                        name: match[1],
                        start: match.index,
                        end: match.index + match[0].length
                    });
                }
            }
        }

        return symbols;
    }

    openSymbolPreview(symbol, currentFileType) {
        // Create or get preview panel
        let previewPanel = document.getElementById('symbol-preview-panel');
        if (!previewPanel) {
            previewPanel = this.createSymbolPreviewPanel();
        }

        // Show the panel
        previewPanel.style.display = 'flex';

        // Update preview content based on symbol type
        if (symbol.type === 'file-reference') {
            this.previewFileReference(symbol, previewPanel);
        } else if (symbol.type === 'function-reference' || symbol.type === 'function-call') {
            this.previewFunctionReference(symbol, currentFileType, previewPanel);
        } else if (symbol.type === 'function-definition') {
            this.previewFunctionDefinition(symbol, currentFileType, previewPanel);
        }
    }

    createSymbolPreviewPanel() {
        const panel = document.createElement('div');
        panel.id = 'symbol-preview-panel';
        panel.className = 'symbol-preview-panel';
        panel.innerHTML = `
            <div class="symbol-preview-header">
                <span class="symbol-preview-title">Preview</span>
                <button class="symbol-preview-close" id="close-symbol-preview">×</button>
            </div>
            <div class="symbol-preview-content" id="symbol-preview-content">
                <p>Click on a symbol (Ctrl/Cmd + Click) to preview</p>
            </div>
        `;

        document.body.appendChild(panel);

        // Close button handler
        document.getElementById('close-symbol-preview').addEventListener('click', () => {
            panel.style.display = 'none';
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && panel.style.display === 'flex') {
                panel.style.display = 'none';
            }
        });

        return panel;
    }

    previewFileReference(symbol, panel) {
        const contentDiv = document.getElementById('symbol-preview-content');
        const fileName = symbol.name;
        const fileType = symbol.fileType || 'html';

        // Check if file exists in project
        const files = this.files[fileType] || {};
        const fileContent = files[fileName];

        if (fileContent !== undefined) {
            // File exists in project - show preview
            const header = panel.querySelector('.symbol-preview-title');
            header.textContent = `Preview: ${fileName}`;

            if (fileType === 'html') {
                // Generate full HTML preview with all CSS and JS
                const { html, css, js } = this.getProjectContentSnapshot();
                const processedJS = this.autoWrapJavaScript(js);

                const previewHTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${fileName}</title>
    <style>${css}</style>
</head>
<body>${fileContent}
    <script>
        ${js}
        ${processedJS}
    </script>
</body>
</html>`;

                // Create iframe and set srcdoc directly (don't escape HTML for srcdoc)
                const iframe = document.createElement('iframe');
                iframe.className = 'symbol-preview-frame';
                iframe.srcdoc = previewHTML;
                contentDiv.innerHTML = '';
                contentDiv.appendChild(iframe);
            } else if (fileType === 'css') {
                contentDiv.innerHTML = `
                    <div class="symbol-preview-code">
                        <pre><code>${this.escapeHtml(fileContent)}</code></pre>
                    </div>
                `;
            } else if (fileType === 'js') {
                contentDiv.innerHTML = `
                    <div class="symbol-preview-code">
                        <pre><code>${this.escapeHtml(fileContent)}</code></pre>
                    </div>
                `;
            }
        } else {
            // File doesn't exist - show message
            contentDiv.innerHTML = `
                <div class="symbol-preview-error">
                    <p>⚠️ File not found: <strong>${fileName}</strong></p>
                    <p>This file doesn't exist in your project. Create it using the file toolbar.</p>
                </div>
            `;
        }
    }

    previewFunctionReference(symbol, currentFileType, panel) {
        const contentDiv = document.getElementById('symbol-preview-content');
        const funcName = symbol.name;
        const header = panel.querySelector('.symbol-preview-title');
        header.textContent = `Function: ${funcName}()`;

        // Search for function definition in all JS files
        let funcDefinition = null;
        const jsFiles = this.files.js || {};

        for (const [fileName, content] of Object.entries(jsFiles)) {
            const funcMatch = content.match(
                new RegExp(`function\\s+${funcName}\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}`, 'm')
            );
            if (funcMatch) {
                funcDefinition = {
                    file: fileName,
                    code: funcMatch[0]
                };
                break;
            }
        }

        if (funcDefinition) {
            contentDiv.innerHTML = `
                <div class="symbol-preview-info">
                    <p><strong>Found in:</strong> ${funcDefinition.file}</p>
                </div>
                <div class="symbol-preview-code">
                    <pre><code>${this.escapeHtml(funcDefinition.code)}</code></pre>
                </div>
            `;
        } else {
            contentDiv.innerHTML = `
                <div class="symbol-preview-error">
                    <p>⚠️ Function not found: <strong>${funcName}()</strong></p>
                    <p>This function is not defined in your JavaScript files.</p>
                </div>
            `;
        }
    }

    previewFunctionDefinition(symbol, currentFileType, panel) {
        const contentDiv = document.getElementById('symbol-preview-content');
        const funcName = symbol.name;
        const header = panel.querySelector('.symbol-preview-title');
        header.textContent = `Function Definition: ${funcName}()`;

        // Get function definition from current file
        const currentFile = this.activeFile[currentFileType] || '';
        const fileContent = this.files[currentFileType]?.[currentFile] || '';

        const funcMatch = fileContent.match(
            new RegExp(`function\\s+${funcName}\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}`, 'm')
        );

        if (funcMatch) {
            contentDiv.innerHTML = `
                <div class="symbol-preview-info">
                    <p><strong>Defined in:</strong> ${currentFile}</p>
                </div>
                <div class="symbol-preview-code">
                    <pre><code>${this.escapeHtml(funcMatch[0])}</code></pre>
                </div>
            `;
        } else {
            contentDiv.innerHTML = `
                <div class="symbol-preview-code">
                    <pre><code>// Function definition not found</code></pre>
                </div>
            `;
        }
    }

    showSymbolTooltip(editor, event, symbol) {
        // Remove existing tooltip
        this.hideSymbolTooltip();

        const tooltip = document.createElement('div');
        tooltip.className = 'symbol-tooltip';
        tooltip.textContent = `Ctrl+Click to preview: ${symbol.name}`;
        tooltip.style.position = 'fixed';
        tooltip.style.left = `${event.clientX + 10}px`;
        tooltip.style.top = `${event.clientY + 10}px`;
        tooltip.id = 'symbol-tooltip';

        document.body.appendChild(tooltip);
    }

    hideSymbolTooltip() {
        const tooltip = document.getElementById('symbol-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ========== UNIVERSAL DEPLOYMENT HTML GENERATION ==========
    generateDeploymentHTML(files) {
        const projectName = document.getElementById('project-name')?.value || 'My Project';
        const { html, css, js } = this.getProjectContentSnapshot(files || this.files);

        // 1. Replace relative asset paths in HTML and CSS with absolute URLs
        const processedHTML = this.replaceAssetPaths(html);
        const processedCSS = this.replaceAssetPaths(css);

        // 2. AUTO-WRAP JavaScript to make all functions globally available
        const processedJS = this.autoWrapJavaScript(js);

        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName}</title>
    <style>
        ${processedCSS}
    </style>
</head>
<body>
    ${processedHTML}
    <script>
        // === AUTO-WRAPPED JAVASCRIPT ===
        // All functions are automatically made global
        
        // 1. Execute the user's original code first
        try {
            (function() {
                // User's original code (preserved for debugging)
                ${js}
            })();
        } catch(error) {
            console.error('User code error:', error);
        }
        
        // 2. AUTO-WRAPPED VERSION - Makes everything work automatically
        (function() {
            // Processed version with auto-wrapped functions
            ${processedJS}
        })();
        
        // 3. Universal event handler for onclick events
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Deployed project loaded: "${projectName}"');
            
            // Auto-bind all onclick handlers
            document.addEventListener('click', function(e) {
                if (e.target.hasAttribute('onclick')) {
                    const handler = e.target.getAttribute('onclick');
                    try {
                        // Try to execute as is
                        eval(handler);
                    } catch(error) {
                        console.warn('onclick handler error:', error);
                        // Try to find and call the function
                        const funcName = handler.replace(/\(.*\)/, '').trim();
                        if (typeof window[funcName] === 'function') {
                            window[funcName]();
                        }
                    }
                }
            });
            
            // Auto-call init() or main() if they exist
            setTimeout(() => {
                if (typeof window.init === 'function') window.init();
                if (typeof window.main === 'function') window.main();
                if (typeof window.onload === 'function') window.onload();
            }, 100);
        });
        
        // 4. Make sure DOMContentLoaded fires even if already loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                console.log('DOMContentLoaded fired');
            });
        } else {
            console.log('DOM already loaded, triggering event');
            document.dispatchEvent(new Event('DOMContentLoaded'));
        }
    </script>
</body>
</html>`;
    }

    // ========== AUTO-WRAP JAVASCRIPT HELPER ==========
    autoWrapJavaScript(js) {
        if (!js.trim()) return js;

        console.log('Auto-wrapping JavaScript for global access...');

        // Keep a copy of original code for reference
        let processed = js;

        // 1. Convert regular function declarations to window assignments
        // Matches: function myFunc() { ... }
        processed = processed.replace(
            /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]*)\)\s*\{/g,
            (match, funcName, params) => {
                console.log(`Auto-wrapping function: ${funcName}`);
                return `window.${funcName} = function(${params}) {`;
            }
        );

        // 2. Convert const/let/var function assignments
        // Matches: const myFunc = function() { ... }
        // Matches: const myFunc = () => { ... }
        processed = processed.replace(
            /(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s*)?(?:function\s*\(([^)]*)\)|\(([^)]*)\)\s*=>)\s*\{/g,
            (match, declaration, funcName, funcParams, arrowParams) => {
                console.log(`Auto-wrapping variable function: ${funcName}`);
                const params = funcParams || arrowParams || '';
                return `${declaration} ${funcName} = function(${params}) { window.${funcName} = ${funcName};`;
            }
        );

        // 3. Also assign to window at the end of the function
        // This ensures functions declared inside other scopes still become global
        const functionNames = this.extractAllFunctionNames(js);

        // Add window assignments for all detected functions
        if (functionNames.length > 0) {
            console.log(`Found functions to make global: ${functionNames.join(', ')}`);

            // Add at the beginning of the script
            const windowAssignments = functionNames.map(funcName =>
                `if (typeof ${funcName} === 'function' && !window.${funcName}) window.${funcName} = ${funcName};`
            ).join('\n');

            processed = windowAssignments + '\n' + processed;
        }

        return processed;
    }

    // ========== IMPROVED FUNCTION EXTRACTION ==========
    extractAllFunctionNames(js) {
        const functionNames = new Set();

        // 1. Regular function declarations
        const funcRegex = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
        let match;
        while ((match = funcRegex.exec(js)) !== null) {
            functionNames.add(match[1]);
        }

        // 2. Arrow functions assigned to variables
        const arrowRegex = /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g;
        while ((match = arrowRegex.exec(js)) !== null) {
            functionNames.add(match[1]);
        }

        // 3. Function expressions
        const exprRegex = /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*function/g;
        while ((match = exprRegex.exec(js)) !== null) {
            functionNames.add(match[1]);
        }

        // 4. Method assignments
        const methodRegex = /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*function/g;
        while ((match = methodRegex.exec(js)) !== null) {
            functionNames.add(match[1]);
        }

        console.log(`Extracted function names: ${Array.from(functionNames)}`);
        return Array.from(functionNames);
    }

    toggleFullscreenPreview() {
        const previewFrame = document.getElementById('preview-frame');
        if (!previewFrame) return;

        if (!document.fullscreenElement) {
            const container = previewFrame.parentElement;
            if (container) {
                container.classList.add('preview-fullscreen');
                previewFrame.requestFullscreen?.();
            }
        } else {
            document.exitFullscreen?.();
            const container = previewFrame.parentElement;
            if (container) {
                container.classList.remove('preview-fullscreen');
            }
        }
    }

    // ========== SAVE PROJECT METHOD ==========
    async saveProject() {
        const token = Cookies.get('token');
        if (!token) {
            alert('Please login to save your project');
            return;
        }

        const saveBtn = document.getElementById('save-project');
        const originalText = saveBtn ? saveBtn.innerHTML : 'Save';

        // Add saving state
        if (saveBtn) {
            saveBtn.innerHTML = '💾 Saving...';
            saveBtn.classList.add('saving');
            saveBtn.disabled = true;
        }

        const projectName = document.getElementById('project-name')?.value.trim() || 'Untitled Project';

        try {
            const projectFiles = this.files;

            // Generate universal deployment HTML from all project files (with assets)
            const deploymentHTML = this.generateDeploymentHTML(projectFiles);

            const response = await fetch('/api/frontend/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: projectName,
                    files: projectFiles,
                    assets: this.assets,
                    deploymentHTML: deploymentHTML
                })
            });

            const result = await response.json();

            if (result.success) {
                this.currentProjectId = result.projectId;
                const shareUrl = result.shareUrl;
                navigator.clipboard.writeText(shareUrl).then(() => {
                    this.showSuccessNotification(shareUrl);
                });

                if (saveBtn) {
                    saveBtn.innerHTML = '✅ Saved!';
                    setTimeout(() => {
                        saveBtn.innerHTML = originalText;
                    }, 2000);
                }
            } else {
                alert('Failed to save project: ' + result.error);
                if (saveBtn) saveBtn.innerHTML = originalText;
            }
        } catch (error) {
            console.error('Error saving project:', error);
            alert('Error saving project. Please try again.');
            if (saveBtn) {
                saveBtn.innerHTML = '❌ Failed';
                setTimeout(() => {
                    saveBtn.innerHTML = originalText;
                }, 2000);
            }
        } finally {
            if (saveBtn) {
                saveBtn.classList.remove('saving');
                saveBtn.disabled = false;
            }
        }
    }

    showSuccessNotification(url) {
        const n = document.getElementById('success-notification');
        if (n) {
            n.innerHTML = `<span>✓</span> Project saved! Share URL: <a href="${url}" target="_blank" style="color: white; text-decoration: underline;">${url}</a>`;
            n.style.display = 'flex';
            setTimeout(() => (n.style.display = 'none'), 5000);
        }
    }

    // ========== AUTH METHODS ==========
    async checkAuthStatus() {
        const token = Cookies.get('token');
        const authToggle = document.getElementById('auth-toggle');

        if (!token) {
            this.setAuthState(false);
            return;
        }

        try {
            if (authToggle) {
                authToggle.innerHTML = '⏳ Checking...';
                authToggle.className = 'btn btn-auth-loading';
                authToggle.disabled = true;
            }

            const response = await fetch('/verify-token', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) this.setAuthState(true);
            else {
                Cookies.remove('token');
                this.setAuthState(false);
            }

        } catch (err) {
            console.error('Auth check failed:', err);
            Cookies.remove('token');
            this.setAuthState(false);
        } finally {
            if (authToggle) authToggle.disabled = false;
        }
    }

    setAuthState(isAuthenticated) {
        this.isAuthenticated = isAuthenticated;
        const btn = document.getElementById('auth-toggle');
        if (!btn) return;

        if (isAuthenticated) {
            btn.innerHTML = '🚪 Logout';
            btn.className = 'btn btn-logout';
        } else {
            btn.innerHTML = '🔐 Login';
            btn.className = 'btn btn-login';
        }
    }

    async handleAuthToggle() {
        if (this.isAuthenticated) {
            await this.logout();
        } else {
            this.login();
        }
    }

    login() {
        const currentUrl = window.location.pathname + window.location.search;
        window.location.href = `/login.html?redirect=${encodeURIComponent(currentUrl)}`;
    }

    async logout() {
        const token = Cookies.get('token');
        const authToggle = document.getElementById('auth-toggle');

        if (authToggle) {
            authToggle.innerHTML = '⏳ Logging out...';
            authToggle.className = 'btn btn-auth-loading';
            authToggle.disabled = true;
        }

        try {
            if (token) {
                await fetch('/logout', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }

            Cookies.remove('token');
            this.setAuthState(false);
            this.showNotification('Logged out successfully!');

            setTimeout(() => window.location.href = '/landing.html', 800);

        } catch (err) {
            console.error('Logout error:', err);
            Cookies.remove('token');
            this.setAuthState(false);
            this.showNotification('Logged out successfully!');
            setTimeout(() => window.location.href = '/landing.html', 800);
        } finally {
            if (authToggle) authToggle.disabled = false;
        }
    }

    showNotification(message, type = 'success') {
        const box = document.createElement('div');
        box.style.cssText = `
            position:fixed; top:20px; right:20px;
            background:${type === 'success' ? '#10b981' : '#ef4444'};
            color:#fff; padding:15px 25px; 
            border-radius:10px; z-index:20000;
            box-shadow:0 10px 25px rgba(0,0,0,.2);
            animation:slideInRight .3s ease;
            backdrop-filter:blur(10px);
            border:1px solid rgba(255,255,255,.1);
        `;
        box.textContent = message;
        document.body.appendChild(box);

        setTimeout(() => {
            box.style.animation = 'slideOutRight .3s ease';
            setTimeout(() => box.remove(), 300);
        }, 3000);
    }

    // ========== PROJECT MANAGEMENT ==========
    async showProjects() {
        const token = Cookies.get('token');
        if (!token) {
            alert('Please login to view your projects');
            return;
        }

        try {
            const response = await fetch('/api/frontend/projects', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load projects');
            }

            const projects = await response.json();
            this.displayProjectsModal(projects);
        } catch (error) {
            console.error('Error loading projects:', error);
            alert('Error loading projects: ' + error.message);
        }
    }

    displayProjectsModal(projects) {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'projects-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            backdrop-filter: blur(5px);
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: var(--dark-bg, #1e1e1e);
            color: var(--text-color, #e0e0e0);
            padding: 30px;
            border-radius: 15px;
            max-width: 800px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            border: 1px solid var(--border-color, #444);
        `;

        modalContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0;">My Projects</h2>
                <button id="close-projects" style="background: none; border: none; color: #fff; font-size: 24px; cursor: pointer;">×</button>
            </div>
            <div id="projects-list" style="display: grid; gap: 15px;">
                ${projects.length === 0 ?
                '<p style="text-align: center; color: #888; padding: 40px;">No projects found. Create your first project!</p>' :
                projects.map(project => `
                        <div class="project-card" style="background: rgba(255,255,255,0.05); border-radius: 10px; padding: 20px; border: 1px solid rgba(255,255,255,0.1);">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <div>
                                    <h3 style="margin: 0 0 10px 0; color: #fff;">${this.escapeHtml(project.name)}</h3>
                                    <p style="margin: 0; color: #aaa; font-size: 14px;">
                                        Created: ${new Date(project.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div style="display: flex; gap: 10px;">
                                    <button class="btn-open" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;" 
                                            onclick="frontendEditor.openProject('${project.id}')">Open</button>
                                    <button class="btn-delete" style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;"
                                            onclick="frontendEditor.deleteProject('${project.id}', '${this.escapeHtml(project.name)}')">Delete</button>
                                </div>
                            </div>
                            <div style="margin-top: 15px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                <p style="margin: 5px 0; font-size: 13px; color: #888;">
                                    <strong>Share URL:</strong> <a href="${project.shareUrl}" target="_blank" style="color: #3b82f6; text-decoration: none;">${project.shareUrl}</a>
                                </p>
                                <button class="copy-link-btn" data-share-url="${this.escapeHtml(project.shareUrl)}" title="Copy link" style="background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.4); color: #3b82f6; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 13px;">📋 Copy</button>
                            </div>
                        </div>
                    `).join('')}
            </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Close modal events
        const closeBtn = modalContent.querySelector('#close-projects');
        closeBtn.addEventListener('click', () => modal.remove());

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
            // Copy link button
            if (e.target.classList.contains('copy-link-btn')) {
                const url = e.target.dataset.shareUrl;
                if (url) {
                    navigator.clipboard.writeText(url).then(() => {
                        this.showNotification('Link copied to clipboard!');
                        e.target.textContent = '✓ Copied';
                        setTimeout(() => { e.target.textContent = '📋 Copy'; }, 2000);
                    });
                }
            }
        });

        // Escape key to close
        document.addEventListener('keydown', function closeModalOnEsc(e) {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', closeModalOnEsc);
            }
        });
    }

    async openProject(projectId) {
        try {
            const token = Cookies.get('token');
            const response = await fetch(`/api/frontend/project/${projectId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load project');
            }

            const project = await response.json();

            // Load project data
            document.getElementById('project-name').value = project.name;

            // Load full multi-file structure (fallback to legacy single-file if needed)
            this.files = project.files || { html: {}, css: {}, js: {} };

            if (!this.files.html) this.files.html = {};
            if (!this.files.css) this.files.css = {};
            if (!this.files.js) this.files.js = {};

            // Legacy safety: ensure there is at least one file of each type
            if (Object.keys(this.files.html).length === 0 && project.files?.html?.['index.html']) {
                this.files.html['index.html'] = project.files.html['index.html'];
            }
            if (Object.keys(this.files.css).length === 0 && project.files?.css?.['style.css']) {
                this.files.css['style.css'] = project.files.css['style.css'];
            }
            if (Object.keys(this.files.js).length === 0 && project.files?.js?.['script.js']) {
                this.files.js['script.js'] = project.files.js['script.js'];
            }

            // Reset active files
            this.activeFile = {
                html: this.getEntryHtmlFileNameFromFiles(this.files.html) || Object.keys(this.files.html)[0] || 'index.html',
                css: Object.keys(this.files.css)[0] || 'style.css',
                js: Object.keys(this.files.js)[0] || 'script.js'
            };

            this.entryHtmlFile = this.activeFile.html;

            // Load assets
            this.assets = project.assets || [];
            this.saveAssetsToLocalStorage();

            // Update editors and selectors
            this.refreshFileSelectors();
            this.syncEditorsFromFiles();

            // Update preview
            this.updatePreview();

            // Save to localStorage
            this.saveToLocalStorage();

            // Close projects modal
            document.querySelector('.projects-modal')?.remove();

            this.showNotification('Project loaded successfully!');

        } catch (error) {
            console.error('Error opening project:', error);
            alert('Error opening project: ' + error.message);
        }
    }

    async deleteProject(projectId, projectName) {
        if (!confirm(`Are you sure you want to delete "${projectName}"?`)) {
            return;
        }

        try {
            const token = Cookies.get('token');
            const response = await fetch(`/api/frontend/project/${projectId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete project');
            }

            // Remove from UI
            const projectCard = document.querySelector(`[onclick*="${projectId}"]`)?.closest('.project-card');
            if (projectCard) {
                projectCard.remove();
            }

            // If no projects left, show message
            const projectsList = document.getElementById('projects-list');
            if (projectsList && projectsList.children.length === 0) {
                projectsList.innerHTML = '<p style="text-align: center; color: #888; padding: 40px;">No projects found. Create your first project!</p>';
            }

            this.showNotification('Project deleted successfully!');

        } catch (error) {
            console.error('Error deleting project:', error);
            alert('Error deleting project: ' + error.message);
        }
    }

    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ========== ASSET MANAGEMENT ==========
    setupAssetManagement() {
        const uploadBtn = document.getElementById('upload-asset-btn');
        const fileInput = document.getElementById('asset-file-input');
        const dropzone = document.getElementById('assets-dropzone');
        const assetsList = document.getElementById('assets-list');

        if (!uploadBtn || !fileInput || !dropzone || !assetsList) return;

        // Upload button click
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            this.handleAssetFiles(e.target.files);
        });

        // Drag and drop
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('drag-over');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('drag-over');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('drag-over');
            this.handleAssetFiles(e.dataTransfer.files);
        });

        // Click to browse
        dropzone.addEventListener('click', () => {
            fileInput.click();
        });

        // Load assets from localStorage
        this.loadAssetsFromLocalStorage();
    }

    async handleAssetFiles(files) {
        if (!files || files.length === 0) return;

        const token = Cookies.get('token');
        if (!token) {
            alert('Please login to upload assets');
            return;
        }

        const formData = new FormData();
        Array.from(files).forEach(file => {
            formData.append('assets', file);
        });

        try {
            const response = await fetch('/api/frontend/upload-assets', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to upload assets');
            }

            const result = await response.json();

            // Add uploaded assets to local array
            if (result.assets && result.assets.length > 0) {
                // Ensure asset URLs are absolute
                const assetsWithAbsoluteUrls = result.assets.map(asset => ({
                    ...asset,
                    url: asset.url.startsWith('http') ? asset.url : `${this.baseUrl}${asset.url}`
                }));
                this.assets = [...this.assets, ...assetsWithAbsoluteUrls];
                this.saveAssetsToLocalStorage();
                this.renderAssetsList();
                this.showNotification(`${result.assets.length} asset(s) uploaded successfully!`);
            }

        } catch (error) {
            console.error('Error uploading assets:', error);
            alert('Failed to upload assets: ' + error.message);
        }
    }

    renderAssetsList() {
        const assetsList = document.getElementById('assets-list');
        if (!assetsList) return;

        if (this.assets.length === 0) {
            assetsList.innerHTML = '<p class="no-assets">No assets uploaded yet. Upload assets to use them in your project.</p>';
            return;
        }

        assetsList.innerHTML = this.assets.map(asset => {
            const isImage = /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(asset.filename);
            const isFont = /\.(woff|woff2|ttf|otf)$/i.test(asset.filename);

            // Ensure URL is absolute for preview and display
            const assetUrl = asset.url.startsWith('http') ? asset.url : `${this.baseUrl}${asset.url}`;

            let preview = '';
            if (isImage) {
                preview = `<img src="${assetUrl}" alt="${this.escapeHtml(asset.filename)}" class="asset-preview-image">`;
            } else if (isFont) {
                preview = `<div class="asset-preview-font">🔤 ${this.escapeHtml(asset.filename)}</div>`;
            } else {
                preview = `<div class="asset-preview-file">📄 ${this.escapeHtml(asset.filename)}</div>`;
            }

            return `
                <div class="asset-item" data-asset-id="${asset.id}">
                    <div class="asset-preview">${preview}</div>
                    <div class="asset-info">
                        <div class="asset-name" title="${this.escapeHtml(asset.filename)}">${this.escapeHtml(asset.filename)}</div>
                        <div class="asset-size">${this.formatFileSize(asset.size || 0)}</div>
                        <div class="asset-url">
                            <input type="text" readonly value="${this.escapeHtml(assetUrl)}" class="asset-url-input" id="asset-url-${asset.id}">
                            <button class="btn-copy-asset-url" data-url="${this.escapeHtml(assetUrl)}" title="Copy URL">📋</button>
                        </div>
                    </div>
                    <div class="asset-actions">
                        <button class="btn-delete-asset" data-asset-id="${asset.id}" title="Delete">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners
        assetsList.querySelectorAll('.btn-copy-asset-url').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const url = e.target.dataset.url;
                navigator.clipboard.writeText(url).then(() => {
                    this.showNotification('Asset URL copied to clipboard!');
                });
            });
        });

        assetsList.querySelectorAll('.btn-delete-asset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const assetId = e.target.dataset.assetId;
                this.deleteAsset(assetId);
            });
        });
    }

    async deleteAsset(assetId) {
        const asset = this.assets.find(a => a.id === assetId);
        if (!asset) return;

        if (!confirm(`Delete asset "${asset.filename}"?`)) return;

        const token = Cookies.get('token');
        if (!token) {
            alert('Please login to delete assets');
            return;
        }

        try {
            const response = await fetch(`/api/frontend/asset/${assetId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete asset');
            }

            // Remove from local array
            this.assets = this.assets.filter(a => a.id !== assetId);
            this.saveAssetsToLocalStorage();
            this.renderAssetsList();
            this.showNotification('Asset deleted successfully!');

        } catch (error) {
            console.error('Error deleting asset:', error);
            alert('Failed to delete asset: ' + error.message);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    loadAssetsFromLocalStorage() {
        try {
            const saved = localStorage.getItem('editorAssets');
            if (saved) {
                this.assets = JSON.parse(saved);
                this.renderAssetsList();
            }
        } catch (error) {
            console.warn('Failed to load assets from localStorage:', error);
        }
    }

    saveAssetsToLocalStorage() {
        try {
            localStorage.setItem('editorAssets', JSON.stringify(this.assets));
        } catch (error) {
            console.warn('Failed to save assets to localStorage:', error);
        }
    }
}

// Initialize editor
document.addEventListener('DOMContentLoaded', () => {
    window.frontendEditor = new SimpleFrontendEditor();
});