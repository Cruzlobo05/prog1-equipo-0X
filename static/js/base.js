// --- CONFIGURACIÓN GLOBAL ---
// Definimos la URL aquí para que esté disponible en todas las secciones, esta podemos modificarla si a alguno no le funciona en su pc
window.API_URL = window.location.origin;

let dashboardRefreshInterval = null;
let salesChart = null;
let deliveriesChart = null;

// Variable para controlar la hoja de estilos actual
let currentStyleElement = null;

document.addEventListener("DOMContentLoaded", async () => {
  const storedUser =
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user"));

  if (!storedUser) {
    window.location.href = "/static/index.html";
    return;
  }

  // Referencias del DOM (silenciosas si no existen)
  const avatar = document.getElementById("user-avatar");
  const nameEl = document.getElementById("user-name");
  const emailEl = document.getElementById("user-email");
  const roleEl = document.getElementById("user-role");

  // --- TOGGLE SIDEBAR MOBILE ---
  const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
  const sidebar = document.getElementById('sidebar');
  if (toggleSidebarBtn) {
    const updateToggleVisibility = () => {
      toggleSidebarBtn.style.display = window.innerWidth <= 767 ? 'block' : 'none';
      if (window.innerWidth > 767 && sidebar) sidebar.classList.remove('expanded');
    };
    updateToggleVisibility();
    window.addEventListener('resize', updateToggleVisibility);

    toggleSidebarBtn.addEventListener('click', () => {
      if (sidebar) sidebar.classList.toggle('expanded');
    });
  }

  // --- CARGA DE USUARIO ---
  let currentUser = null;
  try {
    // Intentamos obtener datos, si falla usamos lo guardado
    const res = await fetch("/static/users.json", { cache: "no-store" });
    if (res.ok) {
      const users = await res.json();
      const found = Object.values(users).find(u => u.email === storedUser.email);
      if (found) currentUser = found;
    }
  } catch (err) { /* silent */ }

  if (!currentUser) {
    currentUser = {
      name: storedUser.name || storedUser.username || "Sin nombre",
      email: storedUser.email,
      role: storedUser.role || "usuario",
    };
  }

  const initials = (currentUser.name || "?").split(" ").map(n => n[0]).join("").toUpperCase();

  if (avatar) avatar.textContent = initials;
  if (nameEl) nameEl.textContent = currentUser.name;
  if (emailEl) emailEl.textContent = currentUser.email;
  if (roleEl) roleEl.textContent = currentUser.role === "admin" ? "Administrador" : "Empleado";

  const logoutBtn = document.getElementById("logout-button");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/static/index.html";
    });
  }

  // --- NAVEGACIÓN ---
  const navLinks = document.querySelectorAll("#sidebar-nav a");
  
  navLinks.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const section = e.currentTarget.getAttribute("data-section");
      
      // Actualizar clase active
      navLinks.forEach(l => l.classList.remove('active'));
      e.currentTarget.classList.add('active');

      loadSection(section);
      
      // Cerrar sidebar en mobile
      if (window.innerWidth <= 767 && sidebar) {
        sidebar.classList.remove('expanded');
      }
    });
  });

  // Cargar sección inicial (por defecto dashboard)
  // Buscamos si hay alguno activo por defecto en el HTML
  const activeLink = document.querySelector("#sidebar-nav a.active");
  const initialSection = activeLink ? activeLink.getAttribute("data-section") : 'dashboard';
  loadSection(initialSection);
});


// ======================================================
//  FUNCIÓN PRINCIPAL DE CARGA (HTML + CSS + JS)
// ======================================================
async function loadSection(section) {
  const container = document.getElementById('main-dynamic-content') || document.getElementById('main-content');
  if (!container) {
    console.error("No se encontró el contenedor principal");
    return;
  }

  const storedUser = JSON.parse(localStorage.getItem("user")) || JSON.parse(sessionStorage.getItem("user"));
  const emailParam = storedUser?.email ? `?email=${encodeURIComponent(storedUser.email)}` : "";

  try {
    // 1. GESTIÓN DE CSS
    if (currentStyleElement) {
      currentStyleElement.remove();
      currentStyleElement = null;
    }
    await loadCSS(`/static/css/${section}.css`);

    // 2. CARGA DEL HTML
    const response = await fetch(`/partial/${section}${emailParam}`);
    if (response.status === 403) {
      container.innerHTML = `
        <div class="card">
          <h2 class="section-title">Acceso restringido</h2>
          <p class="section-subtitle">Esta sección solo está disponible para administradores.</p>
        </div>
      `;
      return;
    }
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

    const html = await response.text();
    container.innerHTML = html;

    // 3. CARGA DEL JS
    await loadSectionJS(section);

  } catch (error) {
    container.innerHTML = `<p style="padding: 20px;">Error al cargar la sección <b>${section}</b>. Revise la consola.</p>`;
    console.error(error);
  }
}
// --- ayuda para cargar CSS ---
function loadCSS(href) {
    return new Promise((resolve) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        currentStyleElement = link; 
        
        link.onload = () => resolve();
        link.onerror = () => {
            console.warn(`CSS no encontrado: ${href} (se usará estilo base)`);
            resolve(); // No bloquea si falta el CSS
        };
        document.head.appendChild(link);
    });
}

// --- ayuda para cargar JS ---
function loadSectionJS(section) {
  return new Promise((resolve, reject) => {
      const scriptPath = `/static/js/${section}.js`;
      
      const oldScript = document.querySelector(`script[src="${scriptPath}"]`);
      if (oldScript) oldScript.remove();

      const script = document.createElement('script');
      script.src = scriptPath;
      
      script.onload = () => {
        executeSectionInit(section);
        resolve();
      };
      
      script.onerror = () => {
        console.error(`Error al cargar JS para ${section}`);
        // No rechazamos para que la UI no se rompa totalmente
        resolve(); 
      };
      
      document.head.appendChild(script);
  });
}

function executeSectionInit(section) {
  const functionName = `init${section.charAt(0).toUpperCase() + section.slice(1)}`;
  const initFunction = window[functionName];
  
  if (typeof initFunction === 'function') {
    try {
        initFunction();
    } catch (e) {
        console.error(`Error al ejecutar ${functionName}:`, e);
    }
  } else {
    console.warn(`Función de inicialización ${functionName} no encontrada en ${section}.js`);
  }
}