document.addEventListener('DOMContentLoaded', () => {
    const resetForm = document.getElementById('resetPasswordForm');
    const messageDiv = document.getElementById('message');

    // Extract token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        showMessage('Invalid or missing reset token. Please request a new link.', 'error');
        resetForm.style.display = 'none';
        return;
    }

    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            showMessage('Passwords do not match!', 'error');
            return;
        }

        try {
            // We need the email associated with the token to call the backend /reset-password
            // However, the backend expects { email, token, newPassword }
            // Let's decode the token to get the email if possible, or just send the token.
            // Wait, looking at Api.js lines 972-985, the backend expects 'email' in the body.
            // Let's decode the JWT to get the email.

            const payload = JSON.parse(atob(token.split('.')[1]));
            const email = payload.email;

            if (!email) {
                showMessage('Malformed token. Please request a new link.', 'error');
                return;
            }

            const response = await fetch('/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token, newPassword })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('Password updated successfully! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = '/reset-success.html';
                }, 2000);
            } else {
                showMessage(data.error || 'Failed to reset password.', 'error');
            }
        } catch (error) {
            console.error('Reset password error:', error);
            showMessage('Network error. Please try again.', 'error');
        }
    });

    function showMessage(msg, type) {
        messageDiv.textContent = msg;
        messageDiv.className = 'message ' + type;
        messageDiv.style.display = 'block';
    }
});
