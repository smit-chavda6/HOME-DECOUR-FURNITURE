// ============================================================
// DecorBot - AI Shopping Assistant for Home Decor Furniture
// Connects to live product database via /api/chat
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const CONFIG = {
        apiChat: '/api/chat',
        chatHistoryKey: 'decorbot-history',
        maxHistory: 40,
        maxConversationContext: 6,
        typingDelay: 400
    };

    const STORE = {
        name: 'Home Decor Furniture',
        phone: '+91 9825000000',
        email: 'support@homedecorfurniture.com',
        hours: 'Mon-Fri  9 AM - 6 PM IST'
    };

    let chatHistory = [];

    // ======================== UI CREATION ========================
    function createChatbotUI() {
        if (document.querySelector('.chatbot-container')) return;
        const html = `
        <div class="chatbot-container">
            <button class="chat-toggle" id="chatToggle" title="Chat with DecorBot">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
            </button>
            <div class="chat-window" id="chatWindow">
                <div class="bot-notification" id="botNotification"></div>
                <div class="chat-header">
                    <div class="chat-header-info">
                        <div class="chat-header-avatar">&#127968;</div>
                        <div>
                            <h3>DecorBot</h3>
                            <span class="chat-header-status">Online - AI Assistant</span>
                        </div>
                    </div>
                    <div class="chat-header-actions">
                        <button class="chat-clear-btn" id="chatClearBtn" title="Clear chat">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </button>
                        <button class="close-chat" id="closeChat" title="Close">&times;</button>
                    </div>
                </div>
                <div class="chat-messages" id="chatMessages"></div>
                <div class="chat-suggestions" id="chatSuggestions"></div>
                <div class="chat-input-area">
                    <input type="text" id="chatInput" class="chat-input" placeholder="Ask about furniture, prices, orders..." autocomplete="off">
                    <button id="sendButton" class="send-button" title="Send">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.542 60.542 0 0 0 18.443-8.852.75.75 0 0 0 0-1.288A60.542 60.542 0 0 0 3.478 2.405Z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    // ======================== FORMATTING ========================
    function formatBotText(raw) {
        let text = raw
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
        text = text.replace(/\n/g, '<br>');
        return text;
    }

    // ======================== PRODUCT CARDS ========================
    function renderProductCards(products) {
        if (!products || !products.length) return '';
        const cards = products.slice(0, 5).map(p => {
            const priceStr = '\u20B9' + (p.price || 0).toLocaleString('en-IN');
            const originalStr = p.original_price && p.discount ? '<span class="card-original-price">\u20B9' + p.original_price.toLocaleString('en-IN') + '</span>' : '';
            const discountBadge = p.discount ? '<span class="card-discount">-' + p.discount + '%</span>' : '';
            const stockLabel = p.stock > 10 ? 'In Stock' : p.stock > 0 ? 'Only ' + p.stock + ' left' : 'Out of Stock';
            const stockClass = p.stock > 10 ? 'in-stock' : p.stock > 0 ? 'low-stock' : 'out-of-stock';
            const stockIcon = p.stock > 10 ? '' : p.stock > 0 ? '\u26A1 ' : '\u274C ';
            const ratingVal = parseFloat(p.rating || 0).toFixed(1);
            const imgSrc = p.image || 'image/Logo maker project.webp';
            const threeDTag = p.is_3d ? '<span class="card-3d-badge">\uD83C\uDFAE 3D</span>' : '';

            return '<div class="chat-product-card" onclick="window.open(\'product-details.html?id=' + encodeURIComponent(p.id) + '\',\'_blank\')">' 
                + '<div class="card-image">' + threeDTag + '<img src="' + imgSrc + '" alt="' + (p.name || '') + '" loading="lazy" onerror="this.src=\'image/Logo maker project.webp\'"></div>'
                + '<div class="card-body">'
                + '<div class="card-name">' + (p.name || '') + '</div>'
                + '<div class="card-price-row"><span class="card-price">' + priceStr + '</span> ' + originalStr + ' ' + discountBadge + '</div>'
                + '<div class="card-meta"><span class="card-rating">\u2B50 ' + ratingVal + '</span><span class="card-stock ' + stockClass + '">' + stockIcon + stockLabel + '</span></div>'
                + (p.short_description ? '<div class="card-desc">' + p.short_description.slice(0, 100) + '</div>' : '')
                + '</div>'
                + '</div>';
        }).join('');
        return '<div class="chat-product-cards">' + cards + '</div>';
    }

    // ======================== ORDER CARD ========================
    function renderOrderCard(order) {
        if (!order) return '';
        const statusColors = {
            placed: '#3b82f6', confirmed: '#8b5cf6', processing: '#f59e0b',
            shipped: '#06b6d4', delivered: '#10b981', cancelled: '#ef4444'
        };
        const color = statusColors[order.status] || '#6b7280';
        const items = order.items ? order.items.map(i => '<div class="order-item">' + i.name + ' x ' + i.quantity + '</div>').join('') : '';
        return '<div class="chat-order-card">'
            + '<div class="order-header"><span class="order-id">\uD83D\uDCE6 Order #' + order.id.slice(-8).toUpperCase() + '</span>'
            + '<span class="order-status" style="background:' + color + '">' + order.status.toUpperCase() + '</span></div>'
            + '<div class="order-details">'
            + '<div class="order-total">\uD83D\uDCB0 Total: \u20B9' + (order.total || 0).toLocaleString('en-IN') + '</div>'
            + '<div class="order-date">\uD83D\uDCC5 ' + new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + '</div>'
            + (items ? '<div class="order-items-list">' + items + '</div>' : '')
            + '</div></div>';
    }

    // ======================== SUGGESTIONS ========================
    function showSuggestions(suggestions) {
        const container = document.getElementById('chatSuggestions');
        if (!container) return;
        if (!suggestions || !suggestions.length) { container.innerHTML = ''; return; }
        container.innerHTML = suggestions.map(s =>
            '<button class="suggestion-chip" data-msg="' + s.replace(/"/g, '&quot;') + '">' + s + '</button>'
        ).join('');
        container.querySelectorAll('.suggestion-chip').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                chatInput.value = btn.dataset.msg;
                container.innerHTML = '';
                sendMessage();
            });
        });
    }

    function getContextualSuggestions(userMsg, hasProducts) {
        const lower = (userMsg || '').toLowerCase();
        if (!chatHistory.length || chatHistory.length <= 1) {
            return ['Show me sofas', 'Best under \u20B930,000', 'Track my order', 'Shipping policy'];
        }
        if (hasProducts) return ['Show more options', 'Something cheaper', 'Compare these', 'Any discounts?'];
        if (/shipping|delivery/.test(lower)) return ['Return policy', 'Payment options', 'Track order'];
        if (/return|refund/.test(lower)) return ['Shipping info', 'Contact support'];
        if (/sofa|chair|table|bed/.test(lower)) return ['Under \u20B920,000', 'Premium options', 'What materials?'];
        return ['Browse products', 'Best sellers', 'Contact support', 'FAQ'];
    }

    // ======================== MESSAGES ========================
    function renderMessage(text, sender, extras) {
        extras = extras || {};
        const msg = document.createElement('div');
        msg.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');

        if (sender === 'bot') {
            var avatar = document.createElement('div');
            avatar.className = 'bot-avatar';
            avatar.innerHTML = '&#127968;';
            msg.appendChild(avatar);
        }

        var bubble = document.createElement('div');
        bubble.className = 'message-bubble';

        var textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        if (sender === 'bot') {
            textDiv.innerHTML = formatBotText(text);
        } else {
            textDiv.textContent = text;
        }
        bubble.appendChild(textDiv);

        if (extras.products && extras.products.length && extras.products[0].price) {
            var cardsDiv = document.createElement('div');
            cardsDiv.innerHTML = renderProductCards(extras.products);
            bubble.appendChild(cardsDiv);
        }

        if (extras.order) {
            var orderDiv = document.createElement('div');
            orderDiv.innerHTML = renderOrderCard(extras.order);
            bubble.appendChild(orderDiv);
        }

        var time = document.createElement('div');
        time.className = 'message-timestamp';
        time.textContent = (extras.timestamp ? new Date(extras.timestamp) : new Date())
            .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        bubble.appendChild(time);

        if (extras.buttons && extras.buttons.length) {
            var btnWrap = document.createElement('div');
            btnWrap.className = 'chat-navigation-buttons';
            extras.buttons.forEach(function (b) {
                var btn = document.createElement('button');
                btn.textContent = b.text;
                btn.className = 'chat-nav-btn';
                btn.addEventListener('click', function () { window.open(b.url, '_blank'); });
                btnWrap.appendChild(btn);
            });
            bubble.appendChild(btnWrap);
        }

        msg.appendChild(bubble);
        chatMessages.appendChild(msg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return msg;
    }

    function addWelcomeMessage() {
        var welcome = 'Hello! \uD83D\uDC4B Welcome to **Home Decor Furniture**!\n\nI\'m **DecorBot**, your AI shopping assistant. I can help you:\n\n\uD83D\uDECD\uFE0F Find & compare products\n\uD83D\uDCB0 Search by budget\n\uD83D\uDCE6 Track your orders\n\u2753 Answer any questions\n\nWhat are you looking for today?';
        renderMessage(welcome, 'bot', {
            buttons: [
                { text: '\uD83D\uDECB\uFE0F Browse Gallery', url: 'gallery.html' },
                { text: '\uD83D\uDCDE Contact Us', url: 'contact.html' }
            ]
        });
        showSuggestions(['Show me sofas', 'Best under \u20B930,000', 'Track my order', 'Shipping policy']);
    }

    // ======================== TYPING INDICATOR ========================
    function showTyping(show) {
        var loader = document.getElementById('chatTypingIndicator');
        if (show) {
            if (!loader) {
                loader = document.createElement('div');
                loader.id = 'chatTypingIndicator';
                loader.classList.add('message', 'bot-message', 'typing-indicator');
                loader.innerHTML = '<div class="bot-avatar">&#127968;</div><div class="message-bubble typing-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>';
                chatMessages.appendChild(loader);
            }
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } else if (loader) {
            loader.remove();
        }
    }

    // ======================== NAV BUTTONS ========================
    function generateNavButtons(query) {
        var lower = (query || '').toLowerCase();
        var btns = [];
        if (/product|furniture|browse|shop|gallery|show|view|dikha/.test(lower)) btns.push({ text: '\uD83D\uDECB\uFE0F Gallery', url: 'gallery.html' });
        if (/living|sofa|couch/.test(lower)) btns.push({ text: '\uD83D\uDECB\uFE0F Living Room', url: 'gallery.html?category=living' });
        if (/dining|dinner/.test(lower)) btns.push({ text: '\uD83C\uDF7D\uFE0F Dining', url: 'gallery.html?category=dining' });
        if (/bedroom|bed/.test(lower)) btns.push({ text: '\uD83D\uDECF\uFE0F Bedroom', url: 'gallery.html?category=bedroom' });
        if (/office|desk/.test(lower)) btns.push({ text: '\uD83D\uDCBC Office', url: 'gallery.html?category=office' });
        if (/contact|phone|email|support/.test(lower)) btns.push({ text: '\uD83D\uDCDE Contact', url: 'contact.html' });
        if (/faq|policy|return|ship/.test(lower)) btns.push({ text: '\uD83D\uDCCB FAQ', url: 'faq.html' });
        return btns.slice(0, 3);
    }

    // ======================== HISTORY ========================
    function loadHistory() {
        try { return JSON.parse(localStorage.getItem(CONFIG.chatHistoryKey) || '[]'); }
        catch (e) { return []; }
    }
    function saveHistory() {
        try { localStorage.setItem(CONFIG.chatHistoryKey, JSON.stringify(chatHistory.slice(-CONFIG.maxHistory))); }
        catch (e) { console.error('History save error:', e); }
    }
    function clearHistory() {
        chatHistory = [];
        localStorage.removeItem(CONFIG.chatHistoryKey);
        chatMessages.innerHTML = '';
        addWelcomeMessage();
        showNotification('Chat history cleared');
    }

    function showNotification(msg) {
        var notif = document.getElementById('botNotification');
        if (!notif) return;
        notif.textContent = msg;
        notif.classList.add('show');
        setTimeout(function () {
            notif.classList.remove('show');
        }, 3000);
    }

    // ======================== SEND MESSAGE ========================
    async function sendMessage() {
        var text = chatInput.value.trim();
        if (!text) return;

        var sugContainer = document.getElementById('chatSuggestions');
        if (sugContainer) sugContainer.innerHTML = '';

        renderMessage(text, 'user');
        chatHistory.push({ role: 'user', text: text, timestamp: new Date().toISOString() });
        saveHistory();
        chatInput.value = '';
        chatInput.focus();

        showTyping(true);

        try {
            var recentHistory = chatHistory
                .filter(function (h) { return h.role === 'user' || h.role === 'bot'; })
                .slice(-CONFIG.maxConversationContext)
                .map(function (h) { return { role: h.role, text: h.text }; });

            var response = await fetch(CONFIG.apiChat, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ message: text, history: recentHistory })
            });

            showTyping(false);

            if (!response.ok) throw new Error('HTTP ' + response.status);
            var data = await response.json();

            var reply = data.reply || "I'm having trouble right now. Please try again!";
            var products = data.products || [];
            var order = data.order || null;
            var navButtons = generateNavButtons(text);

            renderMessage(reply, 'bot', {
                products: products,
                order: order,
                buttons: navButtons
            });

            chatHistory.push({
                role: 'bot',
                text: reply,
                products: products.length ? products.map(function (p) { return p.name; }) : undefined,
                timestamp: new Date().toISOString()
            });
            saveHistory();

            var suggestions = getContextualSuggestions(text, products.length > 0);
            showSuggestions(suggestions);

        } catch (error) {
            showTyping(false);
            console.error('Chat error:', error);
            renderMessage(
                'Sorry, I\'m having trouble connecting right now. Please try again or contact us at ' + STORE.phone + ' \uD83D\uDCDE',
                'bot',
                { buttons: [{ text: '\uD83D\uDCDE Contact Us', url: 'contact.html' }] }
            );
        }
    }

    // ======================== INIT ========================
    createChatbotUI();

    var chatToggle = document.getElementById('chatToggle');
    var chatWindow = document.getElementById('chatWindow');
    var closeChat = document.getElementById('closeChat');
    var chatClearBtn = document.getElementById('chatClearBtn');
    var chatMessages = document.getElementById('chatMessages');
    var chatInput = document.getElementById('chatInput');
    var sendButton = document.getElementById('sendButton');

    if (!chatToggle || !chatWindow || !chatMessages || !chatInput || !sendButton) {
        console.error('DecorBot: Missing UI elements');
        return;
    }

    chatHistory = loadHistory();
    if (chatHistory.length) {
        chatHistory.forEach(function (item) {
            renderMessage(item.text, item.role, { timestamp: item.timestamp });
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } else {
        addWelcomeMessage();
    }

    chatToggle.addEventListener('click', function () {
        chatWindow.classList.toggle('active');
        if (chatWindow.classList.contains('active')) {
            setTimeout(function () { chatInput.focus(); }, 200);
        }
    });
    closeChat.addEventListener('click', function () { chatWindow.classList.remove('active'); });
    chatClearBtn.addEventListener('click', function () {
        clearHistory();
    });
    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
    document.addEventListener('click', function (e) {
        if (chatWindow.classList.contains('active') && !chatWindow.contains(e.target) && !chatToggle.contains(e.target)) {
            chatWindow.classList.remove('active');
        }
    });
});
