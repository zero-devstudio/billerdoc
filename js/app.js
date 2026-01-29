function obtenerFechaBogota() {
    const ahora = new Date();

    const formatter = new Intl.DateTimeFormat('es-CO', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });

    const partes = formatter.formatToParts(ahora);

    const year = partes.find(p => p.type === 'year').value;
    const month = partes.find(p => p.type === 'month').value;
    const day = partes.find(p => p.type === 'day').value;

    return `${year}-${month}-${day}`;
}

function obtenerFechaHoraBogota() {
    return new Intl.DateTimeFormat('es-CO', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).format(new Date());
}

function formatearFechaDMY(fechaISO) {
    if (!fechaISO) return '';

    const [year, month, day] = fechaISO.split('-');
    return `${day}/${month}/${year}`;
}

const content = document.querySelector('.content');
const template = document.getElementById('receipt-form-template');
const menuItems = document.querySelectorAll('.sidebar li');


document.addEventListener('click', (e) => {
    const arrow = e.target.closest('.set-icon-arrow');
    if (!arrow) return;

    const view = arrow.dataset.view;
    if (!view) return;

    cargarVista(view);
    activarMenu(view); 
});

document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-view]');
    if (!btn) return;

    const view = btn.dataset.view;
    activarMenu(view);
    cargarVista(view);
});


function activarMenu(view) {
    const items = document.querySelectorAll('.sidebar li');

    items.forEach(li => {
        li.classList.toggle('active', li.dataset.view === view);
    });
}


function configurarFormulario() {
    const fechaInput = document.getElementById('fechaRecibo');

    const hoyBogota = obtenerFechaBogota();

    // Calcular mínimo (Bogotá - 10 días)
    const minDate = new Date(`${hoyBogota}T00:00:00-05:00`);
    minDate.setDate(minDate.getDate() - 10);

    const min = minDate.toISOString().split('T')[0];

    fechaInput.min = min;
    fechaInput.max = hoyBogota;
    fechaInput.value = hoyBogota;


    document.getElementById('btnCancel').onclick = () => {
        cargarVista('dashboard');
    };

    document.getElementById('fila1_valor')
        ?.addEventListener('input', calcularTotal);

    document.getElementById('poliza_valor')
        ?.addEventListener('input', calcularTotal);

    document.getElementById('btnSave').onclick = guardarRecibo;

    //Autocompletar cliente si viene desde Entidades
    const clienteGuardado = sessionStorage.getItem('clienteSeleccionado');

    if (clienteGuardado) {
        const cliente = JSON.parse(clienteGuardado);

        const inputNombre = document.getElementById('clienteNombre');
        const inputDocumento = document.getElementById('fila1_cc');

        if (inputNombre) inputNombre.value = cliente.nombre || '';
        if (inputDocumento) inputDocumento.value = cliente.documento || '';

        inputNombre?.focus();

        sessionStorage.removeItem('clienteSeleccionado');
    }

}

function calcularTotal() {
    const valorAfiliacion = parseFloat(
        document.getElementById('fila1_valor')?.value
    ) || 0;

    const valorPoliza = parseFloat(
        document.getElementById('poliza_valor')?.value
    ) || 0;

    const total = valorAfiliacion + valorPoliza;

    document.getElementById('total').value = total;
}

function recolectarDatosFormulario() {
    const cliente = document.getElementById('clienteNombre').value.trim();
    const fechaISO = document.getElementById('fechaRecibo').value;
    const planes = document.getElementById('planes').value;

    if (!cliente) {
        alert('Debes ingresar el nombre del cliente');
        return null;
    }

    if (!fechaISO) {
        alert('Debes seleccionar una fecha válida');
        return null;
    }

    return {
        cliente,
        fecha: fechaISO, // ✅ SIEMPRE ISO YYYY-MM-DD
        planes,
        entidad: 'FUNERARIA',

        afiliacion: {
            mes: document.getElementById('fila1_mes').value,
            ano: document.getElementById('fila1_ano').value,
            afiliacion: document.getElementById('fila1_afiliacion').value,
            cc: document.getElementById('fila1_cc').value,
            concepto: document.getElementById('fila1_concepto').value,
            valor: Number(document.getElementById('fila1_valor').value || 0)
        },

        poliza: {
            mes: document.getElementById('poliza_mes').value,
            ano: document.getElementById('poliza_ano').value,
            ramo: document.getElementById('poliza_ramo').value,
            numero: document.getElementById('poliza_numero').value,
            valor: Number(document.getElementById('poliza_valor').value || 0)
        },

        total: Number(document.getElementById('total').value || 0)
    };
}

async function guardarRecibo() {
    const recibo = recolectarDatosFormulario();
    if (!recibo) return;

    console.log('RECIBO ARMADO DESDE EL FORM:', recibo);

    try {
        // Guardar en BD
        const response = await window.electron.guardarRecibo(recibo);
        recibo.id = response.id;

        await window.electron.generarPDF(recibo);
        cargarDashboardStats();

        alert(`Recibo ${recibo.id} generado correctamente`);

        resetFormulario();
        
    } catch (error) {
        console.error(error);
        alert('Ocurrió un error al generar el recibo');
    }
}

