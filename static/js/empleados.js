function initEmpleados() {
    const API = `${window.API_URL}/api/empleados`;

    const tableBody = document.getElementById('table-body');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('empleado-form');
    const agregarBtn = document.getElementById('agregar-btn');
    const cancelarBtn = document.getElementById('btn-cancelar');
    const closeBtn = document.getElementById('modal-close');
    const empleadosCount = document.getElementById('empleados-count');

    let empleados = [];
    let editandoEmail = null;

    function abrirModal() {
        document.getElementById('modal-overlay').style.display = 'flex';
    }

    function cerrarModal() {
        const form = document.getElementById('empleado-form');
        form.reset();
        form.removeAttribute('data-editing-email');

        const modalTitle = document.getElementById('modal-title');
        if (modalTitle) modalTitle.textContent = 'Agregar Empleado';

        document.getElementById('modal-overlay').style.display = 'none';
    }

    function abrirModalParaAgregar() {
        const form = document.getElementById('empleado-form');
        form.reset();
        form.removeAttribute('data-editing-email');
        document.getElementById('modal-title').textContent = 'Agregar Empleado';
        abrirModal();
    }

    function abrirModalParaEditar(email) {
        const empleado = empleados.find(e => e.email === email);
        if (!empleado) return;

        const form = document.getElementById('empleado-form');
        form.elements['input-nombre'].value = empleado.name;
        form.elements['input-usuario'].value = empleado.username;
        form.elements['input-password'].value = empleado.password;
        form.elements['input-email'].value = empleado.email;
        form.elements['input-rol'].value = empleado.role;
        form.elements['input-estado'].value = empleado.estado || 'activo';

        form.setAttribute('data-editing-email', email);
        document.getElementById('modal-title').textContent = 'Editar Empleado';
        abrirModal();
    }
    function renderTabla() {
        tableBody.innerHTML = '';
        empleados.forEach(emp => {
            const estado = emp.estado || 'activo';
            const row = document.createElement('tr');
            row.innerHTML = `
        <td>${emp.name}</td>
        <td>${emp.username}</td>
        <td>${emp.email}</td>
        <td>${emp.role}</td>
        <td>${estado}</td>
        <td>
          <button class="btn btn-sm btn-edit" data-id="${emp.email}">Editar</button>
          <button class="btn btn-sm btn-delete" data-id="${emp.email}">Eliminar</button>
        </td>
      `;
            tableBody.appendChild(row);
        });
        empleadosCount.textContent = empleados.length;
    }

    async function cargarEmpleados() {
        try {
            const res = await fetch(API);
            empleados = await res.json();
            renderTabla();
        } catch (err) {
            console.error('Error al cargar empleados:', err);
        }
    }

    async function guardarEmpleado(e) {
        e.preventDefault();
        const nuevo = {
            name: form['input-nombre'].value,
            username: form['input-usuario'].value,
            password: form['input-password'].value,
            email: form['input-email'].value,
            role: form['input-rol'].value,
            estado: form['input-estado'].value
        };

        const method = editandoEmail ? 'PUT' : 'POST';
        const url = editandoEmail ? `${API}/${encodeURIComponent(editandoEmail)}` : API;

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevo)
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.detail || 'Error al guardar');
                return;
            }

            await cargarEmpleados();
            cerrarModal();
        } catch (err) {
            console.error('Error al guardar empleado:', err);
        }
    }

    async function eliminarEmpleado(email) {
        if (!confirm(`¿Eliminar empleado ${email}?`)) return;
        try {
            const res = await fetch(`${API}/${encodeURIComponent(email)}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            await cargarEmpleados();
        } catch (err) {
            alert('Error al eliminar empleado');
        }
    }

    function llenarFormulario(emp) {
        form['input-nombre'].value = emp.name;
        form['input-usuario'].value = emp.username;
        form['input-password'].value = emp.password;
        form['input-email'].value = emp.email;
        form['input-rol'].value = emp.role;
        form['input-estado'].value = emp.estado || 'activo';
    }

    tableBody.addEventListener('click', e => {
        const email = e.target.dataset.id;
        if (e.target.classList.contains('btn-edit')) {
            const emp = empleados.find(u => u.email === email);
            if (emp) {
                llenarFormulario(emp);
                editandoEmail = email;
                abrirModal('Editar Empleado');
            }
        } else if (e.target.classList.contains('btn-delete')) {
            eliminarEmpleado(email);
        }
    });

    agregarBtn?.addEventListener('click', () => abrirModal('Agregar Nuevo Empleado'));
    cancelarBtn?.addEventListener('click', cerrarModal);
    closeBtn?.addEventListener('click', cerrarModal);
    form?.addEventListener('submit', guardarEmpleado);

    cargarEmpleados();
}