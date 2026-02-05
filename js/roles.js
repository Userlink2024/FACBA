// ============================================
// C&A CLOUD FACTORY - Roles & Permissions Module
// ============================================

import { ROLES } from './auth.js';

// Permisos por módulo
const PERMISSIONS = {
    // Dashboard - todos pueden ver
    dashboard: {
        view: [ROLES.ADMIN_FINANZAS, ROLES.ADMIN_RRHH, ROLES.OPERARIO],
        edit: [ROLES.ADMIN_FINANZAS, ROLES.ADMIN_RRHH]
    },
    
    // Producción - operarios pueden registrar, admins pueden ver
    produccion: {
        view: [ROLES.ADMIN_FINANZAS, ROLES.ADMIN_RRHH, ROLES.OPERARIO],
        register: [ROLES.OPERARIO],
        edit: [ROLES.ADMIN_FINANZAS]
    },
    
    // RRHH - solo Carolina (admin_rrhh)
    rrhh: {
        view: [ROLES.ADMIN_RRHH, ROLES.ADMIN_FINANZAS],
        sanction: [ROLES.ADMIN_RRHH],
        attendance: [ROLES.ADMIN_RRHH],
        edit: [ROLES.ADMIN_RRHH]
    },
    
    // Finanzas - Anderson y Carolina
    finanzas: {
        view: [ROLES.ADMIN_FINANZAS, ROLES.ADMIN_RRHH],
        orders: [ROLES.ADMIN_FINANZAS],
        rates: [ROLES.ADMIN_FINANZAS],
        inventory: [ROLES.ADMIN_FINANZAS],
        payroll: [ROLES.ADMIN_FINANZAS],
        edit: [ROLES.ADMIN_FINANZAS]
    }
};

// Verificar si un rol tiene permiso para una acción en un módulo
export function hasPermission(rol, modulo, accion) {
    if (!PERMISSIONS[modulo] || !PERMISSIONS[modulo][accion]) {
        return false;
    }
    return PERMISSIONS[modulo][accion].includes(rol);
}

// Verificar acceso a página
export function canAccessPage(rol, pagina) {
    const pagePermissions = {
        'dashboard.html': [ROLES.ADMIN_FINANZAS, ROLES.ADMIN_RRHH, ROLES.OPERARIO],
        'produccion.html': [ROLES.ADMIN_FINANZAS, ROLES.ADMIN_RRHH, ROLES.OPERARIO],
        'rrhh.html': [ROLES.ADMIN_RRHH, ROLES.ADMIN_FINANZAS],
        'finanzas.html': [ROLES.ADMIN_FINANZAS, ROLES.ADMIN_RRHH]
    };
    
    return pagePermissions[pagina]?.includes(rol) || false;
}

// Obtener menú de navegación según rol
export function getNavigationMenu(rol) {
    const baseMenu = [
        { name: 'Dashboard', icon: 'fa-chart-line', href: 'dashboard.html', roles: [ROLES.ADMIN_FINANZAS, ROLES.ADMIN_RRHH, ROLES.OPERARIO] }
    ];
    
    const roleMenus = {
        [ROLES.ADMIN_FINANZAS]: [
            { name: 'Finanzas', icon: 'fa-dollar-sign', href: 'finanzas.html' },
            { name: 'RRHH', icon: 'fa-users', href: 'rrhh.html' },
            { name: 'Producción', icon: 'fa-industry', href: 'produccion.html' }
        ],
        [ROLES.ADMIN_RRHH]: [
            { name: 'Finanzas', icon: 'fa-dollar-sign', href: 'finanzas.html' },
            { name: 'RRHH', icon: 'fa-users', href: 'rrhh.html' },
            { name: 'Producción', icon: 'fa-industry', href: 'produccion.html' }
        ],
        [ROLES.OPERARIO]: [
            { name: 'Mi Producción', icon: 'fa-shoe-prints', href: 'produccion.html' }
        ]
    };
    
    return [...baseMenu, ...(roleMenus[rol] || [])];
}

// Nombre legible del rol
export function getRoleName(rol) {
    const names = {
        [ROLES.ADMIN_FINANZAS]: 'Administrador de Finanzas',
        [ROLES.ADMIN_RRHH]: 'Administrador de Personal',
        [ROLES.OPERARIO]: 'Operario'
    };
    return names[rol] || 'Sin rol';
}

// Color del badge según rol
export function getRoleBadgeColor(rol) {
    const colors = {
        [ROLES.ADMIN_FINANZAS]: 'bg-emerald-600',
        [ROLES.ADMIN_RRHH]: 'bg-purple-600',
        [ROLES.OPERARIO]: 'bg-blue-600'
    };
    return colors[rol] || 'bg-gray-600';
}
