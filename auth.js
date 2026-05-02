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

        const permissions = await this.loadPermissions(data.id);

        const session = {
            userId: data.id,
            username: data.username,
            role: data.role,
            permissions: permissions,
            loginTime: Date.now()
        };
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));

        await this.setCurrentUser(data.username);

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
        if (path.includes('/MANTENIMIENTO/') || path.includes('/POZOS/') || path.includes('/BODEGAS/')) {
            return '../index.html';
        }
        return 'index.html';
    },

    isAdmin() {
        const session = this.getSession();
        return session && session.role === 'admin';
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
        const roleClasses = { admin: 'user-bar__role--admin', user: 'user-bar__role--user', viewer: 'user-bar__role--viewer' };
        const adminBtn = session.role === 'admin' ? '<button class="auth-admin-btn" onclick="toggleUserPanel()">&#9881; Gestionar Usuarios</button>' : '';
        const auditBtn = session.role === 'admin' ? '<button class="auth-admin-btn" onclick="toggleAuditPanel()">&#128203; Auditoria</button>' : '';

        const isSubApp = window.location.pathname.includes('/MANTENIMIENTO/') ||
                         window.location.pathname.includes('/POZOS/') ||
                         window.location.pathname.includes('/BODEGAS/');
        const backBtn = isSubApp
            ? '<button class="auth-back-btn" onclick="window.location.href=Auth.getPortalPath()">&#8592; Portal</button>'
            : '';

        container.innerHTML = `
            <div class="auth-user-bar">
                <div class="auth-user-info">
                    <span class="auth-user-icon">&#128100;</span>
                    <span class="auth-user-name">${session.username}</span>
                    <span class="auth-user-role ${roleClasses[session.role] || ''}">${roleLabels[session.role] || session.role}</span>
                </div>
                <div class="auth-user-actions">
                    ${backBtn}
                    ${auditBtn}
                    ${adminBtn}
                    <button class="auth-logout-btn" onclick="Auth.logoutAndRedirect()">Cerrar Sesion</button>
                </div>
            </div>
        `;
    },

    // ==================== USER MANAGEMENT ====================

    async loadUsers() {
        const db = this.getSupabaseClient();
        const { data, error } = await db
            .from('users')
            .select('id, username, role')
            .order('username', { ascending: true });
        if (error) {
            console.error('Error cargando usuarios:', error);
            throw error;
        }
        return data || [];
    },

    async saveUser(userId, username, password, role) {
        const db = this.getSupabaseClient();

        if (!username) throw new Error('Ingrese el nombre de usuario');
        if (!password && !userId) throw new Error('Ingrese la contrasena');

        if (userId) {
            const updateData = { username: username, role: role };
            if (password) {
                const salt = this.generateSalt();
                const hash = await this.hashPassword(password, salt);
                updateData.password = password;
                updateData.password_hash = hash;
                updateData.salt = salt;
            }
            const { error } = await db.from('users').update(updateData).eq('id', userId);
            if (error) throw error;
        } else {
            if (!password) throw new Error('Ingrese la contrasena');
            const salt = this.generateSalt();
            const hash = await this.hashPassword(password, salt);
            const { error } = await db.from('users').insert([{
                username: username,
                password: password,
                password_hash: hash,
                salt: salt,
                role: role
            }]);
            if (error) throw error;
        }
    },

    async deleteUser(id) {
        const db = this.getSupabaseClient();
        const { error } = await db.from('users').delete().eq('id', id);
        if (error) throw error;
    },

    getRoleBadge(role) {
        const badges = {
            'admin': '<span class="badge bg-danger">Admin</span>',
            'user': '<span class="badge bg-primary">User</span>',
            'viewer': '<span class="badge bg-secondary">Viewer</span>'
        };
        return badges[role] || '<span class="badge bg-light text-dark">' + role + '</span>';
    },

    // ==================== PERMISSIONS ====================

    async loadPermissions(userId) {
        const db = this.getSupabaseClient();
        const { data, error } = await db.rpc('get_user_permissions', { p_user_id: userId });
        if (error) {
            console.warn('Error cargando permisos:', error.message);
            return {};
        }
        const perms = {};
        (data || []).forEach(p => {
            perms[p.module] = {
                can_view: p.can_view,
                can_edit: p.can_edit,
                can_delete: p.can_delete,
                can_export: p.can_export
            };
        });
        return perms;
    },

    async savePermissions(userId, permissions) {
        const db = this.getSupabaseClient();
        for (const [module, perms] of Object.entries(permissions)) {
            const { error } = await db
                .from('user_permissions')
                .upsert({
                    user_id: userId,
                    module: module,
                    can_view: perms.can_view || false,
                    can_edit: perms.can_edit || false,
                    can_delete: perms.can_delete || false,
                    can_export: perms.can_export || false
                }, { onConflict: 'user_id,module' })
                .execute();
            if (error) throw new Error(`Error en modulo ${module}: ${error.message}`);
        }
    },

    async createDefaultPermissions(userId, role) {
        const db = this.getSupabaseClient();
        const { error } = await db.rpc('create_default_permissions', {
            p_user_id: userId,
            p_role: role
        });
        if (error) throw error;
    },

    hasPermission(module, action) {
        const session = this.getSession();
        if (!session) return false;
        if (session.role === 'admin') return true;
        if (!session.permissions || !session.permissions[module]) return false;
        const key = 'can_' + action;
        return !!session.permissions[module][key];
    },

    canView(module) { return this.hasPermission(module, 'view'); },
    canEdit(module) { return this.hasPermission(module, 'edit'); },
    canDelete(module) { return this.hasPermission(module, 'delete'); },
    canExport(module) { return this.hasPermission(module, 'export'); },

    async setCurrentUser(username) {
        try {
            const db = this.getSupabaseClient();
            await db.rpc('set_current_user', { username: username });
        } catch (e) {
            console.warn('No se pudo setear current_user:', e.message);
        }
    },

    async loadAuditLog(filters = {}) {
        const db = this.getSupabaseClient();
        let query = db
            .from('audit_log')
            .select('id,module,table_name,record_id,action,old_values,new_values,changed_by,changed_at,description')
            .order('changed_at', { ascending: false })
            .limit(500);

        if (filters.module) query = query.eq('module', filters.module);
        if (filters.action) query = query.eq('action', filters.action);
        if (filters.changed_by) query = query.ilike('changed_by', '%' + filters.changed_by + '%');
        if (filters.date_from) query = query.gte('changed_at', filters.date_from);
        if (filters.date_to) query = query.lte('changed_at', filters.date_to + 'T23:59:59');

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    }
};