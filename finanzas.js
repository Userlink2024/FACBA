// ============================================
// C&A CLOUD FACTORY - Finanzas Module
// ============================================

import { checkAuthAndRedirect, logout, ROLES } from './auth.js';
import { getNavigationMenu, getRoleName } from './roles.js';
import { formatCurrency, getWeekStart, showToast, showConfirm } from './utils.js';
import { db, collection, doc, getDocs, addDoc, updateDoc, deleteDoc, setDoc, query, where, orderBy, onSnapshot, Timestamp } from './firebase-init.js';
import { initNotifications } from './notifications.js';

let orders = [];
let employees = [];
let inventory = [];

// Inicializar
async function init() {
    try {
        const { user, userData } = await checkAuthAndRedirect([ROLES.ADMIN_FINANZAS, ROLES.ADMIN_RRHH]);
        
        document.getElementById('userName').textContent = userData.nombre;
        document.getElementById('userRole').textContent = getRoleName(userData.rol);
        
        generateNavMenu(userData.rol);
        
        // Inicializar notificaciones globales
        initNotifications(user.uid);
        
        await Promise.all([
            loadOrders(),
            loadEmployees(),
            loadInventory(),
            loadPayrollData(),
            loadCajaMenor(),
            loadPedidosCliente(),
            loadClientes()
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
            <div class="bg-gray-700/50 rounded-lg p-4 ${isLow ? 'border-l-4 border-red-500' : ''}" data-id="${item.id}">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <p class="text-white font-medium">${item.nombre}</p>
                        <p class="text-gray-500 text-sm">Consumo: ${item.consumo_por_par} ${item.unidad}/par</p>
                    </div>
                    <div class="flex items-start gap-2">
                        <div class="text-right">
                            <p class="text-white font-bold">${item.cantidad} ${item.unidad}</p>
                            ${isLow ? '<span class="text-red-400 text-xs">¡Stock bajo!</span>' : ''}
                        </div>
                        <div class="flex gap-1">
                            <button class="edit-inv-btn p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-600/20 rounded transition" data-id="${item.id}" title="Editar">
                                <i class="fas fa-edit text-sm"></i>
                            </button>
                            <button class="delete-inv-btn p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-600/20 rounded transition" data-id="${item.id}" data-nombre="${item.nombre}" title="Eliminar">
                                <i class="fas fa-trash text-sm"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="w-full bg-gray-600 rounded-full h-2">
                    <div class="${barColor} h-2 rounded-full" style="width: ${percentage}%"></div>
                </div>
                <p class="text-gray-500 text-xs mt-1">Mínimo: ${item.minimo} ${item.unidad}</p>
            </div>
        `;
    }).join('');
    
    // Event listeners para editar
    document.querySelectorAll('.edit-inv-btn').forEach(btn => {
        btn.addEventListener('click', () => editInventoryItem(btn.dataset.id));
    });
    
    // Event listeners para eliminar
    document.querySelectorAll('.delete-inv-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const confirmed = await showConfirm('Eliminar Insumo', `¿Eliminar "${btn.dataset.nombre}" del inventario?`);
            if (confirmed) await deleteInventoryItem(btn.dataset.id);
        });
    });
}

function editInventoryItem(id) {
    const item = inventory.find(i => i.id === id);
    if (!item) return;
    
    document.getElementById('insumoNombre').value = item.nombre;
    document.getElementById('insumoCantidad').value = item.cantidad;
    document.getElementById('insumoUnidad').value = item.unidad;
    document.getElementById('insumoMinimo').value = item.minimo;
    document.getElementById('insumoConsumo').value = item.consumo_por_par;
    
    document.getElementById('insumoNombre').focus();
    showToast('Editando: ' + item.nombre, 'info');
}

async function deleteInventoryItem(id) {
    try {
        await deleteDoc(doc(db, 'inventario', id));
        showToast('Insumo eliminado', 'success');
    } catch (error) {
        console.error('Error eliminando insumo:', error);
        showToast('Error al eliminar', 'error');
    }
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

// ==================== CAJA MENOR ====================

let cajaMenorMovimientos = [];

async function loadCajaMenor() {
    try {
        const q = query(collection(db, 'caja_menor'), orderBy('fecha', 'desc'));
        
        onSnapshot(q, (snapshot) => {
            cajaMenorMovimientos = [];
            let saldo = 0;
            
            snapshot.forEach(docSnap => {
                const mov = { id: docSnap.id, ...docSnap.data() };
                cajaMenorMovimientos.push(mov);
            });
            
            // Calcular saldo
            cajaMenorMovimientos.forEach(mov => {
                if (mov.tipo === 'ingreso') saldo += mov.monto;
                else saldo -= mov.monto;
            });
            
            document.getElementById('saldoCajaMenor').textContent = formatCurrency(saldo);
            document.getElementById('saldoCajaMenor').className = saldo >= 0 ? 'text-3xl font-bold text-emerald-400' : 'text-3xl font-bold text-red-400';
            
            renderCajaMenorList();
        });
    } catch (error) {
        console.error('Error cargando caja menor:', error);
    }
}

function renderCajaMenorList() {
    const list = document.getElementById('cajaMenorList');
    
    if (cajaMenorMovimientos.length === 0) {
        list.innerHTML = '<p class="text-gray-500 text-center py-8">No hay movimientos registrados</p>';
        return;
    }
    
    list.innerHTML = cajaMenorMovimientos.slice(0, 50).map(mov => {
        const isIngreso = mov.tipo === 'ingreso';
        const fecha = mov.fecha?.toDate ? mov.fecha.toDate().toLocaleDateString('es-CO') : '';
        
        return `
            <div class="flex items-center justify-between bg-gray-700/50 rounded-lg p-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 ${isIngreso ? 'bg-emerald-600/20' : 'bg-red-600/20'} rounded-xl flex items-center justify-center">
                        <i class="fas ${isIngreso ? 'fa-arrow-down' : 'fa-arrow-up'} ${isIngreso ? 'text-emerald-500' : 'text-red-500'}"></i>
                    </div>
                    <div>
                        <p class="text-white font-medium">${mov.concepto}</p>
                        <p class="text-gray-500 text-sm">${fecha}</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <p class="text-lg font-bold ${isIngreso ? 'text-emerald-400' : 'text-red-400'}">
                        ${isIngreso ? '+' : '-'}${formatCurrency(mov.monto)}
                    </p>
                    <button class="delete-caja-btn p-2 text-gray-400 hover:text-red-400 hover:bg-red-600/20 rounded-lg transition" data-id="${mov.id}" title="Eliminar">
                        <i class="fas fa-trash text-sm"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('.delete-caja-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const confirmed = await showConfirm('Eliminar Movimiento', '¿Eliminar este movimiento de caja?');
            if (confirmed) {
                try {
                    await deleteDoc(doc(db, 'caja_menor', btn.dataset.id));
                    showToast('Movimiento eliminado', 'success');
                } catch (error) {
                    showToast('Error al eliminar', 'error');
                }
            }
        });
    });
}

