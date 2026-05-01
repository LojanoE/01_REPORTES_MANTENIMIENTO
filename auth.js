const Auth = {
    SUPABASE_URL: 'https://dzmhhlsttqygjvfabdxx.supabase.co',
    SUPABASE_KEY: 'sb_publishable_gqH1ZQ9bl--GBVfmcI4Q-A__UvBKemK',
    SESSION_KEY: 'ecsa_session',
    SESSION_DURATION: 8 * 60 * 60 * 1000,

    _supabase: null,

    getSupabaseClient() {
        if (!this._supabase) {
            this._supabase = supabase.createClient(this.SUPABASE_URL, this.SUPABASE_KEY);
        }
        return this._supabase;
    },

    async hashPassword(password, salt) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + salt);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    generateSalt() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
    },

    async login(username, password) {
        const db = this.getSupabaseClient();
        const { data, error } = await db
            .from('users')
            .select('*')
            .eq('username', username)
            .maybeSingle();

        if (error) throw error;
        if (!data) return { success: false, message: 'Usuario o contrasena incorrectos' };

        let authenticated = false;

        if (data.password_hash && data.salt) {
            const hash = await this.hashPassword(password, data.salt);
            authenticated = (hash === data.password_hash);
        } else if (data.password === password) {
            authenticated = true;
            try {
                const salt = this.generateSalt();
                const hash = await this.hashPassword(password, salt);
                await db.from('users').update({ password_hash: hash, salt: salt }).eq('id', data.id);
            } catch (e) {
                console.warn('No se pudo migrar el hash del usuario:', e.message);
            }
        }

        if (!authenticated) {
            return { success: false, message: 'Usuario o contrasena incorrectos' };
        }

        const session = {
            userId: data.id,
            username: data.username,
            role: data.role,
            loginTime: Date.now()
        };
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        return { success: true, user: session };
    },

    getSession() {
        const stored = localStorage.getItem(this.SESSION_KEY);
        if (!stored) return null;
        try {
            const session = JSON.parse(stored);
            if (Date.now() - session.loginTime > this.SESSION_DURATION) {
                this.logout();
                return null;
            }
            return session;
        } catch {
            this.logout();
            return null;
        }
    },

    getCurrentUser() {
        return this.getSession();
    },

    logout() {
        localStorage.removeItem(this.SESSION_KEY);
    },

    logoutAndRedirect() {
        this.logout();
        window.location.href = this.getPortalPath();
    },

    initPage() {
        const session = this.getSession();
        if (!session) {
            window.location.href = this.getPortalPath();
            return null;
        }
        return session;
    },

    getPortalPath() {
        const path = window.location.pathname;
        if (path.includes('/MANTENIMIENTO/') || path.includes('/POZOS/')) {
            return '../index.html';
        }
        return 'index.html';
    },

    hasRole(requiredRole) {
        const session = this.getSession();
        if (!session) return false;
        if (session.role === 'admin') return true;
        if (requiredRole === 'viewer') return true;
        return session.role === requiredRole;
    },

    renderUserBar(containerId) {
        const session = this.getSession();
        if (!session) return;

        const container = document.getElementById(containerId);
        if (!container) return;

        const roleLabels = { admin: 'Administrador', user: 'Usuario', viewer: 'Observador' };
        const roleColors = { admin: '#dc2626', user: '#2563eb', viewer: '#6b7280' };

        container.innerHTML = `
            <div class="auth-user-bar">
                <div class="auth-user-info">
                    <span class="auth-user-icon">&#128100;</span>
                    <span class="auth-user-name">${session.username}</span>
                    <span class="auth-user-role" style="background: ${roleColors[session.role] || '#6b7280'};">${roleLabels[session.role] || session.role}</span>
                </div>
                <button class="auth-logout-btn" onclick="Auth.logoutAndRedirect()">Cerrar Sesion</button>
            </div>
        `;
    }
};