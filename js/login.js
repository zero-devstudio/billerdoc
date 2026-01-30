const form = document.getElementById('loginForm');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    console.log('INTENTANDO LOGIN:', email);

    if (!email || !password) {
        alert('Debes completar todos los campos');
        return;
    }

    try {
        const result = await window.auth.login(email, password);

        console.log('LOGIN RESULT:', result);

        if (!result || !result.success) {
            alert(result?.message || 'Credenciales incorrectas');
            return;
        }

        window.location.href = '../index.html';

    } catch (err) {
        console.error('ERROR LOGIN:', err);
        alert('Error interno al iniciar sesión');
    }
});
