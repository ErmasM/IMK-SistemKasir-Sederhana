// --- STATE MANAGEMENT ---
const State = {
    menus: [],
    cart: {}, // Format: { menuId: quantity }
    totalCart: 0,
    dailySales: 0,
    soldItems: {}, // Format: { menuId: quantity }
    paymentMethod: 'tunai'
};

// Default initial data if localStorage is empty
const defaultMenus = [
    { id: 'm1', name: 'Nasi Putih', price: 5000, icon: '🍚' },
    { id: 'm2', name: 'Ayam Goreng', price: 12000, icon: '🍗' },
    { id: 'm3', name: 'Telur Dadar', price: 6000, icon: '🍳' },
    { id: 'm4', name: 'Sayur Asem', price: 5000, icon: '🥣' },
    { id: 'm5', name: 'Tempe/Tahu', price: 2000, icon: '🧆' },
    { id: 'm6', name: 'Es Teh Manis', price: 4000, icon: '🍹' },
];

// --- INITIALIZATION ---
function initApp() {
    loadData();
    renderMenuGrid();
    renderManageMenu();
    updateCartUI();
    renderRekap();
}

// --- DATA PERSISTENCE (LOCAL STORAGE) ---
function loadData() {
    const savedMenus = localStorage.getItem('warung_menus');
    if (savedMenus) {
        State.menus = JSON.parse(savedMenus);
    } else {
        State.menus = [...defaultMenus];
        saveMenus();
    }

    const savedDailySales = localStorage.getItem('warung_dailySales');
    if (savedDailySales) State.dailySales = parseInt(savedDailySales);

    const savedSoldItems = localStorage.getItem('warung_soldItems');
    if (savedSoldItems) State.soldItems = JSON.parse(savedSoldItems);
}

function saveMenus() {
    localStorage.setItem('warung_menus', JSON.stringify(State.menus));
}

function saveTransaction() {
    localStorage.setItem('warung_dailySales', State.dailySales.toString());
    localStorage.setItem('warung_soldItems', JSON.stringify(State.soldItems));
}

// --- FORMATTING HELPERS ---
function formatRupiah(number) {
    return 'Rp ' + number.toLocaleString('id-ID');
}

function generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
}