function resetFormulario() {
    const form = document.querySelector('.receipt-form');
    if (!form) return;

    // 1. Limpiar inputs
    form.querySelectorAll('input').forEach(input => {
        if (
            input.type === 'number' ||
            input.type === 'text' ||
            input.type === 'date'
        ) {
            input.value = '';
        }
    });

    // 2. Reset total
    const totalInput = document.getElementById('total');
    if (totalInput) totalInput.value = 0;

    // 3. Reset fecha (Bogotá)
    const fechaInput = document.getElementById('fechaRecibo');
    if (fechaInput) {
        const hoyBogota = obtenerFechaBogota();

        // hoy - 10 días
        const minDate = new Date(`${hoyBogota}T00:00:00-05:00`);
        minDate.setDate(minDate.getDate() - 10);

        fechaInput.min = minDate.toISOString().split('T')[0];
        fechaInput.max = hoyBogota;
        fechaInput.value = hoyBogota;
    }

    // 4. Volver foco al primer campo
    document.getElementById('clienteNombre')?.focus();
}

menuItems.forEach(item => {
    item.addEventListener('click', () => {
        const view = item.dataset.view;
        if (!view) return;

        activarMenu(view);
        cargarVista(view);
    });
});

async function cargarVista(nombre) {
    try {
        
        if (nombre === 'dashboard-form') {
            content.innerHTML = '';
            content.appendChild(template.content.cloneNode(true));
            configurarFormulario();
            return;
        }

        const response = await fetch(`views/${nombre}.html`);
        const html = await response.text();
        content.innerHTML = html;

        if (nombre === 'dashboard') activarDashboard();
        if (nombre === 'emitidos') activarEmitidos();
        if (nombre === 'entidades') activarEntidades();
        if (nombre === 'cuenta') activarCuenta();
        if (nombre === 'updates') activarUpdates();

    } catch (err) {
        content.innerHTML = `<h2>Error cargando la vista</h2>`;
        console.error(err);
    }
}

function activarDashboard() {
    cargarDashboardStats();

    const btnCreate = document.getElementById('btnCreate');

    if (!btnCreate) {
        console.warn('Botón Crear no encontrado');
        return;
    }

    btnCreate.addEventListener('click', () => {
        content.innerHTML = '';
        content.appendChild(template.content.cloneNode(true));
        configurarFormulario();
    });
}

cargarVista('dashboard');

async function activarEmitidos() {
    console.log('📂 Vista Emitidos activada');

    const container = document.getElementById('emitidos-list');
    if (!container) {
        console.warn('No existe #emitidos-list');
        return;
    }

    try {
        const recibos = await window.recibos.listar();
        console.log('RECIBOS:', recibos);

        if (!recibos.length) {
            container.innerHTML = '<p>No hay recibos emitidos</p>';
            return;
        }

        container.innerHTML = '';

        recibos.forEach(r => {
            const row = document.createElement('div');
            row.className = 'emitido-row';

            row.innerHTML = `
                <div>${r.id}</div>
                <div>${r.fecha}</div>
                <div>${r.cliente}</div>
                <div>$ ${r.total.toLocaleString('es-CO')}</div>
                <button class="open-btn" title="Abrir recibo">📂</button>
            `;

            row.querySelector('.open-btn').onclick = async () => {
                const res = await window.electron.abrirRecibo(r.id);

                if (!res?.success) {
                    alert(res?.message || 'No se pudo abrir el recibo');
                }
            };

            container.appendChild(row);
        });

    } catch (err) {
        console.error('Error cargando emitidos:', err);
        container.innerHTML = '<p>Error cargando recibos app</p>';
    }
}

async function cargarDashboardStats() {
    try {
        const stats = await window.dashboard.stats();

        // Docs generados
        const totalRecibosEl = document.getElementById('totalRecibos');
        if (totalRecibosEl) {
            totalRecibosEl.textContent = stats.totalRecibos;
        }

        // Última fecha
        const fechaEl = document.getElementById('ultimaFechaRecibo');
        if (fechaEl && stats.ultimaFecha) {
            const fecha = new Date(stats.ultimaFecha);
            fechaEl.textContent = fecha.toLocaleString('es-CO');
        }

        // Entidades
        const totalEntidadesEl = document.getElementById('totalEntidades');
        if (totalEntidadesEl) {
            totalEntidadesEl.textContent = stats.totalEntidades;
        }

    } catch (err) {
        console.error('Error cargando stats del dashboard:', err);
    }
}

document.addEventListener('click', async (e) => {
    if (e.target.id === 'logoutBtn') {
        const confirmLogout = confirm('¿Seguro que deseas cerrar sesión?');

        if (!confirmLogout) return;

        try {
            await window.auth.logout();
            window.location.href = 'views/login.html';
        } catch (err) {
            console.error('Error cerrando sesión:', err);
            alert('No se pudo cerrar sesión');
        }
    }
    // (cerrar Electron)
    if (e.target.id === 'exitAppBtn') {
        const confirmExit = confirm('¿Seguro que deseas salir de la aplicación?');
        if (!confirmExit) return;

        window.electron.exit();
    }
});