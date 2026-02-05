// ============================================
// C&A CLOUD FACTORY - Authentication Module
// ============================================

import { auth, db, rtdb, signInWithEmailAndPassword, signOut, onAuthStateChanged, doc, getDoc, ref, set, onDisconnect, serverTimestamp } from './firebase-init.js';

// Roles del sistema
export const ROLES = {
    ADMIN_FINANZAS: 'admin_finanzas',
    ADMIN_RRHH: 'admin_rrhh',
    OPERARIO: 'operario'
};

// Rutas según rol
const ROLE_ROUTES = {
    'admin_finanzas': 'finanzas.html',
    'admin_rrhh': 'rrhh.html',
    'operario': 'produccion.html'
};

// Usuario actual en memoria
let currentUser = null;
let currentUserData = null;

// Obtener datos del usuario desde Firestore
export async function getUserData(uid) {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            return { uid, ...userDoc.data() };
        }
        return null;
    } catch (error) {
        console.error('Error obteniendo datos del usuario:', error);
        return null;
    }
}

// Iniciar sesión
export async function login(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Obtener datos adicionales del usuario
        const userData = await getUserData(user.uid);
        
        if (!userData) {
            await signOut(auth);
            throw new Error('Usuario no registrado en el sistema. Contacte al administrador.');
        }
        
        // Verificar si está sancionado (solo para operarios)
        if (userData.rol === ROLES.OPERARIO && userData.estado === 'sancionado') {
            await signOut(auth);
            throw new Error('Su cuenta está sancionada. Contacte a Recursos Humanos.');
        }
        
        // Establecer presencia en Realtime Database
        await setUserPresence(user.uid, userData.nombre);
        
        return { user, userData };
    } catch (error) {
        console.error('Error en login:', error);
        throw error;
    }
}

// Cerrar sesión
export async function logout() {
    try {
        const user = auth.currentUser;
        if (user) {
            // Remover presencia
            await set(ref(rtdb, `presence/${user.uid}`), null);
        }
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error en logout:', error);
        throw error;
    }
}

// Establecer presencia del usuario
async function setUserPresence(uid, nombre) {
    const presenceRef = ref(rtdb, `presence/${uid}`);
    
    // Datos de presencia
    const presenceData = {
        online: true,
        nombre: nombre,
        lastSeen: serverTimestamp()
    };
    
    // Establecer presencia
    await set(presenceRef, presenceData);
    
    // Configurar eliminación al desconectar
    onDisconnect(presenceRef).set({
        online: false,
        nombre: nombre,
        lastSeen: serverTimestamp()
    });
}

// Verificar autenticación y redirigir según rol
export function checkAuthAndRedirect(allowedRoles = []) {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, async (user) => {
            if (!user) {
                // No hay usuario autenticado
                if (window.location.pathname.indexOf('index.html') === -1 && 
                    window.location.pathname !== '/' &&
                    !window.location.pathname.endsWith('/')) {
                    window.location.href = 'index.html';
                }
                reject('No autenticado');
                return;
            }
            
            // Obtener datos del usuario
            const userData = await getUserData(user.uid);
            
            if (!userData) {
                await logout();
                reject('Usuario no encontrado');
                return;
            }
            
            currentUser = user;
            currentUserData = userData;
            
            // Verificar si tiene permiso para esta página
            if (allowedRoles.length > 0 && !allowedRoles.includes(userData.rol)) {
                // Redirigir a su página correspondiente
                window.location.href = ROLE_ROUTES[userData.rol] || 'index.html';
                reject('Sin permisos');
                return;
            }
            
            // Actualizar presencia
            await setUserPresence(user.uid, userData.nombre);
            
            resolve({ user, userData });
        });
    });
}

// Obtener usuario actual
export function getCurrentUser() {
    return currentUser;
}

// Obtener datos del usuario actual
export function getCurrentUserData() {
    return currentUserData;
}

// Redirigir según rol después del login
export function redirectByRole(rol) {
    const route = ROLE_ROUTES[rol] || 'index.html';
    window.location.href = route;
}

// Escuchar cambios de autenticación
export function onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
}
