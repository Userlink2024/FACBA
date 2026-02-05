// ============================================
// C&A CLOUD FACTORY - Finanzas Module
// ============================================

import { checkAuthAndRedirect, logout, ROLES } from './auth.js';
import { getNavigationMenu, getRoleName } from './roles.js';
import { formatCurrency, getWeekStart, showToast, showConfirm } from './utils.js';
import { db, collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, Timestamp } from './firebase-init.js';

let orders = [];
let employees = [];
let inventory = [];

// Inicializar
async function init() {
    try {
        const { userData } = await checkAuthAndRedirect([ROLES.ADMIN_FINANZAS]);
        
        document.getElementById('userName').textContent = userData.nombre;
        document.getElementById('userRole').textContent = getRoleName(userData.rol);
        
        generateNavMenu(userData.rol);
        
        await Promise.all([
            loadOrders(),
            loadEmployees(),
            loadInventory(),
            loadPayrollData()
        ]);
        
        setupEventListeners();
        
    } catch (error) {
        console.error('Error de autenticación:', error);
    }
}

function generateNavMenu(rol) {
    const menu = getNavigationMenu(rol);
    const navMenu = document.getElementById('navMenu');
    navMenu.innerHTML = menu.map(item => `
        <a href="${item.href}" class="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition flex items-center gap-2 ${item.href === 'finanzas.html' ? 'bg-gray-700/50 text-white' : ''}">
            <i class="fas ${item.icon}"></i>
            <span>${item.name}</span>
        </a>
    `).join('');
}

// ==================== ÓRDENES ====================

async function loadOrders() {
    try {
        const q = query(collection(db, 'ordenes'), orderBy('fecha_creacion', 'desc'));
        
        onSnapshot(q, (snapshot) => {
            orders = [];
            let activeCount = 0;
            
            snapshot.forEach(doc => {
                const order = { id: doc.id, ...doc.data() };
                orders.push(order);
                if (order.estado === 'activa') activeCount++;
            });
            
            document.getElementById('totalOrders').textContent = activeCount;
            renderOrdersTable();
        });
        
    } catch (error) {
        console.error('Error cargando órdenes:', error);
    }
}

