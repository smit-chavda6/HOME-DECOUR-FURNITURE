// Profile page logic: fetch, render, update profile and password
(async function(){
  const api = async (path, options = {}) => {
    const res = await fetch(path, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...options });
    if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || 'Request failed');
    return res.json();
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
  // Click outside to close
  document.querySelectorAll('.modal-overlay').forEach(ov => {
    ov.addEventListener('click', (e)=>{ if (e.target === ov) ov.classList.remove('active'); });
  });
})();
