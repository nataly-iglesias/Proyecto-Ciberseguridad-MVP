// Redirige al login si no hay token
if (!localStorage.getItem('token')) {
  window.location.href = '/Pages/login.html';
}

// Mostrar u ocultar el formulario al hacer clic en el botón
document.getElementById("addClient").addEventListener("click", function () {
  const form = document.getElementById("form");
  if (form.style.display === "none") {
    form.style.display = "block";
  } else {
    form.style.display = "none";
  }
});
document.getElementById("cancelBtn").addEventListener("click", function () {
  //cerrar el formulario
  document.getElementById("form").style.display = "none";
  //resetear el formulario
  document.getElementById("formClient").reset();
});

// Mostrar el navbar al cargar la página
document.addEventListener("DOMContentLoaded", function () {
  fetch("/Components/navbar.html")
    .then((response) => {
      if (!response.ok)
        throw new Error("Error al cargar el navbar: " + response.statusText);
      return response.text();
    })
    .then((data) => {
      const safeHTML = DOMPurify.sanitize(data);
      document.getElementById("navbar-container").innerHTML = safeHTML;

      // Verificar el rol del usuario
      const token = localStorage.getItem("token");
      const payload = token ? parseJwt(token) : null;
      const rol = payload ? payload.rol : null;

      // Ocultar el enlace de registro si no es administrador
      if (rol !== "administrador") {
        const navRegistro = document.getElementById("nav-registro");
        if (navRegistro) {
          navRegistro.style.display = "none"; // Ocultar el enlace de registro si no es administrador
        }
      }
      // Cerrar sesión
      document.addEventListener("click", function (e) {
        if (e.target && e.target.id === "logoutBtn") {
          e.preventDefault();
          localStorage.removeItem("token");
          window.location.href = "/Pages/login.html";
        }
      });
    })
    .catch((error) => {
      console.error("Error cargando navbar:", error);
    });
});

// Token para obtener rol
function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

const token = localStorage.getItem("token");
const payload = token ? parseJwt(token) : null;
const rol = payload ? payload.rol : null;

// Oculta el botón y formulario si no es administrador
if (rol !== "administrador") {
  document.getElementById("addClient").style.display = "none";
  document.getElementById("formClient").style.display = "none";
}

// Variables para detectar modo edición
let modoEdicion = false;
let idClientesEditar = null;

// Evento del formulario (Agregar o Editar)
document
  .getElementById("formClient")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    document.getElementById("formTitle").textContent = "Registrar cliente";
    const nombre = document.getElementById("nombre").value;
    const direccion = document.getElementById("direccion").value;
    const telefono = document.getElementById("telefono").value;
    const correo = document.getElementById("correo").value;
    const datos = { nombre, direccion, telefono, correo };

    const url = modoEdicion
      ? `http://localhost:3000/api/clientes/${idClienteEditar}`
      : "http://localhost:3000/api/clientes";
    const method = modoEdicion ? "PUT" : "POST";

    fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(datos),
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.mensaje);
        location.reload();
      })
      .catch((err) => {
        console.error("Error al guardar cliente:", err);
        alert("Error al guardar cliente");
      });
  });

// Mostrar clientes
fetch("http://localhost:3000/api/clientes", {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer " + localStorage.getItem("token"),
  },
})
  .then((res) => res.json())
  .then((data) => {
    const clientesContainer = document.getElementById("clientList");

    data.forEach((cliente) => {
      const clienteItem = document.createElement("div");
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

    // Ocultar botón de editar si no es admin
    if (rol !== "administrador") {
      document
        .querySelectorAll(".editButton")
        .forEach((button) => (button.style.display = "none"));
    }

    // Asignar eventos a los botones de editar
    document.querySelectorAll(".editButton").forEach((button) => {
      button.addEventListener("click", function () {
        const id = this.getAttribute("data-id");
        const cliente = data.find((p) => p.id == id);

        document.getElementById("nombre").value = cliente.nombre;
        document.getElementById("direccion").value = cliente.direccion;
        document.getElementById("telefono").value = cliente.telefono;
        document.getElementById("correo").value = cliente.correo;

        // Mostrar formulario si está oculto
        document.getElementById("form").style.display = "block";

        //Cambiar titulo del formulario
        document.getElementById("formTitle").textContent = "Editar cliente";

        // Cambiar modo a edición
        modoEdicion = true;
        idClienteEditar = id;

        // Botones de actualizar y cancelar
        document.getElementById("addBtn").textContent = "Actualizar";
        document.getElementById("cancelBtn").style.display = "inline-block";

        //boton de cancelar
        document
          .getElementById("cancelBtn")
          .addEventListener("click", function () {
            modoEdicion = false;
            idClienteEditar = null;
            document.getElementById("formTitle").textContent =
              "Registrar cliente";
            document.getElementById("form").style.display = "none";
            document.getElementById("addBtn").textContent = "Agregar";
            document.getElementById("formClient").reset();
          });
      });
    });

    // Botones eliminar
    document.querySelectorAll(".deleteButton").forEach((button) => {
      if (rol !== "administrador") {
        button.style.display = "none";
      } else {
        button.addEventListener("click", function () {
          const id = this.getAttribute("data-id");
          fetch(`http://localhost:3000/api/clientes/${id}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + localStorage.getItem("token"),
            },
          })
            .then((res) => res.json())
            .then((data) => {
              alert(data.mensaje);
              location.reload();
            })
            .catch((err) => {
              console.error("Error al eliminar producto:", err);
              alert("Error al eliminar cliente");
            });
        });
      }
    });
  })
  .catch((err) => console.error("Error al cargar productos:", err));
