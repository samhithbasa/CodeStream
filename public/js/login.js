document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');

    messageDiv.textContent = '';
    messageDiv.className = 'message';

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            const isSecure = window.location.protocol === 'https:';
            Cookies.set('token', data.token, {
                expires: 7,
                path: '/',
                secure: isSecure,
                sameSite: 'lax'
            });

            messageDiv.textContent = data.message;
            messageDiv.classList.add('success');

            // Get the redirect URL from URL parameters or default to editor
            const urlParams = new URLSearchParams(window.location.search);
            const redirectTo = urlParams.get('redirect') || '/editor';

            // Show editor selection popup or redirect directly
            if (redirectTo === '/editor' || redirectTo === '/frontend-editor') {
                // Redirect directly to the specific editor
                setTimeout(() => {
                    window.location.href = redirectTo;
                }, 1000);
            } else {
                // Show editor selection for general login
                setTimeout(() => {
                    showEditorSelectionPopup();
                }, 1000);
            }

        } else {
            messageDiv.textContent = data.error;
            messageDiv.classList.add('error');
        }
    } catch (error) {
        messageDiv.textContent = 'Network error. Please try again.';
        messageDiv.classList.add('error');
        console.error('Login Error:', error);
    }
});

// Update Google OAuth to handle redirects
function handleGoogleAuth(response) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = '';
    messageDiv.className = 'message';

    verifyGoogleToken(response.credential)
        .then(data => {
            if (data.token) {
                const isSecure = window.location.protocol === 'https:';
                Cookies.set('token', data.token, {
                    expires: 7,
                    path: '/',
                    secure: isSecure,
                    sameSite: 'lax'
                });

                messageDiv.textContent = 'Google login successful!';
                messageDiv.classList.add('success');

                // Get redirect URL
                const urlParams = new URLSearchParams(window.location.search);
                const redirectTo = urlParams.get('redirect');

                if (redirectTo) {
                    // Redirect directly to the requested page
                    setTimeout(() => {
                        window.location.href = redirectTo;
                    }, 1000);
                } else {
                    // Show editor selection
                    setTimeout(() => {
                        showEditorSelectionPopup();
                    }, 1000);
                }
            } else {
                messageDiv.textContent = data.error || 'Google login failed';
                messageDiv.classList.add('error');
            }
        })
        .catch(error => {
            messageDiv.textContent = 'Google login error. Please try again.';
            messageDiv.classList.add('error');
            console.error('Google Auth Error:', error);
        });
}

// Update the editor selection popup to handle redirects
function showEditorSelectionPopup() {
    // Get the original redirect parameter if it exists
    const urlParams = new URLSearchParams(window.location.search);
    const originalRedirect = urlParams.get('redirect');

    // Create popup overlay
    const popupOverlay = document.createElement('div');
    popupOverlay.className = 'editor-selection-overlay';
    popupOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        backdrop-filter: blur(10px);
        animation: fadeIn 0.3s ease-out;
    `;

    // Create popup content
    const popupContent = document.createElement('div');
    popupContent.className = 'editor-selection-popup';
    popupContent.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 40px;
        border-radius: 20px;
        text-align: center;
        color: white;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(20px);
        animation: slideUp 0.4s ease-out;
    `;

    popupContent.innerHTML = `
        <h2 style="margin-bottom: 10px; font-size: 2rem; font-weight: 700;">🎉 Welcome Back!</h2>
        <p style="margin-bottom: 30px; opacity: 0.9; font-size: 1.1rem;">Choose your coding environment</p>
        
        <div class="editor-options" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
            <div class="editor-option" style="background: rgba(255, 255, 255, 0.1); padding: 25px; border-radius: 15px; cursor: pointer; transition: all 0.3s ease; border: 2px solid transparent;">
                <div style="font-size: 3rem; margin-bottom: 15px;">💻</div>
                <h3 style="margin-bottom: 10px; font-size: 1.3rem;">Code Editor</h3>
                <p style="font-size: 0.9rem; opacity: 0.8; line-height: 1.4;">Write, compile and run code in multiple programming languages</p>
            </div>
            
            <div class="editor-option" style="background: rgba(255, 255, 255, 0.1); padding: 25px; border-radius: 15px; cursor: pointer; transition: all 0.3s ease; border: 2px solid transparent;">
                <div style="font-size: 3rem; margin-bottom: 15px;">🚀</div>
                <h3 style="margin-bottom: 10px; font-size: 1.3rem;">Frontend Playground</h3>
                <p style="font-size: 0.9rem; opacity: 0.8; line-height: 1.4;">Build HTML, CSS, JS projects with live preview and deployment</p>
            </div>
        </div>
        
        <button class="close-btn" style="background: rgba(255, 255, 255, 0.2); color: white; border: 1px solid rgba(255, 255, 255, 0.3); padding: 12px 30px; border-radius: 25px; cursor: pointer; font-size: 1rem; transition: all 0.3s ease;">Maybe Later</button>
    `;

    // Add styles for animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideUp {
            from { 
                opacity: 0;
                transform: translateY(30px) scale(0.9);
            }
            to { 
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        .editor-option:hover {
            transform: translateY(-5px);
            background: rgba(255, 255, 255, 0.15) !important;
            border-color: rgba(255, 255, 255, 0.4) !important;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
        
        .close-btn:hover {
            background: rgba(255, 255, 255, 0.3) !important;
            transform: translateY(-2px);
        }
    `;
    document.head.appendChild(style);

    // Add event listeners
    const codeEditorOption = popupContent.querySelector('.editor-options .editor-option:nth-child(1)');
    const frontendEditorOption = popupContent.querySelector('.editor-options .editor-option:nth-child(2)');
    const closeBtn = popupContent.querySelector('.close-btn');

    codeEditorOption.addEventListener('click', () => {
        popupOverlay.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(popupOverlay);
            // Redirect to code editor
            window.location.href = '/editor';
        }, 300);
    });

    frontendEditorOption.addEventListener('click', () => {
        popupOverlay.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(popupOverlay);
            // Redirect to frontend editor
            window.location.href = '/frontend-editor';
        }, 300);
    });

    closeBtn.addEventListener('click', () => {
        popupOverlay.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(popupOverlay);
            // If there was an original redirect, go there, otherwise to landing
            window.location.href = originalRedirect || '/landing.html';
        }, 300);
    });

    // Add fadeOut animation
    const fadeOutStyle = document.createElement('style');
    fadeOutStyle.textContent = `
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(fadeOutStyle);

    // Append to body
    popupOverlay.appendChild(popupContent);
    document.body.appendChild(popupOverlay);

    // Add escape key listener
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(popupOverlay);
            document.removeEventListener('keydown', handleEscape);
            window.location.href = originalRedirect || '/landing.html';
        }
    };
    document.addEventListener('keydown', handleEscape);
}

