document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const otpSection = document.getElementById('otpSection');
    const otpInput = document.getElementById('otp');
    const getOtpBtn = document.getElementById('getOtp');
    const verifyOtpBtn = document.getElementById('verifyOtp');
    const messageDiv = document.getElementById('message');
    const otpTimer = document.getElementById('otpTimer');
    const resendOtp = document.getElementById('resendOtp');

    let email = '';
    let password = '';
    let otpCountdown = null;

    const setLoading = (element, isLoading, originalText) => {
        element.disabled = isLoading;
        element.innerHTML = isLoading ?
            '<span class="spinner"></span> Processing...' :
            originalText;
    };


    const startOtpTimer = (duration = 300) => {
        let timeLeft = duration;

        otpCountdown = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;

            otpTimer.textContent = `OTP expires in ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

            if (timeLeft <= 0) {
                clearInterval(otpCountdown);
                otpTimer.textContent = 'OTP expired';
                otpTimer.style.color = 'red';
                resendOtp.style.display = 'block';
            }

            timeLeft--;
        }, 1000);
    };


    const resetOtpTimer = () => {
        clearInterval(otpCountdown);
        otpTimer.style.color = '#666';
        resendOtp.style.display = 'none';
    };

    // Add this at the beginning of your getOtpBtn click handler
    getOtpBtn.addEventListener('click', async (e) => {
        e.preventDefault(); // Prevent default form submission behavior

        email = emailInput.value.trim();
        const emailPassword = document.getElementById('emailPassword').value.trim(); // Get emailPassword
        const loginPassword = document.getElementById('loginPassword').value.trim(); // Get loginPassword

        if (!email || !emailPassword || !loginPassword) {
            showMessage('All fields are required', 'error');
            return;
        }

        if (loginPassword.length < 8) {
            showMessage('Login password must be at least 8 characters', 'error');
            return;
        }

        console.log('Sending OTP request for email:', email);

        try {
            setLoading(getOtpBtn, true, 'Get OTP');

            const response = await fetch('/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            console.log('OTP response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to send OTP');
            }

            showMessage('OTP sent to your email', 'success');
            otpSection.style.display = 'block';
            getOtpBtn.style.display = 'none';
            startOtpTimer();
        } catch (error) {
            showMessage(error.message, 'error');
            console.error('Error:', error);
        } finally {
            setLoading(getOtpBtn, false, 'Get OTP');
        }
    });


    resendOtp.addEventListener('click', async () => {
        try {
            resendOtp.textContent = 'Resending...';
            const response = await fetch('/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                showMessage('New OTP sent to your email', 'success');
                resetOtpTimer();
                startOtpTimer();
                resendOtp.style.display = 'none';
            } else {
                const data = await response.json();
                showMessage(data.error || 'Failed to resend OTP', 'error');
            }
        } catch (error) {
            showMessage('Error resending OTP', 'error');
            console.error('Error resending OTP:', error);
        } finally {
            resendOtp.textContent = 'Resend OTP';
        }
    });

    verifyOtpBtn.addEventListener('click', async () => {
        const otp = otpInput.value.trim();
        const emailPassword = document.getElementById('emailPassword').value.trim();
        const loginPassword = document.getElementById('loginPassword').value.trim();

        if (!otp || !emailPassword || !loginPassword) {
            showMessage('All fields are required', 'error');
            return;
        }

        if (loginPassword.length < 8) {
            showMessage('Login password must be at least 8 characters', 'error');
            return;
        }

        try {
            verifyOtpBtn.disabled = true;
            verifyOtpBtn.textContent = 'Verifying...';

            const response = await fetch('/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    otp,
                    emailPassword,
                    loginPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('Registration successful! Redirecting to login...', 'success');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
            } else {
                showMessage(data.error || 'OTP verification failed', 'error');
            }
        } catch (error) {
            showMessage('Error verifying OTP', 'error');
            console.error('Error verifying OTP:', error);
        } finally {
            verifyOtpBtn.disabled = false;
            verifyOtpBtn.textContent = 'Verify OTP';
        }
    });

    function showMessage(message, type) {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';

        if (type === 'success') {
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        }
    }
});