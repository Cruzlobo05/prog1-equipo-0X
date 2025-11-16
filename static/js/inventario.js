const API_URL = "http://127.0.0.1:8000";

let inventarioActual = [];
let productoEditandoId = null;

// ==================== CARGA INICIAL ====================
document.addEventListener("DOMContentLoaded", () => {
  cargarInventario();
  setupEventListeners();
});

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
  // Botón agregar producto
  const btnAgregar = document.getElementById("btn-agregar-producto");
  if (btnAgregar) {
    btnAgregar.addEventListener("click", abrirModalAgregar);
  }

  // Botón cerrar modal
  const btnCerrar = document.getElementById("btn-cerrar-modal");
  if (btnCerrar) {
    btnCerrar.addEventListener("click", cerrarModal);
  }

  // Botón cancelar
  const btnCancelar = document.getElementById("btn-cancelar");
  if (btnCancelar) {
    btnCancelar.addEventListener("click", cerrarModal);
  }

  // Formulario
  const form = document.getElementById("form-producto");
  if (form) {
    form.addEventListener("submit", guardarProducto);
  }

  // Cerrar modal al hacer click fuera
  const modal = document.getElementById("modal-producto");
  if (modal) {
    window.addEventListener("click", (e) => {
      if (e.target === modal) {
        cerrarModal();
      }
    });
  }
}

// ==================== FUNCIONES PRINCIPALES ====================

// Cargar inventario desde API
async function cargarInventario() {
  try {
    const response = await fetch(`${API_URL}/api/inventario`);
    if (!response.ok) throw new Error("Error al cargar inventario");

    const data = await response.json();
    inventarioActual = data.items || [];

    renderizarTabla();
    actualizarEstadisticas();
    notificarAlDashboard();
  } catch (error) {
    console.error("Error:", error);
    mostrarError("No se pudo cargar el inventario");
  }
}

// Renderizar tabla de productos
function renderizarTabla() {
  const tbody = document.getElementById("tbody-inventario");
  const filaCargar = document.getElementById("fila-cargando");

  if (filaCargar) filaCargar.remove();

  if (inventarioActual.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" style="text-align: center; padding: 20px;">📭 No hay productos en el inventario</td></tr>';
    return;
  }

  tbody.innerHTML = inventarioActual
    .map(
      (producto) => `
    <tr class="fila-producto" data-id="${producto.id}">
      <td>${producto.id}</td>
      <td><strong>${producto.nombre}</strong></td>
      <td>${producto.categoria}</td>
      <td>
        <span class="stock-badge ${producto.stock < 20 ? "bajo-stock" : ""}">
          ${producto.stock} unidades
        </span>
      </td>
      <td>$${producto.precio.toFixed(2)}</td>
      <td>$${(producto.stock * producto.precio).toFixed(2)}</td>
      <td class="acciones-celda">
        <button class="btn-editar" onclick="editarProducto(${producto.id})">✏️</button>
        <button class="btn-eliminar" onclick="eliminarProducto(${producto.id})">🗑️</button>
      </td>
    </tr>
  `
    )
    .join("");
}

// Actualizar estadísticas
function actualizarEstadisticas() {
  const totalProductos = inventarioActual.length;
  const totalStock = inventarioActual.reduce(
    (sum, p) => sum + p.stock,
    0
  );
  const valorTotal = inventarioActual.reduce(
    (sum, p) => sum + p.stock * p.precio,
    0
  );
  const bajoStock = inventarioActual.filter((p) => p.stock < 20).length;

  document.getElementById("stat-productos").textContent = totalProductos;
  document.getElementById("stat-stock").textContent = totalStock;
  document.getElementById("stat-valor").textContent = `$${valorTotal.toFixed(2)}`;
  document.getElementById("stat-bajo-stock").textContent = bajoStock;
}

// ==================== FUNCIONES DEL MODAL ====================

function abrirModalAgregar() {
  productoEditandoId = null;
  document.getElementById("modal-titulo").textContent = "Agregar Producto";
  document.getElementById("form-producto").reset();
  document.getElementById("input-producto-id").value = "";
  document.getElementById("modal-producto").style.display = "block";
}

function cerrarModal() {
  document.getElementById("modal-producto").style.display = "none";
  productoEditandoId = null;
}

// ==================== CRUD OPERACIONES ====================

async function guardarProducto(e) {
  e.preventDefault();

  const nombre = document.getElementById("input-nombre").value;
  const stock = parseInt(document.getElementById("input-stock").value);
  const precio = parseFloat(document.getElementById("input-precio").value);
  const categoria = document.getElementById("input-categoria").value;
  const descripcion = document.getElementById("input-descripcion").value;
  const productoId = document.getElementById("input-producto-id").value;

  const payload = { nombre, stock, precio, categoria, descripcion };

  try {
    let response;
    if (productoId) {
      // Actualizar
      response = await fetch(`${API_URL}/api/inventario/${productoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      // Crear
      response = await fetch(`${API_URL}/api/inventario`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    if (!response.ok) throw new Error("Error al guardar producto");

    cerrarModal();
    await cargarInventario();
    mostrarExito(productoId ? "Producto actualizado" : "Producto creado");
  } catch (error) {
    console.error("Error:", error);
    mostrarError("No se pudo guardar el producto");
  }
}

async function editarProducto(id) {
  const producto = inventarioActual.find((p) => p.id === id);
  if (!producto) return;

  document.getElementById("modal-titulo").textContent = "Editar Producto";
  document.getElementById("input-nombre").value = producto.nombre;
  document.getElementById("input-stock").value = producto.stock;
  document.getElementById("input-precio").value = producto.precio;
  document.getElementById("input-categoria").value = producto.categoria;
  document.getElementById("input-descripcion").value = producto.descripcion;
  document.getElementById("input-producto-id").value = id;

  productoEditandoId = id;
  document.getElementById("modal-producto").style.display = "block";
}

async function eliminarProducto(id) {
  if (!confirm("¿Estás seguro de eliminar este producto?")) return;

  try {
    const response = await fetch(`${API_URL}/api/inventario/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Error al eliminar producto");

    await cargarInventario();
    mostrarExito("Producto eliminado");
  } catch (error) {
    console.error("Error:", error);
    mostrarError("No se pudo eliminar el producto");
  }
}

// ==================== INTEGRACIÓN CON DASHBOARD ====================

function notificarAlDashboard() {
  // Enviar evento personalizado al dashboard
  const evento = new CustomEvent("inventarioActualizado", {
    detail: {
      totalStock: inventarioActual.reduce((sum, p) => sum + p.stock, 0),
      valorTotal: inventarioActual.reduce(
        (sum, p) => sum + p.stock * p.precio,
        0
      ),
      cantidadProductos: inventarioActual.length,
    },
  });
  window.dispatchEvent(evento);
}

// ==================== FUNCIONES AUXILIARES ====================

function mostrarExito(mensaje) {
  const notif = document.createElement("div");
  notif.className = "notificacion exito";
  notif.textContent = `✅ ${mensaje}`;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3000);
}

function mostrarError(mensaje) {
  const notif = document.createElement("div");
  notif.className = "notificacion error";
  notif.textContent = `❌ ${mensaje}`;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3000);
}