// Update Google OAuth to also show the popup
function handleGoogleAuth(response) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = '';
    messageDiv.className = 'message';

    verifyGoogleToken(response.credential)
        .then(data => {
            if (data.token) {
                const isSecure = window.location.protocol === 'https:';
                Cookies.set('token', data.token, {
                    expires: 7,
                    path: '/',
                    secure: isSecure,
                    sameSite: 'lax'
                });

                messageDiv.textContent = 'Google login successful!';
                messageDiv.classList.add('success');

                const urlParams = new URLSearchParams(window.location.search);
                const redirectTo = urlParams.get('redirect');
                if (redirectTo) {
                    setTimeout(() => { window.location.href = redirectTo; }, 1000);
                } else {
                    setTimeout(() => { showEditorSelectionPopup(); }, 1000);
                }
            } else {
                messageDiv.textContent = data.error || 'Google login failed';
                messageDiv.classList.add('error');
            }
        })
        .catch(error => {
            messageDiv.textContent = 'Google login error. Please try again.';
            messageDiv.classList.add('error');
            console.error('Google Auth Error:', error);
        });
}

// Rest of your existing functions remain the same...
async function verifyGoogleToken(googleToken) {
    try {
        const response = await fetch('/google-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: googleToken })
        });

        return await response.json();
    } catch (error) {
        console.error('Error verifying Google token:', error);
        throw error;
    }
}

document.getElementById('forgotPassword').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const messageDiv = document.getElementById('message');

    if (!email) {
        messageDiv.textContent = 'Please enter your email first';
        messageDiv.classList.add('error');
        return;
    }

    try {
        const response = await fetch('/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            messageDiv.textContent = data.message;
            messageDiv.classList.add('success');

            // Removed automatic reset form display - user should use email link
        } else {
            messageDiv.textContent = data.error;
            messageDiv.classList.add('error');
        }
    } catch (error) {
        messageDiv.textContent = 'Error processing your request';
        messageDiv.classList.add('error');
        console.error('Forgot Password Error:', error);
    }
});

function showResetForm(email, token) {
    const loginContainer = document.querySelector('.login-container');
    loginContainer.innerHTML = `
        <h2>Reset Password</h2>
        <form id="resetPasswordForm">
            <input type="hidden" id="resetEmail" value="${email}">
            <input type="hidden" id="resetToken" value="${token}">
            <input type="password" id="newPassword" placeholder="New Password" required>
            <input type="password" id="confirmPassword" placeholder="Confirm Password" required>
            <button type="submit">Reset Password</button>
        </form>
        <div id="resetMessage" class="message"></div>
    `;

    document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const email = document.getElementById('resetEmail').value;
        const token = document.getElementById('resetToken').value;
        const messageDiv = document.getElementById('resetMessage');

        messageDiv.textContent = '';
        messageDiv.className = 'message';

        if (newPassword !== confirmPassword) {
            messageDiv.textContent = 'Passwords do not match';
            messageDiv.classList.add('error');
            return;
        }

        try {
            const response = await fetch('/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token, newPassword })
            });

            const data = await response.json();

            if (response.ok) {
                messageDiv.textContent = data.message;
                messageDiv.classList.add('success');
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                messageDiv.textContent = data.error;
                messageDiv.classList.add('error');
            }
        } catch (error) {
            messageDiv.textContent = 'Error processing your request';
            messageDiv.classList.add('error');
            console.error('Reset Password Error:', error);
        }
    });
}

window.handleGoogleAuth = handleGoogleAuth;

// When landing on login with ?token= (from Google OAuth callback with no redirect), set cookie and show editor choice popup
function applyTokenFromUrlAndShowPopup() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (!token) return;
    const isSecure = window.location.protocol === 'https:';
    Cookies.set('token', token, { expires: 7, path: '/', secure: isSecure, sameSite: 'lax' });
    urlParams.delete('token');
    const newSearch = urlParams.toString();
    window.history.replaceState({}, '', window.location.pathname + (newSearch ? '?' + newSearch : ''));
    showEditorSelectionPopup();
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyTokenFromUrlAndShowPopup);
} else {
    applyTokenFromUrlAndShowPopup();
}