function renderOrdersTable(filter = '') {
    const tbody = document.getElementById('ordersTableBody');
    const statusFilter = document.getElementById('filterOrderStatus').value;
    
    let filtered = orders.filter(order => {
        const matchesSearch = order.cliente.toLowerCase().includes(filter.toLowerCase()) ||
                             order.modelo.toLowerCase().includes(filter.toLowerCase());
        const matchesStatus = statusFilter === 'all' || order.estado === statusFilter;
        return matchesSearch && matchesStatus;
    });
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">No se encontraron órdenes</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(order => {
        const progress = Math.round((order.pares_hechos / order.cantidad_total) * 100) || 0;
        const statusColor = order.estado === 'completada' ? 'bg-green-600/20 text-green-400' : 'bg-amber-600/20 text-amber-400';
        const statusText = order.estado === 'completada' ? 'Completada' : 'Activa';
        
        return `
            <tr class="hover:bg-gray-700/30 transition">
                <td class="px-6 py-4">
                    <p class="text-white font-medium">${order.cliente}</p>
                </td>
                <td class="px-6 py-4">
                    <p class="text-gray-300">${order.modelo}</p>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="flex-1 bg-gray-600 rounded-full h-2 max-w-[100px]">
                            <div class="bg-blue-500 h-2 rounded-full" style="width: ${progress}%"></div>
                        </div>
                        <span class="text-gray-400 text-sm">${order.pares_hechos}/${order.cantidad_total}</span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="px-3 py-1 rounded-full text-xs font-medium ${statusColor}">${statusText}</span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center justify-center gap-2">
                        <button class="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-600/20 rounded-lg transition edit-order-btn" data-id="${order.id}" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="p-2 text-gray-400 hover:text-red-400 hover:bg-red-600/20 rounded-lg transition delete-order-btn" data-id="${order.id}" data-cliente="${order.cliente}" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    document.querySelectorAll('.edit-order-btn').forEach(btn => {
        btn.addEventListener('click', () => editOrder(btn.dataset.id));
    });
    
    document.querySelectorAll('.delete-order-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const confirmed = await showConfirm('Eliminar Orden', `¿Eliminar la orden de ${btn.dataset.cliente}?`);
            if (confirmed) await deleteOrder(btn.dataset.id);
        });
    });
}

function editOrder(id) {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    
    document.getElementById('orderModalTitle').textContent = 'Editar Orden';
    document.getElementById('orderId').value = id;
    document.getElementById('orderCliente').value = order.cliente;
    document.getElementById('orderModelo').value = order.modelo;
    document.getElementById('orderCantidad').value = order.cantidad_total;
    document.getElementById('orderModal').classList.remove('hidden');
}

async function saveOrder(e) {
    e.preventDefault();
    
    const id = document.getElementById('orderId').value;
    const cliente = document.getElementById('orderCliente').value.trim();
    const modelo = document.getElementById('orderModelo').value.trim();
    const cantidad = parseInt(document.getElementById('orderCantidad').value);
    
    try {
        if (id) {
            await updateDoc(doc(db, 'ordenes', id), { cliente, modelo, cantidad_total: cantidad });
            showToast('Orden actualizada', 'success');
        } else {
            await addDoc(collection(db, 'ordenes'), {
                cliente,
                modelo,
                cantidad_total: cantidad,
                pares_hechos: 0,
                estado: 'activa',
                fecha_creacion: Timestamp.now()
            });
            showToast('Orden creada', 'success');
        }
        closeOrderModal();
    } catch (error) {
        console.error('Error guardando orden:', error);
        showToast('Error al guardar', 'error');
    }
}

async function deleteOrder(id) {
    try {
        await deleteDoc(doc(db, 'ordenes', id));
        showToast('Orden eliminada', 'success');
    } catch (error) {
        console.error('Error eliminando orden:', error);
        showToast('Error al eliminar', 'error');
    }
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.add('hidden');
    document.getElementById('orderForm').reset();
    document.getElementById('orderId').value = '';
}

// ==================== EMPLEADOS Y TARIFAS ====================

async function loadEmployees() {
    try {
        const snapshot = await getDocs(collection(db, 'users'));
        employees = [];
        
        snapshot.forEach(doc => {
            employees.push({ uid: doc.id, ...doc.data() });
        });
        
        renderRatesList();
    } catch (error) {
        console.error('Error cargando empleados:', error);
    }
}

function renderRatesList() {
    const list = document.getElementById('ratesList');
    const operarios = employees.filter(e => e.rol === 'operario');
    
    if (operarios.length === 0) {
        list.innerHTML = '<p class="text-gray-500 text-center py-4">No hay operarios registrados</p>';
        return;
    }
    
    list.innerHTML = operarios.map(emp => `
        <div class="flex items-center justify-between bg-gray-700/50 rounded-lg p-4">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                    <i class="fas fa-user text-gray-400"></i>
                </div>
                <div>
                    <p class="text-white font-medium">${emp.nombre}</p>
                    <p class="text-gray-500 text-sm">${emp.estado === 'sancionado' ? 'Sancionado' : 'Activo'}</p>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <input type="number" value="${emp.tarifa_par || 5000}" min="0" step="100" class="w-32 px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white text-right focus:outline-none focus:ring-2 focus:ring-emerald-500 rate-input" data-uid="${emp.uid}">
                <span class="text-gray-400 text-sm">/par</span>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('.rate-input').forEach(input => {
        input.addEventListener('change', async () => {
            const uid = input.dataset.uid;
            const newRate = parseInt(input.value) || 5000;
            
            try {
                await updateDoc(doc(db, 'users', uid), { tarifa_par: newRate });
                showToast('Tarifa actualizada', 'success');
            } catch (error) {
                console.error('Error actualizando tarifa:', error);
                showToast('Error al actualizar', 'error');
            }
        });
    });
}

// ==================== INVENTARIO ====================

