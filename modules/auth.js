const Store = require('electron-store').default;
const crypto = require('crypto');

const store = new Store();

const SESSION_DURATION = 1000 * 60 * 60 * 24 * 30;

const USER = {
    email: 'admin@billerdoc.com',
    password: '123456',
    name: 'Administrador'
};

function login(email, password) {
    console.log('AUTH LOGIN:', email, password);

    if (email !== USER.email || password !== USER.password) {
        console.warn('LOGIN FALLIDO');
        return null;
    }

    console.log('LOGIN OK');

    const token = crypto.randomUUID();

    store.set('session', {
        token,
        user: { email: USER.email, name: USER.name },
        expiresAt: Date.now() + SESSION_DURATION
    });

    return token;
}

function getSession() {
    const session = store.get('session');
    if (!session) return null;

    if (Date.now() > session.expiresAt) {
        store.delete('session');
        return null;
    }

    return session;
}

function logout() {
    store.delete('session');
}

module.exports = {
    login,
    getSession,
    logout
};