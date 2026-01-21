// Advanced Chatbot with Database Integration
document.addEventListener('DOMContentLoaded', () => {
    const CONFIG = {
        apiChat: '/api/chat',
        apiProducts: '/api/products',
        catalogCacheTTL: 5 * 60 * 1000, // 5 min
        chatHistoryKey: 'homeDecorChatHistory',
        maxHistoryItems: 50,
        suggestionsLimit: 3,
        navigationButtonsLimit: 2
    };

    let catalogCache = { products: [], fetchedAt: 0 };
    let chatHistory = [];

    const websiteInfo = {
        company: 'Home Decor Furniture',
        contact: {
            phone: '+91 9825000000',
            email: 'support@homedecorfurniture.com',
            address: 'Ahmedabad, Gujarat, India',
            hours: 'Monday-Friday: 9 AM - 6 PM IST'
        },
        policies: {
            shipping: 'Free delivery on orders over ₹50,000. Standard delivery: 5-7 business days.',
            returns: '30-day return policy for items in original condition.',
            payment: 'Credit cards, UPI, net banking, and EMI options available.',
            warranty: '3-5 year warranty on all furniture depending on product.'
        }
    };

    // ========== Product Catalog Management ==========
    async function fetchProductsFromApi() {
        try {
            const res = await fetch(CONFIG.apiProducts, { credentials: 'include' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return (data.products || []).map(p => ({
                id: p.id,
                name: p.name || `Product ${p.id}`,
                category: (p.category || '').toLowerCase(),
                brand: (p.brand || '').toLowerCase(),
                material: (p.material || '').toLowerCase(),
                price: Number(p.price || 0),
                priceText: `₹${Number(p.price || 0).toLocaleString('en-IN')}`,
                description: p.description || '',
                is3d: !!p.is_3d,
                image: p.image || 'image/Logo maker project.webp',
                url: `product-details.html?id=${encodeURIComponent(p.id)}`
            }));
        } catch (e) {
            console.error('API fetch error:', e);
            return [];
        }
    }

    async function ensureCatalogLoaded(force = false) {
        const now = Date.now();
        if (!force && catalogCache.products.length && (now - catalogCache.fetchedAt) < CONFIG.catalogCacheTTL) {
            return catalogCache.products;
        }
        const products = await fetchProductsFromApi();
        catalogCache = { products, fetchedAt: Date.now() };
        return products;
    }

    // ========== Search & Matching Logic ==========
    function tokenize(str) {
        return (str || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    }

    function calculateMatchScore(product, query) {
        const queryLower = (query || '').toLowerCase();
        const queryTokens = tokenize(queryLower);
        const productFields = [product.name, product.category, product.brand, product.material, product.description].join(' ').toLowerCase();
        const productTokens = tokenize(productFields);

        let score = 0;
        queryTokens.forEach(token => {
            if (productTokens.includes(token)) score += 3;
            if (product.name.toLowerCase().includes(token)) score += 2;
            if (product.category.includes(token)) score += 1;
        });

        // Boost for exact category matches
        const categoryKeywords = {
            'living': ['sofa', 'couch', 'armchair', 'coffee table', 'tv stand', 'settee'],
            'dining': ['dining table', 'dining chair', 'dinner', 'eat', 'kitchen table'],
            'bedroom': ['bed', 'mattress', 'nightstand', 'wardrobe', 'dresser'],
            'office': ['desk', 'office chair', 'work', 'study', 'workspace'],
            '3d': ['3d', 'ar', 'augmented', 'model', 'virtual']
        };

        Object.entries(categoryKeywords).forEach(([cat, keywords]) => {
            if (product.category.includes(cat)) {
                keywords.forEach(kw => {
                    if (queryLower.includes(kw)) score += 2;
                });
            }
        });

        if (queryLower.includes('3d') && product.is3d) score += 3;
        return score;
    }

    function extractBudgetRange(query) {
        const lower = (query || '').toLowerCase();
        const matches = Array.from(lower.matchAll(/(\d+(?:\.\d+)?)(\s*(k|kilo|l|lac|lakh))?/gi));
        if (!matches.length) return null;

        const values = matches.map(m => {
            const val = parseFloat(m[1]);
            const unit = (m[3] || '').toLowerCase();
            if (unit.startsWith('k')) return val * 1000;
            if (unit.startsWith('l')) return val * 100000;
            return val;
        }).filter(v => Number.isFinite(v));

        if (!values.length) return null;
        const max = Math.max(...values);
        const min = Math.min(...values);

        if (/under|below|less|upto/.test(lower)) return { min: 0, max };
        if (/over|above|more/.test(lower)) return { min: max, max: Infinity };
        return { min: Math.max(0, min * 0.7), max: max * 1.3 };
    }

    async function searchProducts(query, limit = CONFIG.suggestionsLimit) {
        const products = await ensureCatalogLoaded();
        if (!products.length) return [];

        const budget = extractBudgetRange(query);
        let candidates = products;
        if (budget) {
            candidates = candidates.filter(p => p.price >= budget.min && p.price <= budget.max);
        }

        const scored = candidates.map(p => ({
            product: p,
            score: calculateMatchScore(p, query)
        })).sort((a, b) => b.score - a.score || a.product.price - b.product.price);

        return scored.slice(0, limit).map(s => s.product);
    }

    function formatProductList(products, header = 'Quick picks:') {
        if (!products || !products.length) return '';
        const list = products.slice(0, CONFIG.suggestionsLimit)
            .map(p => `• ${p.name} — ${p.priceText}${p.is3d ? ' (3D/AR)' : ''}`)
            .join('\n');
        return `\n\n${header}\n${list}`;
    }

    // ========== Question Classification & Responses ==========
    function classifyQuestion(query) {
        const lower = (query || '').toLowerCase();
        const categories = {
            product: /product|furniture|sofa|chair|table|bed|couch|desk|cabinet|shelf|wardrobe|storage|lounger/,
            category: /living|dining|bedroom|office|3d|kitchen|storage/,
            price: /price|cost|₹|rupee|budget|expensive|cheap|afford/,
            shipping: /shipping|delivery|transport|how long|when arrive|free deliver/,
            returns: /return|refund|exchange|wrong|broken|damaged|issue/,
            payment: /payment|pay|card|upi|cash|emi|installment|online/,
            contact: /contact|phone|email|call|reach|support|help/,
            features: /3d|ar|augmented|model|view in room|virtual/,
            brand: /brand|material|quality|wood|leather|fabric|steel/,
            availability: /available|stock|out of stock|when available|pre-order/
        };

        for (const [category, pattern] of Object.entries(categories)) {
            if (pattern.test(lower)) return category;
        }
        return 'general';
    }

    async function generateResponse(query, productContext = '') {
        try {
            const response = await fetch(CONFIG.apiChat, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: query, context: productContext })
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if (data?.reply) return data.reply;
            throw new Error('Invalid response');
        } catch (error) {
            console.error('Chat API error:', error);
            return generateContextualResponse(query);
        }
    }

    async function generateContextualResponse(query) {
        const category = classifyQuestion(query);
        const lower = (query || '').toLowerCase();

        switch (category) {
            case 'product':
                return "We offer sofas, dining sets, bedroom furniture, office desks, and 3D models. Tell me your room and budget and I'll suggest options.";
            
            case 'category':
                if (lower.includes('living')) return 'Living room furniture: sofas, armchairs, coffee tables, TV stands. What interests you?';
                if (lower.includes('dining')) return 'Dining room collection: tables, chairs, storage. Looking for something specific?';
                if (lower.includes('bedroom')) return 'Bedroom furniture: beds, nightstands, wardrobes, dressers. What size/style?';
                if (lower.includes('office')) return 'Office furniture: desks, chairs, storage solutions for your workspace.';
                if (lower.includes('3d')) return 'We offer interactive 3D models for visualizing furniture in your space. Check the gallery!';
                return 'Browse our collections: Living, Dining, Bedroom, Office, or 3D Models.';
            
            case 'price':
                return `Prices range from ₹5,000 to ₹80,000+. Share your budget and room type for specific recommendations.`;
            
            case 'shipping':
                return websiteInfo.policies.shipping + ' Contact us for exact delivery dates.';
            
            case 'returns':
                return websiteInfo.policies.returns;
            
            case 'payment':
                return websiteInfo.policies.payment;
            
            case 'contact':
                return `📞 ${websiteInfo.contact.phone}\n📧 ${websiteInfo.contact.email}\n${websiteInfo.contact.hours}`;
            
            case 'features':
                return 'We offer 3D/AR models for interactive visualization. Browse our 3D collection to see furniture in your space!';
            
            case 'brand':
                return 'All our furniture features premium materials—solid wood, quality upholstery, and sustainable construction.';
            
            case 'availability':
                return 'Most items are in stock. For pre-order or availability, contact us.';
            
            default:
                return "Tell me your room, budget, or style preference and I'll help you find the perfect furniture.";
        }
    }

    // ========== Navigation Buttons ==========
    function generateNavigationButtons(query) {
        const lower = (query || '').toLowerCase();
        const buttons = [];

        if (lower.match(/product|furniture|sofa|chair|table|bed|browse|shop|see|view/)) {
            buttons.push({ text: '🛋️ Browse Gallery', url: 'gallery.html' });
        }
        if (lower.match(/living room|living|sofa|couch|settee/)) {
            buttons.push({ text: '🛋️ Living Room', url: 'gallery.html?category=living' });
        }
        if (lower.match(/dining|dinner|table/)) {
            buttons.push({ text: '🍽️ Dining Room', url: 'gallery.html?category=dining' });
        }
        if (lower.match(/bedroom|bed|sleep|mattress/)) {
            buttons.push({ text: '🛏️ Bedroom', url: 'gallery.html?category=bedroom' });
        }
        if (lower.match(/office|desk|work|study|chair/)) {
            buttons.push({ text: '💼 Office', url: 'gallery.html?category=office' });
        }
        if (lower.match(/3d|ar|model|virtual|augmented/)) {
            buttons.push({ text: '🎮 3D Models', url: 'gallery.html?category=3d' });
        }
        if (lower.match(/shipping|delivery|cost|price|₹/)) {
            buttons.push({ text: '📦 Shipping Info', url: 'faq.html' });
        }
        if (lower.match(/return|refund|warranty|guarantee/)) {
            buttons.push({ text: '📋 Policies', url: 'faq.html' });
        }
        if (lower.match(/payment|pay|card|upi/)) {
            buttons.push({ text: '💳 Payment', url: 'faq.html' });
        }
        if (lower.match(/contact|phone|email|call|support|help/)) {
            buttons.push({ text: '📞 Contact Us', url: 'contact.html' });
        }

        if (buttons.length === 0) {
            buttons.push({ text: '🏠 Home', url: 'index.html' });
            buttons.push({ text: '🛋️ Gallery', url: 'gallery.html' });
        }

        const unique = buttons.filter((btn, idx, self) =>
            idx === self.findIndex(b => b.text === btn.text)
        );
        return unique.slice(0, CONFIG.navigationButtonsLimit);
    }

    // ========== UI Creation & Management ==========
    function createChatbotUI() {
        if (document.querySelector('.chatbot-container')) return;
        
        const html = `
            <div class="chatbot-container">
                <button class="chat-toggle" id="chatToggle" title="Chat with us">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </button>
                <div class="chat-window" id="chatWindow">
                    <div class="chat-header">
                        <h3>Home Decor Support</h3>
                        <button class="close-chat" id="closeChat" title="Close">×</button>
                    </div>
                    <div class="chat-messages" id="chatMessages"></div>
                    <div class="chat-input-area">
                        <input type="text" id="chatInput" class="chat-input" placeholder="Ask about furniture, shipping, prices...">
                        <button id="sendButton" class="send-button" title="Send">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.542 60.542 0 0 0 18.443-8.852.75.75 0 0 0 0-1.288A60.542 60.542 0 0 0 3.478 2.405Z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    function addWelcomeMessage() {
        if (chatMessages.children.length === 0) {
            const welcome = document.createElement('div');
            welcome.classList.add('message', 'bot-message');
            welcome.innerHTML = `
                <div>Welcome! 👋 I'm here to help you find the perfect furniture. Ask about products, prices, shipping, or browse our collection.</div>
                <div class="chat-navigation-buttons">
                    <button class="chat-nav-btn" onclick="window.location.href='gallery.html'">🛋️ Browse Gallery</button>
                    <button class="chat-nav-btn" onclick="window.location.href='contact.html'">📞 Contact</button>
                </div>
            `;
            chatMessages.appendChild(welcome);
        }
    }

    function renderMessage(text, sender, buttons = [], timestamp = null) {
        const msg = document.createElement('div');
        msg.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');

        const textDiv = document.createElement('div');
        textDiv.textContent = text;
        msg.appendChild(textDiv);

        const time = document.createElement('div');
        time.classList.add('message-timestamp');
        time.textContent = (timestamp ? new Date(timestamp) : new Date())
            .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        msg.appendChild(time);

        if (buttons && buttons.length) {
            const btnContainer = document.createElement('div');
            btnContainer.classList.add('chat-navigation-buttons');
            buttons.forEach(btn => {
                const button = document.createElement('button');
                button.textContent = btn.text;
                button.classList.add('chat-nav-btn');
                button.addEventListener('click', () => window.location.href = btn.url);
                btnContainer.appendChild(button);
            });
            msg.appendChild(btnContainer);
        }

        chatMessages.appendChild(msg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function loadChatHistory() {
        try {
            const saved = localStorage.getItem(CONFIG.chatHistoryKey);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    }

    function saveChatHistory() {
        try {
            const trimmed = chatHistory.slice(-CONFIG.maxHistoryItems);
            localStorage.setItem(CONFIG.chatHistoryKey, JSON.stringify(trimmed));
        } catch (e) {
            console.error('Save history error:', e);
        }
    }

    function addMessage(text, sender, buttons = []) {
        renderMessage(text, sender, buttons);
        chatHistory.push({
            type: sender,
            text,
            buttons,
            timestamp: new Date().toISOString()
        });
        saveChatHistory();
    }

    function showLoading(show) {
        const loader = document.getElementById('chatLoader');
        if (show) {
            if (!loader) {
                const div = document.createElement('div');
                div.id = 'chatLoader';
                div.classList.add('message', 'bot-message', 'loading-dots');
                div.innerHTML = '<div></div><div></div><div></div>';
                chatMessages.appendChild(div);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        } else if (loader) {
            loader.remove();
        }
    }

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        chatInput.value = '';
        showLoading(true);

        try {
            // Get product suggestions
            const products = await searchProducts(text, CONFIG.suggestionsLimit);
            const productContext = formatProductList(products);

            // Get AI response
            const botReply = await generateResponse(text, productContext);
            showLoading(false);

            // Combine response with suggestions
            const navButtons = generateNavigationButtons(text);
            const productButtons = products.map(p => ({ text: `View ${p.name}`, url: p.url })).slice(0, 2);
            const allButtons = [...navButtons, ...productButtons].filter((b, i, self) =>
                i === self.findIndex(x => x.text === b.text)
            );

            const fullReply = botReply + (products.length ? formatProductList(products) : '');
            addMessage(fullReply, 'bot', allButtons);
        } catch (error) {
            console.error('Send message error:', error);
            showLoading(false);
            const errorMsg = `Sorry, I'm having trouble. Please contact us at ${websiteInfo.contact.phone}.`;
            addMessage(errorMsg, 'bot', [
                { text: '📞 Contact Us', url: 'contact.html' },
                { text: '🏠 Home', url: 'index.html' }
            ]);
        }
    }

    // ========== Event Listeners ==========
    createChatbotUI();

    const chatToggle = document.getElementById('chatToggle');
    const chatWindow = document.getElementById('chatWindow');
    const closeChat = document.getElementById('closeChat');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');

    if (!chatToggle || !chatWindow || !chatMessages || !chatInput || !sendButton) {
        console.error('Chatbot elements missing');
        return;
    }

    // Load and restore history
    chatHistory = loadChatHistory();
    if (chatHistory.length) {
        chatHistory.forEach(item => {
            renderMessage(item.text, item.type, item.buttons, item.timestamp);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } else {
        addWelcomeMessage();
    }

    // Event handlers
    chatToggle.addEventListener('click', () => {
        chatWindow.classList.add('active');
        setTimeout(() => chatInput.focus(), 100);
    });

    closeChat.addEventListener('click', () => {
        chatWindow.classList.remove('active');
    });

    document.addEventListener('click', (e) => {
        if (!chatWindow.contains(e.target) && !chatToggle.contains(e.target)) {
            chatWindow.classList.remove('active');
        }
    });

    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Pre-load catalog on idle
    setTimeout(() => ensureCatalogLoaded(), 2000);
});
