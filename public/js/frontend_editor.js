console.log('✨ CodeCanvas Frontend Editor loaded');

class CodeCanvasEditor {
    constructor() {
        // Single files only
        this.files = {
            html: '',
            css: '',
            js: ''
        };
        
        this.assets = [];
        this.isAuthenticated = false;
        this.autoSaveTimer = null;
        this.debounceTimer = null;
        
        // Load saved content from localStorage
        this.loadFromStorage();
        this.init();
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('codecanvas_project');
            if (saved) {
                const data = JSON.parse(saved);
                this.files = data.files || this.files;
                this.assets = data.assets || [];
            }
        } catch (e) {
            console.log('No saved project found');
        }
    }

    saveToStorage() {
        const data = {
            files: this.files,
            assets: this.assets,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('codecanvas_project', JSON.stringify(data));
    }

    init() {
        console.log('🚀 Initializing CodeCanvas Editor');
        
        // Set initial content in editors
        this.setupEditors();
        
        // Setup event listeners
        this.bindEvents();
        
        // Check auth status
        this.checkAuthStatus();
        
        // Start auto-save
        this.startAutoSave();
        
        // Update preview
        setTimeout(() => this.updatePreview(), 100);
        
        // Update file stats
        this.updateFileStats();
    }

    setupEditors() {
        const htmlEditor = document.getElementById('html-editor');
        const cssEditor = document.getElementById('css-editor');
        const jsEditor = document.getElementById('js-editor');
        
        if (htmlEditor) htmlEditor.value = this.files.html || htmlEditor.value;
        if (cssEditor) cssEditor.value = this.files.css || cssEditor.value;
        if (jsEditor) jsEditor.value = this.files.js || jsEditor.value;
        
        // Update files with initial content
        this.files.html = htmlEditor?.value || '';
        this.files.css = cssEditor?.value || '';
        this.files.js = jsEditor?.value || '';
    }

    bindEvents() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab || e.target.closest('[data-tab]').dataset.tab);
            });
        });

        // Size buttons
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const size = e.target.dataset.size || e.target.closest('[data-size]').dataset.size;
                this.setPreviewSize(size);
            });
        });

        // Editor input listeners
        this.setupEditorListeners();

        // Buttons
        document.getElementById('save-project')?.addEventListener('click', () => this.saveProject());
        document.getElementById('show-projects')?.addEventListener('click', () => this.showProjects());
        document.getElementById('assets-manager')?.addEventListener('click', () => this.showAssetsManager());
        document.getElementById('auth-toggle')?.addEventListener('click', () => this.handleAuthToggle());
        document.getElementById('fullscreen-preview')?.addEventListener('click', () => this.toggleFullscreen());
        
        // Asset upload
        document.getElementById('asset-upload')?.addEventListener('change', (e) => this.handleAssetUpload(e));
        
        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) modal.style.display = 'none';
            });
        });
    }

    setupEditorListeners() {
        const updateFile = (type, value) => {
            this.files[type] = value;
            this.updateFileStats();
            this.debouncedPreview();
            this.saveToStorage();
        };

        const htmlEditor = document.getElementById('html-editor');
        const cssEditor = document.getElementById('css-editor');
        const jsEditor = document.getElementById('js-editor');

        if (htmlEditor) {
            htmlEditor.addEventListener('input', (e) => updateFile('html', e.target.value));
        }
        if (cssEditor) {
            cssEditor.addEventListener('input', (e) => updateFile('css', e.target.value));
        }
        if (jsEditor) {
            jsEditor.addEventListener('input', (e) => updateFile('js', e.target.value));
        }
    }

    debouncedPreview() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.updatePreview(), 500);
    }

    startAutoSave() {
        this.autoSaveTimer = setInterval(() => {
            this.saveToStorage();
            this.showToast('Auto-saved', 'Project auto-saved locally', 'info');
        }, 30000); // Auto-save every 30 seconds
    }

    updateFileStats() {
        // Update character counts
        document.getElementById('html-size')?.textContent = `${this.files.html.length} chars`;
        document.getElementById('css-size')?.textContent = `${this.files.css.length} chars`;
        document.getElementById('js-size')?.textContent = `${this.files.js.length} chars`;
        
        // Update line counts
        document.getElementById('html-lines')?.textContent = 
            `${(this.files.html.match(/\n/g) || []).length + 1} lines`;
        document.getElementById('css-lines')?.textContent = 
            `${(this.files.css.match(/\n/g) || []).length + 1} lines`;
        document.getElementById('js-lines')?.textContent = 
            `${(this.files.js.match(/\n/g) || []).length + 1} lines`;
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.toggle('active', tab.id === `${tabName}-tab`);
        });
        
        // Update sidebar active item
        document.querySelectorAll('.status-item').forEach((item, index) => {
            const types = ['html', 'css', 'js'];
            item.classList.toggle('active', types[index] === tabName);
        });
        
        if (tabName === 'preview') {
            this.updatePreview();
        }
    }

    setPreviewSize(size) {
        const previewContainer = document.querySelector('.preview-container');
        if (!previewContainer) return;
        
        // Remove all size classes
        previewContainer.classList.remove('preview-desktop', 'preview-tablet', 'preview-mobile', 'preview-responsive');
        
        // Add selected size class
        previewContainer.classList.add(`preview-${size}`);
        
        // Update active button
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.size === size);
        });
        
        // Update preview
        setTimeout(() => this.updatePreview(), 100);
    }

    updatePreview() {
        try {
            const fullHTML = this.generateFullHTML();
            const frame = document.getElementById('preview-frame');
            
            if (!frame) {
                console.error('Preview frame not found');
                return;
            }
            
            frame.srcdoc = fullHTML;
            
            frame.onload = () => {
                console.log('✅ Preview updated');
                this.showToast('Preview Updated', 'Live preview refreshed', 'success');
            };
            
        } catch (error) {
            console.error('Error updating preview:', error);
            this.showToast('Preview Error', error.message, 'error');
        }
    }

    refreshPreview() {
        this.updatePreview();
    }

    generateFullHTML() {
        try {
            const projectName = document.getElementById('project-name')?.value || 'CodeCanvas Project';
            
            // Process JavaScript for safety
            const safeJS = this.files.js
                .replace(/<\/script>/gi, '<\\/script>')
                .replace(/`/g, '\\`')
                .replace(/\${/g, '\\${');
            
            // Replace asset references
            let processedHTML = this.files.html;
            this.assets.forEach(asset => {
                if (asset.name && asset.data) {
                    const regex = new RegExp(`(["'])([^"']*/)?${asset.name}(["'])`, 'gi');
                    processedHTML = processedHTML.replace(regex, `$1${asset.data}$3`);
                }
            });
            
            return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName}</title>
    <style>
        ${this.files.css}
        
        /* Auto-inject styles for assets if needed */
        body {
            font-family: system-ui, -apple-system, sans-serif;
            margin: 0;
            padding: 20px;
            background: #0a0a14;
            color: #ffffff;
        }
        
        img {
            max-width: 100%;
        }
    </style>
</head>
<body>
    ${processedHTML}
    
    <script>
        // Project JavaScript
        (function() {
            ${safeJS}
        })();
        
        // Add error handling
        window.addEventListener('error', function(e) {
            console.error('Preview Error:', e.error);
        });
        
        console.log('🚀 CodeCanvas Preview loaded');
    </script>
</body>
</html>`;
            
        } catch (error) {
            console.error('Error generating HTML:', error);
            return `<!DOCTYPE html>
<html>
<head>
    <title>Preview Error</title>
    <style>
        body {
            font-family: system-ui, sans-serif;
            padding: 40px;
            background: #0a0a14;
            color: #ff6b6b;
        }
        pre {
            background: rgba(255,255,255,0.05);
            padding: 20px;
            border-radius: 8px;
            overflow: auto;
        }
    </style>
</head>
<body>
    <h1>Preview Generation Error</h1>
    <p>${error.message}</p>
    <pre>${error.stack}</pre>
</body>
</html>`;
        }
    }

    toggleFullscreen() {
        const previewContainer = document.querySelector('.preview-container');
        if (!previewContainer) return;
        
        if (!document.fullscreenElement) {
            if (previewContainer.requestFullscreen) {
                previewContainer.requestFullscreen();
            } else if (previewContainer.webkitRequestFullscreen) {
                previewContainer.webkitRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    }

    async checkAuthStatus() {
        const token = Cookies.get('token');
        if (!token) {
            this.setAuthState(false);
            return;
        }

        try {
            const response = await fetch('/verify-token', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                this.setAuthState(true);
            } else {
                Cookies.remove('token');
                this.setAuthState(false);
            }
        } catch (err) {
            console.error('Auth check failed:', err);
            this.setAuthState(false);
        }
    }

    setAuthState(isAuthenticated) {
        this.isAuthenticated = isAuthenticated;
        const btn = document.getElementById('auth-toggle');
        if (!btn) return;

        if (isAuthenticated) {
            btn.innerHTML = '<i class="fas fa-sign-out-alt"></i><span>Logout</span>';
            btn.classList.add('btn-logout');
            btn.classList.remove('btn-auth');
        } else {
            btn.innerHTML = '<i class="fas fa-user"></i><span>Login</span>';
            btn.classList.add('btn-auth');
            btn.classList.remove('btn-logout');
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
        
        try {
            if (token) {
                await fetch('/logout', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
            
            Cookies.remove('token');
            this.setAuthState(false);
            this.showToast('Logged Out', 'Successfully logged out', 'success');
            
            setTimeout(() => window.location.reload(), 1000);
        } catch (err) {
            console.error('Logout error:', err);
            Cookies.remove('token');
            this.setAuthState(false);
            this.showToast('Logged Out', 'Successfully logged out', 'success');
            setTimeout(() => window.location.reload(), 1000);
        }
    }

    async saveProject() {
        const token = Cookies.get('token');
        if (!token) {
            this.showToast('Login Required', 'Please login to save and deploy', 'warning');
            setTimeout(() => this.login(), 1500);
            return;
        }

        this.showLoading(true);
        
        const projectName = document.getElementById('project-name')?.value.trim() || 'Untitled Project';
        
        try {
            const deploymentHTML = this.generateFullHTML();
            
            const response = await fetch('/api/frontend/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: projectName,
                    files: {
                        html: { 'index.html': this.files.html },
                        css: { 'style.css': this.files.css },
                        js: { 'script.js': this.files.js }
                    },
                    assets: this.assets,
                    deploymentHTML: deploymentHTML
                })
            });

            const result = await response.json();

            if (result.success) {
                const shareUrl = result.shareUrl || `https://${window.location.hostname}/frontend/${result.projectId}`;
                
                // Copy to clipboard
                await navigator.clipboard.writeText(shareUrl);
                
                this.showToast('Deployed!', 'Share URL copied to clipboard', 'success');
                
                // Update project name if it was empty
                if (!document.getElementById('project-name').value) {
                    document.getElementById('project-name').value = projectName;
                }
                
            } else {
                throw new Error(result.error || 'Failed to save project');
            }
        } catch (error) {
            console.error('Error saving project:', error);
            this.showToast('Deploy Failed', error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async showProjects() {
        const token = Cookies.get('token');
        if (!token) {
            this.showToast('Login Required', 'Please login to view projects', 'warning');
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch('/api/frontend/projects', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const projects = await response.json();
            this.displayProjects(projects);
            
            document.getElementById('projects-modal').style.display = 'block';
        } catch (error) {
            console.error('Error loading projects:', error);
            this.showToast('Load Failed', 'Failed to load projects', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    displayProjects(projects) {
        const list = document.getElementById('projects-list');
        if (!list) return;

        if (!projects || projects.length === 0) {
            list.innerHTML = `
                <div class="no-projects">
                    <i class="fas fa-folder-open"></i>
                    <h3>No Projects Yet</h3>
                    <p>Create your first project and it will appear here!</p>
                </div>
            `;
            return;
        }

        list.innerHTML = projects.map(project => `
            <div class="project-card" onclick="window.frontendEditor.openProject('${project.id}')">
                <div class="project-header">
                    <i class="fas fa-project-diagram"></i>
                    <h3>${this.escapeHtml(project.name)}</h3>
                </div>
                <div class="project-meta">
                    <span><i class="far fa-calendar"></i> ${new Date(project.createdAt).toLocaleDateString()}</span>
                    <span><i class="fas fa-code"></i> ${project.fileCount || 0} files</span>
                </div>
                <div class="project-actions">
                    <button class="btn btn-small" onclick="event.stopPropagation(); navigator.clipboard.writeText('${project.shareUrl}')">
                        <i class="fas fa-link"></i> Copy Link
                    </button>
                    <button class="btn btn-small btn-danger" onclick="event.stopPropagation(); window.frontendEditor.deleteProject('${project.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    async openProject(projectId) {
        this.showLoading(true);
        
        try {
            const token = Cookies.get('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            
            const response = await fetch(`/api/frontend/project/${projectId}`, { headers });
            const project = await response.json();
            
            // Load project data
            document.getElementById('project-name').value = project.name;
            
            // Load files (single files only)
            if (project.files?.html?.['index.html']) {
                this.files.html = project.files.html['index.html'];
                document.getElementById('html-editor').value = this.files.html;
            }
            if (project.files?.css?.['style.css']) {
                this.files.css = project.files.css['style.css'];
                document.getElementById('css-editor').value = this.files.css;
            }
            if (project.files?.js?.['script.js']) {
                this.files.js = project.files.js['script.js'];
                document.getElementById('js-editor').value = this.files.js;
            }
            
            // Load assets
            this.assets = project.assets || [];
            
            // Save to localStorage
            this.saveToStorage();
            
            // Update UI
            this.updateFileStats();
            this.updatePreview();
            this.switchTab('preview');
            
            // Close modal
            document.getElementById('projects-modal').style.display = 'none';
            
            this.showToast('Project Loaded', `Loaded "${project.name}"`, 'success');
        } catch (error) {
            console.error('Error opening project:', error);
            this.showToast('Load Failed', error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async deleteProject(projectId) {
        if (!confirm('Are you sure you want to delete this project?')) return;
        
        const token = Cookies.get('token');
        if (!token) return;
        
        try {
            const response = await fetch(`/api/frontend/project/${projectId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                this.showToast('Deleted', 'Project deleted successfully', 'success');
                this.showProjects(); // Refresh list
            } else {
                throw new Error('Failed to delete project');
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            this.showToast('Delete Failed', error.message, 'error');
        }
    }

    showAssetsManager() {
        this.renderAssetsList();
        document.getElementById('assets-modal').style.display = 'block';
    }

    handleAssetUpload(e) {
        const files = Array.from(e.target.files);
        
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                this.assets.push({
                    name: file.name,
                    type: file.type,
                    data: event.target.result,
                    size: file.size,
                    uploadedAt: new Date().toISOString()
                });
                
                this.saveToStorage();
                this.renderAssetsList();
                this.showToast('Asset Uploaded', `${file.name} uploaded`, 'success');
                
                // Update preview to include new asset
                setTimeout(() => this.updatePreview(), 500);
            };
            reader.readAsDataURL(file);
        });
        
        e.target.value = '';
    }

    renderAssetsList() {
        const list = document.getElementById('assets-list');
        if (!list) return;
        
        if (this.assets.length === 0) {
            list.innerHTML = `
                <div class="no-assets">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>No assets uploaded yet</p>
                </div>
            `;
            return;
        }
        
        list.innerHTML = this.assets.map((asset, index) => `
            <div class="asset-item">
                ${asset.type.startsWith('image/') 
                    ? `<img src="${asset.data}" alt="${asset.name}" loading="lazy">`
                    : `<div class="asset-icon">
                          <i class="fas fa-file"></i>
                          <span>${asset.name.split('.').pop()}</span>
                       </div>`
                }
                <div class="asset-info">
                    <div class="asset-name">${asset.name}</div>
                    <div class="asset-size">${this.formatFileSize(asset.size)}</div>
                </div>
                <div class="asset-actions">
                    <button onclick="window.frontendEditor.copyAssetUrl(${index})" title="Copy URL">
                        <i class="fas fa-link"></i>
                    </button>
                    <button onclick="window.frontendEditor.deleteAsset(${index})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    copyAssetUrl(index) {
        const asset = this.assets[index];
        if (asset && asset.data) {
            navigator.clipboard.writeText(asset.data);
            this.showToast('URL Copied', 'Asset URL copied to clipboard', 'success');
        }
    }

    deleteAsset(index) {
        if (confirm('Delete this asset?')) {
            this.assets.splice(index, 1);
            this.saveToStorage();
            this.renderAssetsList();
            this.showToast('Asset Deleted', 'Asset removed from project', 'info');
        }
    }

    clearAll() {
        if (confirm('Clear all code? This cannot be undone.')) {
            this.files = { html: '', css: '', js: '' };
            document.getElementById('html-editor').value = '';
            document.getElementById('css-editor').value = '';
            document.getElementById('js-editor').value = '';
            this.updateFileStats();
            this.updatePreview();
            this.showToast('Cleared', 'All code cleared', 'info');
        }
    }

    copyCode() {
        const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
        if (!activeTab || activeTab === 'preview') return;
        
        const code = this.files[activeTab];
        navigator.clipboard.writeText(code);
        this.showToast('Copied', `${activeTab.toUpperCase()} code copied`, 'success');
    }

    openInNewTab() {
        const html = this.generateFullHTML();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    }

    showToast(title, message, type = 'info') {
        const toast = document.getElementById('notification-toast');
        if (!toast) return;
        
        const iconMap = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        const colorMap = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196F3'
        };
        
        document.getElementById('toast-title').textContent = title;
        document.getElementById('toast-message').textContent = message;
        toast.querySelector('.toast-icon i').className = `fas ${iconMap[type]}`;
        toast.style.borderLeft = `4px solid ${colorMap[type]}`;
        
        toast.style.display = 'flex';
        toast.style.animation = 'none';
        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.3s ease';
        }, 10);
        
        // Auto-hide after 4 seconds
        setTimeout(() => {
            toast.style.display = 'none';
        }, 4000);
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize editor when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.frontendEditor = new CodeCanvasEditor();
    console.log('🎨 CodeCanvas Editor ready!');
});