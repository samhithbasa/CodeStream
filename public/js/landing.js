document.addEventListener("DOMContentLoaded", async () => {
    let icon = document.getElementById("icon");
    let gitIcon = document.getElementById("git")?.querySelector("img");

    if (icon) {
        icon.onclick = function() {
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

   
    await updateAuthUI();
});

async function updateAuthUI() {
    const authItem = document.getElementById('auth-item');
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
              
                authItem.innerHTML = `
                    <button id="logout-btn" class="logout-btn">
                        Logout
                    </button>
                `;
                
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
        
       
        Cookies.remove('token', { path: '/' });
    }
    
   
    authItem.innerHTML = `
        <a href="/login.html">Login/Sign Up</a>
    `;
}