// Parse JWT para obtener rol
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

// Ocultar el botón y formulario si no tiene permiso
if (rol !== "administrador" && rol !== "encargado") {
  document.getElementById("addProduct").style.display = "none";
  document.getElementById("formProduct").style.display = "none";
}

document.getElementById("addProduct").addEventListener("click", function () {
  const form = document.getElementById("form");
  form.style.display = form.style.display === "none" ? "block" : "none";
});
document.getElementById("cancelBtn").addEventListener("click", function () {
  //cerrar el formulario
  document.getElementById("form").style.display = "none";
  //resetear el formulario
  document.getElementById("formProduct").reset();
});

// Mostrar navbar
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
    })
    .catch((error) => console.error("Error cargando navbar:", error));
});

// Variables para detectar modo edición
let modoEdicion = false;
let idProductoEditar = null;

// Evento del formulario (Agregar o Editar)
document
  .getElementById("formProduct")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const descripcion = document.getElementById("descripcion").value;
    const cantidad = document.getElementById("cantidad").value;
    const precio = document.getElementById("precio").value;
    const datos = { nombre, descripcion, cantidad, precio };

    const url = modoEdicion
      ? `http://localhost:3000/api/productos/${idProductoEditar}`
      : "http://localhost:3000/api/productos";
    const metodo = modoEdicion ? "PUT" : "POST";

    fetch(url, {
      method: metodo,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify(datos),
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.mensaje);
        location.reload();
      })
      .catch((err) => {
        console.error("Error al guardar producto:", err);
        alert("Error al guardar el producto.");
      });
  });

// Mostrar productos
fetch("http://localhost:3000/api/productos", {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer " + localStorage.getItem("token"),
  },
})
  .then((res) => res.json())
  .then((data) => {
    const productosContainer = document.getElementById("productList");

    data.forEach((producto) => {
      const productoDiv = document.createElement("div");
      const safeHTML = DOMPurify.sanitize(`
            <div class="card mb-3">
                <div class="card-body">
                    <h5 class="card-title">Producto: ${producto.nombre}</h5>
                    <h6 class="card-subtitle mb-2 text-body-secondary">Cantidad: ${producto.cantidad}</h6>
                    <h6 class="card-subtitle mb-2 text-body-secondary">Precio: $${producto.precio}</h6>
                    <p class="card-text">Descripción: ${producto.descripcion}</p>
                    <div style="display: flex; justify-content: flex-end;">
                        <button class="btn btn-outline-secondary deleteButton" data-id="${producto.id}">Eliminar</button>
                        <button class="btn btn-primary editButton" style="margin-left:10px" data-id="${producto.id}">Editar</button>
                    </div>
                </div>
            </div>
            
        `);
      productoDiv.innerHTML = safeHTML;
      productosContainer.appendChild(productoDiv);
    });

    // Ocultar botón de editar si no es admin o encargado
    if (rol !== "administrador" && rol !== "encargado") {
      document
        .querySelectorAll(".editButton")
        .forEach((button) => (button.style.display = "none"));
    }

    // Asignar evento a botones de editar
    document.querySelectorAll(".editButton").forEach((button) => {
      button.addEventListener("click", function () {
        const id = this.getAttribute("data-id");
        const producto = data.find((p) => p.id == id);

        // Rellenar el formulario
        document.getElementById("nombre").value = producto.nombre;
        document.getElementById("descripcion").value = producto.descripcion;
        document.getElementById("cantidad").value = producto.cantidad;
        document.getElementById("precio").value = producto.precio;

        // Mostrar formulario si está oculto
        document.getElementById("form").style.display = "block";

        // Cambiar modo a edición
        modoEdicion = true;
        idProductoEditar = id;

        // Botones de actualizar y cancelar
        document.getElementById("addBtn").textContent = "Actualizar";
        document.getElementById("cancelBtn").style.display = "inline-block";

        //boton de cancelar
        document
          .getElementById("cancelBtn")
          .addEventListener("click", function () {
            modoEdicion = false;
            idProductoEditar = null;
            document.getElementById("form").style.display = "none";
            document.getElementById("addBtn").textContent = "Agregar";
            document.getElementById("formProduct").reset();
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
          fetch(`http://localhost:3000/api/productos/${id}`, {
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
              alert("Error al eliminar el producto.");
            });
        });
      }
    });
  })
  .catch((err) => console.error("Error al cargar productos:", err));
