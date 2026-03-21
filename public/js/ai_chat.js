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

    // Function to parse naive markdown manually to HTML
    function parseMarkdown(md) {
        let html = md.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\n\n/g, '<br><br>');
        return html;
    }

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
