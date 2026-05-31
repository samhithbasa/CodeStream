document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return; // Guard: only run on pages with the register form

    const emailInput = document.getElementById('registerEmail');
    const otpSection = document.getElementById('otpSection');
    const getOtpBtn = document.getElementById('getOtp');
    const verifyOtpBtn = document.getElementById('verifyOtp');
    const messageDiv = document.getElementById('registerMessage');
    const otpTimer = document.getElementById('otpTimer');
    const resendOtp = document.getElementById('resendOtp');
    const otpDigits = document.querySelectorAll('.otp-digit');
    const hiddenOtpInput = document.getElementById('otp');
    const otpSuccessBadge = document.getElementById('otpSuccessBadge');

    let email = '';
    let otpCountdown = null;

    // ── Loading state helper ───────────────────────────────────────
    const setLoading = (element, isLoading, originalText) => {
        if (!element) return;
        element.disabled = isLoading;
        element.innerHTML = isLoading
            ? '<span class="spinner"></span> Processing...'
            : originalText;
    };

    // ── OTP countdown timer ────────────────────────────────────────
    const startOtpTimer = (duration = 300) => {
        let timeLeft = duration;
        if (otpTimer) otpTimer.style.color = '#aaa';
        if (resendOtp) resendOtp.style.display = 'none';

        otpCountdown = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            if (otpTimer) {
                otpTimer.textContent = `OTP expires in ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            }
            if (timeLeft <= 0) {
                clearInterval(otpCountdown);
                if (otpTimer) {
                    otpTimer.textContent = 'OTP expired';
                    otpTimer.style.color = '#ff6b6b';
                }
                if (resendOtp) resendOtp.style.display = 'block';
            }
            timeLeft--;
        }, 1000);
    };

    const resetOtpTimer = () => {
        clearInterval(otpCountdown);
        if (otpTimer) otpTimer.style.color = '#aaa';
        if (resendOtp) resendOtp.style.display = 'none';
    };

    // ── Validation ─────────────────────────────────────────────────
    const isValidEmail = (value) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);

    // ── Prevent default form submission ────────────────────────────
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
    });

    // ── OTP digit auto-focus logic ─────────────────────────────────
    otpDigits.forEach((digit, index) => {
        // Only allow numeric input
        digit.addEventListener('input', (e) => {
            const value = e.target.value;
            // Allow only single digit
            if (!/^\d$/.test(value)) {
                e.target.value = '';
                return;
            }
            // Move to next input
            if (value && index < otpDigits.length - 1) {
                otpDigits[index + 1].focus();
            }
            // Sync hidden OTP field
            syncOtpValue();
        });

        // Handle backspace
        digit.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace') {
                if (!digit.value && index > 0) {
                    otpDigits[index - 1].focus();
                    otpDigits[index - 1].value = '';
                    syncOtpValue();
                }
            }
        });

        // Handle paste (e.g. user pastes full 6-digit code)
        digit.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasteData = (e.clipboardData || window.clipboardData).getData('text').trim();
            if (/^\d{6}$/.test(pasteData)) {
                otpDigits.forEach((d, i) => {
                    d.value = pasteData[i];
                });
                otpDigits[otpDigits.length - 1].focus();
                syncOtpValue();
            }
        });
    });

    function syncOtpValue() {
        if (hiddenOtpInput) {
            hiddenOtpInput.value = Array.from(otpDigits).map(d => d.value).join('');
        }
    }

    // ── Message display helper ─────────────────────────────────────
    function showMessage(message, type) {
        if (!messageDiv) return;
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';

        if (type === 'success') {
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        }
    }

    // ── Get OTP ────────────────────────────────────────────────────
    if (getOtpBtn) {
        getOtpBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            email = emailInput ? emailInput.value.trim() : '';
            const loginPassword = document.getElementById('registerLoginPassword');
            const lpValue = loginPassword ? loginPassword.value.trim() : '';

            if (!email) {
                showMessage('Email is required', 'error');
                return;
            }

            if (!isValidEmail(email)) {
                showMessage('Please enter a valid email (e.g. name@gmail.com)', 'error');
                return;
            }

            if (lpValue.length < 8) {
                showMessage('Login password must be at least 8 characters', 'error');
                return;
            }

            try {
                setLoading(getOtpBtn, true, 'Get OTP');

                const response = await fetch('/send-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to send OTP');
                }

                showMessage('OTP sent to your email', 'success');
                if (otpSection) otpSection.style.display = 'block';
                getOtpBtn.style.display = 'none';
                startOtpTimer();

                // Focus the first OTP digit
                if (otpDigits.length > 0) {
                    setTimeout(() => otpDigits[0].focus(), 300);
                }
            } catch (error) {
                showMessage(error.message, 'error');
                console.error('Error:', error);
            } finally {
                setLoading(getOtpBtn, false, 'Get OTP');
            }
        });
    }

    // ── Resend OTP ─────────────────────────────────────────────────
    if (resendOtp) {
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

                    // Clear old digits and refocus
                    otpDigits.forEach(d => { d.value = ''; });
                    syncOtpValue();
                    if (otpDigits.length > 0) otpDigits[0].focus();
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
    }

    // ── Verify OTP (with collapsing + checkmark animation) ────────
    if (verifyOtpBtn) {
        verifyOtpBtn.addEventListener('click', async () => {
            syncOtpValue();
            const otp = hiddenOtpInput ? hiddenOtpInput.value.trim() : '';
            const emailPassword = document.getElementById('registerEmailPassword');
            const loginPassword = document.getElementById('registerLoginPassword');

            const epValue = emailPassword ? emailPassword.value.trim() : '';
            const lpValue = loginPassword ? loginPassword.value.trim() : '';

            if (!otp || otp.length !== 6) {
                showMessage('Please enter the complete 6-digit OTP', 'error');
                return;
            }

            if (!epValue || !lpValue) {
                showMessage('All fields are required', 'error');
                return;
            }

            if (lpValue.length < 8) {
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
                        emailPassword: epValue,
                        loginPassword: lpValue
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    // ── Success: trigger collapsing + checkmark ─────
                    clearInterval(otpCountdown);
                    if (otpTimer) otpTimer.style.display = 'none';
                    if (resendOtp) resendOtp.style.display = 'none';
                    verifyOtpBtn.style.display = 'none';

                    // Collapse OTP digits
                    otpDigits.forEach((d) => {
                        d.classList.add('collapsed');
                    });

                    // Show checkmark badge after digits collapse
                    setTimeout(() => {
                        if (otpSuccessBadge) {
                            otpSuccessBadge.style.display = 'flex';
                        }
                    }, 500);

                    showMessage('Registration successful! Redirecting to login...', 'success');

                    // Flip back to the Login side after animation completes
                    setTimeout(() => {
                        const authCard = document.getElementById('authCard');
                        if (authCard) {
                            authCard.classList.remove('flipped');
                        }
                    }, 2500);
                } else {
                    showMessage(data.error || 'OTP verification failed', 'error');

                    // Shake the OTP digits on failure
                    const otpInputsEl = document.getElementById('otpInputs');
                    if (otpInputsEl) {
                        otpInputsEl.style.animation = 'shake 0.4s ease';
                        setTimeout(() => { otpInputsEl.style.animation = ''; }, 400);
                    }
                }
            } catch (error) {
                showMessage('Error verifying OTP', 'error');
                console.error('Error verifying OTP:', error);
            } finally {
                verifyOtpBtn.disabled = false;
                verifyOtpBtn.textContent = 'Verify OTP';
            }
        });
    }
});