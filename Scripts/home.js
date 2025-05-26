// Mostrar el navbar al cargar la página
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


