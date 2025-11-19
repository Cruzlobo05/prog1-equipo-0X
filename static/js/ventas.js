{ 
  let ventasData = [];
  let clientesDataVentas = [];
  let productosDataVentas = [];

  window.initVentas = function () {
    console.log("🚀 Iniciando módulo de Ventas...");
    cargarHistorialVentas();
    cargarClientesParaModal();
    cargarProductosParaModal();
    asignarEventosVentas();
  };

  function asignarEventosVentas() {
    document.getElementById('agregar-venta-btn')?.addEventListener('click', abrirModalVenta);
    document.getElementById('modal-venta-close')?.addEventListener('click', cerrarModalVenta);
    document.getElementById('btn-venta-cancelar')?.addEventListener('click', cerrarModalVenta);
    document.getElementById('btn-agregar-producto')?.addEventListener('click', agregarOtraLineaProducto);

    const form = document.getElementById('venta-form');
    if (form) {
      const nuevo = form.cloneNode(true);
      form.parentNode.replaceChild(nuevo, form);
      nuevo.addEventListener('submit', registrarVenta);
    }

    document.getElementById('ventas-search-input')?.addEventListener('input', filtrarVentas);
    document.getElementById('ventas-date-filter')?.addEventListener('change', filtrarVentas);

    // ⭐ Activar cálculos en tiempo real
    document.addEventListener("input", actualizarCalculosVenta);
    document.addEventListener("change", actualizarCalculosVenta);

    // ⭐ Listener para "pago_de_deuda"
    document.getElementById("input-venta-pago")?.addEventListener("change", cambiarModoPago);
  }

  // ------------------------------------------
  //   CAMBIAR MODO SEGÚN TIPO DE PAGO
  // ------------------------------------------
  function cambiarModoPago() {
    const tipo = document.getElementById("input-venta-pago").value;
    const productosBox = document.getElementById("productos-container").parentElement;

    if (tipo === "pago_de_deuda") {
      productosBox.style.display = "none";

      document.querySelectorAll(".select-producto").forEach(s => s.required = false);

      // Reiniciar totales
      document.getElementById("total-productos").textContent = "0.00";
      document.getElementById("deuda-restante").textContent = "0.00";
    } else {
      productosBox.style.display = "block";
      document.querySelectorAll(".select-producto").forEach(s => s.required = true);
      actualizarCalculosVenta();
    }
  }

  // ------------------------------------------
  async function cargarHistorialVentas() {
    const tbody = document.getElementById('ventas-table-body');
    if (!tbody) return;

    try {
      const response = await fetch(`${window.API_URL}/api/ventas`);
      if (!response.ok) throw new Error('Error al cargar historial');

      ventasData = await response.json();
      mostrarVentas(ventasData);

    } catch (error) {
      console.error(error);
      tbody.innerHTML = '<tr><td colspan="5">Error de conexión.</td></tr>';
    }
  }

  function mostrarVentas(ventas) {
    const tbody = document.getElementById('ventas-table-body');
    if (!tbody) return;

    if (ventas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">No hay ventas registradas.</td></tr>';
      return;
    }

    tbody.innerHTML = ventas.map(venta => `
      <tr>
        <td>${venta.cliente_nombre || 'Cliente desconocido'}</td>
        <td>${new Date(venta.fecha).toLocaleString()}</td>
        <td>$${(venta.monto || 0).toFixed(2)}</td>
        <td>
          <span class="estado-badge ${venta.tipo_pago === 'fiado' ? 'estado-inactivo' : 'estado-activo'}">
            ${venta.tipo_pago}
          </span>
        </td>
        <td>
            <button class="btn btn-secondary btn-ver" data-id="${venta.id}">Ver</button>
            <button class="btn btn-delete btn-anular" data-id="${venta.id}">Anular</button>
        </td>

      </tr>
    `).join('');

    document.querySelectorAll('.btn-anular').forEach(btn => {
      btn.addEventListener('click', e => anularVenta(e.target.getAttribute('data-id')));
    });

    document.querySelectorAll('.btn-ver').forEach(btn => {
      btn.addEventListener('click', e => mostrarDetalleVenta(e.target.getAttribute('data-id')));
    });
  }

  async function anularVenta(id) {
    if (!confirm("¿Estás seguro de anular esta venta?")) return;

    try {
      const response = await fetch(`${window.API_URL}/api/ventas/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error("No se pudo anular la venta");

      alert("Venta anulada.");
      ventasData = ventasData.filter(v => v.id != id);
      mostrarVentas(ventasData);

    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
    }
  }

  function mostrarDetalleVenta(id) {
    const venta = ventasData.find(v => v.id == id);
    if (!venta) return;

    const overlay = document.getElementById("modal-ver-venta-overlay");
    const content = document.getElementById("modal-ver-venta-content");

    let html = `
        <p><strong>Cliente:</strong> ${venta.cliente_nombre}</p>
        <p><strong>Fecha:</strong> ${new Date(venta.fecha).toLocaleString()}</p>
        <p><strong>Pago cliente:</strong> $${(venta.pago_cliente || 0)}</p>
        <p><strong>Deuda generada:</strong> $${(venta.deuda_generada || 0)}</p>
        <p><strong>Total venta:</strong> <b>$${(venta.total_calculado || venta.monto)}</b></p>

        <h3 style="margin-top: 15px;">Productos</h3>
        <table style="width:100%; border-collapse: collapse;">
            <thead>
                <tr>
                    <th style="border-bottom:1px solid #ccc; padding:5px;">Producto</th>
                    <th style="border-bottom:1px solid #ccc; padding:5px;">Cantidad</th>
                </tr>
            </thead>
            <tbody>
    `;

    (venta.productos || []).forEach(p => {
      const prod = productosDataVentas.find(x => x.id == p.producto_id);
      const nombre = prod ? prod.nombre : "Producto " + p.producto_id;

      html += `
            <tr>
                <td style="padding:5px;">${nombre}</td>
                <td style="padding:5px;">${p.cantidad}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    content.innerHTML = html;
    overlay.classList.add("active");
  }

  async function cargarClientesParaModal() {
    try {
      const response = await fetch(`${window.API_URL}/api/clientes`);
      if (!response.ok) return;

      clientesDataVentas = await response.json();

      const select = document.getElementById('input-venta-cliente');
      select.innerHTML = `<option value="">Seleccione un cliente...</option>`;

      clientesDataVentas.forEach(c => {
        select.innerHTML += `<option value="${c.id}">${c.nombre}</option>`;
      });

    } catch (e) { console.error(e); }
  }

  async function cargarProductosParaModal() {
    try {
      const response = await fetch(`${window.API_URL}/api/inventario`);
      if (!response.ok) return;

      const data = await response.json();
      productosDataVentas = data.items || [];

    } catch (e) { console.error("Error al cargar productos:", e); }
  }

  function agregarOtraLineaProducto() {
    const container = document.getElementById('productos-container');

    const linea = document.createElement('div');
    linea.className = 'producto-linea';

    linea.innerHTML = `
      <select class="select-producto form-select" required>
        <option value="">Seleccione...</option>
        ${productosDataVentas.map((p) => `<option value="${p.id}">${p.nombre}</option>`).join('')}
      </select>

      <input type="number" class="input-cantidad form-input" min="1" value="1" style="width:80px" />

      <button type="button" class="btn-eliminar-producto btn btn-danger">🗑️</button>
    `;

    linea.querySelector('.btn-eliminar-producto')
      .addEventListener('click', () => { linea.remove(); actualizarCalculosVenta(); });

    container.appendChild(linea);
  }

  function abrirModalVenta() {
    document.getElementById('modal-venta-overlay').classList.add('active');

    const cont = document.getElementById('productos-container');
    cont.innerHTML = "";

    agregarOtraLineaProducto();
    cambiarModoPago(); // por si quedó en "pago_de_deuda"

    actualizarCalculosVenta();
  }

  function cerrarModalVenta() {
    document.getElementById('modal-venta-overlay').classList.remove('active');
    document.getElementById('venta-form').reset();
    cambiarModoPago();
    actualizarCalculosVenta();
  }

  function filtrarVentas() {
    const search = document.getElementById('ventas-search-input')?.value.toLowerCase() || "";
    const date = document.getElementById('ventas-date-filter')?.value || "";

    const filtradas = ventasData.filter(v => {
      const matchNombre = v.cliente_nombre?.toLowerCase().includes(search);
      const matchFecha = !date || v.fecha?.startsWith(date);
      return matchNombre && matchFecha;
    });

    mostrarVentas(filtradas);
  }

  function actualizarCalculosVenta() {
    let total = 0;

    document.querySelectorAll('.producto-linea').forEach(linea => {
      const id = parseInt(linea.querySelector('.select-producto').value);
      const cantidad = parseInt(linea.querySelector('.input-cantidad').value) || 0;

      const prod = productosDataVentas.find(p => p.id === id);
      if (prod && cantidad > 0) total += prod.precio * cantidad;
    });

    document.getElementById("total-productos").textContent = total.toFixed(2);

    const pago = parseFloat(document.getElementById("pago-cliente").value) || 0;
    const deuda = total - pago;

    document.getElementById("deuda-restante").textContent = deuda.toFixed(2);
  }

  // ------------------------------------------
  //   GUARDAR VENTA
  // ------------------------------------------
  async function registrarVenta(event) {
    event.preventDefault();

    const total = parseFloat(document.getElementById("total-productos").textContent);
    const pago = parseFloat(document.getElementById("pago-cliente").value);
    const deuda = parseFloat(document.getElementById("deuda-restante").textContent);

    const productos = Array.from(document.querySelectorAll('.producto-linea'))
      .map(linea => ({
        producto_id: parseInt(linea.querySelector('.select-producto').value),
        cantidad: parseInt(linea.querySelector('.input-cantidad').value)
      }))
      .filter(p => p.producto_id && p.cantidad > 0);

    const tipo = document.getElementById('input-venta-pago').value;

    const data = {
      cliente_id: parseInt(document.getElementById('input-venta-cliente').value),
      tipo_pago: tipo,

      monto: pago,
      total: total,
      pago_cliente: pago,
      deuda: deuda,

      productos: productos
    };

    // VALIDACIÓN
    if (!data.cliente_id) {
      alert("Seleccioná un cliente.");
      return;
    }

    // Si NO es pago de deuda → requiere productos
    if (tipo !== "pago_de_deuda" && productos.length === 0) {
      alert("Debes agregar al menos un producto.");
      return;
    }

    // Si es pago de deuda
    if (tipo === "pago_de_deuda") {
      data.productos = [];
      data.total = 0;
      data.deuda = -pago;
      data.monto = pago;
      data.pago_cliente = pago;

      // MARCA QUE NO ES ENTREGA PARA QUE NO LA REGISTRE EN EL DASHBOARD
      data.is_pago_de_deuda = true;
    }


    const btn = document.getElementById('btn-venta-guardar');
    btn.disabled = true;
    btn.textContent = "Guardando...";

    try {
      const response = await fetch(`${window.API_URL}/api/ventas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error("Error al registrar venta");

      alert("Venta registrada correctamente.");

      cerrarModalVenta();
      cargarHistorialVentas();

    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Guardar Venta";
    }
  }

  document.getElementById("modal-ver-venta-close")?.addEventListener("click", () => {
    document.getElementById("modal-ver-venta-overlay").classList.remove("active");
  });

  document.getElementById("btn-ver-cerrar")?.addEventListener("click", () => {
    document.getElementById("modal-ver-venta-overlay").classList.remove("active");
  });

} 
