document.querySelector('form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const usuario = document.getElementById('username').value;
    const contrasena = document.getElementById('password').value;

    // Validar campos
    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ usuario, contrasena })
        });

        const data = await response.json(); // Parsear la respuesta JSON

        // Verificar si la respuesta es exitosa y contiene un token
        if (response.ok && data.token) {
            localStorage.setItem('token', data.token);
            window.location.href = 'home.html';
        } else {
            alert(data.mensaje || 'Error al iniciar sesión');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('No se pudo conectar con el servidor.');
    }
});

