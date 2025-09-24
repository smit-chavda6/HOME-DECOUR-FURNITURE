// Chatbot functionality for Home Decor Furniture
document.addEventListener('DOMContentLoaded', () => {
    // Website data for the chatbot
    const websiteData = {
        company: "Home Decor Furniture",
        products: {
            categories: ["Living Room", "Dining Room", "Bedroom", "Office", "3D Models"],
            featured: [
                "Comfortable Sofa - ₹41,500",
                "Modern Armchair - ₹20,750", 
                "Wooden Coffee Table - ₹12,450",
                "Dining Table - ₹33,200",
                "Queen Size Bed - ₹49,800",
                "Office Chair - ₹10,790"
            ]
        },
        policies: {
            shipping: "We offer free delivery on orders over ₹50,000. Standard delivery takes 5-7 business days.",
            returns: "30-day return policy for items in original condition. Contact our support team for returns.",
            payment: "We accept all major credit cards, UPI, and net banking.",
            warranty: "3-5 year warranty on all furniture items depending on the product."
        },
        contact: {
            phone: "+91 9825000000",
            email: "support@homedecorfurniturestore.com",
            address: "Ahmedabad, Gujarat, India",
            hours: "Monday-Friday: 9 AM - 6 PM IST"
        },
        features: [
            "Premium Quality Materials",
            "Expert Craftsmanship", 
            "Sustainable Design",
            "Customer Satisfaction Guarantee"
        ]
    };

    // === Live Product Catalog Awareness ===
    // We load the latest products from the backend (or scrape the gallery as a fallback)
    // and use this for price-aware answers and suggestions.
    const CATALOG_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
    let catalogCache = { products: [], fetchedAt: 0 };

    function parsePriceToNumber(text) {
        if (!text) return 0;
        const num = parseFloat(String(text).replace(/[^0-9.]/g, ''));
        return isNaN(num) ? 0 : num;
    }

    function buildProductUrl(id){
        return `product-details.html?id=${encodeURIComponent(id)}`;
    }

    async function fetchCatalogFromApi(){
        try {
            const res = await fetch('/api/products', { credentials: 'include' });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            const items = (data.products || []).map(p => ({
                id: p.id,
                name: p.name || `Product ${p.id}`,
                category: p.category || '',
                brand: p.brand || '',
                material: p.material || '',
                price: Number(p.price || 0),
                priceText: `₹${Number(p.price || 0).toLocaleString('en-IN')}`,
                is3d: !!p.is_3d,
                model_src: p.model_src || '',
                image: p.image || 'image/Logo maker project.webp',
                url: buildProductUrl(p.id)
            }));
            return items;
        } catch (e) {
            return null;
        }
    }

    function scrapeCatalogFromDom(){
        try {
            const cards = Array.from(document.querySelectorAll('.product-card'));
            return cards.map(card => {
                const id = card.getAttribute('data-product-id') || '';
                const name = card.querySelector('.product-title')?.textContent?.trim() || `Product ${id}`;
                const priceText = card.querySelector('.current-price')?.textContent?.trim() || '';
                const price = parsePriceToNumber(priceText);
                const category = card.getAttribute('data-category') || '';
                const brand = card.getAttribute('data-brand') || '';
                const material = card.getAttribute('data-material') || '';
                const is3d = card.classList.contains('product-card-3d') || !!card.querySelector('model-viewer');
                const model_src = card.querySelector('model-viewer')?.getAttribute('src') || '';
                const image = card.querySelector('.product-image img')?.getAttribute('src') || 'image/Logo maker project.webp';
                return { id, name, category, brand, material, price, priceText: priceText || `₹${price.toLocaleString('en-IN')}`, is3d, model_src, image, url: buildProductUrl(id) };
            });
        } catch (e) { return []; }
    }

    async function ensureCatalogLoaded(force=false){
        const now = Date.now();
        if (!force && catalogCache.products.length && (now - catalogCache.fetchedAt) < CATALOG_CACHE_TTL_MS) {
            return catalogCache.products;
        }
        // Try API first
        const apiItems = await fetchCatalogFromApi();
        const items = apiItems && apiItems.length ? apiItems : scrapeCatalogFromDom();
        catalogCache = { products: items, fetchedAt: Date.now() };
        return items;
    }

    function tokenize(str){
        return (str||'').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    }

    function matchScore(product, message){
        const qTokens = tokenize(message);
        const fields = [product.name, product.category, product.brand, product.material].join(' ').toLowerCase();
        const fTokens = tokenize(fields);
        let score = 0;
        qTokens.forEach(t => { if (fTokens.includes(t)) score += 2; });
        // Boost by category keywords
        if (/sofa|couch/.test(message.toLowerCase()) && /sofa|couch/i.test(product.name)) score += 2;
        if (/chair/.test(message.toLowerCase()) && /chair/i.test(product.name)) score += 2;
        if (/table/.test(message.toLowerCase()) && /table/i.test(product.name)) score += 2;
        if (/bed|mattress/.test(message.toLowerCase()) && /bed|mattress/i.test(product.name)) score += 2;
        return score;
    }

    function parseBudget(message){
        const lower = message.toLowerCase();
        const nums = message.match(/\d{1,3}(?:,\d{3})*(?:\.\d+)?/g);
        if (!nums) return null;
        // Use the largest number as a likely budget cap
        const values = nums.map(n => parsePriceToNumber(n)).filter(n => n>0).sort((a,b)=>b-a);
        const max = values[0];
        if (/under|below|less than|<=|upto|up to/.test(lower)) return { type: 'max', value: max };
        if (/above|over|more than|>=/.test(lower)) return { type: 'min', value: max };
        return { type: 'around', value: max };
    }

    async function findProductMatches(message, limit=5){
        const items = await ensureCatalogLoaded();
        if (!items.length) return [];
        const budget = parseBudget(message);
        let filtered = items;
        if (budget) {
            if (budget.type === 'max') filtered = filtered.filter(p => p.price <= budget.value);
            else if (budget.type === 'min') filtered = filtered.filter(p => p.price >= budget.value);
            else {
                const delta = Math.max(2000, Math.round(budget.value * 0.25));
                filtered = filtered.filter(p => Math.abs(p.price - budget.value) <= delta);
            }
        }
        const withScores = filtered.map(p => ({ p, s: matchScore(p, message) + (p.is3d && /ar|3d|view in room/i.test(message) ? 1 : 0) }));
        withScores.sort((a,b) => b.s - a.s || a.p.price - b.p.price);
        const top = withScores.filter(x => x.s > 0).slice(0, limit).map(x => x.p);
        // If no token match but we have a budget, propose by price
        if (!top.length && budget) return items.sort((a,b)=>a.price-b.price).slice(0, limit);
        return top;
    }

    function formatProductSuggestionList(matches){
        if (!matches || !matches.length) return '';
        // Show clean names and prices only; provide clickable buttons separately
        return matches.map(m => `• ${m.name} — ${m.priceText}${m.is3d ? ' (3D/AR)' : ''}`).join('\n');
    }

    // Create chatbot HTML structure
    function createChatbot() {
        const chatbotHTML = `
            <div class="chatbot-container">
                <button class="chat-toggle" id="chatToggle" title="Chat with us">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </button>
                
                <div class="chat-window" id="chatWindow">
                                                <div class="chat-header">
                                <h3>Home Decor Support</h3>
                                <button class="close-chat" id="closeChat" title="Close chat">×</button>
                            </div>
                                                    <div class="chat-messages" id="chatMessages">
                                    <div class="message bot-message">
                                        <div>Hello! Welcome to Home Decor Furniture. I'm here to help you with any questions about our furniture, orders, shipping, or general inquiries. How can I assist you today?</div>
                                        <div class="chat-navigation-buttons">
                                            <button class="chat-nav-btn" onclick="window.location.href='gallery.html'">🛋️ Browse All</button>
                                            <button class="chat-nav-btn" onclick="window.location.href='gallery.html?category=living'">🛋️ Living Room</button>
                                            <button class="chat-nav-btn" onclick="window.location.href='gallery.html?category=dining'">🍽️ Dining Room</button>
                                            <button class="chat-nav-btn" onclick="window.location.href='gallery.html?category=bedroom'">🛏️ Bedroom</button>
                                            <button class="chat-nav-btn" onclick="window.location.href='gallery.html?category=office'">💼 Office</button>
                                            <button class="chat-nav-btn" onclick="window.location.href='gallery.html?category=3d'">🎮 3D Models</button>
                                        </div>
                                    </div>
                                </div>
                    <div class="chat-input-area">
                        <input type="text" id="chatInput" class="chat-input" placeholder="Type your message...">
                        <button id="sendButton" class="send-button" title="Send message">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.542 60.542 0 0 0 18.443-8.852.75.75 0 0 0 0-1.288A60.542 60.542 0 0 0 3.478 2.405Z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    }

                    // Add welcome message function
                function addWelcomeMessage() {
                    const welcomeDiv = document.createElement('div');
                    welcomeDiv.classList.add('message', 'bot-message');
                    welcomeDiv.innerHTML = `
                        <div>Hello! Welcome to Home Decor Furniture. I'm here to help you with any questions about our furniture, orders, shipping, or general inquiries. How can I assist you today?</div>
                        <div class="chat-navigation-buttons">
                            <button class="chat-nav-btn" onclick="window.location.href='gallery.html'">🛋️ Browse All</button>
                            <button class="chat-nav-btn" onclick="window.location.href='gallery.html?category=living'">🛋️ Living Room</button>
                            <button class="chat-nav-btn" onclick="window.location.href='gallery.html?category=dining'">🍽️ Dining Room</button>
                            <button class="chat-nav-btn" onclick="window.location.href='gallery.html?category=bedroom'">🛏️ Bedroom</button>
                            <button class="chat-nav-btn" onclick="window.location.href='gallery.html?category=office'">💼 Office</button>
                            <button class="chat-nav-btn" onclick="window.location.href='gallery.html?category=3d'">🎮 3D Models</button>
                        </div>
                    `;
                    chatMessages.appendChild(welcomeDiv);
                }
                
                // Restore chat history to UI with session detection
                function restoreChatHistory() {
                    chatMessages.innerHTML = '';
                    
                    // Check if this is a new session (user returning after long break)
                    const isNewSession = detectNewSession();
                    
                    if (chatHistory.length === 0 || isNewSession) {
                        // No history or new session, show welcome message
                        if (isNewSession && chatHistory.length > 0) {
                            // Clear old history for new session
                            chatHistory = [];
                            saveChatHistory(chatHistory);
                        }
                        addWelcomeMessage();
                    } else {
                        // Restore previous conversation
                        chatHistory.forEach(item => {
                            restoreMessage(item.text, item.type, item.navigationButtons, item.timestamp);
                        });
                        
                        // Scroll to bottom
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }
                }
                
                // Detect if user is starting a new session
                function detectNewSession() {
                    if (chatHistory.length === 0) return true;
                    
                    const now = new Date();
                    const lastMessageTime = new Date(chatHistory[chatHistory.length - 1].timestamp);
                    const timeSinceLastMessage = now - lastMessageTime;
                    const newSessionThreshold = 6 * 60 * 60 * 1000; // 6 hours
                    
                    return timeSinceLastMessage > newSessionThreshold;
                }
                
                // Restore message without saving to history
                function restoreMessage(text, sender, navigationButtons = null, timestamp = null) {
                    const messageDiv = document.createElement('div');
                    messageDiv.classList.add('message');
                    messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
                    
                    // Add text content
                    const textDiv = document.createElement('div');
                    textDiv.textContent = text;
                    messageDiv.appendChild(textDiv);
                    
                    // Add timestamp
                    const timeToShow = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const timestampDiv = document.createElement('div');
                    timestampDiv.classList.add('message-timestamp');
                    timestampDiv.textContent = timeToShow;
                    messageDiv.appendChild(timestampDiv);
                    
                    // Add navigation buttons if provided
                    if (navigationButtons && navigationButtons.length > 0) {
                        const buttonsContainer = document.createElement('div');
                        buttonsContainer.classList.add('chat-navigation-buttons');
                        
                        navigationButtons.forEach(button => {
                            const btn = document.createElement('button');
                            btn.textContent = button.text;
                            btn.classList.add('chat-nav-btn');
                            btn.addEventListener('click', () => {
                                window.location.href = button.url;
                            });
                            buttonsContainer.appendChild(btn);
                        });
                        
                        messageDiv.appendChild(buttonsContainer);
                    }
                    
                    chatMessages.appendChild(messageDiv);
                }
                
                // Initialize chatbot
                createChatbot();

                    // Get chatbot elements
                const chatToggle = document.getElementById('chatToggle');
                const chatWindow = document.getElementById('chatWindow');
                const closeChat = document.getElementById('closeChat');
                const chatMessages = document.getElementById('chatMessages');
                const chatInput = document.getElementById('chatInput');
                const sendButton = document.getElementById('sendButton');

                    // Chat history management
                const CHAT_HISTORY_KEY = 'homeDecorChatHistory';
                const MAX_HISTORY_LENGTH = 50; // Maximum number of messages to store
                const MAX_HISTORY_AGE_HOURS = 24; // Maximum age of chat history in hours
                const MAX_SESSION_LENGTH = 20; // Maximum messages per session before auto-clear
                
                // Load chat history from localStorage
                function loadChatHistory() {
                    try {
                        const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
                        if (savedHistory) {
                            return JSON.parse(savedHistory);
                        }
                    } catch (error) {
                        console.error('Error loading chat history:', error);
                    }
                    return [];
                }
                
                // Save chat history to localStorage with automatic cleanup
                function saveChatHistory(history) {
                    try {
                        // Auto-cleanup based on various rules
                        let cleanedHistory = autoCleanupHistory(history);
                        
                        // Limit history length to prevent localStorage overflow
                        const limitedHistory = cleanedHistory.slice(-MAX_HISTORY_LENGTH);
                        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(limitedHistory));
                    } catch (error) {
                        console.error('Error saving chat history:', error);
                    }
                }
                
                // Automatic cleanup rules
                function autoCleanupHistory(history) {
                    const now = new Date();
                    const maxAgeMs = MAX_HISTORY_AGE_HOURS * 60 * 60 * 1000;
                    
                    // Remove messages older than MAX_HISTORY_AGE_HOURS
                    const ageFiltered = history.filter(item => {
                        if (!item.timestamp) return true;
                        const messageAge = now - new Date(item.timestamp);
                        return messageAge < maxAgeMs;
                    });
                    
                    // Auto-clear if session is too long (user has been chatting for a while)
                    if (ageFiltered.length > MAX_SESSION_LENGTH) {
                        // Keep only the last 5 messages to maintain some context
                        return ageFiltered.slice(-5);
                    }
                    
                    // Auto-clear if user has been inactive for too long
                    const lastMessageTime = ageFiltered.length > 0 ? new Date(ageFiltered[ageFiltered.length - 1].timestamp) : now;
                    const timeSinceLastMessage = now - lastMessageTime;
                    const inactivityThreshold = 2 * 60 * 60 * 1000; // 2 hours
                    
                    if (timeSinceLastMessage > inactivityThreshold && ageFiltered.length > 10) {
                        // Keep only recent messages
                        return ageFiltered.slice(-3);
                    }
                    
                    return ageFiltered;
                }
                
                // Clear chat history
                function clearChatHistory() {
                    try {
                        localStorage.removeItem(CHAT_HISTORY_KEY);
                        chatMessages.innerHTML = '';
                        addWelcomeMessage();
                    } catch (error) {
                        console.error('Error clearing chat history:', error);
                    }
                }
                
                // Initialize chat history
                let chatHistory = loadChatHistory();
                
                // System prompt for AI context
                const systemPrompt = `You are a friendly, knowledgeable, and professional customer support chatbot for ${websiteData.company}. Your name is 'DecorBot'.

You should answer questions about:
- Products and categories: ${websiteData.products.categories.join(', ')}
- Featured products: ${websiteData.products.featured.join(', ')}
- Shipping: ${websiteData.policies.shipping}
- Returns: ${websiteData.policies.returns}
- Payment: ${websiteData.policies.payment}
- Warranty: ${websiteData.policies.warranty}
- Contact info: Phone: ${websiteData.contact.phone}, Email: ${websiteData.contact.email}
- Company features: ${websiteData.features.join(', ')}

Keep responses concise and helpful. If you don't know something specific, suggest visiting the FAQ page or contacting human support at ${websiteData.contact.phone}. Maintain a warm, inviting tone that matches our elegant furniture brand.`;

            // Restore chat history after chatbot is created
            setTimeout(() => {
                restoreChatHistory();
            }, 100);

    // Toggle chat window
    chatToggle.addEventListener('click', () => {
        chatWindow.classList.add('active');
        chatInput.focus();
    });

                    closeChat.addEventListener('click', () => {
                    chatWindow.classList.remove('active');
                });



    // Close chat when clicking outside
    document.addEventListener('click', (e) => {
        if (!chatWindow.contains(e.target) && !chatToggle.contains(e.target)) {
            chatWindow.classList.remove('active');
        }
    });

                    // Add message to chat with optional navigation buttons
                function addMessage(text, sender, navigationButtons = null) {
                    const messageDiv = document.createElement('div');
                    messageDiv.classList.add('message');
                    messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
                    
                    // Add text content
                    const textDiv = document.createElement('div');
                    textDiv.textContent = text;
                    messageDiv.appendChild(textDiv);
                    
                    // Add timestamp
                    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const timestampDiv = document.createElement('div');
                    timestampDiv.classList.add('message-timestamp');
                    timestampDiv.textContent = timestamp;
                    messageDiv.appendChild(timestampDiv);
                    
                    // Add navigation buttons if provided
                    if (navigationButtons && navigationButtons.length > 0) {
                        const buttonsContainer = document.createElement('div');
                        buttonsContainer.classList.add('chat-navigation-buttons');
                        
                        navigationButtons.forEach(button => {
                            const btn = document.createElement('button');
                            btn.textContent = button.text;
                            btn.classList.add('chat-nav-btn');
                            btn.addEventListener('click', () => {
                                window.location.href = button.url;
                            });
                            buttonsContainer.appendChild(btn);
                        });
                        
                        messageDiv.appendChild(buttonsContainer);
                    }
                    
                    chatMessages.appendChild(messageDiv);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                    
                    // Save message to chat history
                    const historyItem = {
                        type: sender,
                        text: text,
                        timestamp: new Date().toISOString(),
                        navigationButtons: navigationButtons
                    };
                    
                    chatHistory.push(historyItem);
                    saveChatHistory(chatHistory);
                }

                    // Show loading indicator with random animation style and dynamic messages
                function showLoading(show) {
                    if (show) {
                        const loadingDiv = document.createElement('div');
                        loadingDiv.id = 'loadingDots';
                        loadingDiv.classList.add('bot-message');
                        
                        // Randomly select a loading animation style
                        const loadingStyles = ['loading-dots', 'loading-typing', 'loading-spinner', 'loading-wave', 'loading-progress', 'loading-pulse-ring'];
                        const randomStyle = loadingStyles[Math.floor(Math.random() * loadingStyles.length)];
                        loadingDiv.classList.add(randomStyle);
                        
                        // Set appropriate HTML content based on style
                        if (randomStyle === 'loading-dots') {
                            loadingDiv.innerHTML = '<div></div><div></div><div></div>';
                        } else if (randomStyle === 'loading-wave') {
                            loadingDiv.innerHTML = '<div></div><div></div><div></div><div></div><div></div>';
                        }
                        // For loading-typing and loading-spinner, the content is handled by CSS pseudo-elements
                        
                        chatMessages.appendChild(loadingDiv);
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                        
                        // Add dynamic loading messages
                        const loadingMessages = [
                            "🤔 Thinking...",
                            "🔍 Searching our database...",
                            "📝 Crafting the perfect response...",
                            "✨ Processing your request...",
                            "🎯 Finding the best answer...",
                            "💡 Analyzing your question...",
                            "🚀 Almost ready..."
                        ];
                        
                        let messageIndex = 0;
                        const messageInterval = setInterval(() => {
                            if (document.getElementById('loadingDots')) {
                                const currentMessage = loadingMessages[messageIndex % loadingMessages.length];
                                loadingDiv.setAttribute('data-message', currentMessage);
                                messageIndex++;
                            } else {
                                clearInterval(messageInterval);
                            }
                        }, 800);
                        
                    } else {
                        const loadingDiv = document.getElementById('loadingDots');
                        if (loadingDiv) {
                            loadingDiv.remove();
                        }
                    }
                }

    // AI response system using Google Gemini API
    async function generateResponse(userMessage, productContext = '') {
        try {
            const apiKey = 'YOUR-API-KEY';
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            
            const systemPrompt = `You are a friendly, knowledgeable, and professional customer support chatbot for ${websiteData.company}. Your name is 'DecorBot'. 

You should answer questions about:
- Products and categories: ${websiteData.products.categories.join(', ')}
- Featured products: ${websiteData.products.featured.join(', ')}
- Shipping: ${websiteData.policies.shipping}
- Returns: ${websiteData.policies.returns}
- Payment: ${websiteData.policies.payment}
- Warranty: ${websiteData.policies.warranty}
- Contact info: Phone: ${websiteData.contact.phone}, Email: ${websiteData.contact.email}
- Company features: ${websiteData.features.join(', ')}

Keep responses concise and helpful (max 150 words). If you don't know something specific, suggest visiting the FAQ page or contacting human support at ${websiteData.contact.phone}. Maintain a warm, inviting tone that matches our elegant furniture brand.

${productContext ? ('Live catalog context (use for accurate names/prices):\n' + productContext) : ''}`;

            const payload = {
                contents: [{
                    role: "user",
                    parts: [{ text: systemPrompt + "\n\nUser question: " + userMessage }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 200,
                    topP: 0.8,
                    topK: 40
                }
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            
            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                return result.candidates[0].content.parts[0].text;
            } else {
                throw new Error('Invalid response format from API');
            }
            
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            // Fallback to simple responses if API fails
            return generateFallbackResponse(userMessage);
        }
    }

    // Generate navigation buttons based on user question and response
    function generateNavigationButtons(userMessage, aiResponse) {
        const message = userMessage.toLowerCase();
        const response = aiResponse.toLowerCase();
        const buttons = [];
        
        // Product-related questions
        if (message.includes('product') || message.includes('furniture') || message.includes('sofa') || 
            message.includes('chair') || message.includes('table') || message.includes('bed') ||
            message.includes('dining') || message.includes('office') || message.includes('living')) {
            buttons.push({ text: '🛋️ Browse Gallery', url: 'gallery.html' });
            buttons.push({ text: '🏠 Shop by Category', url: 'index.html#categories' });
        }
        
        // Living Room specific
        if (message.includes('living room') || message.includes('livingroom') || message.includes('sofa') || 
            message.includes('couch') || message.includes('coffee table') || message.includes('tv stand') ||
            message.includes('entertainment') || message.includes('lounge')) {
            buttons.push({ text: '🛋️ Living Room', url: 'gallery.html?category=living' });
            buttons.push({ text: '☕ Coffee Tables', url: 'gallery.html?category=living' });
            buttons.push({ text: '📺 TV Stands', url: 'gallery.html?category=living' });
        }
        
        // Dining Room specific
        if (message.includes('dining room') || message.includes('diningroom') || message.includes('dining table') || 
            message.includes('dining chair') || message.includes('dinner') || message.includes('eat') ||
            message.includes('kitchen table') || message.includes('breakfast')) {
            buttons.push({ text: '🍽️ Dining Room', url: 'gallery.html?category=dining' });
            buttons.push({ text: '🪑 Dining Chairs', url: 'gallery.html?category=dining' });
            buttons.push({ text: '🍳 Kitchen Tables', url: 'gallery.html?category=dining' });
        }
        
        // Bedroom specific
        if (message.includes('bedroom') || message.includes('bed') || message.includes('mattress') || 
            message.includes('nightstand') || message.includes('wardrobe') || message.includes('dresser') ||
            message.includes('sleep') || message.includes('master bedroom')) {
            buttons.push({ text: '🛏️ Bedroom', url: 'gallery.html?category=bedroom' });
            buttons.push({ text: '🪞 Wardrobes', url: 'gallery.html?category=bedroom' });
            buttons.push({ text: '💤 Beds & Mattresses', url: 'gallery.html?category=bedroom' });
        }
        
        // Office specific
        if (message.includes('office') || message.includes('desk') || message.includes('office chair') || 
            message.includes('work') || message.includes('study') || message.includes('computer') ||
            message.includes('workspace') || message.includes('home office')) {
            buttons.push({ text: '💼 Office', url: 'gallery.html?category=office' });
            buttons.push({ text: '🪑 Office Chairs', url: 'gallery.html?category=office' });
            buttons.push({ text: '🖥️ Desks', url: 'gallery.html?category=office' });
        }
        
        // 3D models
        if (message.includes('3d') || message.includes('model') || message.includes('ar') || 
            message.includes('augmented reality') || message.includes('virtual')) {
            buttons.push({ text: '🎮 3D Models', url: 'gallery.html?category=3d' });
            buttons.push({ text: '📱 View in AR', url: 'gallery.html?category=3d' });
        }
        
        // Pricing questions
        if (message.includes('price') || message.includes('cost') || message.includes('₹') || 
            message.includes('rupee') || message.includes('expensive') || message.includes('cheap')) {
            buttons.push({ text: '💰 View Products', url: 'gallery.html' });
            buttons.push({ text: '📞 Get Quote', url: 'contact.html' });
        }
        
        // Shipping/Delivery
        if (message.includes('shipping') || message.includes('delivery') || message.includes('transport')) {
            buttons.push({ text: '📦 Shipping Info', url: 'faq.html' });
            buttons.push({ text: '📞 Contact Us', url: 'contact.html' });
        }
        
        // Returns/Refunds
        if (message.includes('return') || message.includes('refund') || message.includes('exchange') || 
            message.includes('warranty') || message.includes('guarantee')) {
            buttons.push({ text: '📋 Return Policy', url: 'faq.html' });
            buttons.push({ text: '📞 Support', url: 'contact.html' });
        }
        
        // Payment methods
        if (message.includes('payment') || message.includes('pay') || message.includes('card') || 
            message.includes('upi') || message.includes('cash') || message.includes('emi')) {
            buttons.push({ text: '💳 Payment Info', url: 'faq.html' });
            buttons.push({ text: '🛒 Checkout', url: 'checkout.html' });
        }
        
        // Contact information
        if (message.includes('contact') || message.includes('phone') || message.includes('email') || 
            message.includes('call') || message.includes('reach') || message.includes('support')) {
            buttons.push({ text: '📞 Contact Us', url: 'contact.html' });
            buttons.push({ text: '📍 Location', url: 'about.html' });
        }
        
        // About company
        if (message.includes('about') || message.includes('company') || message.includes('story') || 
            message.includes('team') || message.includes('history')) {
            buttons.push({ text: '🏢 About Us', url: 'about.html' });
            buttons.push({ text: '👥 Our Team', url: 'about.html#team' });
        }
        
        // Blog/News
        if (message.includes('blog') || message.includes('news') || message.includes('article') || 
            message.includes('tips') || message.includes('guide')) {
            buttons.push({ text: '📰 Blog', url: 'blog.html' });
            buttons.push({ text: '💡 Tips & Guides', url: 'blog.html' });
        }
        
        // FAQ/Help
        if (message.includes('faq') || message.includes('help') || message.includes('question') || 
            message.includes('problem') || message.includes('issue')) {
            buttons.push({ text: '❓ FAQ', url: 'faq.html' });
            buttons.push({ text: '📞 Get Help', url: 'contact.html' });
        }
        
        // Specific furniture types
        if (message.includes('sofa') || message.includes('couch') || message.includes('settee')) {
            buttons.push({ text: '🛋️ Sofas', url: 'gallery.html?category=living' });
            buttons.push({ text: '🪑 Armchairs', url: 'gallery.html?category=living' });
            buttons.push({ text: '🛋️ Living Room', url: 'gallery.html?category=living' });
        }
        
        if (message.includes('table') && !message.includes('dining')) {
            buttons.push({ text: '☕ Coffee Tables', url: 'gallery.html?category=living' });
            buttons.push({ text: '🪑 Side Tables', url: 'gallery.html?category=living' });
            buttons.push({ text: '📺 TV Stands', url: 'gallery.html?category=living' });
        }
        
        if (message.includes('chair') && !message.includes('dining') && !message.includes('office')) {
            buttons.push({ text: '🪑 Armchairs', url: 'gallery.html?category=living' });
            buttons.push({ text: '🛋️ Living Room', url: 'gallery.html?category=living' });
            buttons.push({ text: '🪑 Accent Chairs', url: 'gallery.html?category=living' });
        }
        
        if (message.includes('storage') || message.includes('shelf') || message.includes('cabinet') || 
            message.includes('bookcase') || message.includes('bookshelf')) {
            buttons.push({ text: '📚 Bookshelves', url: 'gallery.html' });
            buttons.push({ text: '🗄️ Cabinets', url: 'gallery.html' });
            buttons.push({ text: '🛋️ Living Room', url: 'gallery.html?category=living' });
        }
        
        // General shopping
        if (message.includes('shop') || message.includes('buy') || message.includes('purchase') || 
            message.includes('order') || message.includes('cart')) {
            buttons.push({ text: '🛒 Browse Products', url: 'gallery.html' });
            buttons.push({ text: '🏠 Home', url: 'index.html' });
        }
        
        // If no specific buttons were added, add general navigation
        if (buttons.length === 0) {
            buttons.push({ text: '🏠 Home', url: 'index.html' });
            buttons.push({ text: '🛋️ Gallery', url: 'gallery.html' });
            buttons.push({ text: '📞 Contact', url: 'contact.html' });
        }
        
        return buttons;
    }

    // Fallback response system for when API is unavailable
    function generateFallbackResponse(userMessage) {
        const message = userMessage.toLowerCase();
        
        // Product inquiries
        if (message.includes('product') || message.includes('furniture') || message.includes('sofa') || message.includes('chair') || message.includes('table') || message.includes('bed')) {
            return `We offer a wide range of furniture across ${websiteData.products.categories.join(', ')} categories.\n\nOur featured products include:\n• ${websiteData.products.featured.slice(0, 3).join('\n• ')}\n\nYou can browse our complete collection in the gallery section. Would you like to know about specific products or categories?`;
        }
        
        // Pricing inquiries
        if (message.includes('price') || message.includes('cost') || message.includes('₹') || message.includes('rupee')) {
            return `Our furniture prices range from ₹6,640 for bar stools to ₹74,700 for premium L-shaped sofas.\n\nAll prices are clearly displayed on our product pages.\n\nWe also offer financing options for larger purchases.`;
        }
        
        // Shipping inquiries
        if (message.includes('shipping') || message.includes('delivery')) {
            return `${websiteData.policies.shipping}\n\nFor specific delivery times, please contact us with your location.`;
        }
        
        // Return inquiries
        if (message.includes('return') || message.includes('refund') || message.includes('exchange')) {
            return `${websiteData.policies.returns}\n\nPlease ensure items are in original packaging for returns.`;
        }
        
        // Payment inquiries
        if (message.includes('payment') || message.includes('pay') || message.includes('card') || message.includes('upi')) {
            return `${websiteData.policies.payment}\n\nWe also offer EMI options for qualifying purchases.`;
        }
        
        // Contact inquiries
        if (message.includes('contact') || message.includes('phone') || message.includes('email') || message.includes('call')) {
            return `You can reach us at:\n\n📞 Phone: ${websiteData.contact.phone}\n📧 Email: ${websiteData.contact.email}\n\nOur support team is available ${websiteData.contact.hours}.`;
        }
        
        // Warranty inquiries
        if (message.includes('warranty') || message.includes('guarantee')) {
            return `${websiteData.policies.warranty}\n\nWe stand behind the quality of all our products.`;
        }
        
        // 3D model inquiries
        if (message.includes('3d') || message.includes('model') || message.includes('ar') || message.includes('augmented reality')) {
            return "We offer interactive 3D models for many of our furniture pieces!\n\nYou can view them in augmented reality to see how they look in your space.\n\nCheck out our 3D Models category in the gallery.";
        }
        
        // General greeting
        if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
            return "Hello! 👋\n\nI'm here to help you with any questions about our furniture collection, orders, or policies.\n\nWhat would you like to know?";
        }
        
        // Default response
        return "Thank you for your question!\n\nFor specific inquiries about orders or complex issues, please call us at " + websiteData.contact.phone + " or visit our FAQ page.\n\nHow else can I assist you today?";
    }

    // Send message
    async function sendMessage() {
        const userText = chatInput.value.trim();
        if (userText === '') return;

        addMessage(userText, 'user');
        chatInput.value = '';
        showLoading(true);

        try {
            // Prepare live catalog matches for product-aware suggestions
            let matches = [];
            try { matches = await findProductMatches(userText, 4); } catch {}
            const contextText = formatProductSuggestionList(matches);

            const botResponse = await generateResponse(userText, contextText);
            showLoading(false);

            // Build a single combined message and buttons set
            const navigationButtons = generateNavigationButtons(userText, botResponse) || [];
            const productButtons = (matches && matches.length) ? matches.slice(0, 4).map(m => ({ text: `View ${m.name}`, url: m.url })) : [];
            const combinedButtons = [...navigationButtons, ...productButtons];

            const suggestionsText = (matches && matches.length)
                ? `\n\nHere are a few options you might like:\n\n${formatProductSuggestionList(matches)}`
                : '';
            const combinedText = botResponse + suggestionsText;

            addMessage(combinedText, 'bot', combinedButtons);
        } catch (error) {
            console.error('Error in sendMessage:', error);
            showLoading(false);
            const errorMessage = "I'm sorry, I'm having trouble connecting right now. Please try again or contact us directly at " + websiteData.contact.phone;
            const fallbackButtons = [
                { text: '📞 Contact Us', url: 'contact.html' },
                { text: '🏠 Home', url: 'index.html' }
            ];
            addMessage(errorMessage, 'bot', fallbackButtons);
        }
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Auto-focus input when chat opens
    chatToggle.addEventListener('click', () => {
        setTimeout(() => {
            chatInput.focus();
        }, 100);
    });
}); 