// --- VIEW NAVIGATION ---
const app = {
    // --- CUSTOM DIALOGS ---
    showAlert: function(msg, type = 'success') {
        const toast = document.getElementById('custom-toast');
        const titleEl = document.getElementById('toast-title');
        const msgEl = document.getElementById('toast-message');
        const iconEl = toast.querySelector('.toast-icon');

        msgEl.innerText = msg;
        
        if (type === 'error') {
            titleEl.innerText = 'Peringatan';
            titleEl.style.color = 'var(--danger)';
            iconEl.innerText = '⚠️';
            toast.className = 'custom-toast error show';
        } else {
            titleEl.innerText = 'Berhasil';
            titleEl.style.color = 'var(--primary-dark)';
            iconEl.innerText = '✅';
            toast.className = 'custom-toast success show';
        }

        setTimeout(() => {
            toast.className = `custom-toast ${type}`;
        }, 3000);
    },

    showConfirm: function(msg, callback) {
        document.getElementById('confirm-message').innerText = msg;
        const confirmModal = document.getElementById('custom-confirm');
        confirmModal.classList.add('active');
        
        const btnOk = document.getElementById('btn-confirm-ok');
        const btnCancel = document.getElementById('btn-confirm-cancel');
        
        const newBtnOk = btnOk.cloneNode(true);
        const newBtnCancel = btnCancel.cloneNode(true);
        btnOk.parentNode.replaceChild(newBtnOk, btnOk);
        btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
        
        newBtnOk.onclick = () => {
            confirmModal.classList.remove('active');
            callback();
        };
        
        newBtnCancel.onclick = () => {
            confirmModal.classList.remove('active');
        };
    },

    switchView: function(viewId, title, btnElement) {
        // Hide all views
        document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
        // Show target view
        document.getElementById(viewId).classList.add('active');
        
        // Update Title
        document.getElementById('page-title').innerText = title;

        // Update Bottom Nav Active State
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        if(btnElement) btnElement.classList.add('active');

        // Specific actions on tab change
        if (viewId === 'view-rekap') renderRekap();
        if (viewId === 'view-menu') renderManageMenu();
    },

    addToCart: function(menuId) {
        if (State.cart[menuId]) {
            State.cart[menuId]++;
        } else {
            State.cart[menuId] = 1;
        }
        this.calculateTotalCart();
        renderMenuGrid(); // Re-render to show qty badges
        updateCartUI();
    },

    reduceFromCart: function(menuId) {
        if (State.cart[menuId]) {
            State.cart[menuId]--;
            if (State.cart[menuId] <= 0) {
                delete State.cart[menuId];
            }
            this.calculateTotalCart();
            renderMenuGrid();
            updateCartUI();
        }
    },

    clearCart: function() {
        State.cart = {};
        this.calculateTotalCart();
        renderMenuGrid();
        updateCartUI();
    },

    calculateTotalCart: function() {
        let total = 0;
        for (const menuId in State.cart) {
            const menu = State.menus.find(m => m.id === menuId);
            if (menu) {
                total += menu.price * State.cart[menuId];
            }
        }
        State.totalCart = total;
    },

    // --- PAYMENT MODAL ---
    showPaymentModal: function() {
        if (State.totalCart <= 0) {
            this.showAlert('Pilih menu terlebih dahulu!', 'error');
            return;
        }
        document.getElementById('payment-total-display').innerText = formatRupiah(State.totalCart);
        document.getElementById('input-uang').value = '';
        this.setPaymentMethod('tunai'); // Reset ke Tunai default
        
        document.getElementById('modal-payment').classList.add('active');
        setTimeout(() => document.getElementById('input-uang').focus(), 100);
    },

    setPaymentMethod: function(method) {
        State.paymentMethod = method;
        const btnTunai = document.getElementById('btn-method-tunai');
        const btnNonTunai = document.getElementById('btn-method-nontunai');
        const tunaiSection = document.getElementById('tunai-section');
        const btnSelesai = document.getElementById('btn-selesai-bayar');

        if (method === 'tunai') {
            btnTunai.style.background = 'linear-gradient(135deg, var(--primary), var(--primary-dark))';
            btnTunai.style.color = 'white';
            btnTunai.style.boxShadow = 'var(--shadow-colored)';
            
            btnNonTunai.style.background = 'transparent';
            btnNonTunai.style.color = 'var(--text-muted)';
            btnNonTunai.style.boxShadow = 'none';

            tunaiSection.style.display = 'block';
            this.calculateChange();
        } else {
            btnNonTunai.style.background = 'linear-gradient(135deg, var(--primary), var(--primary-dark))';
            btnNonTunai.style.color = 'white';
            btnNonTunai.style.boxShadow = 'var(--shadow-colored)';
            
            btnTunai.style.background = 'transparent';
            btnTunai.style.color = 'var(--text-muted)';
            btnTunai.style.boxShadow = 'none';

            tunaiSection.style.display = 'none';
            btnSelesai.disabled = false;
            btnSelesai.style.opacity = '1';
        }
    },

    closeModal: function(modalId) {
        document.getElementById(modalId).classList.remove('active');
    },

    setQuickCash: function(amount) {
        document.getElementById('input-uang').value = amount;
        this.calculateChange();
    },

    setCashExact: function() {
        document.getElementById('input-uang').value = State.totalCart;
        this.calculateChange();
    },

    calculateChange: function() {
        const inputUangStr = document.getElementById('input-uang').value;
        const uang = parseInt(inputUangStr) || 0;
        const changeBox = document.getElementById('change-info-box');
        const changeDisplay = document.getElementById('payment-change-display');
        const btnSelesai = document.getElementById('btn-selesai-bayar');

        if (uang < State.totalCart && inputUangStr !== '') {
            changeBox.classList.add('error');
            changeDisplay.innerText = "Uang Kurang!";
            btnSelesai.disabled = true;
            btnSelesai.style.opacity = '0.5';
        } else {
            changeBox.classList.remove('error');
            const kembalian = uang - State.totalCart;
            changeDisplay.innerText = formatRupiah(kembalian > 0 ? kembalian : 0);
            
            if (inputUangStr !== '') {
                btnSelesai.disabled = false;
                btnSelesai.style.opacity = '1';
            } else {
                btnSelesai.disabled = true;
                btnSelesai.style.opacity = '0.5';
            }
        }
    },

    processPayment: function() {
        if (State.paymentMethod === 'tunai') {
            const uang = parseInt(document.getElementById('input-uang').value) || 0;
            if (uang < State.totalCart) {
                this.showAlert('Uang pembayaran kurang!', 'error');
                return;
            }
        }

        // Add to daily sales
        State.dailySales += State.totalCart;

        // Add to sold items
        for (const menuId in State.cart) {
            if (State.soldItems[menuId]) {
                State.soldItems[menuId] += State.cart[menuId];
            } else {
                State.soldItems[menuId] = State.cart[menuId];
            }
        }

        saveTransaction();
        this.clearCart();
        this.closeModal('modal-payment');
        
        // Show success briefly
        this.showAlert('Pembayaran Berhasil! Data tersimpan di Rekap.', 'success');
        
        // WOW FACTOR: Trigger Confetti 🎊
        triggerConfetti();
    },

    // --- REKAP ---
    resetHarian: function() {
        this.showConfirm('Yakin ingin mereset data hari ini? Total penjualan dan riwayat menu akan kembali jadi 0.', () => {
            State.dailySales = 0;
            State.soldItems = {};
            saveTransaction();
            renderRekap();
            app.showAlert('Data harian telah direset.', 'success');
        });
    },

    // --- MENU MANAGEMENT ---
    showAddMenuModal: function(id = '', name = '', price = '', icon = '') {
        document.getElementById('input-menu-id').value = id;
        document.getElementById('input-menu-name').value = name;
        document.getElementById('input-menu-price').value = price;
        document.getElementById('input-menu-icon').value = icon || '🍽️';
        
        document.getElementById('modal-menu-title').innerText = id ? 'Ubah Menu' : 'Tambah Menu';
        document.getElementById('modal-menu').classList.add('active');
    },

    saveMenu: function() {
        const id = document.getElementById('input-menu-id').value;
        const name = document.getElementById('input-menu-name').value;
        const price = parseInt(document.getElementById('input-menu-price').value);
        let icon = document.getElementById('input-menu-icon').value;

        if (!name || isNaN(price) || price <= 0) {
            this.showAlert('Nama dan Harga (angka) harus diisi dengan benar!', 'error');
            return;
        }

        if(!icon) icon = '🍽️';

        if (id) {
            // Edit
            const index = State.menus.findIndex(m => m.id === id);
            if (index > -1) {
                State.menus[index] = { id, name, price, icon };
            }
        } else {
            // Add
            State.menus.push({ id: generateId(), name, price, icon });
        }

        saveMenus();
        this.closeModal('modal-menu');
        renderMenuGrid();
        renderManageMenu();
    },

    deleteMenu: function(id) {
        this.showConfirm('Yakin ingin menghapus menu ini?', () => {
            State.menus = State.menus.filter(m => m.id !== id);
            // Hapus juga dari cart jika ada
            if(State.cart[id]) {
                delete State.cart[id];
                app.calculateTotalCart();
                updateCartUI();
            }
            saveMenus();
            renderMenuGrid();
            renderManageMenu();
        });
    }
};