async function saveCajaMovimiento() {
    const tipo = document.getElementById('cajaMovTipo').value;
    const concepto = document.getElementById('cajaMovConcepto').value.trim();
    const monto = parseFloat(document.getElementById('cajaMovMonto').value) || 0;
    
    if (!concepto || monto <= 0) {
        showToast('Complete todos los campos', 'warning');
        return;
    }
    
    try {
        await addDoc(collection(db, 'caja_menor'), {
            tipo,
            concepto,
            monto,
            fecha: Timestamp.now(),
            registrado_por: document.getElementById('userName').textContent
        });
        
        document.getElementById('cajaMovConcepto').value = '';
        document.getElementById('cajaMovMonto').value = '';
        
        showToast(`${tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} registrado`, 'success');
    } catch (error) {
        console.error('Error guardando movimiento:', error);
        showToast('Error al guardar', 'error');
    }
}

// ==================== EXPORTAR PDF ====================

async function exportarInformePDF() {
    showToast('Generando informe...', 'info');
    
    // Cargar jsPDF dinámicamente
    if (!window.jspdf) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        document.head.appendChild(script);
        await new Promise(resolve => script.onload = resolve);
    }
    
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    
    const fechaHoy = new Date().toLocaleDateString('es-CO', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    
    // Encabezado
    pdf.setFillColor(30, 41, 59);
    pdf.rect(0, 0, 210, 40, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.text('C&A Cloud Factory', 20, 25);
    pdf.setFontSize(10);
    pdf.text('Informe Financiero - ' + fechaHoy, 20, 35);
    
    let y = 55;
    
    // Resumen
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(16);
    pdf.text('Resumen Semanal', 20, y);
    y += 10;
    
    pdf.setFontSize(11);
    pdf.text(`Órdenes Activas: ${document.getElementById('totalOrders').textContent}`, 20, y);
    y += 7;
    pdf.text(`Pares Producidos: ${document.getElementById('totalPares').textContent}`, 20, y);
    y += 7;
    pdf.text(`Total Nómina: ${document.getElementById('totalNomina').textContent}`, 20, y);
    y += 7;
    pdf.text(`Alertas Inventario: ${document.getElementById('inventoryAlerts').textContent}`, 20, y);
    y += 15;
    
    // Órdenes
    pdf.setFontSize(16);
    pdf.text('Órdenes de Trabajo', 20, y);
    y += 10;
    
    pdf.setFontSize(10);
    orders.slice(0, 10).forEach(order => {
        const progress = Math.round((order.pares_hechos / order.cantidad_total) * 100) || 0;
        pdf.text(`• ${order.cliente} - ${order.modelo}: ${order.pares_hechos}/${order.cantidad_total} (${progress}%)`, 25, y);
        y += 6;
        if (y > 270) { pdf.addPage(); y = 20; }
    });
    
    y += 10;
    
    // Nómina
    pdf.setFontSize(16);
    pdf.text('Detalle Nómina', 20, y);
    y += 10;
    
    const payrollItems = document.querySelectorAll('#payrollList > div');
    pdf.setFontSize(10);
    payrollItems.forEach(item => {
        const nombre = item.querySelector('p.text-white')?.textContent || '';
        const monto = item.querySelector('p.text-emerald-400')?.textContent || '';
        if (nombre && monto) {
            pdf.text(`• ${nombre}: ${monto}`, 25, y);
            y += 6;
            if (y > 270) { pdf.addPage(); y = 20; }
        }
    });
    
    y += 10;
    
    // Inventario
    if (y > 230) { pdf.addPage(); y = 20; }
    pdf.setFontSize(16);
    pdf.text('Estado de Inventario', 20, y);
    y += 10;
    
    pdf.setFontSize(10);
    inventory.forEach(item => {
        const status = item.cantidad <= item.minimo ? ' ⚠️ BAJO' : '';
        pdf.text(`• ${item.nombre}: ${item.cantidad} ${item.unidad}${status}`, 25, y);
        y += 6;
        if (y > 270) { pdf.addPage(); y = 20; }
    });
    
    // Pie de página
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text('Generado por C&A Cloud Factory ERP', 20, 285);
    
    // Descargar
    pdf.save(`Informe_CA_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast('Informe PDF generado', 'success');
}

// ==================== PEDIDOS CLIENTE ====================

let pedidosCliente = [];

async function loadPedidosCliente() {
    try {
        const q = query(collection(db, 'pedidos_cliente'), orderBy('fecha_creacion', 'desc'));
        
        onSnapshot(q, (snapshot) => {
            pedidosCliente = [];
            let pendientes = 0, porRecibir = 0, enProduccion = 0, completadosHoy = 0;
            const hoy = new Date().toDateString();
            
            snapshot.forEach(docSnap => {
                const pedido = { id: docSnap.id, ...docSnap.data() };
                pedidosCliente.push(pedido);
                
                if (pedido.estado === 'pendiente') pendientes++;
                if (pedido.estado === 'en_produccion') enProduccion++;
                if (pedido.estado === 'completado' && pedido.fecha_completado?.toDate?.()?.toDateString() === hoy) completadosHoy++;
                
                if (pedido.materiales) {
                    porRecibir += pedido.materiales.filter(m => !m.recibido).length;
                }
            });
            
            document.getElementById('pedidosPendientesCount').textContent = pendientes;
            document.getElementById('materialesPorRecibir').textContent = porRecibir;
            document.getElementById('pedidosEnProduccion').textContent = enProduccion;
            document.getElementById('pedidosCompletadosHoy').textContent = completadosHoy;
            
            const badge = document.getElementById('pedidosClienteBadge');
            if (pendientes > 0) {
                badge.textContent = pendientes;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
            
            renderPedidosCliente();
            loadClientInventory();
        });
    } catch (error) {
        console.error('Error cargando pedidos cliente:', error);
    }
}

function renderPedidosCliente() {
    const list = document.getElementById('pedidosClienteList');
    const filter = document.getElementById('filterPedidoEstado')?.value || 'todos';
    
    let filtered = pedidosCliente;
    if (filter !== 'todos') {
        filtered = pedidosCliente.filter(p => p.estado === filter);
    }
    
    if (filtered.length === 0) {
        list.innerHTML = '<p class="text-gray-500 text-center py-8">Sin pedidos de clientes</p>';
        return;
    }
    
    const statusConfig = {
        'pendiente': { color: 'bg-amber-600/20 text-amber-400', label: 'Pendiente', icon: 'clock' },
        'materiales_recibidos': { color: 'bg-blue-600/20 text-blue-400', label: 'Mat. Recibidos', icon: 'box' },
        'en_produccion': { color: 'bg-purple-600/20 text-purple-400', label: 'En Producción', icon: 'cogs' },
        'completado': { color: 'bg-green-600/20 text-green-400', label: 'Completado', icon: 'check' },
        'entregado': { color: 'bg-emerald-600/20 text-emerald-400', label: 'Entregado', icon: 'truck' }
    };
    
    list.innerHTML = filtered.map(pedido => {
        const status = statusConfig[pedido.estado] || statusConfig['pendiente'];
        const fecha = pedido.fecha_creacion?.toDate?.() ? pedido.fecha_creacion.toDate().toLocaleDateString('es-CO') : '-';
        const fechaEntrega = pedido.fecha_entrega_esperada?.toDate?.() ? pedido.fecha_entrega_esperada.toDate().toLocaleDateString('es-CO') : '-';
        const progress = pedido.pares_hechos ? Math.round((pedido.pares_hechos / pedido.cantidad) * 100) : 0;
        
        const materialesHtml = pedido.materiales?.map((m, idx) => `
            <div class="flex items-center justify-between bg-gray-700/30 rounded px-3 py-2">
                <span class="text-gray-300 text-sm">${m.nombre}: ${m.cantidad} ${m.unidad}</span>
                ${m.recibido 
                    ? '<span class="text-green-400 text-xs"><i class="fas fa-check mr-1"></i>Recibido</span>'
                    : `<button class="recibir-mat-btn px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition" data-pedido="${pedido.id}" data-idx="${idx}">
                        <i class="fas fa-hand-holding mr-1"></i>Recibir
                       </button>`
                }
            </div>
        `).join('') || '';
        
        return `
            <div class="bg-gray-700/50 rounded-xl p-4 border-l-4 ${pedido.estado === 'pendiente' ? 'border-amber-500' : pedido.estado === 'en_produccion' ? 'border-purple-500' : 'border-gray-600'}">
                <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                            <h4 class="text-white font-semibold text-lg">${pedido.modelo}</h4>
                            <span class="px-2 py-1 rounded-full text-xs ${status.color}">
                                <i class="fas fa-${status.icon} mr-1"></i>${status.label}
                            </span>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <p class="text-gray-400">
                                <i class="fas fa-user mr-1 text-blue-400"></i><strong>Cliente:</strong> ${pedido.cliente_nombre || 'N/A'}
                            </p>
                            <p class="text-gray-400">
                                <i class="fas fa-hashtag mr-1 text-gray-500"></i><strong>ID:</strong> ${pedido.id.slice(-8).toUpperCase()}
                            </p>
                            <p class="text-gray-400">
                                <i class="fas fa-calendar-plus mr-1 text-green-400"></i><strong>Creado:</strong> ${fecha}
                            </p>
                            <p class="text-gray-400">
                                <i class="fas fa-calendar-check mr-1 text-amber-400"></i><strong>Entrega:</strong> ${fechaEntrega}
                            </p>
                            ${pedido.tallas ? `
                            <p class="text-gray-400">
                                <i class="fas fa-ruler mr-1 text-purple-400"></i><strong>Tallas:</strong> ${pedido.tallas}
                            </p>` : ''}
                            <p class="text-gray-400">
                                <i class="fas fa-shoe-prints mr-1 text-blue-400"></i><strong>Cantidad:</strong> ${pedido.cantidad} pares
                            </p>
                        </div>
                        ${pedido.color ? `
                        <div class="mt-3 p-3 bg-gradient-to-r from-pink-900/30 to-purple-900/30 border border-pink-700/50 rounded-lg">
                            <p class="text-white font-medium text-sm">
                                <i class="fas fa-palette mr-2 text-pink-400"></i>🎨 <strong>Color Principal:</strong> 
                                <span class="text-pink-300 font-bold">${pedido.color}</span>
                                ${pedido.color_secundario ? `<span class="text-gray-400 mx-2">|</span><strong>Secundario:</strong> <span class="text-purple-300">${pedido.color_secundario}</span>` : ''}
                            </p>
                        </div>` : ''}
                        ${pedido.notas ? `
                        <div class="mt-3 p-2 bg-gray-800/50 rounded-lg">
                            <p class="text-gray-400 text-sm"><i class="fas fa-sticky-note mr-1 text-yellow-400"></i><strong>Notas:</strong> ${pedido.notas}</p>
                        </div>` : ''}
                    </div>
                    <div class="text-right">
                        <p class="text-3xl font-bold text-white">${pedido.cantidad}</p>
                        <p class="text-gray-400 text-sm">pares totales</p>
                        ${pedido.estado === 'en_produccion' ? `
                            <div class="mt-2">
                                <p class="text-purple-400 font-medium">${pedido.pares_hechos || 0} / ${pedido.cantidad}</p>
                                <div class="w-24 bg-gray-700 rounded-full h-2 mt-1">
                                    <div class="bg-purple-500 h-2 rounded-full" style="width: ${progress}%"></div>
                                </div>
                                <p class="text-gray-500 text-xs mt-1">${progress}% completado</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                ${pedido.materiales && pedido.materiales.length > 0 ? `
                    <div class="mt-4 pt-4 border-t border-gray-600">
                        <p class="text-gray-400 text-sm mb-2"><i class="fas fa-cubes mr-1"></i>Materiales:</p>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            ${materialesHtml}
                        </div>
                    </div>
                ` : ''}
                
                <div class="mt-4 pt-4 border-t border-gray-600 flex flex-wrap gap-2">
                    ${pedido.estado === 'pendiente' || pedido.estado === 'materiales_recibidos' ? `
                        <button class="iniciar-produccion-btn px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition" data-id="${pedido.id}">
                            <i class="fas fa-play mr-1"></i>Iniciar Producción
                        </button>
                    ` : ''}
                    ${pedido.estado === 'en_produccion' ? `
                        <button class="completar-pedido-btn px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition" data-id="${pedido.id}">
                            <i class="fas fa-check mr-1"></i>Marcar Completado
                        </button>
                    ` : ''}
                    ${pedido.estado === 'completado' ? `
                        <button class="entregar-pedido-btn px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition" data-id="${pedido.id}">
                            <i class="fas fa-truck mr-1"></i>Marcar Entregado
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    // Event listeners
    document.querySelectorAll('.recibir-mat-btn').forEach(btn => {
        btn.addEventListener('click', () => recibirMaterial(btn.dataset.pedido, parseInt(btn.dataset.idx)));
    });
    
    document.querySelectorAll('.iniciar-produccion-btn').forEach(btn => {
        btn.addEventListener('click', () => cambiarEstadoPedido(btn.dataset.id, 'en_produccion'));
    });
    
    document.querySelectorAll('.completar-pedido-btn').forEach(btn => {
        btn.addEventListener('click', () => cambiarEstadoPedido(btn.dataset.id, 'completado'));
    });
    
    document.querySelectorAll('.entregar-pedido-btn').forEach(btn => {
        btn.addEventListener('click', () => cambiarEstadoPedido(btn.dataset.id, 'entregado'));
    });
}

async function recibirMaterial(pedidoId, materialIdx) {
    try {
        const pedido = pedidosCliente.find(p => p.id === pedidoId);
        if (!pedido || !pedido.materiales[materialIdx]) return;
        
        const material = pedido.materiales[materialIdx];
        material.recibido = true;
        material.fecha_recibido = Timestamp.now();
        
        await updateDoc(doc(db, 'pedidos_cliente', pedidoId), {
            materiales: pedido.materiales
        });
        
        // Agregar al inventario de clientes
        await addDoc(collection(db, 'inventario_clientes'), {
            cliente_id: pedido.cliente_id,
            cliente_nombre: pedido.cliente_nombre,
            pedido_id: pedidoId,
            nombre: material.nombre,
            tipo: material.tipo,
            cantidad: material.cantidad,
            unidad: material.unidad,
            fecha_entrega: Timestamp.now(),
            recibido: true
        });
        
        // Verificar si todos los materiales fueron recibidos
        const todosRecibidos = pedido.materiales.every(m => m.recibido);
        if (todosRecibidos && pedido.estado === 'pendiente') {
            await updateDoc(doc(db, 'pedidos_cliente', pedidoId), {
                estado: 'materiales_recibidos'
            });
        }
        
        showToast('Material recibido e ingresado al inventario', 'success');
    } catch (error) {
        console.error('Error recibiendo material:', error);
        showToast('Error al recibir material', 'error');
    }
}

async function cambiarEstadoPedido(pedidoId, nuevoEstado) {
    try {
        const pedido = pedidosCliente.find(p => p.id === pedidoId);
        const updateData = { estado: nuevoEstado };
        
        if (nuevoEstado === 'en_produccion') {
            updateData.fecha_inicio_produccion = Timestamp.now();
            
            // Crear orden de trabajo en el sistema de producción
            if (pedido) {
                await addDoc(collection(db, 'ordenes'), {
                    cliente: pedido.cliente_nombre || 'Cliente',
                    modelo: pedido.modelo,
                    cantidad_total: pedido.cantidad,
                    cantidad_hecha: 0,
                    estado: 'activa',
                    fecha_creacion: Timestamp.now(),
                    pedido_cliente_id: pedidoId,
                    tallas: pedido.tallas || '',
                    notas: pedido.notas || ''
                });
            }
        } else if (nuevoEstado === 'completado') {
            updateData.fecha_completado = Timestamp.now();
        } else if (nuevoEstado === 'entregado') {
            updateData.fecha_entregado = Timestamp.now();
        }
        
        await updateDoc(doc(db, 'pedidos_cliente', pedidoId), updateData);
        showToast(`Pedido marcado como ${nuevoEstado.replace('_', ' ')}`, 'success');
    } catch (error) {
        console.error('Error cambiando estado:', error);
        showToast('Error al cambiar estado', 'error');
    }
}

// ==================== INVENTARIO CLIENTES ====================

let clientInventory = [];

async function loadClientInventory() {
    try {
        const q = query(collection(db, 'inventario_clientes'), orderBy('fecha_entrega', 'desc'));
        
        onSnapshot(q, (snapshot) => {
            clientInventory = [];
            const clientesSet = new Set();
            
            snapshot.forEach(docSnap => {
                const item = { id: docSnap.id, ...docSnap.data() };
                clientInventory.push(item);
                if (item.cliente_nombre) clientesSet.add(item.cliente_nombre);
            });
            
            // Actualizar filtro de clientes
            const filterSelect = document.getElementById('filterClienteMaterial');
            if (filterSelect) {
                const currentValue = filterSelect.value;
                filterSelect.innerHTML = '<option value="todos">Todos los clientes</option>' +
                    Array.from(clientesSet).map(c => `<option value="${c}">${c}</option>`).join('');
                filterSelect.value = currentValue;
            }
            
            renderClientInventory();
        });
    } catch (error) {
        console.error('Error cargando inventario clientes:', error);
    }
}

function renderClientInventory() {
    const list = document.getElementById('clientInventoryList');
    if (!list) return;
    
    const filter = document.getElementById('filterClienteMaterial')?.value || 'todos';
    
    let filtered = clientInventory;
    if (filter !== 'todos') {
        filtered = clientInventory.filter(i => i.cliente_nombre === filter);
    }
    
    if (filtered.length === 0) {
        list.innerHTML = '<p class="text-gray-500 text-center py-8">Sin materiales de clientes registrados</p>';
        return;
    }
    
    // Agrupar por cliente
    const grouped = {};
    filtered.forEach(item => {
        const key = item.cliente_nombre || 'Sin cliente';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
    });
    
    list.innerHTML = Object.entries(grouped).map(([cliente, items]) => `
        <div class="bg-gray-700/30 rounded-xl p-4">
            <h4 class="text-white font-semibold mb-3">
                <i class="fas fa-user mr-2 text-blue-400"></i>${cliente}
            </h4>
            <div class="space-y-2">
                ${items.map(item => {
                    const fecha = item.fecha_entrega?.toDate?.() ? item.fecha_entrega.toDate().toLocaleDateString('es-CO') : '-';
                    return `
                        <div class="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2">
                            <div>
                                <span class="text-gray-300">${item.nombre}</span>
                                <span class="text-gray-500 text-sm ml-2">(${item.cantidad} ${item.unidad})</span>
                            </div>
                            <span class="text-gray-500 text-xs">${fecha}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `).join('');
}

// ==================== INVENTORY SUB-TABS ====================

function switchInvSubTab(invType) {
    document.querySelectorAll('.inv-sub-tab').forEach(btn => {
        btn.classList.remove('bg-emerald-600', 'text-white');
        btn.classList.add('text-gray-400');
    });
    
    document.querySelector(`[data-inv="${invType}"]`).classList.add('bg-emerald-600', 'text-white');
    document.querySelector(`[data-inv="${invType}"]`).classList.remove('text-gray-400');
    
    document.querySelectorAll('.inv-content').forEach(c => c.classList.add('hidden'));
    document.getElementById(`inv${invType.charAt(0).toUpperCase() + invType.slice(1)}Content`).classList.remove('hidden');
}

// ==================== CLIENTES ====================

let clientes = [];

async function loadClientes() {
    try {
        onSnapshot(collection(db, 'clientes'), (snapshot) => {
            clientes = [];
            snapshot.forEach(docSnap => {
                clientes.push({ id: docSnap.id, ...docSnap.data() });
            });
            console.log('Clientes cargados:', clientes.length);
            renderClientesTable();
        }, (error) => {
            console.error('Error en snapshot clientes:', error);
            const tbody = document.getElementById('clientesTableBody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-red-400">Error al cargar clientes. Verifique los permisos de Firebase.</td></tr>';
            }
        });
    } catch (error) {
        console.error('Error cargando clientes:', error);
    }
}

function renderClientesTable(filter = '') {
    const tbody = document.getElementById('clientesTableBody');
    if (!tbody) return;
    
    // Si no hay clientes, mostrar mensaje
    if (clientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">No hay clientes registrados. Cree uno nuevo o espere a que se registren desde el portal.</td></tr>';
        return;
    }
    
    let filtered = clientes.filter(c => {
        const searchMatch = c.nombre?.toLowerCase().includes(filter.toLowerCase()) ||
                           c.id?.toLowerCase().includes(filter.toLowerCase()) ||
                           c.email?.toLowerCase().includes(filter.toLowerCase()) ||
                           c.telefono?.includes(filter);
        return searchMatch;
    });
    
    // Ordenar por fecha de registro descendente
    filtered.sort((a, b) => {
        const fechaA = a.fecha_registro?.toDate?.() || new Date(0);
        const fechaB = b.fecha_registro?.toDate?.() || new Date(0);
        return fechaB - fechaA;
    });
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">No se encontraron clientes</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(cliente => {
        const fecha = cliente.fecha_registro?.toDate?.() ? cliente.fecha_registro.toDate().toLocaleDateString('es-CO') : '-';
        const statusColor = cliente.activo !== false ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400';
        const statusText = cliente.activo !== false ? 'Activo' : 'Inactivo';
        const clienteColor = cliente.color || '#3B82F6';
        
        return `
            <tr class="hover:bg-gray-700/30 transition">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                        <span class="w-3 h-3 rounded-full" style="background-color: ${clienteColor}"></span>
                        <span class="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-sm font-mono">${cliente.id}</span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background-color: ${clienteColor}20; border: 2px solid ${clienteColor}">
                            <i class="fas fa-user-tie" style="color: ${clienteColor}"></i>
                        </div>
                        <p class="text-white font-medium">${cliente.nombre || '-'}</p>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <p class="text-white">${cliente.telefono || '-'}</p>
                    <p class="text-gray-500 text-sm">${cliente.email || '-'}</p>
                </td>
                <td class="px-6 py-4 text-gray-400">${fecha}</td>
                <td class="px-6 py-4">
                    <span class="px-3 py-1 rounded-full text-xs font-medium ${statusColor}">${statusText}</span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center justify-center gap-2">
                        <button class="edit-cliente-btn p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-600/20 rounded-lg transition" data-id="${cliente.id}" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-cliente-btn p-2 text-red-400 hover:text-red-300 hover:bg-red-600/20 rounded-lg transition" data-id="${cliente.id}" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    // Event listeners
    document.querySelectorAll('.edit-cliente-btn').forEach(btn => {
        btn.addEventListener('click', () => editCliente(btn.dataset.id));
    });
    
    document.querySelectorAll('.delete-cliente-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteCliente(btn.dataset.id));
    });
}

function editCliente(clienteId) {
    const cliente = clientes.find(c => c.id === clienteId);
    if (!cliente) return;
    
    document.getElementById('clienteModalTitle').textContent = 'Editar Cliente';
    document.getElementById('clienteId').value = clienteId;
    document.getElementById('clienteCodigo').value = clienteId;
    document.getElementById('clienteCodigo').disabled = true;
    document.getElementById('clienteNombre').value = cliente.nombre || '';
    document.getElementById('clienteTelefono').value = cliente.telefono || '';
    document.getElementById('clienteEmail').value = cliente.email || '';
    document.getElementById('clientePassword').value = cliente.password || '';
    document.getElementById('clienteColor').value = cliente.color || '#3B82F6';
    document.getElementById('clienteEstado').value = cliente.activo !== false ? 'true' : 'false';
    
    document.getElementById('clienteModal').classList.remove('hidden');
}

async function deleteCliente(clienteId) {
    const confirmed = await showConfirm('¿Está seguro de eliminar este cliente? Esta acción no se puede deshacer.');
    if (!confirmed) return;
    
    try {
        await deleteDoc(doc(db, 'clientes', clienteId));
        showToast('Cliente eliminado correctamente', 'success');
    } catch (error) {
        console.error('Error eliminando cliente:', error);
        showToast('Error al eliminar cliente', 'error');
    }
}

async function saveCliente(e) {
    e.preventDefault();
    
    const clienteId = document.getElementById('clienteId').value;
    const codigo = document.getElementById('clienteCodigo').value.trim();
    const nombre = document.getElementById('clienteNombre').value.trim();
    const telefono = document.getElementById('clienteTelefono').value.trim();
    const email = document.getElementById('clienteEmail').value.trim();
    const password = document.getElementById('clientePassword').value;
    const color = document.getElementById('clienteColor').value;
    const activo = document.getElementById('clienteEstado').value === 'true';
    
    if (!codigo || !nombre) {
        showToast('Complete los campos requeridos', 'warning');
        return;
    }
    
    try {
        const data = {
            nombre,
            telefono,
            email,
            password,
            color,
            activo
        };
        
        if (clienteId) {
            // Editar
            await updateDoc(doc(db, 'clientes', clienteId), data);
            showToast('Cliente actualizado correctamente', 'success');
        } else {
            // Crear nuevo
            data.fecha_registro = Timestamp.now();
            await setDoc(doc(db, 'clientes', codigo), data);
            showToast('Cliente creado correctamente', 'success');
        }
        
        closeClienteModal();
    } catch (error) {
        console.error('Error guardando cliente:', error);
        showToast('Error al guardar cliente', 'error');
    }
}

function closeClienteModal() {
    document.getElementById('clienteModal').classList.add('hidden');
    document.getElementById('clienteForm').reset();
    document.getElementById('clienteId').value = '';
    document.getElementById('clienteCodigo').disabled = false;
}

async function generateNextClientCode() {
    const snapshot = await getDocs(collection(db, 'clientes'));
    const nextNum = snapshot.size + 1;
    return `CLI-${String(nextNum).padStart(3, '0')}`;
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
    
    // Caja Menor
    document.getElementById('saveCajaMovBtn')?.addEventListener('click', saveCajaMovimiento);
    
    // Exportar PDF
    document.getElementById('exportPdfBtn')?.addEventListener('click', exportarInformePDF);
    
    // Inventory sub-tabs
    document.querySelectorAll('.inv-sub-tab').forEach(btn => {
        btn.addEventListener('click', () => switchInvSubTab(btn.dataset.inv));
    });
    
    // Filter client materials
    document.getElementById('filterClienteMaterial')?.addEventListener('change', renderClientInventory);
    
    // Filter pedidos cliente
    document.getElementById('filterPedidoEstado')?.addEventListener('change', renderPedidosCliente);
    
    // Clientes
    document.getElementById('newClienteBtn')?.addEventListener('click', async () => {
        document.getElementById('clienteModalTitle').textContent = 'Nuevo Cliente';
        document.getElementById('clienteId').value = '';
        document.getElementById('clienteForm').reset();
        document.getElementById('clienteCodigo').disabled = false;
        document.getElementById('clienteCodigo').value = await generateNextClientCode();
        document.getElementById('clienteModal').classList.remove('hidden');
    });
    
    document.getElementById('closeClienteModal')?.addEventListener('click', closeClienteModal);
    document.getElementById('cancelClienteModal')?.addEventListener('click', closeClienteModal);
    document.getElementById('clienteForm')?.addEventListener('submit', saveCliente);
    document.getElementById('searchClientes')?.addEventListener('input', (e) => {
        renderClientesTable(e.target.value);
    });
}

// Iniciar
init();
