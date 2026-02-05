// ============================================
// C&A CLOUD FACTORY - Chat Module
// ============================================

import { db, rtdb, collection, addDoc, query, where, orderBy, onSnapshot, Timestamp, ref, push, onValue } from './firebase-init.js';

let currentChatUser = null;
let currentUserUid = null;
let unsubscribeChat = null;

export function initChat(userUid) {
    currentUserUid = userUid;
    createChatModal();
}

function createChatModal() {
    if (document.getElementById('chatModal')) return;
    
    const modal = document.createElement('div');
    modal.id = 'chatModal';
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 hidden';
    modal.innerHTML = `
        <div class="bg-gray-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl border border-gray-700 flex flex-col max-h-[80vh]">
            <!-- Header -->
            <div class="flex items-center justify-between p-4 border-b border-gray-700">
                <div class="flex items-center gap-3">
                    <div class="relative">
                        <div class="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                            <i class="fas fa-user text-gray-400"></i>
                        </div>
                        <span class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></span>
                    </div>
                    <div>
                        <p id="chatUserName" class="text-white font-medium">Usuario</p>
                        <p class="text-green-400 text-xs">En línea</p>
                    </div>
                </div>
                <button id="closeChatModal" class="text-gray-400 hover:text-white p-2">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <!-- Messages -->
            <div id="chatMessages" class="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
                <p class="text-gray-500 text-center text-sm">Cargando mensajes...</p>
            </div>
            
            <!-- Input -->
            <div class="p-4 border-t border-gray-700">
                <form id="chatForm" class="flex gap-2">
                    <input 
                        type="text" 
                        id="chatInput" 
                        placeholder="Escribe un mensaje importante..." 
                        class="flex-1 px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autocomplete="off"
                    >
                    <button type="submit" class="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('closeChatModal').addEventListener('click', closeChat);
    document.getElementById('chatForm').addEventListener('submit', sendMessage);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeChat();
    });
}

export function openChat(targetUid, targetName) {
    currentChatUser = { uid: targetUid, nombre: targetName };
    
    document.getElementById('chatUserName').textContent = targetName;
    document.getElementById('chatModal').classList.remove('hidden');
    document.getElementById('chatInput').focus();
    
    loadMessages();
}

function closeChat() {
    document.getElementById('chatModal').classList.add('hidden');
    if (unsubscribeChat) {
        unsubscribeChat();
        unsubscribeChat = null;
    }
    currentChatUser = null;
}

function getChatId(uid1, uid2) {
    return [uid1, uid2].sort().join('_');
}

function loadMessages() {
    if (!currentChatUser || !currentUserUid) return;
    
    const chatId = getChatId(currentUserUid, currentChatUser.uid);
    const messagesRef = ref(rtdb, `chats/${chatId}/messages`);
    
    if (unsubscribeChat) unsubscribeChat();
    
    unsubscribeChat = onValue(messagesRef, (snapshot) => {
        const container = document.getElementById('chatMessages');
        
        if (!snapshot.exists()) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-comments text-4xl text-gray-600 mb-3"></i>
                    <p class="text-gray-500">No hay mensajes aún</p>
                    <p class="text-gray-600 text-sm">Envía un mensaje importante</p>
                </div>
            `;
            return;
        }
        
        const messages = [];
        snapshot.forEach(child => {
            messages.push({ id: child.key, ...child.val() });
        });
        
        messages.sort((a, b) => a.timestamp - b.timestamp);
        
        container.innerHTML = messages.map(msg => {
            const isOwn = msg.senderUid === currentUserUid;
            const time = new Date(msg.timestamp).toLocaleTimeString('es-CO', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            return `
                <div class="flex ${isOwn ? 'justify-end' : 'justify-start'}">
                    <div class="max-w-[75%] ${isOwn ? 'bg-blue-600' : 'bg-gray-700'} rounded-2xl px-4 py-2">
                        ${!isOwn ? `<p class="text-xs text-gray-400 mb-1">${msg.senderName}</p>` : ''}
                        <p class="text-white text-sm">${escapeHtml(msg.text)}</p>
                        <p class="text-xs ${isOwn ? 'text-blue-200' : 'text-gray-500'} text-right mt-1">${time}</p>
                    </div>
                </div>
            `;
        }).join('');
        
        container.scrollTop = container.scrollHeight;
    });
}

async function sendMessage(e) {
    e.preventDefault();
    
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    
    if (!text || !currentChatUser || !currentUserUid) return;
    
    input.value = '';
    
    try {
        const chatId = getChatId(currentUserUid, currentChatUser.uid);
        const messagesRef = ref(rtdb, `chats/${chatId}/messages`);
        
        const senderName = document.getElementById('userName')?.textContent || 'Usuario';
        
        await push(messagesRef, {
            text,
            senderUid: currentUserUid,
            senderName,
            receiverUid: currentChatUser.uid,
            timestamp: Date.now()
        });
        
    } catch (error) {
        console.error('Error enviando mensaje:', error);
        input.value = text;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
