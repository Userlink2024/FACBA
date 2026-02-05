// ============================================
// C&A CLOUD FACTORY - Global Notifications Module
// ============================================

import { rtdb, ref, onValue, set } from './firebase-init.js';

let audioContext = null;
let lastNotifCount = -1;
let lastChatTimestamp = 0;
let currentUserUid = null;
let notificationContainer = null;

// Inicializar sistema de notificaciones
export function initNotifications(userUid) {
    currentUserUid = userUid;
    createNotificationContainer();
    initAudio();
    listenToNotifications();
    listenToChats();
}

// Crear contenedor de notificaciones toast
function createNotificationContainer() {
    if (document.getElementById('globalNotifContainer')) return;
    
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'globalNotifContainer';
    notificationContainer.className = 'fixed top-20 right-4 z-50 space-y-2 max-w-sm';
    document.body.appendChild(notificationContainer);
}

// Inicializar audio
function initAudio() {
    document.addEventListener('click', () => {
        if (!audioContext) {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.log('Audio not supported');
            }
        }
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }, { once: true });
}

// Reproducir sonido de notificación
function playNotificationSound() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) { return; }
    }
    
    try {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.15);
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.log('Error playing sound');
    }
}

// Reproducir sonido de chat
function playChatSound() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) { return; }
    }
    
    try {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(587, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
        console.log('Error playing sound');
    }
}

// Mostrar notificación toast
function showToastNotification(title, message, type = 'info') {
    if (!notificationContainer) createNotificationContainer();
    
    const icons = {
        'pedido': 'fa-box text-blue-500',
        'cliente': 'fa-user-plus text-green-500',
        'chat': 'fa-comment text-purple-500',
        'info': 'fa-bell text-yellow-500'
    };
    
    const toast = document.createElement('div');
    toast.className = 'bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-2xl animate-slide-in flex items-start gap-3 cursor-pointer hover:bg-gray-700 transition';
    toast.innerHTML = `
        <div class="w-10 h-10 bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
            <i class="fas ${icons[type] || icons['info']}"></i>
        </div>
        <div class="flex-1 min-w-0">
            <p class="text-white font-medium text-sm">${title}</p>
            <p class="text-gray-400 text-xs mt-1 truncate">${message}</p>
        </div>
        <button class="text-gray-500 hover:text-white">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Cerrar al hacer clic
    toast.querySelector('button').addEventListener('click', (e) => {
        e.stopPropagation();
        toast.remove();
    });
    
    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slide-out 0.3s ease-out forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
    
    notificationContainer.appendChild(toast);
}

// Escuchar notificaciones de pedidos/clientes
function listenToNotifications() {
    const notifsRef = ref(rtdb, 'notificaciones_fabrica');
    
    onValue(notifsRef, (snapshot) => {
        if (!snapshot.exists()) {
            lastNotifCount = 0;
            return;
        }
        
        const notifs = [];
        snapshot.forEach(child => {
            notifs.push({ id: child.key, ...child.val() });
        });
        
        const unread = notifs.filter(n => !n.leido).length;
        
        // Reproducir sonido y mostrar toast si hay nuevas
        if (unread > lastNotifCount && lastNotifCount >= 0) {
            playNotificationSound();
            
            // Mostrar la notificación más reciente
            const newest = notifs.filter(n => !n.leido).sort((a, b) => (b.fecha || 0) - (a.fecha || 0))[0];
            if (newest) {
                const type = newest.tipo === 'nuevo_pedido' ? 'pedido' : 
                            newest.tipo === 'nuevo_cliente' ? 'cliente' : 'info';
                showToastNotification(newest.titulo || 'Nueva Notificación', newest.mensaje || '', type);
            }
        }
        
        if (lastNotifCount === -1) {
            lastNotifCount = unread;
        } else {
            lastNotifCount = unread;
        }
        
        // Actualizar badge en navbar si existe
        updateNavbarBadge(unread);
    });
}

// Escuchar mensajes de chat
function listenToChats() {
    if (!currentUserUid) return;
    
    const chatsRef = ref(rtdb, 'chats');
    
    onValue(chatsRef, (snapshot) => {
        if (!snapshot.exists()) return;
        
        let newestMessage = null;
        let newestTimestamp = lastChatTimestamp;
        
        snapshot.forEach(chatChild => {
            const chatId = chatChild.key;
            // Solo escuchar chats donde participa el usuario
            if (!chatId.includes(currentUserUid)) return;
            
            const messages = chatChild.child('messages');
            if (!messages.exists()) return;
            
            messages.forEach(msgChild => {
                const msg = msgChild.val();
                if (msg.timestamp > lastChatTimestamp && msg.senderUid !== currentUserUid) {
                    if (msg.timestamp > newestTimestamp) {
                        newestTimestamp = msg.timestamp;
                        newestMessage = msg;
                    }
                }
            });
        });
        
        // Si hay mensaje nuevo, notificar
        if (newestMessage && lastChatTimestamp > 0) {
            playChatSound();
            showToastNotification(
                `Mensaje de ${newestMessage.senderName || 'Usuario'}`,
                newestMessage.text || '',
                'chat'
            );
        }
        
        lastChatTimestamp = newestTimestamp || Date.now();
    });
}

// Actualizar badge en navbar
function updateNavbarBadge(count) {
    let badge = document.getElementById('globalNotifBadge');
    
    if (!badge) {
        // Buscar el navbar y agregar badge
        const navbar = document.querySelector('nav');
        if (!navbar) return;
        
        const userMenu = navbar.querySelector('.flex.items-center.gap-4') || navbar.querySelector('[id*="user"]')?.parentElement;
        if (!userMenu) return;
        
        // Crear botón de notificaciones
        const notifBtn = document.createElement('button');
        notifBtn.id = 'globalNotifBtn';
        notifBtn.className = 'relative p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition';
        notifBtn.innerHTML = `
            <i class="fas fa-bell text-lg"></i>
            <span id="globalNotifBadge" class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center hidden">0</span>
        `;
        
        // Insertar antes del menú de usuario
        userMenu.parentElement.insertBefore(notifBtn, userMenu);
        badge = document.getElementById('globalNotifBadge');
        
        // Click para ir al dashboard
        notifBtn.addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });
    }
    
    if (count > 0) {
        badge.textContent = count > 9 ? '9+' : count;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}
