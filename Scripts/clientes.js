// Mostrar u ocultar el formulario al hacer clic en el botón
document.getElementById('addClient').addEventListener('click', function() {
    const form = document.getElementById('form');
    if (form.style.display === 'none') {
        form.style.display = 'block';
    } else {
        form.style.display = 'none';
    }
});

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
    })
    .catch(error => {
        console.error("Error cargando navbar:", error);
    });
});

// Token para obtener rol
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

// Oculta el botón y formulario si no es administrador
    if (rol !== 'administrador') {
        document.getElementById('addClient').style.display = 'none';
        document.getElementById('formClient').style.display = 'none';
    }

// Mostrar navbar
document.addEventListener("DOMContentLoaded", function () {
    fetch("/Components/navbar.html")
        .then(response => {
            if (!response.ok) throw new Error('Error al cargar el navbar: ' + response.statusText);
            return response.text();
        })
        .then(data => {
            const safeHTML = DOMPurify.sanitize(data);
            document.getElementById("navbar-container").innerHTML = safeHTML;
        })
        .catch(error => console.error("Error cargando navbar:", error));
});

// Variables para detectar modo edición
let modoEdicion = false;
let idProductoEditar = null;

// Evento del formulario (Agregar o Editar)
document.getElementById('formClient').addEventListener('submit', function (event) {
    event.preventDefault();
    const nombre = document.getElementById('nombre').value;
    const direccion = document.getElementById('direccion').value;
    const telefono = document.getElementById('telefono').value;
    const correo = document.getElementById('correo').value;
    const datos = { nombre, direccion, telefono, correo };

    const url = modoEdicion
        ? `http://localhost:3000/api/clientes/${idClienteEditar}`
        : 'http://localhost:3000/api/clientes';
    const method = modoEdicion ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datos)
    })
     .then(res => res.json())
    .then(data => {
        alert(data.mensaje);
        location.reload();
    })
    .catch(err => {
         console.error('Error al guardar cliente:', err);
        alert('Error al guardar cliente');
    });
});

// Mostrar clientes
fetch('http://localhost:3000/api/clientes', {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
})
.then(res => res.json())
.then(data => {
    const clientesContainer = document.getElementById('clientList');

    data.forEach(cliente => {
        const clienteItem = document.createElement('div');
            const safeHTML = DOMPurify.sanitize(`
            <div class="card mb-3">
                <div class="card-body">
                    <h5 class="card-title">Cliente: ${cliente.nombre}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">Dirección: ${cliente.direccion}</h6>
                    <h6 class="card-subtitle mb-2 text-muted">Teléfono: ${cliente.telefono}</h6>
                    <h6 class="card-subtitle mb-2 text-muted">Correo: ${cliente.correo}</h6>
                    <div style="display: flex; justify-content: flex-end;">
                    <button class="btn btn-outline-secondary deleteButton" data-id="${cliente.id}">Eliminar</button>
                    <button class="btn btn-primary editButton" style="margin-left:10px" data-id="${cliente.id}">Editar</button>
                </div>
            </div>
        </div>
        `);
        clienteItem.innerHTML = safeHTML;
        clientesContainer.appendChild(clienteItem);
    });

    // Ocultar botón de editar si no es admin o encargado
    if (rol !== 'administrador' && rol !== 'encargado') {
        document.querySelectorAll('.editButton').forEach(button => button.style.display = 'none');
    }

    // Asignar eventos a los botones de editar
    document.querySelectorAll('.editButton').forEach(button => {
        button.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            const cliente = data.find(p => p.id == id);

            document.getElementById('nombre').value = cliente.nombre;
            document.getElementById('direccion').value = cliente.direccion;
            document.getElementById('telefono').value = cliente.telefono;
            document.getElementById('correo').value = cliente.correo;

            // Mostrar formulario si está oculto
            document.getElementById('form').style.display = 'block';

            // Cambiar modo a edición
            modoEdicion = true;
            idClienteEditar = id;

            // Cambiar texto del botón
            document.getElementById('registerBtn').textContent = 'Actualizar';

            //boton de cancelar
            const cancelButton = document.createElement('button');
            cancelButton.textContent = 'Cancelar';
            cancelButton.className = 'btn btn-secondary';
            cancelButton.style.marginLeft = '10px';
            cancelButton.addEventListener('click', function () {
                modoEdicion = false;
                idClienteEditar = null;
                document.getElementById('form').style.display = 'none';
                document.getElementById('registerBtn').textContent = 'Registrar';
                document.getElementById('formClient').reset();
                cancelButton.remove();
            });
            document.getElementById('formClient').appendChild(cancelButton);
        });
     });
     
     // Botones eliminar
     document.querySelectorAll('.deleteButton').forEach(button => {
        if (rol !== 'administrador') {
            button.style.display = 'none';
        } else {
            button.addEventListener('click', function () {
                const id = this.getAttribute('data-id');
                    fetch(`http://localhost:3000/api/clientes/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + localStorage.getItem('token')
                        }
                    })
                    .then(res => res.json())
                    .then(data => {
                        alert(data.mensaje);
                        location.reload();
                    })
                    .catch(err => {
                        console.error('Error al eliminar producto:', err);
                        alert('Error al eliminar cliente');
                        });
            });
        }
    });
})
.catch(err => console.error('Error al cargar productos:', err));
