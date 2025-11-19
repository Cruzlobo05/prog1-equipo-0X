let inventarioActual = [];
let productoEditandoId = null;

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

  // Cerrar modal clic afuera
  const modal = document.getElementById("modal-producto");
  if (modal) {
    window.addEventListener("click", (e) => {
      if (e.target === modal) {
        cerrarModal();
      }
    });
  }
}

// ==================== CARGAR INVENTARIO ====================
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

// ==================== RENDERIZAR TABLA ====================
function renderizarTabla() {
  const tbody = document.getElementById("tbody-inventario");
  const filaCargar = document.getElementById("fila-cargando");

  if (filaCargar) filaCargar.remove();

  if (inventarioActual.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" style="text-align:center;padding:20px;">📭 No hay productos en el inventario</td></tr>';
    return;
  }

  tbody.innerHTML = inventarioActual
    .map(
      (producto) => `
    <tr id="fila-producto-${producto.id}" data-role="fila-producto" data-id="${producto.id}">
      <td>${producto.id}</td>
      <td><strong>${producto.nombre}</strong></td>
      <td>${producto.categoria}</td>

      <td>
        <span 
          id="stock-badge-${producto.id}${producto.stock < 20 ? "-bajo" : ""}"
          data-role="stock-badge"
        >
          ${producto.stock} unidades
        </span>
      </td>

      <td>$${producto.precio.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}</td>

      <td>$${(producto.stock * producto.precio).toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}</td>

      <td id="acciones-${producto.id}" data-role="acciones">
        <button id="btn-editar-${producto.id}" data-role="button-edit" onclick="editarProducto(${producto.id})">✏️</button>
        <button id="btn-eliminar-${producto.id}" data-role="button-delete" onclick="eliminarProducto(${producto.id})">🗑️</button>
      </td>
    </tr>
  `
    )
    .join("");
}

// ==================== ESTADÍSTICAS ====================
function actualizarEstadisticas() {
  const totalProductos = inventarioActual.length;
  const totalStock = inventarioActual.reduce((sum, p) => sum + p.stock, 0);
  const valorTotal = inventarioActual.reduce(
    (sum, p) => sum + p.stock * p.precio,
    0
  );
  const bajoStock = inventarioActual.filter((p) => p.stock < 20).length;

  document.getElementById("stat-productos").textContent = totalProductos;
  document.getElementById("stat-stock").textContent = totalStock;
  document.getElementById("stat-valor").textContent = `$${valorTotal.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
  document.getElementById("stat-bajo-stock").textContent = bajoStock;
}

// ==================== MODAL ====================
function abrirModalAgregar() {
  productoEditandoId = null;
  document.getElementById("modal-titulo").textContent = "Agregar Producto";
  document.getElementById("form-producto").reset();
  document.getElementById("input-producto-id").value = "";
  document.getElementById("modal-producto").style.display = "flex";

}

function cerrarModal() {
  document.getElementById("modal-producto").style.display = "none";
  productoEditandoId = null;
}

// ==================== CRUD ====================
async function guardarProducto(e) {
  e.preventDefault();

  const nombre = document.getElementById("input-nombre").value.trim();
  const stock = parseInt(document.getElementById("input-stock").value);
  const precio = parseFloat(document.getElementById("input-precio").value);
  const categoria = document.getElementById("input-categoria").value.trim();
  const descripcion = document.getElementById("input-descripcion").value.trim();
  const productoId = document.getElementById("input-producto-id").value;

  if (!nombre || isNaN(stock) || isNaN(precio)) {
    mostrarError("Completa todos los campos obligatorios");
    return;
  }

  if (!productoId) {
    const nombreExiste = inventarioActual.some(
      (p) => p.nombre.toLowerCase() === nombre.toLowerCase()
    );
    if (nombreExiste) {
      mostrarError("Ya existe un producto con ese nombre");
      return;
    }
  }

  const payload = { nombre, stock, precio, categoria, descripcion };

  try {
    let response;

    if (productoId) {
      response = await fetch(`${API_URL}/api/inventario/${productoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } else {
      response = await fetch(`${API_URL}/api/inventario`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
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
  document.getElementById("input-producto-id").value = producto.id;

  productoEditandoId = id;
  document.getElementById("modal-producto").style.display = "flex";

}

async function eliminarProducto(id) {
  if (!confirm("¿Estás seguro de eliminar este producto?")) return;

  try {
    const response = await fetch(`${API_URL}/api/inventario/${id}`, {
      method: "DELETE"
    });

    if (!response.ok) throw new Error("Error al eliminar producto");

    await cargarInventario();
    mostrarExito("producto eliminado");
  } catch (error) {
    console.error("Error:", error);
    mostrarError("No se pudo eliminar");
  }
}

// ==================== DASHBOARD EVENT ====================
function notificarAlDashboard() {
  const evento = new CustomEvent("inventarioActualizado", {
    detail: {
      totalStock: inventarioActual.reduce((sum, p) => sum + p.stock, 0),
      valorTotal: inventarioActual.reduce((sum, p) => sum + p.stock * p.precio, 0),
      cantidadProductos: inventarioActual.length
    }
  });
  window.dispatchEvent(evento);
}

// ==================== NOTIFICACIONES ====================
function mostrarExito(mensaje) {
  const notif = document.createElement("div");
  notif.id = "notif-exito";
  notif.textContent = `✅ ${mensaje}`;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3000);
}

function mostrarError(mensaje) {
  const notif = document.createElement("div");
  notif.id = "notif-error";
  notif.textContent = `❌ ${mensaje}`;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3000);
}

// ==================== INICIO ====================
window.initInventario = function () {
  cargarInventario();
  setupEventListeners();
};
