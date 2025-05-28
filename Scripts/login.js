document.querySelector("form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const usuario = document.getElementById("username").value;
  const contrasena = document.getElementById("password").value;
  const recaptchaToken = grecaptcha.getResponse();

  let intentos = parseInt(localStorage.getItem("intentosFallidos")) || 0;
  const bloqueoHasta = parseInt(localStorage.getItem("bloqueoHasta")) || 0;
  const ahora = Date.now();

  // Verificar si está bloqueado
  if (bloqueoHasta && ahora < bloqueoHasta) {
    const segundosRestantes = Math.ceil((bloqueoHasta - ahora) / 1000);
    alert(
      `Has alcanzado el número máximo de intentos. Espera ${segundosRestantes} segundos para intentarlo de nuevo.`
    );
    return;
  }

  if (!recaptchaToken) {
    alert("Por favor verifica el reCAPTCHA.");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ usuario, contrasena, recaptchaToken }),
    });

    const data = await response.json();

    if (response.ok && data.token) {
      localStorage.removeItem("intentosFallidos");
      localStorage.removeItem("bloqueoHasta");
      localStorage.setItem("token", data.token);
      window.location.href = "home.html";
    } else {
      const nuevosIntentos = intentos + 1;
      localStorage.setItem("intentosFallidos", nuevosIntentos);

      alert(data.mensaje || "Usuario o contraseña incorrectos");

      if (nuevosIntentos >= 3) {
        const tiempoBloqueo = Date.now() + 30000; // 30 segundos en milisegundos
        localStorage.setItem("bloqueoHasta", tiempoBloqueo);
        alert(
          "Demasiados intentos. Espera 30 segundos para volver a intentarlo."
        );
      }
    }
  } catch (error) {
    console.error("Error:", error);
    alert("No se pudo conectar con el servidor.");
  }
});
