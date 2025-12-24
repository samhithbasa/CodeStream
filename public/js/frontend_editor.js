console.log('Enhanced Frontend Editor JavaScript loaded');

class SimpleFrontendEditor {
    constructor() {
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
        this.bindEvents();
        this.checkAuthStatus();
        this.loadFromLocalStorage();
        this.updatePreview();

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

        // Editor listeners
        this.setupEditorListeners();

        // Save project
        const saveBtn = document.getElementById('save-project');
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveProject());

        // Preview controls
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
                this.html = e.target.value;
                debouncedSave();
                debouncedPreview();
            });
            this.html = htmlEditor.value;
        }

        if (cssEditor) {
            cssEditor.addEventListener('input', (e) => {
                this.css = e.target.value;
                debouncedSave();
                debouncedPreview();
            });
            this.css = cssEditor.value;
        }

        if (jsEditor) {
            jsEditor.addEventListener('input', (e) => {
                this.js = e.target.value;
                debouncedSave();
                debouncedPreview();
            });
            this.js = jsEditor.value;
        }
    }

    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('simpleEditorData');
            if (saved) {
                const data = JSON.parse(saved);
                this.html = data.html || '';
                this.css = data.css || '';
                this.js = data.js || '';

                const htmlEditor = document.getElementById('html-editor');
                const cssEditor = document.getElementById('css-editor');
                const jsEditor = document.getElementById('js-editor');

                if (htmlEditor && this.html) htmlEditor.value = this.html;
                if (cssEditor && this.css) cssEditor.value = this.css;
                if (jsEditor && this.js) jsEditor.value = this.js;

                console.log('Loaded from localStorage');
            }
        } catch (error) {
            console.warn('Failed to load from localStorage:', error);
        }
    }

    saveToLocalStorage() {
        try {
            const data = {
                html: this.html,
                css: this.css,
                js: this.js,
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
        if (tabName === 'preview') this.updatePreview();
    }

    generateHTML() {
        const projectName = document.getElementById('project-name')?.value || 'My Project';

        // Process JavaScript for preview too
        const processedJS = this.processJavaScriptForDeployment(this.js);

        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName}</title>
    <style>
        ${this.css}
    </style>
</head>
<body>
    ${this.html}
    <script>
        // Processed JavaScript for preview
        ${processedJS}
        
        // Simple onclick handler for preview
        document.addEventListener('click', function(e) {
            if (e.target.hasAttribute('onclick')) {
                const handler = e.target.getAttribute('onclick');
                try {
                    eval(handler);
                } catch(error) {
                    console.error('Preview onclick error:', error);
                }
            }
        });
        
        console.log('Preview loaded');
    </script>
</body>
</html>`;
    }

    updatePreview() {
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

    // ========== UNIVERSAL DEPLOYMENT HTML GENERATION ==========
    // ========== UNIVERSAL DEPLOYMENT HTML GENERATION ==========
    generateDeploymentHTML(html, css, js) {
        const projectName = document.getElementById('project-name')?.value || 'My Project';

        // Process JavaScript to make ALL functions global
        const processedJS = this.processJavaScriptForDeployment(js);

        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName}</title>
    <style>
        ${css}
    </style>
</head>
<body>
    ${html}
    <script>
        // === CRITICAL: MAKE ALL FUNCTIONS GLOBAL ===
        // This ensures onclick handlers can find functions
        
        // 1. Process user's JavaScript to attach everything to window
        ${processedJS}
        
        // 2. Universal click handler for onclick attributes
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Setting up universal event handlers...');
            
            // Handle ALL onclick attributes
            document.querySelectorAll('[onclick]').forEach(element => {
                const originalOnClick = element.getAttribute('onclick');
                
                // Replace the onclick attribute with event listener
                element.removeAttribute('onclick');
                element.addEventListener('click', function(e) {
                    try {
                        // Use Function constructor for safe execution in global scope
                        const func = new Function('return (' + originalOnClick + ')');
                        func().call(element);
                    } catch(error) {
                        console.error('Error executing onclick:', error);
                        // Fallback to eval
                        try {
                            eval(originalOnClick);
                        } catch(e) {
                            console.error('Fallback also failed:', e);
                        }
                    }
                });
            });
            
            console.log('Universal handlers ready for project: "${projectName}"');
        });
        
        // 3. If DOM already loaded, trigger setup
        if (document.readyState !== 'loading') {
            const event = new Event('DOMContentLoaded');
            document.dispatchEvent(event);
        }
    </script>
</body>
</html>`;
    }

    // ========== CRITICAL: PROCESS JAVASCRIPT TO MAKE FUNCTIONS GLOBAL ==========
    processJavaScriptForDeployment(js) {
        // This is the MOST IMPORTANT function
        // It rewrites ALL function declarations to be attached to window

        let processed = js;

        // Pattern 1: Regular functions - function myFunc() { ... }
        const funcRegex = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{/g;

        // Replace all function declarations with window.attachment
        processed = processed.replace(funcRegex, 'window.$1 = function(');

        // Pattern 2: Const arrow functions - const myFunc = () => { ... }
        const arrowRegex = /(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g;

        processed = processed.replace(arrowRegex, 'window.$2 = ');

        // Pattern 3: Const function expressions - const myFunc = function() { ... }
        const exprRegex = /(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*function/g;

        processed = processed.replace(exprRegex, 'window.$2 = function');

        // Also ensure that functions called from within the code use window.
        const functionCalls = this.extractFunctionCalls(js);
        functionCalls.forEach(func => {
            // Replace function calls with window.func if func is a known function
            const callRegex = new RegExp(`\\b${func}\\(`, 'g');
            if (!processed.includes(`window.${func} =`)) {
                // If it's not defined in this file, it might be from onclick
                // We'll handle it via the onclick processor
            }
        });

        return processed;
    }

    extractFunctionCalls(js) {
        const calls = new Set();

        // Find function calls like myFunc() but not declarations
        const callRegex = /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
        let match;

        // List of JavaScript keywords to exclude
        const keywords = ['if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'typeof'];

        while ((match = callRegex.exec(js)) !== null) {
            const funcName = match[1];
            if (!keywords.includes(funcName) && !funcName.match(/^[0-9]/)) {
                calls.add(funcName);
            }
        }

        return Array.from(calls);
    }

    // ========== HELPER METHODS ==========
    extractAllFunctionNames(js) {
        const functionNames = new Set();

        // 1. Regular function declarations: function myFunc() {...}
        const funcRegex = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
        let match;
        while ((match = funcRegex.exec(js)) !== null) {
            functionNames.add(match[1]);
        }

        // 2. Arrow functions: const myFunc = () => {...}
        const arrowRegex = /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g;
        while ((match = arrowRegex.exec(js)) !== null) {
            functionNames.add(match[1]);
        }

        // 3. Function expressions: const myFunc = function() {...}
        const exprRegex = /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*function/g;
        while ((match = exprRegex.exec(js)) !== null) {
            functionNames.add(match[1]);
        }

        // 4. Method definitions: myMethod() {...}
        const methodRegex = /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{/g;
        while ((match = methodRegex.exec(js)) !== null) {
            // Skip keywords and common words
            const skipWords = ['if', 'for', 'while', 'switch', 'catch', 'function'];
            if (!skipWords.includes(match[1])) {
                functionNames.add(match[1]);
            }
        }

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
            const htmlContent = this.html;
            const cssContent = this.css;
            const jsContent = this.js;

            // Generate universal deployment HTML
            const deploymentHTML = this.generateDeploymentHTML(htmlContent, cssContent, jsContent);

            const response = await fetch('/api/frontend/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: projectName,
                    files: {
                        html: { 'index.html': htmlContent },
                        css: { 'style.css': cssContent },
                        js: { 'script.js': jsContent }
                    },
                    assets: [],
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

            setTimeout(() => window.location.reload(), 800);

        } catch (err) {
            console.error('Logout error:', err);
            Cookies.remove('token');
            this.setAuthState(false);
            this.showNotification('Logged out successfully!');
            setTimeout(() => window.location.reload(), 800);
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
                            <div style="margin-top: 15px;">
                                <p style="margin: 5px 0; font-size: 13px; color: #888;">
                                    <strong>Share URL:</strong> <a href="${project.shareUrl}" target="_blank" style="color: #3b82f6; text-decoration: none;">${project.shareUrl}</a>
                                </p>
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

            // Load files
            this.html = project.files?.html?.['index.html'] || '';
            this.css = project.files?.css?.['style.css'] || '';
            this.js = project.files?.js?.['script.js'] || '';

            // Update editors
            const htmlEditor = document.getElementById('html-editor');
            const cssEditor = document.getElementById('css-editor');
            const jsEditor = document.getElementById('js-editor');

            if (htmlEditor) htmlEditor.value = this.html;
            if (cssEditor) cssEditor.value = this.css;
            if (jsEditor) jsEditor.value = this.js;

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
}

// Initialize editor
document.addEventListener('DOMContentLoaded', () => {
    window.frontendEditor = new SimpleFrontendEditor();
});