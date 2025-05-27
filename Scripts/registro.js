// Mostrar el navbar al cargar la página
document.addEventListener("DOMContentLoaded", function () {
    fetch("/Components/navbar.html")
        .then(response => {
            if (!response.ok) throw new Error('Error al cargar el navbar: ' + response.statusText);
            return response.text();
        })
        .then(data => {
            const safeHTML = DOMPurify.sanitize(data);
            document.getElementById("navbar-container").innerHTML = safeHTML;

            const token = localStorage.getItem('token');
            const payload = token ? parseJwt(token) : null;
            const rol = payload ? payload.rol : null;

            // Verificar el rol del usuario
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
});

//Desplegar el formulario de registro al dar click en el botón de registro
document.getElementById('registerBtn').addEventListener('click', function() {
    const form = document.getElementById('form');
    document.getElementById('password').setAttribute('required', 'required'); // Asegurar que el campo contraseña sea requerido
    document.getElementById('addBtn').textContent = 'Registrar';
    form.style.display = (form.style.display === 'none') ? 'block' : 'none';
    modoEdicion = false;
    idTrabajadorEditar = null;
    document.getElementById('registerForm').reset();
});

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

// Variables para detectar modo edición
let modoEdicion = false;
let idTrabajadorEditar = null;

// Evento del botón cancelar (solo se asigna una vez)
document.getElementById('cancelBtn').addEventListener('click', function () {
    modoEdicion = false;
    idTrabajadorEditar = null;
    document.getElementById('form').style.display = 'none';
    document.getElementById('addBtn').textContent = 'Registrar';
    document.getElementById('registerForm').reset();
    document.getElementById('password').setAttribute('required', 'required');
});

// Evento del formulario
document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault(); 

    const nombre = document.getElementById('nombre').value;
    const usuario = document.getElementById('usuario').value;
    const contrasena = document.getElementById('password').value;
    const rol = document.getElementById('rol').value;

    let datos = { nombre, usuario, rol };

    // Solo agregar la contraseña si se está creando un nuevo usuario o si se escribe una nueva
    if (contrasena){
        datos.contrasena = contrasena; 
    }

    if (modoEdicion && idTrabajadorEditar) {
        // Actualizar usuario (PUT)
        fetch(`http://localhost:3000/api/usuarios/${idTrabajadorEditar}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify(datos)
        })
        .then(res => {
            if (!res.ok) {
                throw new Error('Error al actualizar el usuario: ' + res.statusText);
            }
            return res.json();
        })
        .then(data => {
            alert(data.mensaje);
            window.location.reload();
        })
        .catch(err => {
            console.error('Error al actualizar:', err);
            alert('Error al actualizar el usuario.');
        });
    } else {
        // Registrar usuario (POST)
        fetch('http://localhost:3000/api/usuarios', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify(datos)
        })
        .then(res => res.json())
        .then(data => {
            alert(data.mensaje);
            window.location.reload();
        })
        .catch(err => {
            console.error('Error al registrar:', err);
            alert('Error al registrar el usuario.');
        });
    }
});

// Mostrar trabajadores
fetch ('http://localhost:3000/api/usuarios', {
    method: 'GET',
    headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
})
.then(res => res.json())
.then(data => {
    const trabajadorContainer = document.getElementById('workerList');
    trabajadorContainer.innerHTML = ''; // Limpiar antes de renderizar

    data.forEach(trabajador => {
        const trabajadorDiv = document.createElement('div');
        const safeHTML = DOMPurify.sanitize(`
            <div class="card mb-3">
                <div class="card-body">
                    <h5 class="card-title">${trabajador.nombre}</h5>
                    <p class="card-text">Usuario: ${trabajador.usuario}</p>
                    <p class="card-text">Rol: ${trabajador.rol}</p>
                    <div style="display: flex; justify-content: flex-end;">
                        <button class="btn btn-outline-secondary deleteButton" data-id="${trabajador.id}">Eliminar</button>
                        <button class="btn btn-primary editButton" style="margin-left:10px" data-id="${trabajador.id}">Editar</button>
                    </div>
                </div>
            </div>
        `);
        trabajadorDiv.innerHTML = safeHTML;
        trabajadorContainer.appendChild(trabajadorDiv);
    });

    // Asignar evento a botones de editar
    document.querySelectorAll('.editButton').forEach(button => {
        button.addEventListener('click', function () {
            const id = Number(this.getAttribute('data-id'));
            const trabajador = data.find(t => t.id === id);

            // Rellenar formulario
            document.getElementById('nombre').value = trabajador.nombre;
            document.getElementById('usuario').value = trabajador.usuario;
            document.getElementById('password').value = ''; // No mostrar la contraseña
            document.getElementById('password').removeAttribute('required'); // No es necesario en edición
            document.getElementById('rol').value = trabajador.rol;

            // Mostrar formulario si está oculto
            document.getElementById('form').style.display = 'block';

            // Cambiar modo a edición
            modoEdicion = true;
            idTrabajadorEditar = id;

            // Cambiar texto del botón
            document.getElementById('addBtn').textContent = 'Actualizar';
            document.getElementById('cancelBtn').style.display = 'inline-block';
        });
    });

    // Botones eliminar
    document.querySelectorAll('.deleteButton').forEach(button => {
        button.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            fetch(`http://localhost:3000/api/usuarios/${id}`, {
                method: 'DELETE',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
            })
            .then(res => {
                if (!res.ok){
                    throw new Error('Error al eliminar el trabajador: ' + res.statusText);
                }
                return res.json();
            })
            .then(data => {
                alert(data.mensaje);
                window.location.reload();
            })
            .catch(err => {
                console.error('Error al eliminar:', err);
                alert('Error al eliminar el trabajador.');
            });
        });
    });
})
.catch(err => {
    alert('Error al cargar la lista de trabajadores.');
});