document.addEventListener("DOMContentLoaded", async () => {
    let icon = document.getElementById("icon");
    let gitIcon = document.getElementById("git")?.querySelector("img");

    if (icon) {
        icon.onclick = function () {
            document.body.classList.toggle("dark-theme");

            if (document.body.classList.contains("dark-theme")) {
                icon.src = "images/sun.webp";
                if (gitIcon) gitIcon.src = "images/image.png";
                localStorage.setItem('theme', 'dark');
            } else {
                icon.src = "images/moon.png";
                if (gitIcon) gitIcon.src = "images/git.png";
                localStorage.setItem('theme', 'light');
            }
        };


        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add("dark-theme");
            icon.src = "images/sun.webp";
            if (gitIcon) gitIcon.src = "images/image.png";
        }
    }


    // 3D Card Tilt Animation
    const card = document.getElementById("tilt-card");
    const container = document.querySelector(".main");

    if (card && container) {
        container.addEventListener("mousemove", (e) => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left - (rect.width / 2);
            const y = e.clientY - rect.top - (rect.height / 2);

            // Cap rotation angle at 12 degrees for realistic depth
            const rotX = -(y / (rect.height / 2)) * 12;
            const rotY = (x / (rect.width / 2)) * 12;

            card.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(10px)`;
        });

        container.addEventListener("mouseleave", () => {
            // Smooth snap back
            card.style.transition = "transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)";
            card.style.transform = "rotateX(0deg) rotateY(0deg) translateZ(0)";
        });

        container.addEventListener("mouseenter", () => {
            // Remove transitions during active tracking for instant feedback
            card.style.transition = "none";
        });
    }

    await updateAuthUI();
});

async function updateAuthUI() {
    const authItem = document.getElementById('auth-item');
    const profileItem = document.getElementById('profile-item');
    const adminItem = document.getElementById('admin-item');

    if (!authItem) return;

    const token = Cookies.get('token');

    if (token) {
        try {
            const response = await fetch('/verify-token', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();

                // Show logout button
                authItem.innerHTML = `
                    <button id="logout-btn" class="logout-btn">
                        Logout
                    </button>
                `;

                // Show profile icon for all logged-in users
                if (profileItem) {
                    const profileLink = profileItem.querySelector('a');
                    const profileImg = profileLink.querySelector('img');

                    if (data.user && data.user.picture) {
                        profileImg.src = data.user.picture;
                    } else {
                        profileImg.src = 'images/user-icon.png';
                    }

                    // Apply modern styling
                    profileImg.style.cssText = `
                        width: 35px;
                        height: 35px;
                        border-radius: 50%;
                        cursor: pointer;
                        border: 2px solid white;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                        object-fit: cover;
                        transition: transform 0.3s ease;
                    `;

                    profileImg.onmouseover = () => profileImg.style.transform = 'scale(1.1)';
                    profileImg.onmouseout = () => profileImg.style.transform = 'scale(1)';

                    profileItem.style.display = 'block';
                }

                // Show admin button only for admin users
                if (adminItem && data.user && data.user.isAdmin) {
                    adminItem.style.display = 'block';
                }

                document.getElementById('logout-btn').addEventListener('click', async () => {
                    try {
                        await fetch('/logout', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        Cookies.remove('token', { path: '/' });
                        window.location.href = '/landing.html';
                    } catch (error) {
                        console.error('Logout failed:', error);
                    }
                });
                return;
            }
        } catch (error) {
            console.error('Token verification failed:', error);
        }

        // Invalid token - remove it
        Cookies.remove('token', { path: '/' });
    }

    // Not logged in - show login link and hide profile/admin
    authItem.innerHTML = `
        <a href="/login.html">Login/Sign Up</a>
    `;

    if (profileItem) {
        profileItem.style.display = 'none';
    }

    if (adminItem) {
        adminItem.style.display = 'none';
    }
}