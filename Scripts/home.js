// Función para decodificar el token JWT
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

// Mostrar el navbar al cargar la página
fetch("/Components/navbar.html")
    .then(response => {
        if (!response.ok) throw new Error('Error al cargar el navbar: ' + response.statusText);
            return response.text();
    })
    .then(data => {
        const safeHTML = DOMPurify.sanitize(data);
        document.getElementById("navbar-container").innerHTML = safeHTML;

        // Verificar el rol del usuario
            const token = localStorage.getItem('token');
            const payload = token ? parseJwt(token) : null;
            const rol = payload ? payload.rol : null;

            // Ocultar el enlace de registro si no es administrador
            if (rol !== 'administrador') {
                const navRegistro = document.getElementById('nav-registro');
                if (navRegistro) {
                    navRegistro.style.display = 'none'; // Ocultar el enlace de registro si no es administrador
                }
            }
    })
    .catch(error => {
        console.error("Error cargando navbar:", error);
    });


