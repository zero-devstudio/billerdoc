/* =========================
   ESTADO
========================= */
let entidadesCache = [];
let entidadEditando = null;

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
            let res;

            if (entidadEditando) {
                // ✏️ EDITAR
                res = await window.entidades.actualizar(entidadEditando.id, data);
            } else {
                // ➕ CREAR
                res = await window.entidades.crear(data);
            }

            if (!res.success) {
                alert('No se pudo guardar la entidad');
                return;
            }

            form.reset();
            entidadEditando = null;
            form.querySelector('button').textContent = 'Guardar entidad';

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
   FILTRO + RENDER
========================= */

function aplicarFiltroEntidades() {
    const list = document.getElementById('entidades-list');
    if (!list) return;

    list.innerHTML = '';

    const search = document
        .querySelector('.emitidos-toolbar input')
        ?.value
        .toLowerCase() || '';

    const filtradas = entidadesCache.filter(e =>
        e.nombre.toLowerCase().includes(search) ||
        (e.documento || '').toLowerCase().includes(search)
    );

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
            <div class="acciones">
                <button class="edit-btn">
                    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.22119 16.7072L16.1758 3.75586L22.2351 9.81683L9.28013 22.7682L3.22119 16.7072Z" fill="#FFCE31"/>
                        <path d="M24.8978 1.86841L24.1261 1.09668C22.6639 -0.365559 20.308 -0.365559 18.8052 1.09668L16.165 3.73683L22.2577 9.82948L24.8978 7.18933C26.3601 5.7271 26.3601 3.33065 24.8978 1.86841Z" fill="#ED4C5C"/>
                        <path d="M14.5327 5.40637L16.198 3.74023L22.2582 9.8004L20.5929 11.4661L14.5327 5.40637Z" fill="#93A2AA"/>
                        <path d="M15.1646 6.0378L16.8299 4.37207L21.598 9.13978L19.9319 10.8051L15.1646 6.0378Z" fill="#C7D3D8"/>
                        <path d="M3.20802 16.6938L0.567871 23.5989L2.39567 25.4267L9.30068 22.7865L3.20802 16.6938Z" fill="#FED0AC"/>
                        <path d="M0.121371 24.817C-0.244188 25.7918 0.243225 26.2386 1.21805 25.873L4.5487 24.6139L1.42114 21.4863L0.121371 24.817Z" fill="#333333"/>
                        <path d="M3.2041 16.7238L14.5202 5.40771L16.5308 7.41829L5.21468 18.7344L3.2041 16.7238Z" fill="#FFDF85"/>
                        <path d="M7.27148 20.7721L18.5876 9.45605L20.5982 11.4666L9.28206 22.7827L7.27148 20.7721Z" fill="#FF8736"/>
                    </svg>
                </button>

                <button class="delete-btn">
                    <svg width="26" height="27" viewBox="0 0 26 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 6.68749C0 6.304 -7.26424e-08 6.11225 0.118624 5.99362C0.237248 5.875 0.428996 5.875 0.812492 5.875H25.1873C25.5707 5.875 25.7625 5.875 25.8811 5.99362C25.9997 6.11225 25.9997 6.304 25.9997 6.68749V7.09699C25.9997 7.24324 25.9997 7.31799 25.977 7.38299C25.9574 7.43898 25.9258 7.49001 25.8844 7.53248C25.8356 7.58123 25.7706 7.61373 25.639 7.68036C24.5811 8.20848 24.053 8.47335 23.6679 8.86985C23.3389 9.20868 23.0877 9.61515 22.9318 10.061C22.7498 10.581 22.7498 11.1724 22.7498 12.3554V20.4999C22.7498 23.5646 22.7498 25.0953 21.7975 26.0476C20.8453 26.9998 19.3146 26.9998 16.2498 26.9998H9.7499C6.68518 26.9998 5.15445 26.9998 4.20221 26.0476C3.24997 25.0953 3.24997 23.5646 3.24997 20.4999V12.3554C3.24997 11.1724 3.24997 10.581 3.06797 10.061C2.91206 9.61515 2.66086 9.20868 2.33185 8.86985C1.94673 8.47335 1.41861 8.20848 0.360747 7.68036C0.272121 7.64342 0.189437 7.59359 0.115374 7.53248C0.0739538 7.49001 0.0423381 7.43898 0.0227497 7.38299C-9.98834e-08 7.31799 0 7.24324 0 7.09699V6.68749Z" fill="url(#paint0_linear_104_14)"/>
                        <path d="M6 3.99192C6.41304 3.13514 7.32246 2.37535 8.59058 1.8338C10.046 1.25738 11.5219 0.978714 13 1.00127C14.5942 1.00127 16.1449 1.29225 17.4094 1.8338C18.6739 2.37535 19.5833 3.13514 20 4" stroke="#D4D4D4" stroke-width="2" stroke-linecap="round"/>
                        <path d="M17.875 13.1875C17.875 12.7388 17.5112 12.375 17.0625 12.375C16.6138 12.375 16.25 12.7388 16.25 13.1875V21.3124C16.25 21.7611 16.6138 22.1249 17.0625 22.1249C17.5112 22.1249 17.875 21.7611 17.875 21.3124V13.1875Z" fill="#8E8E8E"/>
                        <path d="M9.74998 13.1875C9.74998 12.7388 9.38622 12.375 8.93749 12.375C8.48877 12.375 8.125 12.7388 8.125 13.1875V21.3124C8.125 21.7611 8.48877 22.1249 8.93749 22.1249C9.38622 22.1249 9.74998 21.7611 9.74998 21.3124V13.1875Z" fill="#8E8E8E"/>
                        <defs>
                        <linearGradient id="paint0_linear_104_14" x1="10.5" y1="11" x2="9.5" y2="28.5" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#E3E3E3"/>
                        <stop offset="1" stop-color="#BAB8B8"/>
                        </linearGradient>
                        </defs>
                    </svg>
                </button>

                <button class="crear-recibo-btn">
                    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 0V2.58964H2.6V26L7.1058 22.4108L10.075 25.0392L13 22.4496L15.925 25.0392L18.8942 22.4108L23.4 26V2.58964H26V0H0ZM18.2 9.06374H7.8V6.4741H18.2V9.06374ZM9.1 14.243V11.6534H16.9V14.243H9.1Z" fill="white"/>
                    </svg>
                </button>
            </div>
        `;

        row.querySelector('.edit-btn').onclick = () => editarEntidad(e);
        row.querySelector('.delete-btn').onclick = () => eliminarEntidad(e.id);
        row.querySelector('.crear-recibo-btn').onclick = () => crearReciboDesdeEntidad(e);

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
   EDITAR
========================= */

function editarEntidad(entidad) {
    entidadEditando = entidad;

    document.getElementById('nombre').value = entidad.nombre;
    document.getElementById('documento').value = entidad.documento || '';
    document.getElementById('telefono').value = entidad.telefono || '';
    document.getElementById('ciudad').value = entidad.ciudad || '';

    document
        .querySelector('#entidadForm button')
        .textContent = 'Actualizar entidad';
}

/* =========================
   ELIMINAR
========================= */

async function eliminarEntidad(id) {
    const ok = confirm('¿Seguro que deseas eliminar esta entidad?');
    if (!ok) return;

    try {
        const res = await window.entidades.eliminar(id);

        if (!res.success) {
            alert('No se pudo eliminar');
            return;
        }

        await cargarEntidades();

    } catch (err) {
        console.error(err);
        alert('Error eliminando entidad');
    }
}

/* =========================
   CREAR RECIBO
========================= */

function crearReciboDesdeEntidad(entidad) {
    sessionStorage.setItem(
        'clienteSeleccionado',
        JSON.stringify(entidad)
    );
    activarMenu('dashboard');
    cargarVista('dashboard-form');
}