// --- RENDER FUNCTIONS ---
function renderMenuGrid() {
    const container = document.getElementById('menu-container');
    container.innerHTML = '';

    State.menus.forEach(menu => {
        const qty = State.cart[menu.id] || 0;
        const badgeHtml = qty > 0 ? `<div class="menu-qty-badge">${qty}</div>` : '';
        
        const html = `
            <div class="menu-wrapper" onclick="app.addToCart('${menu.id}')">
                ${badgeHtml}
                <div class="menu-item-btn">
                    <div class="menu-icon-wrapper">
                        <div class="menu-icon">${menu.icon}</div>
                    </div>
                    <div class="menu-name">${menu.name}</div>
                    <div class="menu-price">${formatRupiah(menu.price)}</div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
}

function updateCartUI() {
    const btnBayar = document.getElementById('btn-bayar');
    const totalEl = document.getElementById('cart-total-price');
    totalEl.innerText = formatRupiah(State.totalCart);
    
    // Animasi Bouncing (Bump) pada Total Harga
    totalEl.classList.remove('bump-anim');
    void totalEl.offsetWidth; // trigger reflow untuk me-restart animasi
    totalEl.classList.add('bump-anim');

    const cartList = document.getElementById('cart-items-list');
    cartList.innerHTML = '';
    
    if (Object.keys(State.cart).length === 0) {
        cartList.innerHTML = `
            <div style="text-align:center; padding: 30px 0; color: var(--gray-400); animation: fadeInBg 0.5s ease;">
                <div style="font-size: 50px; margin-bottom: 10px; opacity: 0.6; filter: grayscale(1);">🛒</div>
                <p style="font-weight: 800; font-size: 15px; color: var(--text-muted);">Keranjang masih kosong.<br>Yuk, pilih menu pesanan!</p>
            </div>
        `;
        btnBayar.disabled = true;
        btnBayar.style.opacity = '0.5';
        return;
    }

    let hasItems = false;
    for (const menuId in State.cart) {
        const qty = State.cart[menuId];
        const menu = State.menus.find(m => m.id === menuId);
        if (menu && qty > 0) {
            hasItems = true;
            cartList.insertAdjacentHTML('beforeend', `
                <div class="cart-item-row" style="display:flex; align-items: center;">
                    <div style="flex:1;">
                        <span style="font-size:18px; font-weight:800; color:var(--dark);">${menu.name}</span><br>
                        <span style="font-size:15px; color:var(--primary-dark); font-weight:800;">${formatRupiah(menu.price * qty)}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:12px;">
                        <button class="btn btn-danger cart-qty-btn" onclick="app.reduceFromCart('${menuId}')">-</button>
                        <span style="font-size:20px; font-weight:900; min-width:25px; text-align:center;">${qty}</span>
                        <button class="btn btn-primary cart-qty-btn" onclick="app.addToCart('${menuId}')">+</button>
                    </div>
                </div>
            `);
        }
    }

    if (hasItems) {
        btnBayar.disabled = false;
        btnBayar.style.opacity = '1';
    } else {
        btnBayar.disabled = true;
        btnBayar.style.opacity = '0.5';
    }
}

function renderRekap() {
    document.getElementById('rekap-total-sales').innerText = formatRupiah(State.dailySales);
    
    const soldList = document.getElementById('rekap-sold-items');
    soldList.innerHTML = '';
    
    let hasSales = false;
    for (const menuId in State.soldItems) {
        const qty = State.soldItems[menuId];
        const menu = State.menus.find(m => m.id === menuId);
        const menuName = menu ? menu.name : 'Menu Terhapus';
        
        if (qty > 0) {
            hasSales = true;
            soldList.insertAdjacentHTML('beforeend', `
                <li class="sold-item">
                    <span>${menuName}</span>
                    <span>Terjual: <b>${qty}</b></span>
                </li>
            `);
        }
    }

    if (!hasSales) {
        soldList.innerHTML = '<li style="text-align:center; color:#999; padding:20px; font-size:18px;">Belum ada penjualan hari ini.</li>';
    }
}

function renderManageMenu() {
    const container = document.getElementById('manage-menu-list');
    container.innerHTML = '';

    State.menus.forEach(menu => {
        container.insertAdjacentHTML('beforeend', `
            <div class="menu-manage-item">
                <div class="menu-manage-info">
                    <h3>${menu.icon} ${menu.name}</h3>
                    <p>${formatRupiah(menu.price)}</p>
                </div>
                <div class="menu-manage-actions">
                    <button class="btn-edit" onclick="app.showAddMenuModal('${menu.id}', '${menu.name}', ${menu.price}, '${menu.icon}')">✎</button>
                    <button class="btn-del" onclick="app.deleteMenu('${menu.id}')">🗑️</button>
                </div>
            </div>
        `);
    });
}

// Start Application
window.onload = () => {
    initApp();
    
    // Update Status Bar Time
    const updateTime = () => {
        const now = new Date();
        let h = now.getHours();
        let m = now.getMinutes();

        if(m < 10) m = '0' + m;
        const timeEl = document.getElementById('status-time');
        if(timeEl) timeEl.innerText = `${h}:${m}`;
    };
    setInterval(updateTime, 1000);
    updateTime();
};

function triggerConfetti() {
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
    const container = document.querySelector('.app-container');
    if (!container) return;
    
    for(let i=0; i<40; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = (Math.random() * 1.5) + 's';
        
        // Randomize shape a bit
        if(Math.random() > 0.5) confetti.style.borderRadius = '50%';
        
        container.appendChild(confetti);
        setTimeout(() => confetti.remove(), 2500);
    }
}
