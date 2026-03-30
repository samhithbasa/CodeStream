// 🔔 Toast Notification System
(function () {
    // Create container
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

    window.showToast = function (message, type = 'info', duration = 3500) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
            <span class="toast-msg">${message}</span>
        `;

        toast.addEventListener('click', () => dismissToast(toast));
        container.appendChild(toast);

        setTimeout(() => dismissToast(toast), duration);
    };

    function dismissToast(toast) {
        if (!toast.parentNode) return;
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 400);
    }
})();
