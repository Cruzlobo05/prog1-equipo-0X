document.addEventListener("DOMContentLoaded", async () => {
  console.log("Dashboard cargado ✅");

  const storedUser =
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user"));

  if (!storedUser) {
    window.location.href = "/static/index.html";
    return;
  }

  // Referencias del DOM
  const avatar = document.getElementById("user-avatar");
  const nameEl = document.getElementById("user-name");
  const emailEl = document.getElementById("user-email");
  const roleEl = document.getElementById("user-role");

  let currentUser = null;

  try {
    // 🔹 Intentar cargar desde el backend (más confiable)
    const res = await fetch("/users.json", { cache: "no-store" });
    if (res.ok) {
      const users = await res.json();
      const found = users[storedUser.email];
      if (found) currentUser = found;
    }
  } catch (err) {
    console.warn("⚠️ No se pudo leer users.json:", err);
  }

  // Si no se encontró en users.json, usar lo que haya
  if (!currentUser) {
    currentUser = {
      name: storedUser.name || storedUser.username || "Sin nombre",
      email: storedUser.email,
      role: storedUser.role || "usuario",
    };
  }

  // 🧩 Mostrar datos
  const initials = (currentUser.name || "?")
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase();

  avatar.textContent = initials;
  nameEl.textContent = currentUser.name;
  emailEl.textContent = currentUser.email;
  roleEl.textContent =
    currentUser.role === "admin"
      ? "Administrador"
      : currentUser.role === "usuario"
      ? "Empleado"
      : "Desconocido";

  // Colores y estilos
  nameEl.style.fontWeight = "600";
  nameEl.style.color = "#fff";
  roleEl.style.color =
    currentUser.role === "admin" ? "#facc15" : "#63b3ed";

  // 🔹 Botón de cerrar sesión
  document.getElementById("logout-button").addEventListener("click", () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/static/index.html";
  });

  // 🔹 Navegación dinámica
  const content = document.getElementById("main-dynamic-content");
  document.querySelectorAll("#sidebar-nav a").forEach(link => {
    link.addEventListener("click", async e => {
      e.preventDefault();
      const section = e.currentTarget.getAttribute("data-section");

      try {
        const res = await fetch(`/partial/${section}`);
        if (!res.ok) throw new Error("Error al cargar sección");
        const html = await res.text();
        content.innerHTML = html;
      } catch (err) {
        content.innerHTML = `<p>Error al cargar la sección <b>${section}</b>.</p>`;
      }
    });
  });

  // Cargar dashboard por defecto
  fetch("/partial/dashboard")
    .then(res => res.text())
    .then(html => (content.innerHTML = html))
    .catch(() => (content.innerHTML = "Error al cargar el dashboard."));
});
