/* =========================
   ESTADO
========================= */
let entidadesCache = [];

/* =========================
   ACTIVAR ENTIDADES
========================= */

function activarEntidades() {
    cargarEntidades();
    activarBuscadorEntidades();

    const form = document.getElementById('entidadForm');
    if (!form) return;

    form.onsubmit = async (e) => {
        e.preventDefault();

        const data = {
            nombre: document.getElementById('nombre').value.trim(),
            documento: document.getElementById('documento').value.trim(),
            telefono: document.getElementById('telefono').value.trim(),
            ciudad: document.getElementById('ciudad').value.trim()
        };

        if (!data.nombre) {
            alert('El nombre es obligatorio');
            return;
        }

        try {
            const res = await window.entidades.crear(data);

            if (!res.success) {
                alert('No se pudo guardar la entidad');
                return;
            }

            form.reset();
            await cargarEntidades();

        } catch (err) {
            console.error(err);
            alert('Error guardando entidad');
        }
    };
}

/* =========================
   CARGAR ENTIDADES
========================= */

async function cargarEntidades() {
    const list = document.getElementById('entidades-list');
    if (!list) return;

    list.innerHTML = '';

    try {
        entidadesCache = await window.entidades.listar();

        if (!entidadesCache.length) {
            list.innerHTML = '<p>No hay entidades registradas</p>';
            return;
        }

        aplicarFiltroEntidades();

    } catch (err) {
        console.error(err);
        list.innerHTML = '<p>Error cargando entidades</p>';
    }
}

/* =========================
   FILTRO
========================= */

function aplicarFiltroEntidades() {
    const list = document.getElementById('entidades-list');
    if (!list) return;

    list.innerHTML = '';

    const search = document
        .querySelector('.emitidos-toolbar input')
        ?.value
        .toLowerCase() || '';

    const filtradas = entidadesCache.filter(e => {
        return (
            e.nombre.toLowerCase().includes(search) ||
            (e.documento || '').toLowerCase().includes(search)
        );
    });

    if (!filtradas.length) {
        list.innerHTML = '<p>No hay entidades que coincidan</p>';
        return;
    }

    filtradas.forEach(e => {
        const row = document.createElement('div');
        row.className = 'entidades-row';
        row.innerHTML = `
            <div>${e.id}</div>
            <div>${e.nombre}</div>
            <div>${e.documento || '-'}</div>
            <div>${e.telefono || '-'}</div>
            <div>${e.ciudad || '-'}</div>
            <button class="crear-recibo-btn">Crear recibo</button>
        `;

        row.querySelector('.crear-recibo-btn').onclick = () => {
            crearReciboDesdeEntidad(e);
        };

        list.appendChild(row);
    });
}

/* =========================
   BUSCADOR
========================= */

function activarBuscadorEntidades() {
    const input = document.querySelector('.emitidos-toolbar input');
    if (!input) return;

    input.oninput = aplicarFiltroEntidades;
}

/* =========================
   CREAR RECIBO
========================= */

function crearReciboDesdeEntidad(entidad) {
    sessionStorage.setItem(
        'clienteSeleccionado',
        JSON.stringify(entidad)
    );
    cargarVista('dashboard-form');
}
