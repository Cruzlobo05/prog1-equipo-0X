{ // <--- INICIO DEL BLOQUE DE ÁMBITO (Aísla este archivo para que cargue bien en base.js)

  let clientesData = []; // Variable local solo para este archivo

  // Asignamos la función al objeto window para que base.js pueda llamarla
  window.initClientes = async function() {
    console.log('🚀 Iniciando módulo de Clientes...');
    await cargarClientes();
    initClientesEvents();
  };

  async function cargarClientes() {
    try {
      // Usamos window.API_URL definido en base.js
      const response = await fetch(`${window.API_URL}/api/clientes`);
      
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      
      let clientes = await response.json();
      
      // Normalizar datos
      clientesData = clientes.map(c => ({
        ...c,
        id: c.id, 
        email: c.email || '',
        telefono: c.telefono || '',
        direccion: c.direccion || '',
        bidones: c.bidones || 0,
        deuda: c.deuda || 0,
        estado: c.estado || 'activo'
      }));
      
      mostrarClientes(clientesData);
      actualizarContador(clientesData.length);
      
    } catch (error) {
      console.error('❌ Error cargando clientes:', error);
      const tbody = document.getElementById('table-body');
      if (tbody) tbody.innerHTML = '<tr><td colspan="7">Error al conectar con el servidor.</td></tr>';
    }
  }

  function mostrarClientes(clientes) {
    const tbody = document.getElementById('table-body');
    if (!tbody) return;
    
    if (clientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No hay clientes para mostrar.</td></tr>';
        return;
    }
    
    tbody.innerHTML = clientes.map(c => `
        <tr>
          <td>${c.nombre}</td>
          <td>
            ${c.telefono || '<span class="dato-faltante">Sin teléfono</span>'}<br>
            <small>${c.email || '<span class="dato-faltante">Sin email</span>'}</small>
          </td>
          <td>${c.direccion || '<span class="dato-faltante">Sin dirección</span>'}</td>
          <td>${c.bidones}</td>
          <td class="${(c.deuda || 0) <= 0 ? 'deuda-verde' : 'deuda-cell'}">
            $${(c.deuda || 0).toFixed(2)}
          </td>
          <td>
            <span class="estado-badge estado-${c.estado}">${c.estado}</span>
          </td>
          <td>
            <button class="btn btn-edit" data-id="${c.id}">Editar</button>
            <button class="btn btn-delete" data-id="${c.id}">Eliminar</button>
          </td>
        </tr>
      `).join('');
    
    // una lista que escucha los eventos para los botones generados
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => eliminarCliente(e.target.dataset.id));
    });

    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => abrirModalParaEditar(e.target.dataset.id));
    });
  }

  function actualizarContador(count) {
    const countEl = document.getElementById('clientes-count');
    if (countEl) countEl.textContent = count;
  }

  function filtrarClientes() {
    const search = document.getElementById('search-input').value.toLowerCase();
    const zona = document.getElementById('zona-filter').value;
    const estado = document.getElementById('estado-filter').value;
    
    const filtrados = clientesData.filter(c => {
      const matchSearch = !search || 
        c.nombre.toLowerCase().includes(search) || 
        (c.telefono && c.telefono.includes(search)) || 
        (c.direccion && c.direccion.toLowerCase().includes(search));
      const matchZona = !zona || c.zona === zona;
      const matchEstado = !estado || c.estado === estado;
      return matchSearch && matchZona && matchEstado;
    });
    
    mostrarClientes(filtrados);
    actualizarContador(filtrados.length);
  }

  // --- LÓGICA DEL MODAL Y CRUD ---

  function abrirModal() {
    document.getElementById('modal-overlay').style.display = 'flex';
  }

  function cerrarModal() {
    const form = document.getElementById('cliente-form');
    form.reset(); 
    form.removeAttribute('data-editing-id');
    
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) modalTitle.textContent = 'Agregar Cliente';
    
    document.getElementById('modal-overlay').style.display = 'none';
  }

  function abrirModalParaAgregar() {
      const form = document.getElementById('cliente-form');
      form.reset();
      form.removeAttribute('data-editing-id');
      document.getElementById('modal-title').textContent = 'Agregar Cliente';
      abrirModal();
  }

  function abrirModalParaEditar(id) {
      // Importante: convertir ID a numero para comparar
      const cliente = clientesData.find(c => c.id == id);
      if (!cliente) return;
      
      const form = document.getElementById('cliente-form');
      form.elements['input-nombre'].value = cliente.nombre;
      form.elements['input-zona'].value = cliente.zona;
      form.elements['input-telefono'].value = cliente.telefono;
      form.elements['input-email'].value = cliente.email;
      form.elements['input-direccion'].value = cliente.direccion;
      form.elements['input-bidones'].value = cliente.bidones;
      form.elements['input-deuda'].value = cliente.deuda;
      form.elements['input-estado'].value = cliente.estado;
      
      form.setAttribute('data-editing-id', id);
      document.getElementById('modal-title').textContent = 'Editar Cliente';
      abrirModal();
  }

  async function manejarSubmitCliente(event) {
      event.preventDefault(); 
      const form = event.target;
      const id = form.getAttribute('data-editing-id'); 
      
      if (id) {
          await guardarCambios(id); 
      } else {
          await agregarCliente(); 
      }
  }

  async function agregarCliente() {
    const form = document.getElementById('cliente-form');
    const nuevoCliente = {
      nombre: form.elements['input-nombre'].value.trim(),
      zona: form.elements['input-zona'].value,
      telefono: form.elements['input-telefono'].value.trim(),
      email: form.elements['input-email'].value.trim(),
      direccion: form.elements['input-direccion'].value.trim(),
      bidones: parseInt(form.elements['input-bidones'].value) || 0,
      deuda: parseFloat(form.elements['input-deuda'].value) || 0,
      estado: form.elements['input-estado'].value,
    };
    
    try {
      const response = await fetch(`${window.API_URL}/api/clientes`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(nuevoCliente)
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Error del servidor');
      }

      const clienteGuardado = await response.json();
      clientesData.push(clienteGuardado);
      
      alert('Cliente agregado exitosamente.');
      cerrarModal();
      mostrarClientes(clientesData);
      actualizarContador(clientesData.length);

    } catch (error) {
       console.error('❌ Error:', error);
       alert(`Error al guardar: ${error.message}`);
    }
  }

  async function guardarCambios(id) {
    const form = document.getElementById('cliente-form');
    const clienteActualizado = {
      nombre: form.elements['input-nombre'].value.trim(),
      zona: form.elements['input-zona'].value,
      telefono: form.elements['input-telefono'].value.trim(),
      email: form.elements['input-email'].value.trim(),
      direccion: form.elements['input-direccion'].value.trim(),
      bidones: parseInt(form.elements['input-bidones'].value) || 0,
      deuda: parseFloat(form.elements['input-deuda'].value) || 0,
      estado: form.elements['input-estado'].value,
    };

    try {
      const response = await fetch(`${window.API_URL}/api/clientes/${id}`, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(clienteActualizado)
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Error del servidor');
      }

      const clienteGuardado = await response.json();
      const index = clientesData.findIndex(c => c.id == id);
      if (index !== -1) clientesData[index] = clienteGuardado;
      else cargarClientes();

      alert('Cliente actualizado exitosamente.');
      cerrarModal();
      mostrarClientes(clientesData);

    } catch (error) {
       console.error('❌ Error:', error);
       alert(`Error al actualizar: ${error.message}`);
    }
  }

  async function eliminarCliente(id) {
    const idParaBorrar = parseInt(id);
    if (!confirm(`¿Estás seguro de eliminar al cliente con ID: ${idParaBorrar}?`)) return;
    
    try {
      const response = await fetch(`${window.API_URL}/api/clientes/${idParaBorrar}`, {
          method: 'DELETE'
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Cliente no encontrado');
      }

      clientesData = clientesData.filter(c => c.id !== idParaBorrar);
      alert('Cliente eliminado.');
      mostrarClientes(clientesData);
      actualizarContador(clientesData.length);

    } catch (error) {
       console.error('❌ Error:', error);
       alert(`Error al eliminar: ${error.message}`);
    }
  }

  function initClientesEvents() {
    const agregarBtn = document.getElementById('agregar-btn');
    if (agregarBtn) agregarBtn.addEventListener('click', abrirModalParaAgregar);
    
    const closeBtn = document.getElementById('modal-close');
    if (closeBtn) closeBtn.addEventListener('click', cerrarModal);
    
    const cancelBtn = document.getElementById('btn-cancelar');
    if (cancelBtn) cancelBtn.addEventListener('click', cerrarModal);
    
    const form = document.getElementById('cliente-form');
    if (form) {
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        newForm.addEventListener('submit', manejarSubmitCliente);
    }
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.addEventListener('input', filtrarClientes);
    
    const zonaFilter = document.getElementById('zona-filter');
    if (zonaFilter) zonaFilter.addEventListener('change', filtrarClientes);
    
    const estadoFilter = document.getElementById('estado-filter');
    if (estadoFilter) estadoFilter.addEventListener('change', filtrarClientes);
  }

} 