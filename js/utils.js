// ============================================
// C&A CLOUD FACTORY - Utility Functions
// Zona horaria: America/Bogota (UTC-5)
// ============================================

// Parsear fecha de input type="date" sin problemas de timezone
// Evita que la fecha se corra hacia atrás por UTC
export function parseLocalDate(dateString) {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0); // Mediodía para evitar problemas de DST
}

// Formatear fecha para input type="date" (YYYY-MM-DD)
export function formatDateForInput(date) {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Formatear moneda colombiana
export function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Formatear fecha
export function formatDate(date) {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return new Intl.DateTimeFormat('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(d);
}

// Formatear fecha y hora
export function formatDateTime(date) {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return new Intl.DateTimeFormat('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(d);
}

// Formatear hora
export function formatTime(date) {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return new Intl.DateTimeFormat('es-CO', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(d);
}

// Verificar si llegó tarde (después de las 7:00 AM)
export function isLate(date) {
    if (!date) return false;
    const d = date.toDate ? date.toDate() : new Date(date);
    const hours = d.getHours();
    const minutes = d.getMinutes();
    return hours > 7 || (hours === 7 && minutes > 0);
}

// Obtener inicio de la semana actual (Lunes)
export function getWeekStart() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
}

// Obtener fin de la semana actual (Domingo)
export function getWeekEnd() {
    const monday = getWeekStart();
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return sunday;
}

// Obtener inicio del día
export function getDayStart(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

// Obtener fin del día
export function getDayEnd(date = new Date()) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}

// Mostrar notificación toast
export function showToast(message, type = 'info') {
    const colors = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        warning: 'bg-yellow-600',
        info: 'bg-blue-600'
    };
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-4 rounded-lg shadow-xl z-50 flex items-center gap-3 animate-slide-in`;
    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('animate-slide-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Mostrar modal de confirmación
export function showConfirm(title, message) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-700">
                <h3 class="text-xl font-bold text-white mb-2">${title}</h3>
                <p class="text-gray-300 mb-6">${message}</p>
                <div class="flex gap-3 justify-end">
                    <button id="cancelBtn" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition">
                        Cancelar
                    </button>
                    <button id="confirmBtn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
                        Confirmar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('#cancelBtn').onclick = () => {
            modal.remove();
            resolve(false);
        };
        
        modal.querySelector('#confirmBtn').onclick = () => {
            modal.remove();
            resolve(true);
        };
    });
}

// Mostrar loading
export function showLoading(show = true) {
    let loader = document.getElementById('globalLoader');
    
    if (show) {
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'globalLoader';
            loader.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
            loader.innerHTML = `
                <div class="text-center">
                    <i class="fas fa-spinner fa-spin text-4xl text-blue-500 mb-4"></i>
                    <p class="text-white">Cargando...</p>
                </div>
            `;
            document.body.appendChild(loader);
        }
    } else {
        if (loader) loader.remove();
    }
}

// Generar ID único
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Debounce function
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Validar email
export function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Escapar HTML
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
