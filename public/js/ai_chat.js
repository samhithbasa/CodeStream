// Logic for the AI Assistant Chat Interface

document.addEventListener('DOMContentLoaded', () => {
    // Determine the environment based on which objects are present
    const isCodeEditor = typeof editor !== 'undefined'; // code.html uses global 'editor' (CodeMirror)
    const isFrontendEditor = typeof htmlEditor !== 'undefined' || !!document.getElementById('html-editor');

    const aiBtn = document.getElementById('ai-assistant-btn');
    const aiPanel = document.getElementById('ai-panel');
    const closeAiBtn = document.getElementById('close-ai');
    const sendAiBtn = document.getElementById('send-ai-btn');
    const aiPromptInput = document.getElementById('ai-prompt');
    const chatBox = document.getElementById('ai-chat-box');

    // Function to parse naive markdown manually to HTML and inject Accept/Reject UI
    let codeBlockIdCount = 0;
    function parseMarkdown(md) {
        const codeBlocks = [];

        // 1. Extract and protect code blocks
        let html = md.replace(/```([a-zA-Z0-9+#-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
            codeBlockIdCount++;
            const safeCodeId = `ai-code-block-${Date.now()}-${codeBlockIdCount}`;
            codeBlocks.push({ id: safeCodeId, lang: lang, code: code });
            return `%%CODE_BLOCK_${safeCodeId}%%`;
        });
        
        // Handle blocks without language specified
        html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
            codeBlockIdCount++;
            const safeCodeId = `ai-code-block-${Date.now()}-${codeBlockIdCount}`;
            codeBlocks.push({ id: safeCodeId, lang: '', code: code });
            return `%%CODE_BLOCK_${safeCodeId}%%`;
        });

        // 2. Perform text formatting safely
        html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.2); padding: 2px 4px; border-radius: 3px;">$1</code>');
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\n\n/g, '<br><br>');

        // 3. Inject code blocks back into the HTML
        codeBlocks.forEach(block => {
            const rawCodeDisplay = block.code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            // Also escape it for the textarea value
            const rawCodeValue = block.code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

            const blockHtml = `
            <div class="ai-code-container" id="container-${block.id}">
                <div class="ai-code-header">${block.lang || 'code'}</div>
                <pre><code>${rawCodeDisplay}</code></pre>
                <textarea id="raw-${block.id}" style="display: none;">${rawCodeValue}</textarea>
                <div class="ai-code-actions">
                    <button class="ai-btn-action ai-btn-accept" onclick="acceptAICode('${block.id}', '${block.lang}')">✓ Accept</button>
                    <button class="ai-btn-action ai-btn-reject" onclick="rejectAICode('${block.id}')">✕ Reject</button>
                </div>
            </div>`;
            
            html = html.replace(`%%CODE_BLOCK_${block.id}%%`, blockHtml);
        });

        return html;
    }

    // Attach to window so onclick works globally
    window.acceptAICode = function(id, lang) {
        const rawElement = document.getElementById(`raw-${id}`);
        if (!rawElement) return;
        const codeToInsert = rawElement.value;
        const container = document.getElementById(`container-${id}`);

        if (isCodeEditor && typeof editor !== 'undefined') {
            // Standard Code Editor (CodeMirror) - replace selection or insert at cursor
            editor.replaceSelection(codeToInsert);
            
            // UI Feedback
            container.style.opacity = '0.6';
            container.querySelector('.ai-code-actions').innerHTML = '<span style="color: #10b981; font-weight: bold;">✓ Accepted & Inserted</span>';
        } else if (isFrontendEditor) {
            // Frontend Editor (TextAreas)
            let targetEditor = null;
            const langLower = (lang || '').toLowerCase();
            
            if (langLower === 'html') targetEditor = document.getElementById('html-editor');
            else if (langLower === 'css') targetEditor = document.getElementById('css-editor');
            else if (langLower === 'js' || langLower === 'javascript') targetEditor = document.getElementById('js-editor');
            else {
                // fallback to active tab
                const activeBtn = document.querySelector('.tab-btn.active');
                if (activeBtn) {
                    const tab = activeBtn.getAttribute('data-tab');
                    if (tab === 'html') targetEditor = document.getElementById('html-editor');
                    else if (tab === 'css') targetEditor = document.getElementById('css-editor');
                    else if (tab === 'js') targetEditor = document.getElementById('js-editor');
                }
            }

            if (targetEditor) {
                // If it's a huge block of code, replace the whole file, else append?
                // Usually for playgounds, AI generates the whole file or a big chunk.
                // Let's replace the content and trigger the input event to compile.
                targetEditor.value = codeToInsert;
                targetEditor.dispatchEvent(new Event('input', { bubbles: true }));

                // UI Feedback
                container.style.opacity = '0.6';
                container.querySelector('.ai-code-actions').innerHTML = '<span style="color: #10b981; font-weight: bold;">✓ Inserted into ' + (lang || 'editor').toUpperCase() + '</span>';
            } else {
                alert("Please select the correct tab (HTML/CSS/JS) first!");
            }
        }
    };

    window.rejectAICode = function(id) {
        const container = document.getElementById(`container-${id}`);
        if (container) {
            container.classList.add('ai-btn-rejected');
            container.querySelector('.ai-code-actions').innerHTML = '<span style="color: #ef4444; font-weight: bold;">✕ Rejected</span>';
        }
    };

    if (aiBtn && aiPanel) {
        // Toggle panel
        aiBtn.addEventListener('click', () => {
            aiPanel.classList.toggle('open');
            if (aiPanel.classList.contains('open')) {
                aiPromptInput.focus();
            }
        });

        closeAiBtn.addEventListener('click', () => {
            aiPanel.classList.remove('open');
        });

        const sendRequest = async () => {
            const prompt = aiPromptInput.value.trim();
            if (!prompt) return;

            // Gather context
            let context = '';
            let mode = 'standard';

            if (isFrontendEditor) {
                mode = 'frontend';
                const htmlCode = document.getElementById('html-editor') ? document.getElementById('html-editor').value : '';
                const cssCode = document.getElementById('css-editor') ? document.getElementById('css-editor').value : '';
                const jsCode = document.getElementById('js-editor') ? document.getElementById('js-editor').value : '';
                
                context = `HTML:\n${htmlCode}\n\nCSS:\n${cssCode}\n\nJS:\n${jsCode}`;
            } else if (isCodeEditor && typeof editor !== 'undefined') {
                // global editor from code.html
                context = editor.getValue();
            }

            // Append user message
            const userMsg = document.createElement('div');
            userMsg.className = 'ai-message user';
            userMsg.textContent = prompt;
            chatBox.appendChild(userMsg);
            
            aiPromptInput.value = '';
            chatBox.scrollTop = chatBox.scrollHeight;

            // Append loading indicator
            const loadingMsg = document.createElement('div');
            loadingMsg.className = 'ai-loader';
            loadingMsg.style.display = 'block';
            loadingMsg.textContent = 'AI is thinking...';
            chatBox.appendChild(loadingMsg);
            chatBox.scrollTop = chatBox.scrollHeight;

            try {
                const response = await fetch('/api/ai/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt, context, mode })
                });

                const data = await response.json();
                
                loadingMsg.remove();

                const aiMsg = document.createElement('div');
                aiMsg.className = 'ai-message ai-system';
                
                if (data.success) {
                    aiMsg.innerHTML = parseMarkdown(data.answer);
                } else {
                    aiMsg.textContent = "Error: " + (data.error || "Unknown error occurred.");
                    aiMsg.style.color = "#ff6b6b";
                }
                
                chatBox.appendChild(aiMsg);
                chatBox.scrollTop = chatBox.scrollHeight;

            } catch (err) {
                console.error("AI Request Failed", err);
                loadingMsg.remove();
                const errMsg = document.createElement('div');
                errMsg.className = 'ai-message ai-system';
                errMsg.textContent = "Failed to connect to the server.";
                errMsg.style.color = "#ff6b6b";
                chatBox.appendChild(errMsg);
            }
        };

        sendAiBtn.addEventListener('click', sendRequest);
        aiPromptInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendRequest();
            }
        });
    }
});
