function activarCuenta() {
    cargarEmpresa();
    configurarEventosCuenta();
}

async function cargarEmpresa() {
    const data = await window.empresa.obtener();
    if (!data) return;

    document.getElementById('empresaNombre').textContent = data.nombre || '—';
    document.getElementById('empresaNit').textContent = data.nit || '—';
    document.getElementById('empresaDireccion').textContent = data.direccion || '—';
    document.getElementById('empresaTelefono').textContent = data.telefono || '—';
    document.getElementById('empresaCorreo').textContent = data.correo || '—';

    const logo = document.getElementById('empresaLogo');
    if (logo && data.logo) {
        const logoPath = await window.empresa.logo();
        logo.src = `file://${logoPath}?t=${Date.now()}`;
    }
}

let eventosConfigurados = false;

function configurarEventosCuenta() {
    if (eventosConfigurados) return; // 👈 evita duplicar listeners
    eventosConfigurados = true;

    document.addEventListener('click', async (e) => {

        if (e.target?.id === 'btnCambiarLogo') {
            const res = await window.empresa.cambiarLogo();
            if (!res.success) {
                if (res.message) {
                    alert(res.message);
                }
                return;
            }
            cargarEmpresa();
        }

        if (e.target?.id === 'btnEditarEmpresa') {
            abrirModalEmpresa();
        }

        if (e.target?.id === 'btnGuardarEmpresa') {
            await guardarEmpresa();
        }

        if (e.target?.id === 'btnCancelarEmpresa') {
            cerrarModalEmpresa();
        }

    });
}

/* =========================
   MODAL
========================= */
function abrirModalEmpresa() {
    const modal = document.getElementById('modalEmpresa');
    if (!modal) return;

    window.empresa.obtener().then(data => {
        editNombre.value = data.nombre || '';
        editNit.value = data.nit || '';
        editDireccion.value = data.direccion || '';
        editTelefono.value = data.telefono || '';
        editCorreo.value = data.correo || '';
    });

    modal.classList.remove('hidden');
}

function cerrarModalEmpresa() {
    const modal = document.getElementById('modalEmpresa');
    if (modal) modal.classList.add('hidden');
}

async function guardarEmpresa() {
    const payload = {
        nombre: editNombre.value.trim(),
        nit: editNit.value.trim(),
        direccion: editDireccion.value.trim(),
        telefono: editTelefono.value.trim(),
        correo: editCorreo.value.trim()
    };

    const res = await window.empresa.guardar(payload);
    if (!res.success) {
        alert(res.message || 'Error guardando datos');
        return;
    }

    cerrarModalEmpresa();
    cargarEmpresa();
}
