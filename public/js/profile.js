// Profile page logic: fetch, render, update profile and password
(async function(){
  const api = async (path, options = {}) => {
    const res = await fetch(path, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...options });
    const data = await res.json().catch(()=>({}));
    if (!res.ok) {
      const err = new Error(data.error || 'Request failed');
      err.status = res.status;
      throw err;
    }
    return data;
  };

  // Redirect if not authenticated
  const auth = await api('/api/check-auth').catch(()=>({ authenticated:false }));
  if (!auth.authenticated) {
    location.href = '/login.html';
    return;
  }

  const user = auth.user;
  // Admin link if admin
  const adminLink = document.getElementById('adminLink');
  if (adminLink) adminLink.style.display = (user.role === 'admin') ? 'inline-block' : 'none';

  // Display basics
  const initials = (name) => (name||user.username||'U').split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase();
  document.getElementById('avatarInitials').textContent = initials(user.full_name);
  document.getElementById('displayName').textContent = user.full_name || user.username;
  document.getElementById('displayUsername').textContent = '@' + (user.username || 'user');
  // Role chip removed from UI; keep admin link toggle only

  // Get full profile from server
  const profile = await api('/api/profile').then(r=>r.user);
  document.getElementById('displayEmail').textContent = profile.email || '—';
  document.getElementById('displayPhone').textContent = profile.phone || '—';
  document.getElementById('displayAddress').textContent = profile.address || '—';

  // Prefill form
  document.getElementById('full_name').value = profile.full_name || '';
  document.getElementById('phone').value = profile.phone || '';
  document.getElementById('address').value = profile.address || '';

  // Save profile
  const profileForm = document.getElementById('profileForm');
  const profileMsg = document.getElementById('profileMsg');
  profileForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    profileMsg.textContent = '';
    const body = {
      full_name: document.getElementById('full_name').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      address: document.getElementById('address').value.trim()
    };
    try {
      const res = await api('/api/profile', { method:'PUT', body: JSON.stringify(body) });
      profileMsg.textContent = 'Profile updated successfully';
      profileMsg.className = 'msg ok';
      // refresh display
      const updated = await api('/api/profile').then(r=>r.user);
      document.getElementById('displayName').textContent = updated.full_name || user.username;
      document.getElementById('displayPhone').textContent = updated.phone || '—';
      document.getElementById('displayAddress').textContent = updated.address || '—';
      document.getElementById('avatarInitials').textContent = initials(updated.full_name);
    } catch(ex) {
      profileMsg.textContent = ex.message;
      profileMsg.className = 'msg error';
    }
  });

  // Change password
  const passwordForm = document.getElementById('passwordForm');
  const passwordMsg = document.getElementById('passwordMsg');
  passwordForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    passwordMsg.textContent = '';
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    if (newPassword !== confirmPassword) {
      passwordMsg.textContent = 'New passwords do not match';
      passwordMsg.className = 'msg error';
      return;
    }
    try {
      await api('/api/change-password', { method:'PUT', body: JSON.stringify({ currentPassword, newPassword }) });
      passwordMsg.textContent = 'Password updated';
      passwordMsg.className = 'msg ok';
      passwordForm.reset();
    } catch(ex) {
      passwordMsg.textContent = ex.message;
      passwordMsg.className = 'msg error';
    }
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', async()=>{
    try { await api('/api/logout', { method:'POST' }); } catch(e) {}
    location.href = '/login.html';
  })

  // Back button: go back if possible, otherwise go home
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', ()=>{
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '/';
      }
    });
  }

  // Modal helpers
  const openModal = (id) => { const el = document.getElementById(id); if (el) el.classList.add('active'); };
  const closeModal = (id) => { const el = document.getElementById(id); if (el) el.classList.remove('active'); };
  const editOpeners = ['openEditBtn'];
  editOpeners.forEach(id => { const b = document.getElementById(id); if (b) b.addEventListener('click', ()=> openModal('editModal')); });
  const passOpeners = ['openPasswordBtn'];
  passOpeners.forEach(id => { const b = document.getElementById(id); if (b) b.addEventListener('click', ()=> openModal('passwordModal')); });
  // Close buttons
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', ()=> closeModal(btn.getAttribute('data-close')));
  });
  // Any button/link with data-close should close the referenced modal
  document.querySelectorAll('[data-close]')
    .forEach(btn => btn.addEventListener('click', ()=> closeModal(btn.getAttribute('data-close'))));
  // Click outside to close
  document.querySelectorAll('.modal-overlay').forEach(ov => {
    ov.addEventListener('click', (e)=>{ if (e.target === ov) ov.classList.remove('active'); });
  });

  // -----------------------------
  // Orders & Reviews
  // -----------------------------
  const ordersList = document.getElementById('ordersList');
  const reviewsList = document.getElementById('reviewsList');
  const openOrdersBtn = document.getElementById('openOrdersBtn');
  let ordersLoaded = false, reviewsLoaded = false;
  // Track reviewed entries per order+product to prevent duplicate reviews within same order
  // Key format: `${orderId}:${productId}` (orderId 0 = legacy/no specific order)
  let reviewedKeys = new Set();
  // Cache last fetched orders so we can re-render when review list changes
  let lastOrders = [];

  function formatINR(paisa){
    try { return new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(paisa); } catch { return `₹${paisa||0}`; }
  }

  function el(tag, cls, html){ const e = document.createElement(tag); if (cls) e.className = cls; if (html!==undefined) e.innerHTML = html; return e; }

  function renderOrders(orders){
    ordersList.innerHTML = '';
    if (!orders.length) {
      const tr = el('tr');
      tr.innerHTML = '<td colspan="6">You have no orders yet.</td>';
      ordersList.appendChild(tr);
      return;
    }
    orders.forEach(order => {
      const tr = el('tr');
      const date = new Date(order.created_at).toLocaleString();
      const status = (order.status || 'placed').toLowerCase();
      const statusClass = `status-badge ${status}`;

      // Items cell: chips with thumbs
      const itemsCell = document.createElement('td');
      itemsCell.className = 'items-cell';
      (order.items||[]).forEach(it => {
        const name = it.name || `Product ${it.product_id||''}`;
        const thumb = (it.product_image || '').replace(/\\/g,'/').replace(/\\/g,'/');
        const span = document.createElement('span');
        span.className = 'item';
        span.innerHTML = `${thumb ? `<img class=\"item-thumb\" src=\"${thumb}\" alt=\"${name}\" onerror=\"this.style.display='none'\">` : ''}<span><strong>${name}</strong> × ${it.quantity} <span class=\"muted\">${formatINR(it.price)}</span></span>`;
        // Per-item Review button inside items chip
        const pid = parseInt(it.product_id, 10);
  const rBtn = el('button','btn sm');
  // Consider reviewed if this exact order/product is reviewed OR legacy/global (order_id 0) review exists
  const keySpecific = `${order.id}:${pid}`;
  const keyGlobal = `0:${pid}`; // legacy reviews created before per-order feature
  const alreadyReviewed = pid && (reviewedKeys.has(keySpecific) || reviewedKeys.has(keyGlobal));
        if (alreadyReviewed) {
          // Show single Reviewed badge with star icon
          const reviewedTag = document.createElement('span');
          reviewedTag.className = 'reviewed-badge';
          reviewedTag.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" width="10" height="10" style="vertical-align:middle; margin-right:3px;"><path fill="currentColor" d="M12 .587l3.668 7.431 8.214 1.193-5.941 5.793 1.403 8.173L12 18.897l-7.344 3.28 1.403-8.173L.118 9.211l8.214-1.193L12 .587z"/></svg>Reviewed';
          span.appendChild(reviewedTag);
        } else {
          // Configure active review button
          rBtn.textContent = 'Review';
            rBtn.title = pid ? `Write a review for ${name}` : 'Review';
          if (pid) {
            rBtn.addEventListener('click', ()=>{
              if (status !== 'delivered') {
                alert('You can review this product after your order is delivered.');
                return;
              }
              openReviewModal(pid, name, order.id);
            });
          } else {
            rBtn.disabled = true;
          }
          if (status !== 'delivered') {
            rBtn.classList.add('ghost');
            rBtn.title = 'Available after delivery';
          }
          span.appendChild(rBtn);
        }
        itemsCell.appendChild(span);
      });

      tr.innerHTML = `
        <td>#${order.id}</td>
        <td>${date}</td>
        <td><span class="${statusClass}">${status}</span></td>
        <td><strong>${formatINR(order.total)}</strong></td>
      `;
      tr.appendChild(itemsCell);
      // Actions column: per-order actions (Details/Print)
      const actionsTd = el('td');
      const actionsWrap = el('div','actions');
      // Order-level actions
      const detailsBtn = el('button','btn sm');
      detailsBtn.textContent = 'Details';
      detailsBtn.title = 'View order details';
      detailsBtn.addEventListener('click', ()=> showOrderDetails(order));
      const printBtn = el('button','btn sm');
      printBtn.textContent = 'Print';
      printBtn.title = 'Print invoice';
      printBtn.addEventListener('click', ()=> printOrderInvoice(order));

      actionsWrap.appendChild(detailsBtn);
      actionsWrap.appendChild(printBtn);
      actionsTd.appendChild(actionsWrap);
      tr.appendChild(actionsTd);
      ordersList.appendChild(tr);
    });
  }

  // Order details popup (basic) and invoice print helpers
  function showOrderDetails(order){
    // Simple alert as placeholder; can be replaced with richer modal later
    try {
      const lines = [
        `Order #${order.id}`,
        `Date: ${new Date(order.created_at).toLocaleString()}`,
        `Status: ${order.status}`,
        `Total: ${formatINR(order.total)}`,
        '',
        'Items:',
        ...(order.items||[]).map(it=>`- ${it.name||('Product '+it.product_id)} × ${it.quantity} @ ${formatINR(it.price)}`)
      ];
      alert(lines.join('\n'));
    } catch(e){ console.error(e); }
  }

  function printOrderInvoice(order){
    // Minimal printable invoice in a new window
    const win = window.open('', '_blank');
    if (!win) return;
    const styles = `body{font-family:Arial,Helvetica,sans-serif;padding:20px;color:#000} h1{font-size:18px;margin:0 0 8px} table{width:100%;border-collapse:collapse;margin-top:12px} th,td{border:1px solid #ccc;padding:8px;text-align:left} th{background:#f4f4f4}`;
    const rows = (order.items||[]).map(it=>`<tr><td>${(it.name||('Product '+it.product_id))}</td><td>${it.quantity}</td><td>${formatINR(it.price)}</td><td>${formatINR((it.price||0)*(it.quantity||0))}</td></tr>`).join('');
    win.document.write(`<!doctype html><html><head><title>Invoice #${order.id}</title><meta charset="utf-8"><style>${styles}</style></head><body>`);
    win.document.write(`<h1>Invoice #${order.id}</h1><div>Date: ${new Date(order.created_at).toLocaleString()}</div><div>Status: ${order.status}</div>`);
    win.document.write(`<table><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><th colspan="3" style="text-align:right">Total</th><th>${formatINR(order.total)}</th></tr></tfoot></table>`);
    win.document.write(`</body></html>`);
    win.document.close();
    win.focus();
    win.print();
  }

  function renderReviews(reviews){
    reviewsList.innerHTML = '';
    if (!reviews.length) {
      const tr = el('tr');
      tr.innerHTML = '<td colspan="5">No reviews yet.</td>';
      reviewsList.appendChild(tr);
      return;
    }
    reviews.forEach(r => {
      const tr = el('tr');
        const makeStars = (val)=>{
          const base = '<svg viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 .587l3.668 7.431 8.214 1.193-5.941 5.793 1.403 8.173L12 18.897l-7.344 3.28 1.403-8.173L.118 9.211l8.214-1.193L12 .587z\"/></svg>';
          let out = '<span class=\"stars\" aria-label=\"'+val+' out of 5 stars\">';
          for (let i=1;i<=5;i++){
            let fillPct = 0;
            if (val >= i) fillPct = 100; else if (val >= i-0.5) fillPct = 50; else fillPct = 0;
            let cls = 'star--empty';
            if (fillPct === 100) cls = 'star--filled'; else if (fillPct === 50) cls = 'star--partial';
            out += '<span class="star star-static '+cls+'" aria-hidden="true">'+base+'<span class="star-fill-layer" style="width:'+fillPct+'%">'+base+'</span></span>';
          }
          out += '</span><span class="rating-value" style="margin-left:4px;font-weight:600;">'+val.toFixed(1)+'</span>';
          return out;
        };
      const ratingVal = parseFloat(r.rating)||0;
      const starHtml = makeStars(ratingVal);
      const when = new Date(r.updated_at || r.created_at).toLocaleString();
      const orderInfo = r.order_id ? ` <span class="badge">Order #${r.order_id}</span>` : '';
      const orderDate = r.order_created_at ? new Date(r.order_created_at).toLocaleDateString() : '';
      tr.innerHTML = `
        <td>${r.product_name || ('Product '+r.product_id)}${orderInfo}${orderDate? `<div class=\"muted tiny\">Placed: ${orderDate}</div>`:''}</td>
        <td>${starHtml}</td>
        <td>${(r.comment||'').replace(/</g,'&lt;')}</td>
        <td>${when}</td>
      `;
      const actionsTd = el('td');
      const del = el('button','btn');
      del.textContent = 'Delete';
      del.addEventListener('click', async ()=>{
        if (!confirm('Delete this review?')) return;
        try {
          await api(`/api/my/reviews/${encodeURIComponent(r.product_id)}`, { method:'DELETE' });
          await loadReviews();
        } catch(ex){
          alert(ex.message||'Failed to delete review');
        }
      });
      actionsTd.appendChild(del);
      tr.appendChild(actionsTd);
      reviewsList.appendChild(tr);
    });
  }

  async function loadOrders(){
    try {
      const data = await api('/api/my/orders');
      lastOrders = data.orders || [];
      renderOrders(lastOrders);
    } catch (e) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="6">${e.status === 401 ? 'Please <a href="/login.html">log in</a> to view your orders.' : 'Could not load orders right now. Please try again later.'}</td>`;
      ordersList.innerHTML = '';
      ordersList.appendChild(tr);
    }
  }

  async function loadReviews(){
    try {
      const data = await api('/api/my/reviews');
      const reviews = data.reviews || [];
      // Populate set of reviewed product IDs
      reviewedKeys = new Set(
        reviews
          .map(r => {
            const pid = parseInt(r.product_id,10); const oid = parseInt(r.order_id,10)||0; return (Number.isFinite(pid) ? `${oid}:${pid}`: null);
          })
          .filter(v => v)
      );
      renderReviews(reviews);
      // If orders were already loaded, re-render so buttons reflect reviewed state
      if (ordersLoaded && lastOrders.length) {
        renderOrders(lastOrders);
      }
    } catch (e) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="5">${e.status === 401 ? 'Please <a href="/login.html">log in</a> to view your reviews.' : 'Could not load reviews right now. Please try again later.'}</td>`;
      reviewsList.innerHTML = '';
      reviewsList.appendChild(tr);
      // Reset reviewed set on error to avoid stale state
  reviewedKeys = new Set();
    }
  }

  // (Order-based review filtering removed per latest request)

  // Review modal
  const reviewModal = document.getElementById('reviewModal');
  const reviewProductId = document.getElementById('reviewProductId');
  const reviewOrderId = document.getElementById('reviewOrderId');
  const reviewRating = document.getElementById('reviewRating');
  const reviewRatingStars = document.getElementById('reviewRatingStars');
  const reviewComment = document.getElementById('reviewComment');
  const reviewMsg = document.getElementById('reviewMsg');
  const reviewForm = document.getElementById('reviewForm');
  const reviewModalTitle = document.getElementById('reviewModalTitle');

  // Build interactive star rating UI in the review modal
  function renderInteractiveStars(selected){
    if (!reviewRatingStars) return;
    reviewRatingStars.innerHTML = '';
    const valDisplay = document.getElementById('reviewRatingValue');
    let current = Number(selected)||0;
    const starSVG = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 .587l3.668 7.431 8.214 1.193-5.941 5.793 1.403 8.173L12 18.897l-7.344 3.28 1.403-8.173L.118 9.211l8.214-1.193L12 .587z"/></svg>';
    for (let i=1;i<=5;i++){
      const span = document.createElement('span');
      span.className = 'star star-slot';
      span.dataset.index = String(i);
      span.innerHTML = starSVG + '<span class="star-fill-layer">'+starSVG+'</span>';
      reviewRatingStars.appendChild(span);
    }
    function paint(val){
      [...reviewRatingStars.children].forEach(star => {
        const idx = parseInt(star.dataset.index,10);
        const fillLayer = star.querySelector('.star-fill-layer');
        let fillPct = 0;
        if (val >= idx) fillPct = 100; else if (val >= idx-0.5) fillPct = 50; else fillPct = 0;
        star.classList.toggle('star--filled', fillPct===100);
        star.classList.toggle('star--partial', fillPct===50);
        star.classList.toggle('star--empty', fillPct===0);
        if (fillLayer) fillLayer.style.width = fillPct+'%';
      });
      if (valDisplay) valDisplay.textContent = (val||0).toFixed(1);
      reviewRatingStars.setAttribute('aria-label', `${val||0} out of 5 stars`);
    }
    function snap(x){ return Math.round(x*2)/2; }
    function setRating(val){ current = snap(val); reviewRating.value = String(current); paint(current); }
    // Mouse handling for half detection
    reviewRatingStars.addEventListener('mousemove', (e)=>{
      const starEl = e.target.closest('.star-slot');
      if (!starEl) return;
      const rect = starEl.getBoundingClientRect();
      const idx = parseInt(starEl.dataset.index,10);
      const halfway = rect.left + rect.width/2;
      let val = idx - (e.clientX < halfway ? 0.5 : 0);
      paint(val);
    });
    reviewRatingStars.addEventListener('mouseleave', ()=> paint(current));
    reviewRatingStars.addEventListener('click', (e)=>{
      const starEl = e.target.closest('.star-slot');
      if (!starEl) return;
      const rect = starEl.getBoundingClientRect();
      const idx = parseInt(starEl.dataset.index,10);
      const halfway = rect.left + rect.width/2;
      let val = idx - (e.clientX < halfway ? 0.5 : 0);
      setRating(val);
    });
    // Keyboard (whole star increments, half steps with Shift+Arrow)
    reviewRatingStars.tabIndex = 0;
    reviewRatingStars.addEventListener('keydown', (e)=>{
      if (['ArrowLeft','ArrowDown','ArrowRight','ArrowUp'].includes(e.key)){
        e.preventDefault();
        let delta = (e.key==='ArrowLeft' || e.key==='ArrowDown') ? -1 : 1;
        if (e.shiftKey) delta/=2;
        setRating(Math.min(5, Math.max(1, current + delta)));
      }
    });
    paint(current||0);
  }

  function openReviewModal(pid, productName, orderId, existingRating, existingComment){
    reviewProductId.value = pid;
    reviewOrderId.value = orderId || '';
    reviewRating.value = existingRating || '';
    reviewComment.value = existingComment || '';
    reviewMsg.textContent = '';
    reviewModalTitle.textContent = (existingRating ? 'Edit review' : 'Write a review') + (productName ? ` — ${productName}` : '');
    renderInteractiveStars(existingRating||0);
    reviewModal.classList.add('active');
  }

  reviewForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    reviewMsg.textContent = '';
  const pid = parseInt(reviewProductId.value, 10);
  const oid = parseInt(reviewOrderId.value, 10) || 0;
  const rating = parseFloat(reviewRating.value);
    const comment = reviewComment.value.trim();
    if (!pid || !(rating >=1 && rating <=5)){
      reviewMsg.textContent = 'Please select a rating.';
      reviewMsg.className = 'msg error';
      return;
    }
    try {
  await api('/api/my/reviews', { method:'POST', body: JSON.stringify({ product_id: pid, order_id: oid, rating, comment }) });
      reviewMsg.textContent = 'Review saved';
      reviewMsg.className = 'msg ok';
      // Refresh lists
      await Promise.all([loadReviews(), loadOrders()]);
      setTimeout(()=> reviewModal.classList.remove('active'), 400);
    } catch (ex) {
      reviewMsg.textContent = ex.message || 'Failed to save review';
      reviewMsg.className = 'msg error';
    }
  });

  // Open modal + lazy-load on button click
  const ordersReviewsModal = document.getElementById('ordersReviewsModal');
  const tabOrdersBtn = document.getElementById('tabOrdersBtn');
  const tabReviewsBtn = document.getElementById('tabReviewsBtn');
  const ordersTab = document.getElementById('ordersTab');
  const reviewsTab = document.getElementById('reviewsTab');

  function showTab(which){
    const isOrders = which === 'orders';
    ordersTab.style.display = isOrders ? 'block' : 'none';
    reviewsTab.style.display = isOrders ? 'none' : 'block';
    tabOrdersBtn.setAttribute('aria-selected', isOrders ? 'true' : 'false');
    tabReviewsBtn.setAttribute('aria-selected', isOrders ? 'false' : 'true');
    tabOrdersBtn.classList.toggle('active', isOrders);
    tabReviewsBtn.classList.toggle('active', !isOrders);
  }

  if (tabOrdersBtn && tabReviewsBtn) {
    tabOrdersBtn.addEventListener('click', ()=> showTab('orders'));
    tabReviewsBtn.addEventListener('click', ()=> showTab('reviews'));
  }

  if (openOrdersBtn && ordersReviewsModal) {
    openOrdersBtn.addEventListener('click', async () => {
      ordersReviewsModal.classList.add('active');
      showTab('orders');
      if (!ordersLoaded) { await loadOrders(); ordersLoaded = true; }
      if (!reviewsLoaded) { await loadReviews(); reviewsLoaded = true; }
    });
  }

  // Handle URL hash to open Orders/Reviews modal on page load
  async function handleHashNavigation() {
    const hash = window.location.hash;
    if (hash === '#my-orders' || hash === '#my-reviews') {
      if (ordersReviewsModal) {
        ordersReviewsModal.classList.add('active');
        showTab(hash === '#my-reviews' ? 'reviews' : 'orders');
        if (!ordersLoaded) { await loadOrders(); ordersLoaded = true; }
        if (!reviewsLoaded) { await loadReviews(); reviewsLoaded = true; }
      }
      // Clean up hash
      window.history.replaceState(null, '', window.location.pathname);
    }
  }

  // Check hash on page load
  handleHashNavigation();

  // Also listen for hash changes
  window.addEventListener('hashchange', handleHashNavigation);
})();
