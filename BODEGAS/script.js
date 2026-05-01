document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar Sesión
    const session = Auth.initPage();
    if (!session) return;

    // 2. Renderizar Barra de Usuario
    Auth.renderUserBar('userBar');

    // 3. Manejar Visibilidad según Rol
    if (session.role === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
    }

    // 4. Inicializar Supabase y Cargar Datos
    await loadInventory();
    await loadTransactions();
    await updateItemSelect();

    // 5. Event Listeners
    document.getElementById('inventorySearch').addEventListener('input', filterInventory);
    document.getElementById('categoryFilter').addEventListener('change', filterInventory);
    document.getElementById('itemForm')?.addEventListener('submit', handleNewItem);
    document.getElementById('transactionForm')?.addEventListener('submit', handleNewTransaction);
});

let inventoryData = [];
let transactionsData = [];

// ==================== INVENTARIO ====================

async function loadInventory() {
    try {
        const db = Auth.getSupabaseClient();
        const { data, error } = await db
            .from('bodegas_inventory')
            .select('*')
            .order('description', { ascending: true });

        if (error) throw error;
        inventoryData = data || [];
        renderInventory(inventoryData);
        populateCategories(inventoryData);
    } catch (err) {
        console.error('Error al cargar inventario:', err);
    }
}

function renderInventory(items) {
    const tbody = document.getElementById('inventoryTableBody');
    tbody.innerHTML = '';

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron artículos</td></tr>';
        return;
    }

    items.forEach(item => {
        let statusBadge = '';
        const stock = parseFloat(item.current_stock) || 0;
        const min = parseFloat(item.min_stock) || 0;

        if (stock <= 0) {
            statusBadge = '<span class="badge badge-stock badge-out">Sin Stock</span>';
        } else if (stock <= min) {
            statusBadge = '<span class="badge badge-stock badge-low">Stock Bajo</span>';
        } else {
            statusBadge = '<span class="badge badge-stock badge-ok">Normal</span>';
        }

        const row = `
            <tr>
                <td><code>${item.code}</code></td>
                <td><strong>${item.description}</strong></td>
                <td><span class="text-secondary">${item.category || '-'}</span></td>
                <td>${item.unit}</td>
                <td class="text-center"><h4>${stock}</h4></td>
                <td class="text-center text-secondary">${min}</td>
                <td class="text-center">${statusBadge}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function filterInventory() {
    const search = document.getElementById('inventorySearch').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;

    const filtered = inventoryData.filter(item => {
        const matchesSearch = item.code.toLowerCase().includes(search) || 
                              item.description.toLowerCase().includes(search);
        const matchesCategory = category === "" || item.category === category;
        return matchesSearch && matchesCategory;
    });

    renderInventory(filtered);
}

function populateCategories(items) {
    const select = document.getElementById('categoryFilter');
    const categories = [...new Set(items.map(i => i.category).filter(c => c))];
    
    // Mantener la opción "Todas"
    select.innerHTML = '<option value="">Todas las categorías</option>';
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        select.appendChild(opt);
    });
}

// ==================== MOVIMIENTOS ====================

async function loadTransactions() {
    try {
        const db = Auth.getSupabaseClient();
        const { data, error } = await db
            .from('bodegas_transactions')
            .select(`
                *,
                bodegas_inventory (code, description)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        transactionsData = data || [];
        renderTransactions(transactionsData);
    } catch (err) {
        console.error('Error al cargar movimientos:', err);
    }
}

function renderTransactions(trans) {
    const tbody = document.getElementById('transactionsTableBody');
    tbody.innerHTML = '';

    trans.forEach(t => {
        const typeBadge = t.type === 'IN' ? 
            '<span class="text-success">↑ INGRESO</span>' : 
            '<span class="text-danger">↓ EGRESO</span>';
        
        const row = `
            <tr>
                <td>${new Date(t.created_at).toLocaleString()}</td>
                <td>
                    <div class="small text-secondary">${t.bodegas_inventory?.code || '-'}</div>
                    <div>${t.bodegas_inventory?.description || '-'}</div>
                </td>
                <td>${typeBadge}</td>
                <td class="text-center"><strong>${t.quantity}</strong></td>
                <td>${t.reason || '-'}</td>
                <td><span class="badge bg-secondary">${t.created_by_name || 'Sistema'}</span></td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// ==================== GESTIÓN (ADMIN) ====================

async function handleNewItem(e) {
    e.preventDefault();
    const session = Auth.getSession();
    if (!Auth.isAdmin()) return alert('Solo administradores pueden realizar esta acción');

    const newItem = {
        code: document.getElementById('itemCode').value.trim(),
        description: document.getElementById('itemDescription').value.trim(),
        category: document.getElementById('itemCategory').value.trim(),
        unit: document.getElementById('itemUnit').value.trim() || 'UND',
        min_stock: parseFloat(document.getElementById('itemMinStock').value) || 0,
        current_stock: 0
    };

    try {
        const db = Auth.getSupabaseClient();
        const { error } = await db.from('bodegas_inventory').insert([newItem]);
        if (error) throw error;

        alert('Artículo registrado con éxito');
        e.target.reset();
        await loadInventory();
        await updateItemSelect();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function handleNewTransaction(e) {
    e.preventDefault();
    const session = Auth.getSession();
    if (session.role !== 'admin') return alert('Permiso denegado');

    const itemId = document.getElementById('transItem').value;
    const type = document.getElementById('transType').value;
    const qty = parseFloat(document.getElementById('transQty').value);
    const reason = document.getElementById('transReason').value.trim();

    if (!itemId || !qty) return alert('Complete todos los campos');

    // Validar stock suficiente para egresos
    if (type === 'OUT') {
        const item = inventoryData.find(i => i.id == itemId);
        if (item && item.current_stock < qty) {
            if (!confirm(`Stock insuficiente (${item.current_stock}). ¿Desea continuar de todos modos?`)) return;
        }
    }

    try {
        const db = Auth.getSupabaseClient();
        const { error } = await db.from('bodegas_transactions').insert([{
            item_id: itemId,
            type: type,
            quantity: qty,
            reason: reason,
            created_by_name: session.username
        }]);

        if (error) throw error;

        alert('Movimiento registrado correctamente');
        e.target.reset();
        await loadInventory();
        await loadTransactions();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function updateItemSelect() {
    const select = document.getElementById('transItem');
    if (!select) return;
    
    select.innerHTML = '<option value="">Seleccione un ítem...</option>';
    inventoryData.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.id;
        opt.textContent = `[${item.code}] ${item.description}`;
        select.appendChild(opt);
    });
}

function exportToExcel() {
    if (transactionsData.length === 0) return alert('No hay datos para exportar');
    
    const dataToExport = transactionsData.map(t => ({
        Fecha: new Date(t.created_at).toLocaleString(),
        Código: t.bodegas_inventory?.code,
        Descripción: t.bodegas_inventory?.description,
        Tipo: t.type === 'IN' ? 'INGRESO' : 'EGRESO',
        Cantidad: t.quantity,
        Motivo: t.reason,
        Responsable: t.created_by_name
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Movimientos");
    XLSX.writeFile(wb, `Reporte_Bodegas_${new Date().toISOString().split('T')[0]}.xlsx`);
}