async function loadInventory() {
    try {
        const q = query(collection(db, 'inventario'), orderBy('nombre'));
        
        onSnapshot(q, (snapshot) => {
            inventory = [];
            let alerts = 0;
            
            snapshot.forEach(doc => {
                const item = { id: doc.id, ...doc.data() };
                inventory.push(item);
                if (item.cantidad <= item.minimo) alerts++;
            });
            
            document.getElementById('inventoryAlerts').textContent = alerts;
            renderInventoryList();
        });
    } catch (error) {
        console.error('Error cargando inventario:', error);
    }
}

function renderInventoryList() {
    const list = document.getElementById('inventoryList');
    
    if (inventory.length === 0) {
        list.innerHTML = '<p class="text-gray-500 text-center py-4">No hay insumos registrados</p>';
        return;
    }
    
    list.innerHTML = inventory.map(item => {
        const isLow = item.cantidad <= item.minimo;
        const barColor = isLow ? 'bg-red-500' : 'bg-emerald-500';
        const percentage = Math.min((item.cantidad / (item.minimo * 3)) * 100, 100);
        
        return `
            <div class="bg-gray-700/50 rounded-lg p-4 ${isLow ? 'border-l-4 border-red-500' : ''}">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <p class="text-white font-medium">${item.nombre}</p>
                        <p class="text-gray-500 text-sm">Consumo: ${item.consumo_por_par} ${item.unidad}/par</p>
                    </div>
                    <div class="text-right">
                        <p class="text-white font-bold">${item.cantidad} ${item.unidad}</p>
                        ${isLow ? '<span class="text-red-400 text-xs">¡Stock bajo!</span>' : ''}
                    </div>
                </div>
                <div class="w-full bg-gray-600 rounded-full h-2">
                    <div class="${barColor} h-2 rounded-full" style="width: ${percentage}%"></div>
                </div>
                <p class="text-gray-500 text-xs mt-1">Mínimo: ${item.minimo} ${item.unidad}</p>
            </div>
        `;
    }).join('');
}

async function saveInsumo() {
    const nombre = document.getElementById('insumoNombre').value.trim();
    const cantidad = parseFloat(document.getElementById('insumoCantidad').value) || 0;
    const unidad = document.getElementById('insumoUnidad').value.trim() || 'unidad';
    const minimo = parseFloat(document.getElementById('insumoMinimo').value) || 10;
    const consumo = parseFloat(document.getElementById('insumoConsumo').value) || 0.1;
    
    if (!nombre) {
        showToast('Ingrese el nombre del insumo', 'warning');
        return;
    }
    
    try {
        const existing = inventory.find(i => i.nombre.toLowerCase() === nombre.toLowerCase());
        
        if (existing) {
            await updateDoc(doc(db, 'inventario', existing.id), {
                cantidad,
                unidad,
                minimo,
                consumo_por_par: consumo
            });
            showToast('Insumo actualizado', 'success');
        } else {
            await addDoc(collection(db, 'inventario'), {
                nombre,
                cantidad,
                unidad,
                minimo,
                consumo_por_par: consumo
            });
            showToast('Insumo agregado', 'success');
        }
        
        document.getElementById('insumoNombre').value = '';
        document.getElementById('insumoCantidad').value = '';
        document.getElementById('insumoUnidad').value = '';
        document.getElementById('insumoMinimo').value = '';
        document.getElementById('insumoConsumo').value = '';
        
    } catch (error) {
        console.error('Error guardando insumo:', error);
        showToast('Error al guardar', 'error');
    }
}

// ==================== NÓMINA ====================

async function loadPayrollData() {
    try {
        const weekStart = getWeekStart();
        
        const q = query(
            collection(db, 'produccion_logs'),
            where('fecha', '>=', Timestamp.fromDate(weekStart)),
            orderBy('fecha', 'desc')
        );
        
        onSnapshot(q, async (snapshot) => {
            const payrollData = {};
            let totalPares = 0;
            let totalNomina = 0;
            
            snapshot.forEach(doc => {
                const log = doc.data();
                const uid = log.uid_operario;
                
                if (!payrollData[uid]) {
                    payrollData[uid] = {
                        nombre: log.nombre_operario,
                        pares: 0,
                        monto: 0
                    };
                }
                
                payrollData[uid].pares += log.cantidad || 0;
                payrollData[uid].monto += log.monto_ganado || 0;
                totalPares += log.cantidad || 0;
                totalNomina += log.monto_ganado || 0;
            });
            
            document.getElementById('totalPares').textContent = totalPares;
            document.getElementById('totalNomina').textContent = formatCurrency(totalNomina);
            document.getElementById('payrollTotal').textContent = formatCurrency(totalNomina);
            
            renderPayrollList(payrollData);
        });
        
    } catch (error) {
        console.error('Error cargando nómina:', error);
    }
}

