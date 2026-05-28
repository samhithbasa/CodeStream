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

            // Append morphing emoji progress loading indicator
            const loadingMsg = document.createElement('div');
            loadingMsg.className = 'ai-loader emoji-loader-container';
            loadingMsg.style.display = 'flex';
            loadingMsg.style.opacity = '1';
            loadingMsg.style.transform = 'scale(1)';
            loadingMsg.innerHTML = `
                <div class="emoji-face">😢</div>
                <div class="emoji-progress-bar"><div class="emoji-progress-fill"></div></div>
                <div class="emoji-status-text">Connecting to AI...</div>
            `;
            chatBox.appendChild(loadingMsg);
            chatBox.scrollTop = chatBox.scrollHeight;

            // Setup morphing loader state
            let progress = 0;
            const emojis = ['😢', '😟', '😕', '😐', '🙂', '😀', '😁', '🥳'];
            const statusTexts = [
                'Connecting to AI...',
                'Analyzing context...',
                'Formulating thoughts...',
                'Generating response...'
            ];
            
            const emojiFaceEl = loadingMsg.querySelector('.emoji-face');
            const progressFillEl = loadingMsg.querySelector('.emoji-progress-fill');
            const statusTextEl = loadingMsg.querySelector('.emoji-status-text');

            let streamStarted = false;
            let aiMsgAppended = false;

            const aiMsg = document.createElement('div');
            aiMsg.className = 'ai-message ai-system';
            aiMsg.style.opacity = '0'; // Keep hidden initially
            aiMsg.style.transition = 'opacity 0.3s ease';

            const progressInterval = setInterval(() => {
                if (streamStarted) {
                    // Zoom to 100% when stream starts/progresses
                    progress += (100 - progress) * 0.25;
                    if (progress >= 99) {
                        progress = 100;
                    }
                } else {
                    // Regular progress increment, slowing down near 90%
                    if (progress < 90) {
                        progress += 1.5;
                    } else {
                        progress += (95 - progress) * 0.05;
                    }
                }

                // Update emoji face
                const emojiIdx = Math.min(Math.floor((progress / 100) * emojis.length), emojis.length - 1);
                emojiFaceEl.textContent = emojis[emojiIdx];
                
                // Micro-bounce transition when emoji morphs
                const prevEmoji = emojiFaceEl.getAttribute('data-emoji');
                if (prevEmoji !== emojis[emojiIdx]) {
                    emojiFaceEl.setAttribute('data-emoji', emojis[emojiIdx]);
                    emojiFaceEl.style.transform = 'scale(1.2) translateY(-2px)';
                    setTimeout(() => {
                        emojiFaceEl.style.transform = 'none';
                    }, 150);
                }

                // Update progress bar width
                progressFillEl.style.width = `${progress}%`;

                // Update status text based on progress stage
                const statusIdx = Math.min(Math.floor((progress / 100) * statusTexts.length), statusTexts.length - 1);
                statusTextEl.textContent = statusTexts[statusIdx];

                // When complete, reveal response and remove loader
                if (progress >= 100) {
                    clearInterval(progressInterval);
                    
                    // Fade out loader
                    loadingMsg.style.opacity = '0';
                    loadingMsg.style.transform = 'scale(0.95)';
                    
                    setTimeout(() => {
                        loadingMsg.remove();
                        
                        // Append & reveal the AI response
                        if (!aiMsgAppended) {
                            chatBox.appendChild(aiMsg);
                            aiMsgAppended = true;
                        }
                        aiMsg.style.opacity = '1';
                        chatBox.scrollTop = chatBox.scrollHeight;
                    }, 300);
                }
            }, 60);

            try {
                const response = await fetch('/api/ai/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt, context, mode })
                });

                // Streaming: read as Server-Sent Events
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let rawText = '';
                let buffer = '';

                while (true) {
                    const { value, done: readerDone } = await reader.read();
                    if (readerDone) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop(); // keep incomplete line

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const parsed = JSON.parse(line.slice(6));
                                if (parsed.token) {
                                    // First token received! Mark stream as started
                                    streamStarted = true;
                                    
                                    rawText += parsed.token;
                                    aiMsg.innerHTML = rawText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                                    
                                    // If message is already revealed, scroll
                                    if (aiMsgAppended) {
                                        chatBox.scrollTop = chatBox.scrollHeight;
                                    }
                                }
                                if (parsed.done) {
                                    streamStarted = true; // Ensure 100% progress
                                    
                                    // Full response received — now render proper parsed markdown
                                    aiMsg.innerHTML = parseMarkdown(rawText);
                                    
                                    // Automatically stage & apply generated code blocks directly into editor tabs
                                    setTimeout(() => {
                                        const acceptButtons = aiMsg.querySelectorAll('.ai-btn-accept');
                                        acceptButtons.forEach(btn => {
                                            const onclickAttr = btn.getAttribute('onclick');
                                            if (onclickAttr) {
                                                const matches = onclickAttr.match(/acceptAICode\('([^']+)',\s*'([^']*)'\)/);
                                                if (matches) {
                                                    const blockId = matches[1];
                                                    const blockLang = matches[2];
                                                    window.acceptAICode(blockId, blockLang);
                                                }
                                            }
                                        });
                                    }, 100);
                                    
                                    if (aiMsgAppended) {
                                        chatBox.scrollTop = chatBox.scrollHeight;
                                    }
                                }
                                if (parsed.error) {
                                    aiMsg.textContent = "Error: " + parsed.error;
                                    aiMsg.style.color = "#ff6b6b";
                                }
                            } catch (_) {}
                        }
                    }
                }

                chatBox.scrollTop = chatBox.scrollHeight;

            } catch (err) {
                console.error("AI Request Failed", err);
                clearInterval(progressInterval);
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
