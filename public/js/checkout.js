// Checkout page controller
(function(){
	if (typeof window === 'undefined') return;

	// Track auth state so we can relax validation for logged-in users
	let authState = { authenticated: false, user: null };
	// Remember last successful order for re-printing
	let lastOrderContext = null;

	async function checkAuth() {
		try {
			const res = await fetch('/api/check-auth', { credentials: 'include' });
			if (!res.ok) return authState;
			const data = await res.json();
			authState = { authenticated: !!data.authenticated, user: data.user || null };
			prefillFromUser(authState.user);
			// Enforce login requirement for checkout
			if (!authState.authenticated) {
				const redirect = encodeURIComponent('checkout.html' + (window.location.search||''));
				window.location.href = `login.html?redirect=${redirect}`;
			}
			return authState;
		} catch {
			return authState;
		}
	}

	function prefillFromUser(user){
		const fullNameEl = document.getElementById('fullName');
		const emailEl = document.getElementById('email');
		const phoneEl = document.getElementById('phone');
		const countryEl = document.getElementById('country');
		const address1El = document.getElementById('address1');
		const address2El = document.getElementById('address2');
		const stateEl = document.getElementById('state');
		const cityEl = document.getElementById('city');
		const postalEl = document.getElementById('postal');

		// Load from local storage first (user can resume later)
		try {
			const saved = JSON.parse(localStorage.getItem('checkoutFormData') || '{}');
			const assign = (el, key)=>{ if (el && saved && saved[key] && !String(el.value||'').trim()) el.value = saved[key]; };
			assign(fullNameEl, 'fullName'); assign(emailEl, 'email'); assign(phoneEl, 'phone');
			assign(countryEl, 'country'); assign(address1El, 'address1'); assign(address2El, 'address2');
			assign(stateEl, 'state'); assign(cityEl, 'city'); assign(postalEl, 'postal');
		} catch {}

		if (!user) return;
		const name = user.full_name || user.name || [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || '';
		if (fullNameEl && !fullNameEl.value && name) fullNameEl.value = name;
		if (emailEl && !emailEl.value && user.email) emailEl.value = user.email;
		if (phoneEl && !phoneEl.value && user.phone) phoneEl.value = user.phone;
	}

	const fmtINR = (n) => `₹${(Number(n)||0).toLocaleString('en-IN')}`;

	// India location data (states & some major cities). For full coverage, you can also provide data/locations-in.json.
	const LOCATION_DATA_FALLBACK = {
		"Andhra Pradesh": [ { city: 'Visakhapatnam', postal: '530001' }, { city: 'Vijayawada', postal: '520001' }, { city: 'Guntur', postal: '522002' }, { city: 'Nellore', postal: '524001' } ],
		"Arunachal Pradesh": [ { city: 'Itanagar', postal: '791111' } ],
		"Assam": [ { city: 'Guwahati', postal: '781001' }, { city: 'Dibrugarh', postal: '786001' } ],
		"Bihar": [ { city: 'Patna', postal: '800001' }, { city: 'Gaya', postal: '823001' } ],
		"Chhattisgarh": [ { city: 'Raipur', postal: '492001' }, { city: 'Bhilai', postal: '490001' } ],
		"Goa": [ { city: 'Panaji', postal: '403001' }, { city: 'Margao', postal: '403601' } ],
		"Gujarat": [
			{ city: 'Ahmedabad', postal: '380001' },
			{ city: 'Surat', postal: '395003' },
			{ city: 'Vadodara', postal: '390001' },
			{ city: 'Rajkot', postal: '360001' },
			{ city: 'Gandhinagar', postal: '382010' },
			{ city: 'Bhavnagar', postal: '364001' },
			{ city: 'Jamnagar', postal: '361001' },
			{ city: 'Junagadh', postal: '362001' },
			{ city: 'Porbandar', postal: '360575' },
			{ city: 'Bhuj', postal: '370001' },
			{ city: 'Gandhidham', postal: '370201' },
			{ city: 'Mundra', postal: '370421' },
			{ city: 'Morbi', postal: '363641' },
			{ city: 'Surendranagar', postal: '363001' },
			{ city: 'Amreli', postal: '365601' },
			{ city: 'Veraval', postal: '362265' },
			{ city: 'Somnath (Prabhas Patan)', postal: '362268' },
			{ city: 'Dwarka', postal: '361335' },
			{ city: 'Valsad', postal: '396001' },
			{ city: 'Vapi', postal: '396191' },
			{ city: 'Navsari', postal: '396445' },
			{ city: 'Bharuch', postal: '392001' },
			{ city: 'Ankleshwar', postal: '393001' },
			{ city: 'Anand', postal: '388001' },
			{ city: 'Nadiad', postal: '387001' },
			{ city: 'Mehsana', postal: '384001' },
			{ city: 'Palanpur', postal: '385001' },
			{ city: 'Patan', postal: '384265' },
			{ city: 'Himmatnagar', postal: '383001' },
			{ city: 'Modasa', postal: '383315' },
			{ city: 'Dahod', postal: '389151' },
			{ city: 'Godhra', postal: '389001' },
			{ city: 'Deesa', postal: '385535' },
			{ city: 'Idar', postal: '383430' },
			{ city: 'Botad', postal: '364710' },
			{ city: 'Gondal', postal: '360311' },
			{ city: 'Jetpur', postal: '360370' },
			{ city: 'Kalol (Gandhinagar)', postal: '382721' },
			{ city: 'Sanand', postal: '382110' },
			{ city: 'Bardoli', postal: '394601' },
			{ city: 'Halol', postal: '389350' },
			{ city: 'Vyara', postal: '394650' },
			{ city: 'Ahwa (Dang)', postal: '394710' }
		],
		"Haryana": [ { city: 'Gurugram', postal: '122001' }, { city: 'Faridabad', postal: '121001' }, { city: 'Panipat', postal: '132103' } ],
		"Himachal Pradesh": [ { city: 'Shimla', postal: '171001' }, { city: 'Dharamshala', postal: '176215' } ],
		"Jharkhand": [ { city: 'Ranchi', postal: '834001' }, { city: 'Jamshedpur', postal: '831001' } ],
		"Karnataka": [ { city: 'Bengaluru', postal: '560001' }, { city: 'Mysuru', postal: '570001' }, { city: 'Mangaluru', postal: '575001' } ],
		"Kerala": [ { city: 'Thiruvananthapuram', postal: '695001' }, { city: 'Kochi', postal: '682001' }, { city: 'Kozhikode', postal: '673001' } ],
		"Madhya Pradesh": [ { city: 'Bhopal', postal: '462001' }, { city: 'Indore', postal: '452001' }, { city: 'Gwalior', postal: '474001' } ],
		"Maharashtra": [ { city: 'Mumbai', postal: '400001' }, { city: 'Pune', postal: '411001' }, { city: 'Nagpur', postal: '440001' }, { city: 'Nashik', postal: '422001' }, { city: 'Thane', postal: '400601' } ],
		"Manipur": [ { city: 'Imphal', postal: '795001' } ],
		"Meghalaya": [ { city: 'Shillong', postal: '793001' } ],
		"Mizoram": [ { city: 'Aizawl', postal: '796001' } ],
		"Nagaland": [ { city: 'Kohima', postal: '797001' } ],
		"Odisha": [ { city: 'Bhubaneswar', postal: '751001' }, { city: 'Cuttack', postal: '753001' } ],
		"Punjab": [ { city: 'Ludhiana', postal: '141001' }, { city: 'Amritsar', postal: '143001' }, { city: 'Jalandhar', postal: '144001' } ],
		"Rajasthan": [ { city: 'Jaipur', postal: '302001' }, { city: 'Udaipur', postal: '313001' }, { city: 'Jodhpur', postal: '342001' } ],
		"Sikkim": [ { city: 'Gangtok', postal: '737101' } ],
		"Tamil Nadu": [ { city: 'Chennai', postal: '600001' }, { city: 'Coimbatore', postal: '641001' }, { city: 'Madurai', postal: '625001' } ],
		"Telangana": [ { city: 'Hyderabad', postal: '500001' }, { city: 'Warangal', postal: '506002' } ],
		"Tripura": [ { city: 'Agartala', postal: '799001' } ],
		"Uttar Pradesh": [ { city: 'Lucknow', postal: '226001' }, { city: 'Kanpur', postal: '208001' }, { city: 'Noida', postal: '201301' }, { city: 'Varanasi', postal: '221001' } ],
		"Uttarakhand": [ { city: 'Dehradun', postal: '248001' }, { city: 'Haridwar', postal: '249401' } ],
		"West Bengal": [ { city: 'Kolkata', postal: '700001' }, { city: 'Siliguri', postal: '734001' } ],
		// Union Territories
		"Delhi": [ { city: 'New Delhi', postal: '110001' } ],
		"Jammu and Kashmir": [ { city: 'Srinagar', postal: '190001' }, { city: 'Jammu', postal: '180001' } ],
		"Ladakh": [ { city: 'Leh', postal: '194101' } ],
		"Chandigarh": [ { city: 'Chandigarh', postal: '160017' } ],
		"Puducherry": [ { city: 'Puducherry', postal: '605001' } ],
		"Dadra and Nagar Haveli and Daman and Diu": [ { city: 'Daman', postal: '396210' }, { city: 'Silvassa', postal: '396230' } ],
		"Andaman and Nicobar Islands": [ { city: 'Port Blair', postal: '744101' } ],
		"Lakshadweep": [ { city: 'Kavaratti', postal: '682555' } ]
	};

	let LOCATION_DATA = LOCATION_DATA_FALLBACK;

	async function tryLoadLocationData(){
		try {
			const res = await fetch('data/locations-in.json', { cache: 'no-store' });
			if (!res.ok) return;
			const json = await res.json();
			// Expect shape: { "State": [{ city, postal }, ...], ... }
			if (json && typeof json === 'object') {
				LOCATION_DATA = json;
			}
		} catch {}
	}

	function ensureSelectFrom(el, fallbackId){
		if (!el) return null;
		if (String(el.tagName).toLowerCase() === 'select') return el;
		const initial = el.value || '';
		const sel = document.createElement('select');
		sel.id = el.id || fallbackId || '';
		sel.name = el.name || sel.id || '';
		sel.className = el.className || '';
		sel.setAttribute('data-initial', initial);
		if (el.parentNode) el.parentNode.replaceChild(sel, el);
		return sel;
	}

	async function initLocationSelectors(){
		await tryLoadLocationData();
		const stateEl = ensureSelectFrom(document.getElementById('state'), 'state');
		const cityEl = ensureSelectFrom(document.getElementById('city'), 'city');
		const postalEl = document.getElementById('postal');
		if (!stateEl || !cityEl) return;

		// Add an optional manual city input (shown when user selects Other)
		let cityOtherEl = document.getElementById('cityOther');
		if (!cityOtherEl) {
			cityOtherEl = document.createElement('input');
			cityOtherEl.type = 'text';
			cityOtherEl.id = 'cityOther';
			cityOtherEl.name = 'cityOther';
			cityOtherEl.placeholder = 'Enter city';
			cityOtherEl.style.display = 'none';
			cityEl.insertAdjacentElement('afterend', cityOtherEl);
		}

		const states = Object.keys(LOCATION_DATA).sort();
		stateEl.innerHTML = '<option value="">Select State</option>' + states.map(s => `<option value="${s}">${s}</option>`).join('');

		const populateCities = (state, preservePostal=false) => {
			const list = LOCATION_DATA[state] || [];
			cityEl.innerHTML = '<option value="">Select City</option>' + list.map(c => `<option value="${c.city}" data-postal="${c.postal}">${c.city}</option>`).join('') + '<option value="__OTHER__">Other (Enter manually)</option>';
			if (!preservePostal && postalEl) postalEl.value = '';
			cityOtherEl.style.display = 'none';
		};

		stateEl.addEventListener('change', () => {
			populateCities(stateEl.value);
		});

		cityEl.addEventListener('change', () => {
			const val = cityEl.value;
			if (val === '__OTHER__') {
				cityOtherEl.style.display = '';
				if (postalEl) postalEl.value = '';
				return;
			}
			cityOtherEl.style.display = 'none';
			const opt = cityEl.options[cityEl.selectedIndex];
			const pin = opt ? opt.getAttribute('data-postal') : '';
			if (postalEl) postalEl.value = pin || postalEl.value || '';
		});

		// Reverse lookup by PIN: when user types a valid 6-digit PIN, auto-select state/city if known
		if (postalEl) {
			postalEl.addEventListener('input', () => {
				const pin = String(postalEl.value || '').trim();
				if (!/^\d{6}$/.test(pin)) return;
				// Find state and city with matching PIN
				let foundState = '';
				let foundCity = '';
				for (const st of Object.keys(LOCATION_DATA)) {
					const list = LOCATION_DATA[st] || [];
					const match = list.find(entry => String(entry.postal) === pin);
					if (match) { foundState = st; foundCity = String(match.city); break; }
				}
				if (foundState) {
					stateEl.value = foundState;
					populateCities(foundState, true);
					// Try set city
					const option = Array.from(cityEl.options).find(o => o.value === foundCity);
					if (option) {
						cityEl.value = foundCity;
					} else {
						cityEl.value = '__OTHER__';
						cityOtherEl.style.display = '';
						cityOtherEl.value = foundCity;
					}
				}
			});
		}

		// Try to restore previous values if present
		const initState = stateEl.getAttribute('data-initial') || '';
		if (initState && states.includes(initState)) {
			stateEl.value = initState;
			populateCities(initState);
			const initCity = cityEl.getAttribute('data-initial') || '';
			if (initCity) {
				// If the city isn't in list, switch to Other and keep the text in cityOther
				const found = Array.from(cityEl.options).some(o => o.value === initCity);
				if (found) {
					cityEl.value = initCity;
					const opt = cityEl.options[cityEl.selectedIndex];
					const pin = opt ? opt.getAttribute('data-postal') : '';
					if (postalEl && pin) postalEl.value = pin;
				} else {
					cityEl.value = '__OTHER__';
					cityOtherEl.style.display = '';
					cityOtherEl.value = initCity;
				}
			}
		}
	}

	function readCart(){
		try {
			const raw = JSON.parse(localStorage.getItem('cart')) || [];
			const norm = (u)=> typeof u === 'string' ? u.replace(/\\\\/g,'/').replace(/\\/g,'/') : u;
			return (raw || []).map(it => ({
				...it,
				id: String(it.id),
				quantity: Math.max(1, parseInt(it.quantity, 10) || 1),
				price: typeof it.price === 'number' ? it.price : (parseFloat(it.price) || 0),
				image: norm(it.image) || 'image/1.png'
			}));
		} catch { return []; }
	}

	// Checkout state
	let selectedShippingMethod = 'standard';
	let promo = { code: '', percent: 0, freeShip: false };

	function calcTotals(items){
		const subtotal = items.reduce((s, it)=> s + (it.price * it.quantity), 0);
		// Shipping based on method
		let shipping = 0;
		if (selectedShippingMethod === 'pickup') {
			shipping = 0;
		} else if (selectedShippingMethod === 'express') {
			shipping = items.length ? 999 : 0;
		} else {
			// standard
			const base = items.length ? 499 : 0;
			shipping = (subtotal >= 50000 ? 0 : base);
		}
		// Promo free shipping overrides shipping
		if (promo.freeShip) shipping = 0;
		const discount = Math.round(subtotal * (promo.percent / 100));
		const tax = Math.round((subtotal - discount) * 0.18); // GST based on discounted subtotal
		const total = Math.max(0, subtotal - discount) + shipping + tax;
		return { subtotal, shipping, discount, tax, total };
	}

	function renderSummary(items){
		const container = document.getElementById('summaryItems');
		const subtotalEl = document.getElementById('subtotal');
		const shippingEl = document.getElementById('shipping');
		const taxEl = document.getElementById('tax');
		const totalEl = document.getElementById('grandTotal');
		const discountEl = document.getElementById('discount');
		const discountRow = document.getElementById('discountRow');
		if (!container) return;
		container.innerHTML = '';
		if (!items.length) {
			const div = document.createElement('div');
			div.className = 'summary-empty';
			div.textContent = 'Your cart is empty.';
			container.appendChild(div);
		} else {
			items.forEach((it, idx) => {
				const row = document.createElement('div');
				row.className = 'summary-item';
				const img = document.createElement('img');
				img.src = String(it.image || 'image/1.png');
				img.alt = String(it.name || 'Item');
				img.addEventListener('error', () => { img.src = 'image/1.png'; });
				const info = document.createElement('div');
				const nameDiv = document.createElement('div');
				nameDiv.className = 'name';
				nameDiv.textContent = String(it.name || 'Item');
				const metaDiv = document.createElement('div');
				metaDiv.className = 'meta';
				metaDiv.textContent = 'Qty: ' + String(it.quantity || 1);
				// Quantity controls
				const qty = document.createElement('div');
				qty.className = 'qty-controls';
				const minus = document.createElement('button'); minus.type = 'button'; minus.className = 'qty-btn'; minus.textContent = '−';
				const count = document.createElement('span'); count.className = 'qty-count'; count.textContent = String(it.quantity || 1);
				const plus = document.createElement('button'); plus.type = 'button'; plus.className = 'qty-btn'; plus.textContent = '+';
				const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove-item'; remove.textContent = 'Remove';

				function persistCart(updated){ try { localStorage.setItem('cart', JSON.stringify(updated)); } catch {} }
				minus.addEventListener('click', ()=>{
					const current = readCart();
					const target = current[idx];
					if (!target) return;
					target.quantity = Math.max(1, (target.quantity||1) - 1);
					persistCart(current);
					// Re-render
					renderSummary(current);
				});
				plus.addEventListener('click', ()=>{
					const current = readCart();
					const target = current[idx];
					if (!target) return;
					target.quantity = Math.min(99, (target.quantity||1) + 1);
					persistCart(current);
					renderSummary(current);
				});
				remove.addEventListener('click', ()=>{
					const current = readCart();
					const next = current.filter((_, i) => i !== idx);
					persistCart(next);
					renderSummary(next);
				});
				qty.appendChild(minus);
				qty.appendChild(count);
				qty.appendChild(plus);
				qty.appendChild(remove);
				metaDiv.appendChild(qty);
				info.appendChild(nameDiv);
				info.appendChild(metaDiv);
				const priceDiv = document.createElement('div');
				priceDiv.className = 'price';
				priceDiv.textContent = fmtINR((Number(it.price)||0) * (Number(it.quantity)||1));
				row.appendChild(img);
				row.appendChild(info);
				row.appendChild(priceDiv);
				container.appendChild(row);
			});
		}
		const t = calcTotals(items);
		if (subtotalEl) subtotalEl.textContent = fmtINR(t.subtotal);
		if (shippingEl) shippingEl.textContent = fmtINR(t.shipping);
		if (discountEl) discountEl.textContent = '−' + fmtINR(t.discount);
		if (discountRow) discountRow.hidden = !(t.discount > 0);
		if (taxEl) taxEl.textContent = fmtINR(t.tax);
		if (totalEl) totalEl.textContent = fmtINR(t.total);
	}

	function initLinearProgress(){
		// Linear progress is optional now; circular FAB should still work without it
		const progress = document.querySelector('.checkout-progress-linear');
		const bar = progress ? progress.querySelector('.bar') : null;
		const label = progress ? progress.querySelector('.label') : null;
		const form = document.getElementById('checkoutForm');
		if (!form) return;

		function countFilled(ids){
			let filled = 0;
			ids.forEach(id => {
				const el = form.querySelector('#'+id);
				if (!el) return;
				const val = String(el.value||'').trim();
				if (val) filled++;
			});
			return filled;
		}

		function computeProgress(){
			// Base: details fields
			const required = authState.authenticated
				? ['address1','city','state','postal']
				: ['fullName','email','address1','city','state','postal'];
			let max = required.length + 1; // +1 for payment selection
			let done = countFilled(required);
			// If city is other, count cityOther too
			const citySel = form.querySelector('#city');
			if (citySel && citySel.value === '__OTHER__') {
				const other = form.querySelector('#cityOther');
				if (other && String(other.value).trim()) done++;
				max++;
			}
			// Payment method selected
			const pm = form.querySelector('input[name="paymentMethod"]:checked');
			if (pm) done++;
			// If upi selected, count upiId as an extra chunk when filled
			if (pm && pm.value === 'upi') {
				max++;
				const upi = form.querySelector('#upiId');
				if (upi && String(upi.value).trim()) done++;
			}
			// If card selected, treat three inputs as two chunks: number/expiry+cvv
			if (pm && pm.value === 'card') {
				max += 2;
				const num = form.querySelector('#cardNumber');
				const exp = form.querySelector('#expiry');
				const cvv = form.querySelector('#cvv');
				if (num && String(num.value).replace(/\s/g,'').length >= 14) done++;
				if (exp && /^(0[1-9]|1[0-2])\/\d{2}$/.test(String(exp.value)) && cvv && String(cvv.value).trim().length >= 3) done++;
			}
			const pct = Math.max(0, Math.min(100, Math.round((done / Math.max(1, max)) * 100)));
			if (bar) bar.style.setProperty('--progress', pct + '%');
			if (progress) progress.setAttribute('aria-valuenow', String(pct));
			if (label) label.textContent = pct + '%';

			// Update floating circular progress (if present)
			const fab = document.querySelector('.checkout-progress-fab');
			if (fab) {
				const circ = fab.querySelector('.ring-fg');
				const fabLabel = fab.querySelector('.progress-text');
				const radius = 20; // matches r in SVG
				const circumference = 2 * Math.PI * radius; // ~125.66
				const offset = circumference * (1 - (pct / 100));
				if (circ) circ.style.strokeDashoffset = String(offset);
				fab.setAttribute('aria-valuenow', String(pct));
				if (fabLabel) fabLabel.textContent = pct + '%';
			}
		}

		const events = ['input','change','blur'];
		events.forEach(ev => form.addEventListener(ev, computeProgress, true));
		const pmRadios = form.querySelectorAll('input[name="paymentMethod"]');
		pmRadios.forEach(r => r.addEventListener('change', computeProgress));
		computeProgress();
	}

	// Toggle payment detail fieldsets visibility (COD/UPI/Card)
	function bindPaymentToggles(){
		const radios = document.querySelectorAll('input[name="paymentMethod"]');
		const upi = document.getElementById('upiFields');
		const card = document.getElementById('cardFields');
		const set = (v)=>{
			if (upi) upi.hidden = v !== 'upi';
			if (card) card.hidden = v !== 'card';
		};
		radios.forEach(r => r.addEventListener('change', ()=> set(document.querySelector('input[name="paymentMethod"]:checked')?.value)));
		const checked = document.querySelector('input[name="paymentMethod"]:checked');
		if (checked) set(checked.value);
	}

	// Shipping method toggles & delivery estimate
	function bindShippingToggles(items){
		const radios = document.querySelectorAll('input[name="shippingMethod"]');
		const estimate = document.getElementById('deliveryEstimate');
		const updateEstimate = ()=>{
			let text = 'Estimated delivery: 3–5 days';
			if (selectedShippingMethod === 'express') text = 'Estimated delivery: 1–2 days';
			if (selectedShippingMethod === 'pickup') text = 'Pickup today at store';
			if (estimate) estimate.textContent = text;
		};
		radios.forEach(r => r.addEventListener('change', ()=>{
			selectedShippingMethod = document.querySelector('input[name="shippingMethod"]:checked')?.value || 'standard';
			updateEstimate();
			renderSummary(items);
		}));
		updateEstimate();
	}

	// Validate required fields and payment-specific inputs
	// Luhn algorithm for card validation
	function luhnCheck(num){
		const digits = String(num).replace(/\s+/g, '');
		if (!/^\d{14,19}$/.test(digits)) return false;
		let sum = 0; let alt = false;
		for (let i = digits.length - 1; i >= 0; i--) {
			let n = parseInt(digits[i], 10);
			if (alt) { n *= 2; if (n > 9) n -= 9; }
			sum += n; alt = !alt;
		}
		return (sum % 10) === 0;
	}

	function validate(form){
		const need = authState.authenticated
			? ['address1','city','state','postal']
			: ['fullName','email','address1','city','state','postal'];
		// Clear existing error states
		form.querySelectorAll('.field-error').forEach(e => e.remove());
		function flag(el, msg){
			if (!el) return;
			el.setAttribute('aria-invalid','true');
			const small = document.createElement('small');
			small.className = 'field-error';
			small.style.color = '#a33';
			small.textContent = msg;
			el.insertAdjacentElement('afterend', small);
		}
		for (const id of need) {
			const el = form.querySelector('#'+id);
			if (!el || !String(el.value).trim()) { flag(el, 'Required'); return { ok:false, message:'Please fill all required fields.' }; }
		}
		// Extra rule: if city is Other, ensure manual city is provided
		const citySel = form.querySelector('#city');
		if (citySel && citySel.value === '__OTHER__') {
			const other = form.querySelector('#cityOther');
			if (!other || !String(other.value).trim()) return { ok:false, message:'Please enter your city.' };
		}
		const pm = form.querySelector('input[name="paymentMethod"]:checked')?.value;
		if (pm === 'upi') {
			const upi = form.querySelector('#upiId');
			if (!upi || !/^[\w.-]+@[\w.-]+$/.test(String(upi.value).trim())) {
				flag(upi, 'Enter a valid UPI ID (e.g., name@bank).');
				return { ok:false, message:'Enter a valid UPI ID (e.g., name@bank).' };
			}
		}
		if (pm === 'card') {
			const num = form.querySelector('#cardNumber');
			const exp = form.querySelector('#expiry');
			const cvv = form.querySelector('#cvv');
			if (!num || !luhnCheck(num.value)) { flag(num, 'Invalid card number'); return { ok:false, message:'Enter a valid card number.' }; }
			if (!exp || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(String(exp.value))) { flag(exp, 'Use MM/YY'); return { ok:false, message:'Enter expiry as MM/YY.' }; }
			if (!cvv || String(cvv.value).trim().length < 3) { flag(cvv, '3–4 digits'); return { ok:false, message:'Enter a valid CVV.' }; }
		}
		return { ok:true };
	}

	async function submitOrder(form, items){
		const totals = calcTotals(items);
		const selectedCity = (form.city?.value === '__OTHER__') ? (form.cityOther?.value?.trim() || '') : (form.city?.value?.trim() || '');
		const payload = {
			items: items.map(it => ({ id: it.id, name: it.name, price: it.price, quantity: it.quantity })),
			shipping: {
				fullName: (form.fullName?.value?.trim()) || authState.user?.full_name || authState.user?.name || authState.user?.username || '',
				email: (form.email?.value?.trim()) || authState.user?.email || '',
				phone: form.phone.value.trim(),
				country: form.country.value.trim(),
				address1: form.address1.value.trim(),
				address2: form.address2.value.trim(),
				city: selectedCity,
				state: form.state.value.trim(),
				postal: form.postal.value.trim(),
			},
			// Fake payment: mark as mock-paid without contacting any gateway
			payment: {
				method: 'mock',
				status: 'paid',
				upiId: null,
				cardLast4: null,
			},
			amounts: totals
		};

		try {
			const res = await fetch('/api/orders', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(payload) });
			if (!res.ok) throw new Error('Order failed');
			const data = await res.json();
			
			console.log('✅ Order created successfully:', data);
			
			// Send order data to n8n webhook for invoice generation
			if (data.orderId) {
				console.log('📧 Preparing to send invoice to n8n...');
				try {
					// Send each item as a separate webhook call or combine them
					const customerName = payload.shipping.fullName;
					const customerEmail = payload.shipping.email;
					
					console.log('Sending order data to n8n webhook...');
					
					// Send order data to n8n webhook
					for (const item of items) {
						const webhookPayload = {
							orderId: data.orderId,
							customerName: customerName,
							customerEmail: customerEmail,
							productName: item.name,
							quantity: item.quantity,
							price: item.price,
							totalAmount: item.price * item.quantity,
							orderDate: new Date().toISOString(),
							shippingAddress: {
								phone: payload.shipping.phone,
								country: payload.shipping.country,
								address1: payload.shipping.address1,
								address2: payload.shipping.address2,
								city: selectedCity,
								state: payload.shipping.state,
								postal: payload.shipping.postal
							},
							grandTotal: totals.total
						};
						
						console.log('n8n webhook payload:', webhookPayload);
						
						// Fire and forget - don't block order completion
						fetch('	https://smarty67.app.n8n.cloud/webhook/fcc3c895-f089-4bb6-a23e-3621110f11f7', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify(webhookPayload)
						})
						.then(response => {
							console.log('n8n webhook response status:', response.status);
							if (!response.ok) {
								console.warn('n8n webhook returned error:', response.status, response.statusText);
							} else {
								console.log('✅ Invoice sent to n8n successfully for:', item.name);
							}
							return response.text();
						})
						.then(text => {
							console.log('n8n webhook response:', text);
						})
						.catch(err => {
							console.warn('❌ n8n webhook error:', err);
						});
					}
				} catch (webhookErr) {
					console.warn('Failed to send to n8n:', webhookErr);
					// Don't fail the order, just log the error
				}
			} else {
				console.warn('⚠️ Order data missing orderId, cannot send to n8n:', data);
			}
			
			return { ok:true, data };
		} catch (e) {
			console.warn('Order submit error:', e);
			return { ok:false };
		}
	}

	function showSuccess(total){
		const modal = document.getElementById('checkoutSuccess');
		const text = document.getElementById('successText');
		if (text) text.textContent = `Your order has been placed successfully. Total: ${fmtINR(total)}.`;
		if (modal) {
			modal.classList.add('active');
			modal.setAttribute('aria-hidden','false');
			// lock body scroll when modal is open
			try { document.body.classList.add('no-scroll'); } catch {}
			// focus the primary action inside the dialog
			setTimeout(() => {
				const primary = modal.querySelector('#successContinueBtn, .success-dialog a, .success-dialog button, .success-dialog [tabindex="0"]');
				if (primary && primary.focus) primary.focus();
			}, 50);
		}
	}

	function closeSuccessModal(){
		const m = document.getElementById('checkoutSuccess');
		if (!m) return;
		m.classList.remove('active');
		m.setAttribute('aria-hidden','true');
		try { document.body.classList.remove('no-scroll'); } catch {}
		// return focus to a sensible element on page
		const focusBack = document.getElementById('placeOrderBtn') || document.querySelector('.navbar-brand');
		if (focusBack && focusBack.focus) try { focusBack.focus(); } catch {}
	}

	// Open a printable order confirmation preview (fake email)
	function renderEmailPreview(email, items, totals, orderId){
		// HTML escape helper
		const escapeHTML = (str) => {
			const map = {
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#39;'
			};
			return String(str || '').replace(/[&<>"']/g, c => map[c]);
		};

		const rows = items.map(it => `
		  <tr>
		    <td style="padding:6px 8px;border-bottom:1px solid #eee;">${escapeHTML(it.name||'Item')}</td>
		    <td style="padding:6px 8px;border-bottom:1px solid #eee;">${(it.quantity||1)}</td>
		    <td style="padding:6px 8px;border-bottom:1px solid #eee;">${fmtINR((Number(it.price)||0))}</td>
		  </tr>`).join('');
		const html = `
		  <div style="font-family: Jost, Arial, sans-serif; padding:16px; max-width:720px; margin:16px auto;">
		    <h2 style="margin:0 0 8px;">Order Confirmation</h2>
		    <p style="margin:0 0 12px;">Thanks for your purchase${email?`, ${escapeHTML(email)}`:''}! ${orderId?`Your order <strong>#${escapeHTML(String(orderId))}</strong> `:'Your order '}has been received.</p>
		    <table style="width:100%; border-collapse:collapse; margin:16px 0;">
		      <thead>
		        <tr>
		          <th style="text-align:left; padding:6px 8px; border-bottom:2px solid #ddd;">Item</th>
		          <th style="text-align:left; padding:6px 8px; border-bottom:2px solid #ddd;">Qty</th>
		          <th style="text-align:left; padding:6px 8px; border-bottom:2px solid #ddd;">Price</th>
		        </tr>
		      </thead>
		      <tbody>${rows}</tbody>
		    </table>
		    <div style="text-align:right;">
		      <div>Subtotal: <strong>${fmtINR(Number(totals.subtotal)||0)}</strong></div>
		      <div>Shipping: <strong>${fmtINR(Number(totals.shipping)||0)}</strong></div>
		      <div>Tax: <strong>${fmtINR(Number(totals.tax)||0)}</strong></div>
		      <div style="font-size:18px;margin-top:6px;">Total: <strong>${fmtINR(Number(totals.total)||0)}</strong></div>
		    </div>
		    <p style="margin-top:16px;color:#555;">Payment method: Mock Payment (Test)</p>
		    <p style="margin-top:8px;">You can print this page as a receipt for your records.</p>
		  </div>`;
		const w = window.open('', '_blank');
		if (!w) return;
		w.document.write(`<!DOCTYPE html><html><head><title>Order Confirmation</title></head><body>${html}</body></html>`);
		w.document.close();
	}

	function attachFormatters(){
		const num = document.getElementById('cardNumber');
		const exp = document.getElementById('expiry');
		if (num) num.addEventListener('input', ()=> { num.value = num.value.replace(/[^\d]/g,'').replace(/(.{4})/g,'$1 ').trim(); });
		if (exp) exp.addEventListener('input', ()=> { exp.value = exp.value.replace(/[^\d]/g,'').slice(0,4).replace(/^(\d{2})(\d{0,2}).*/, (m,a,b)=> b?`${a}/${b}`:a); });
		const toggle = document.getElementById('toggleCvv');
		const cvv = document.getElementById('cvv');
		if (toggle && cvv) {
			toggle.addEventListener('click', ()=>{
				const isPwd = cvv.type === 'password';
				cvv.type = isPwd ? 'text' : 'password';
				toggle.textContent = isPwd ? 'Hide' : 'Show';
				toggle.setAttribute('aria-label', isPwd ? 'Hide CVV' : 'Show CVV');
			});
		}
	}

	function notify(msg, type='info'){
		if (window.cartPopupSystem && window.cartPopupSystem.showNotification) {
			window.cartPopupSystem.showNotification(msg, type);
		} else {
			alert(msg);
		}
	}

	// (removed old step-based dynamic progress)

	async function init(){
		const items = readCart();
		renderSummary(items);
	bindPaymentToggles();
	// Initialize state/city dropdowns and auto pincode
	await initLocationSelectors();
		attachFormatters();
		initLinearProgress();
		bindShippingToggles(items);
		// Persist form fields to local storage
		const persistTargets = ['fullName','email','phone','country','address1','address2','state','city','postal','upiId','cardNumber','expiry'];
		persistTargets.forEach(id => {
			const el = document.getElementById(id);
			if (!el) return;
			const handler = ()=>{
				try {
					const saved = JSON.parse(localStorage.getItem('checkoutFormData') || '{}');
					saved[id] = String(el.value || '');
					localStorage.setItem('checkoutFormData', JSON.stringify(saved));
				} catch {}
			};
			el.addEventListener('input', handler);
			el.addEventListener('change', handler);
		});
		// Promo code apply
		const promoInput = document.getElementById('promoCode');
		const applyBtn = document.getElementById('applyPromoBtn');
		function applyPromo(){
			const code = String(promoInput?.value || '').trim().toUpperCase();
			promo = { code: '', percent: 0, freeShip: false };
			if (code === 'SAVE10') promo = { code, percent: 10, freeShip: false };
			else if (code === 'NEWYEAR15') promo = { code, percent: 15, freeShip: false };
			else if (code === 'FREESHIP') promo = { code, percent: 0, freeShip: true };
			renderSummary(items);
			if (applyBtn) applyBtn.textContent = promo.code ? 'Applied' : 'Apply';
		}
		if (applyBtn) applyBtn.addEventListener('click', applyPromo);
		if (promoInput) promoInput.addEventListener('keydown', (e)=>{ if (e.key === 'Enter') { e.preventDefault(); applyPromo(); } });
		// Enforce login before allowing checkout
		await checkAuth();
		const form = document.getElementById('checkoutForm');
		const btn = document.getElementById('placeOrderBtn');
		if (btn) btn.disabled = items.length === 0;
		// Success modal actions
		const closeBtn = document.getElementById('successCloseBtn');
		if (closeBtn) closeBtn.addEventListener('click', closeSuccessModal);
		const printBtn = document.getElementById('successPrintBtn');
		if (printBtn) printBtn.addEventListener('click', () => {
			if (lastOrderContext) {
				const { email, items, totals, orderId } = lastOrderContext;
				try { renderEmailPreview(email || '', items || [], totals || {subtotal:0,shipping:0,tax:0,total:0}, orderId || null); } catch {}
			} else {
				const itemsNow = readCart();
				const totalsNow = calcTotals(itemsNow);
				try { renderEmailPreview(document.getElementById('email')?.value || '', itemsNow, totalsNow, null); } catch {}
			}
		});
		if (form) {
			form.addEventListener('submit', async (e)=>{
				e.preventDefault();
				if (!readCart().length) { notify('Your cart is empty.', 'warning'); return; }
				const v = validate(form);
				if (!v.ok) { notify(v.message || 'Please fix the errors.', 'warning'); return; }
				btn && (btn.disabled = true);
				const itemsNow = readCart();
				const totalsNow = calcTotals(itemsNow);
				const res = await submitOrder(form, itemsNow);
				if (res.ok) {
					try { renderEmailPreview(form.email?.value || '', itemsNow, totalsNow, res.data?.order_id); } catch {}
					// Save context for re-print
					try { lastOrderContext = { email: form.email?.value || '', items: itemsNow, totals: totalsNow, orderId: res.data?.order_id || null }; } catch {}
					try { localStorage.setItem('cart', JSON.stringify([])); } catch {}
					if (window.cartPopupSystem) window.cartPopupSystem.updateCartCount();
					showSuccess(totalsNow.total);
				} else {
					notify('Could not place order. Please try again.', 'error');
					btn && (btn.disabled = false);
				}
			});
		}
	}

	// global listeners for closing the success modal (ESC and backdrop click)
	document.addEventListener('keydown', (e)=>{
		if (e.key === 'Escape') {
			const m = document.getElementById('checkoutSuccess');
			if (m && m.classList.contains('active')) closeSuccessModal();
		}
	});
	document.addEventListener('click', (e)=>{
		const m = document.getElementById('checkoutSuccess');
		if (!m || !m.classList.contains('active')) return;
		if (e.target && e.target.classList && e.target.classList.contains('success-backdrop')) {
			closeSuccessModal();
		}
	});

	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