function renderPayrollList(data) {
    const list = document.getElementById('payrollList');
    const entries = Object.entries(data);
    
    if (entries.length === 0) {
        list.innerHTML = '<p class="text-gray-500 text-center py-4">Sin producción registrada esta semana</p>';
        return;
    }
    
    list.innerHTML = entries.map(([uid, info]) => `
        <div class="flex items-center justify-between bg-gray-700/50 rounded-lg p-4">
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                    <i class="fas fa-user text-blue-500"></i>
                </div>
                <div>
                    <p class="text-white font-medium">${info.nombre}</p>
                    <p class="text-gray-500 text-sm">${info.pares} pares producidos</p>
                </div>
            </div>
            <p class="text-2xl font-bold text-emerald-400">${formatCurrency(info.monto)}</p>
        </div>
    `).join('');
}

async function closeWeek() {
    const confirmed = await showConfirm(
        'Cerrar Semana',
        '¿Está seguro de cerrar la semana? Esto generará un resumen y descontará el inventario según la producción.'
    );
    
    if (!confirmed) return;
    
    try {
        const weekStart = getWeekStart();
        
        // Obtener producción de la semana
        const prodQuery = query(
            collection(db, 'produccion_logs'),
            where('fecha', '>=', Timestamp.fromDate(weekStart))
        );
        
        const prodSnapshot = await getDocs(prodQuery);
        let totalPares = 0;
        
        prodSnapshot.forEach(doc => {
            totalPares += doc.data().cantidad || 0;
        });
        
        // Descontar inventario
        for (const item of inventory) {
            const consumo = totalPares * (item.consumo_por_par || 0);
            const newCantidad = Math.max(0, item.cantidad - consumo);
            
            await updateDoc(doc(db, 'inventario', item.id), {
                cantidad: newCantidad
            });
        }
        
        // Guardar resumen de cierre
        await addDoc(collection(db, 'cierres_semana'), {
            fecha_inicio: Timestamp.fromDate(weekStart),
            fecha_cierre: Timestamp.now(),
            total_pares: totalPares,
            total_nomina: parseFloat(document.getElementById('payrollTotal').textContent.replace(/[^\d]/g, '')) || 0
        });
        
        showToast('Semana cerrada correctamente. Inventario actualizado.', 'success');
        
    } catch (error) {
        console.error('Error cerrando semana:', error);
        showToast('Error al cerrar semana', 'error');
    }
}

// ==================== TABS ====================

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-emerald-600', 'text-white');
        btn.classList.add('text-gray-400');
    });
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('bg-emerald-600', 'text-white');
    document.querySelector(`[data-tab="${tabName}"]`).classList.remove('text-gray-400');
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    document.getElementById(`${tabName}Tab`).classList.remove('hidden');
}

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    document.getElementById('searchOrders').addEventListener('input', (e) => {
        renderOrdersTable(e.target.value);
    });
    
    document.getElementById('filterOrderStatus').addEventListener('change', () => {
        renderOrdersTable(document.getElementById('searchOrders').value);
    });
    
    document.getElementById('newOrderBtn').addEventListener('click', () => {
        document.getElementById('orderModalTitle').textContent = 'Nueva Orden';
        document.getElementById('orderId').value = '';
        document.getElementById('orderForm').reset();
        document.getElementById('orderModal').classList.remove('hidden');
    });
    
    document.getElementById('closeOrderModal').addEventListener('click', closeOrderModal);
    document.getElementById('cancelOrderModal').addEventListener('click', closeOrderModal);
    document.getElementById('orderForm').addEventListener('submit', saveOrder);
    
    document.getElementById('saveInsumoBtn').addEventListener('click', saveInsumo);
    document.getElementById('closeWeekBtn').addEventListener('click', closeWeek);
}

// Iniciar
init();
