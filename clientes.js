let clientes = [];
let editandoId = null;

async function cargarClientes() {
    try {
        const response = await fetch('clientes.json');
        clientes = await response.json();
        renderizarTabla();
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        clientes = [];
        renderizarTabla();
    }
}

function renderizarTabla() {
    const tbody = document.getElementById('clientes-tbody');
    tbody.innerHTML = '';
    
    clientes.forEach(cliente => {
        const tr = document.createElement('tr');
        
        const deudaClass = cliente.deuda > 50000 ? ' style="color: #E74C3C; font-weight: 600;"' : '';
        
        tr.innerHTML = `
            <td>${cliente.nombre}</td>
            <td>${cliente.edad}</td>
            <td>${cliente.telefono}</td>
            <td>${cliente.zona}</td>
            <td>${cliente.bidones}</td>
            <td${deudaClass}>$${cliente.deuda.toLocaleString('es-AR')}</td>
            <td>
                <div id="acciones-cell">
                    <button id="btn-editar" onclick="editarCliente(${cliente.id})">Editar</button>
                    <button id="btn-eliminar" onclick="eliminarCliente(${cliente.id})">Eliminar</button>
                </div>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

function abrirModal() {
    document.getElementById('modal-overlay').classList.add('active');
}

function cerrarModal() {
    document.getElementById('modal-overlay').classList.remove('active');
    limpiarFormulario();
    editandoId = null;
    document.getElementById('modal-title').textContent = 'Agregar Cliente';
}

function limpiarFormulario() {
    document.getElementById('input-nombre').value = '';
    document.getElementById('input-edad').value = '';
    document.getElementById('input-telefono').value = '';
    document.getElementById('input-zona').value = '';
    document.getElementById('input-bidones').value = '';
    document.getElementById('input-deuda').value = '';
}

function guardarCliente() {
    const nombre = document.getElementById('input-nombre').value;
    const edad = parseInt(document.getElementById('input-edad').value);
    const telefono = document.getElementById('input-telefono').value;
    const zona = document.getElementById('input-zona').value;
    const bidones = parseInt(document.getElementById('input-bidones').value);
    const deuda = parseFloat(document.getElementById('input-deuda').value) || 0;
    
    if (!nombre || !edad || !telefono || !zona || !bidones) {
        alert('Por favor completa todos los campos obligatorios');
        return;
    }
    
    if (editandoId) {
        const index = clientes.findIndex(c => c.id === editandoId);
        if (index !== -1) {
            clientes[index] = {
                id: editandoId,
                nombre,
                edad,
                telefono,
                zona,
                bidones,
                deuda
            };
        }
    } else {
        const nuevoId = clientes.length > 0 ? Math.max(...clientes.map(c => c.id)) + 1 : 1;
        clientes.push({
            id: nuevoId,
            nombre,
            edad,
            telefono,
            zona,
            bidones,
            deuda
        });
    }
    
    renderizarTabla();
    cerrarModal();
}

function editarCliente(id) {
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) return;
    
    editandoId = id;
    document.getElementById('modal-title').textContent = 'Editar Cliente';
    document.getElementById('input-nombre').value = cliente.nombre;
    document.getElementById('input-edad').value = cliente.edad;
    document.getElementById('input-telefono').value = cliente.telefono;
    document.getElementById('input-zona').value = cliente.zona;
    document.getElementById('input-bidones').value = cliente.bidones;
    document.getElementById('input-deuda').value = cliente.deuda;
    
    abrirModal();
}

function eliminarCliente(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
        clientes = clientes.filter(c => c.id !== id);
        renderizarTabla();
    }
}

document.getElementById('btn-agregar').addEventListener('click', abrirModal);
document.getElementById('btn-cerrar').addEventListener('click', cerrarModal);
document.getElementById('btn-cancelar').addEventListener('click', cerrarModal);
document.getElementById('btn-guardar').addEventListener('click', guardarCliente);

document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') {
        cerrarModal();
    }
});

cargarClientes();