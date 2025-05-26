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

const token = localStorage.getItem('token');
const payload = token ? parseJwt(token) : null;
const rol = payload ? payload.rol : null;

// Verificar el rol del usuario
if (rol !== 'administrador') {
    alert('No tienes permiso para acceder a esta página.');
    window.location.href = 'home.html'; 
}

// Mostrar el formulario de registro al cargar la página
document.getElementById('registroForm').addEventListener('submit', function(event) {
    event.preventDefault(); 

    const nombre = document.getElementById('nombre').value;
    const usuario = document.getElementById('usuario').value;
    const contrasena = document.getElementById('contrasena').value;
    const rol = document.getElementById('rol').value;

    const datos = { nombre, usuario, contrasena, rol };

    fetch('http://localhost:3000/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    })
    .then(res => res.json())
    .then(data => {
        alert(data.mensaje);
    //volver a la pagina principal una vez registrado
    window.location.href = "http://localhost:3000/Components/home.html";
    })
    .catch(err => {
        console.error('Error al registrar:', err);
        alert('Error al registrar el usuario.');
    });
});