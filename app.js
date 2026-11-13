// Modal foto menu: klik tombol "Lihat Gambar" untuk membuka foto menu.
        function showMenuImage(button) {
            const modal = document.getElementById('menuImageModal');
            const preview = document.getElementById('menuImagePreview');
            const missing = document.getElementById('menuImageMissing');
            const title = document.getElementById('menuImageTitle');
            const path = document.getElementById('menuImagePath');
            const imagePath = button.dataset.image;

            title.textContent = button.dataset.title || 'Foto Menu';
            path.textContent = imagePath;
            missing.classList.add('hidden');
            preview.classList.remove('hidden');
            preview.onerror = function () {
                preview.classList.add('hidden');
                missing.classList.remove('hidden');
            };
            preview.onload = function () {
                preview.classList.remove('hidden');
                missing.classList.add('hidden');
            };
            preview.src = imagePath;
            modal.classList.remove('hidden');
        }

        function closeMenuImage() {
            const modal = document.getElementById('menuImageModal');
            const preview = document.getElementById('menuImagePreview');
            modal.classList.add('hidden');
            preview.src = '';
        }

        // Data Store & State Global
        const cart = {};
        const MAIN_WA_NUMBER = "6289525068907";
        const PINK_PRINT_WA_NUMBER = "62882005161406";
        let selectedPayment = null;
        let paymentProofFile = null;
        let qrCodeInstance = null;

        window.onload = function() {
            const urlInput = document.getElementById('customWebUrl');
            if (urlInput) {
                urlInput.value = window.location.href;
            }
            initQRCode(window.location.href);
        };

        // Tab Switcher: setiap tab hanya menampilkan kelompok layanannya sendiri.
        function switchTab(tabName) {
            const allowedTypes = {
                warung: 'warung',
                print: 'print',
                service: 'service'
            };
            if (!allowedTypes[tabName]) return;

            document.querySelectorAll('.tab-content').forEach(el => {
                el.classList.add('hidden');
            });
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('bg-pinky-500', 'text-white', 'shadow-md');
                btn.classList.add('text-gray-600', 'hover:bg-pink-100');
            });

            const targetContent = document.getElementById('content-' + tabName);
            if (targetContent) targetContent.classList.remove('hidden');

            const activeBtn = document.getElementById('tab-' + tabName);
            if (activeBtn) {
                activeBtn.classList.add('bg-pinky-500', 'text-white', 'shadow-md');
                activeBtn.classList.remove('text-gray-600', 'hover:bg-pink-100');
            }

            // Kosongkan pencarian dan tampilkan kembali semua item pada tab aktif.
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.value = '';
            document.querySelectorAll('.tab-content .item-card').forEach(card => {
                card.style.display = '';
            });
        }

        // Pencarian dibatasi pada tab aktif dan tipe item yang sesuai.
        function filterItems() {
            const searchInput = document.getElementById('searchInput');
            const activeTab = document.querySelector('.tab-content:not(.hidden)');
            if (!searchInput || !activeTab) return;

            const keyword = searchInput.value.toLowerCase().trim();
            const tabId = activeTab.id;
            const allowedType = {
                'content-warung': 'warung',
                'content-print': 'print',
                'content-service': 'service'
            }[tabId];

            activeTab.querySelectorAll('.item-card').forEach(card => {
                const isCorrectType = card.dataset.type === allowedType;
                const searchableText = (
                    (card.dataset.name || '') + ' ' +
                    (card.querySelector('.item-name')?.innerText || '') +
                    ' ' + card.innerText
                ).toLowerCase();
                card.style.display = (
                    isCorrectType && (!keyword || searchableText.includes(keyword))
                ) ? '' : 'none';
            });
        }

        function updateMieJebewVariant() {
            const card = document.querySelector(`[data-id="w11"]`);
            const select = document.getElementById('variant-w11');
            const priceTag = document.getElementById('price-tag-w11');

            if (select && select.value === "+ Telur (10k)") {
                card.setAttribute('data-price', '10000');
                if (priceTag) priceTag.innerText = "10k";
            } else {
                card.setAttribute('data-price', '5000');
                if (priceTag) priceTag.innerText = "5k";
            }

            if (cart['w11']) {
                cart['w11'].price = parseInt(card.getAttribute('data-price'));
                updateOptions('w11');
            }
        }

        let seblakMode = 'free';
        function setSeblakMode(mode) {
            seblakMode = mode;
            document.getElementById('seblakFreePanel').classList.toggle('hidden', mode !== 'free');
            document.getElementById('seblakCustomPanel').classList.toggle('hidden', mode !== 'custom');
            ['free','custom'].forEach(m => {
                const b = document.getElementById('seblakMode-' + m);
                b.className = m === mode ? 'flex-1 py-2 rounded-lg border-2 border-pinky-500 bg-pinky-100 text-pinky-700 text-[11px] font-bold' : 'flex-1 py-2 rounded-lg border-2 border-pink-200 bg-white text-gray-600 text-[11px] font-bold';
            });
            if (cart.w12) updateOptions('w12');
        }
        function updateSeblakFree() {
            if (!cart.w12) updateQty('w12', 1);
            updateOptions('w12');
        }

        function changeTopingQty(name, change) {
            if (!cart['w12']) updateQty('w12', 1);
            if (!cart['w12'].topingCounts) cart['w12'].topingCounts = {};
            const next = Math.max(0, (cart['w12'].topingCounts[name] || 0) + change);
            if (next === 0) delete cart['w12'].topingCounts[name];
            else cart['w12'].topingCounts[name] = next;
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            const display = document.getElementById(`topingqty-${slug}`);
            if (display) display.innerText = next;
            updateOptions('w12');
        }

        function updateOptions(id) {
            if (!cart[id]) return;

            let laukText = "";
            let sambalText = "";
            let levelText = "";
            let variantText = "";
            let topings = [];
            let topingExtraCost = 0;
            let noRice = false;
            let noEgg = false;

            if (id === 'w1') {
                const laukSelect = document.getElementById('lauk-w1');
                laukText = laukSelect ? laukSelect.value : "";
                const sambalSelect = document.getElementById('sambal-w1');
                sambalText = sambalSelect ? sambalSelect.value : "";
            } else if (['w2','w3','w4','w5','w6','w7','w8','w9','w14'].includes(id)) {
                const sambalSelect = document.getElementById(`sambal-${id}`);
                sambalText = sambalSelect ? sambalSelect.value : "";
                const noRiceCheckbox = document.getElementById(`no-rice-${id}`);
                noRice = Boolean(noRiceCheckbox && noRiceCheckbox.checked);
            } else if (id === 'w10') {
                const variantSelect = document.getElementById('variant-w10');
                variantText = variantSelect ? variantSelect.value : "";
                const noEggCheckbox = document.getElementById('no-egg-w10');
                noEgg = Boolean(noEggCheckbox && noEggCheckbox.checked);
            } else if (id === 'w11') {
                const sambalSelect = document.getElementById('sambal-w11');
                sambalText = sambalSelect ? sambalSelect.value : "";
            } else if (['m1', 'm4', 'm5', 'm6', 'm8'].includes(id)) {
                const variantSelect = document.getElementById(`variant-${id}`);
                variantText = variantSelect ? variantSelect.value : "";
            } else if (id === 'w12') {
                const levelSelect = document.getElementById('level-w12');
                levelText = levelSelect ? levelSelect.value : "";

                const topingPrices = { 'Telur': 2500, 'Dumpling': 2500, 'Chikuwa': 2000, 'Twiser': 2000, 'Kembang Cumi': 2000, 'Sosis': 2000, 'Sosis Bambu': 2000, 'Sosis Salju': 2000, 'Cocktail': 2000, 'Jamur Enoki': 1000, 'Jamur Kuping': 1000, 'Tempura': 1000, 'Otak-Otak': 1000, 'Bakso': 1000, 'Cuangki': 1000, 'Cireng': 1000, 'Cikur': 1000, 'Makaroni': 1000, 'Kerupuk': 1000, 'Mie Kuning': 1000, 'Bihun': 1000 };
                if (seblakMode === 'free') {
                    const amount = parseInt(document.getElementById('seblakFreeAmount')?.value) || 0;
                    const note = document.getElementById('seblakFreeNote')?.value.trim() || '';
                    if (note) topings.push('Request: ' + note);
                    cart[id].price = amount;
                } else {
                    const counts = cart[id].topingCounts || {};
                    Object.entries(counts).forEach(([name, qty]) => {
                        if (qty > 0) { topings.push(`${name} x${qty}`); topingExtraCost += (topingPrices[name] || 0) * qty; }
                    });
                }
            } else if (['c1', 'c2', 'c3'].includes(id)) {
                // Satu pilihan sambal gratis; setiap pilihan tambahan dikenakan Rp1.000.
                const selectedTopings = Array.from(
                    document.querySelectorAll(`input[name="toping-${id}"]:checked`)
                ).map(input => input.value);

                topings = selectedTopings;
                if (selectedTopings.length > 1) {
                    topingExtraCost = (selectedTopings.length - 1) * 1000;
                }
                sambalText = selectedTopings.join(', ');
            }

            const card = document.querySelector(`[data-id="${id}"]`);
            let basePrice = card ? (parseInt(card.getAttribute('data-price')) || 0) : 0;

            cart[id].lauk = laukText;
            cart[id].sambal = sambalText;
            cart[id].level = levelText;
            cart[id].variant = variantText;
            cart[id].topings = topings;
            cart[id].noRice = noRice;
            cart[id].noEgg = noEgg;
            if (id === 'w12') {
                if (seblakMode === 'custom') cart[id].price = topingExtraCost;
            } else if (noRice) {
                cart[id].price = parseInt(card?.getAttribute('data-no-rice-price')) || basePrice;
            } else if (noEgg) {
                cart[id].price = parseInt(card?.getAttribute('data-no-egg-price')) || basePrice;
            } else cart[id].price = basePrice + topingExtraCost;

            updateCartBar();
        }

        function updateQty(id, change) {
            if (!cart[id]) {
                const card = document.querySelector(`[data-id="${id}"]`);
                if (!card) return;
                cart[id] = {
                    id: id,
                    name: card.getAttribute('data-name'),
                    price: parseInt(card.getAttribute('data-price')) || 0,
                    unit: card.getAttribute('data-unit'),
                    type: card.getAttribute('data-type'),
                    qty: 0,
                    lauk: '',
                    sambal: '',
                    level: '',
                    variant: '',
                    topings: [],
                    topingCounts: {},
                    noRice: false,
                    noEgg: false
                };
            }

            cart[id].qty += change;
            if (cart[id].qty <= 0) {
                delete cart[id];
                if (id === 'w12') {
                    document.querySelectorAll('[id^="topingqty-"]').forEach(el => el.innerText = '0');
                }
            } else {
                updateOptions(id);
            }

            document.querySelectorAll(`[id="qty-${id}"]`).forEach(qtyDisplay => {
                qtyDisplay.innerText = cart[id] ? cart[id].qty : 0;
            });
            updateCartBar();
        }

        function updateCartBar() {
            let totalCount = 0;
            let totalPrice = 0;
            let listHtml = '';

            for (let id in cart) {
                let item = cart[id];
                totalCount += item.qty;
                totalPrice += item.price * item.qty;

                let details = [];
                if (item.lauk) details.push(`Lauk: ${item.lauk}`);
                if (item.variant) details.push(`Varian: ${item.variant}`);
                if (item.noRice) details.push('Tanpa Nasi');
                if (item.noEgg) details.push('Tanpa Telur');
                if (item.sambal) details.push(`Sambal: ${item.sambal}`);
                if (item.level) details.push(`Level: ${item.level}`);
                if (item.topings && item.topings.length > 0) details.push(`Toping Seblak: ${item.topings.join(', ')}`);
                let detailStr = details.length > 0 ? `<div class="text-[10px] text-pinky-600 font-medium">${details.join(' | ')}</div>` : '';

                listHtml += `
                    <div class="flex justify-between items-center text-xs bg-white p-2 rounded-xl border border-pink-100">
                        <div>
                            <span class="font-bold text-gray-800">${item.name}</span>
                            <span class="text-pinky-600 font-semibold ml-1">(${item.qty}x)</span>
                            ${detailStr}
                        </div>
                        <span class="font-extrabold text-gray-700">${item.price > 0 ? 'Rp ' + (item.price * item.qty).toLocaleString('id-ID') : item.unit}</span>
                    </div>
                `;
            }

            const cartBar = document.getElementById('cartBar');
            if (totalCount > 0) {
                cartBar.classList.remove('translate-y-full');
            } else {
                cartBar.classList.add('translate-y-full');
                const detailList = document.getElementById('cartDetailList');
                if (detailList) detailList.classList.add('hidden');
                const detailIcon = document.getElementById('cartDetailIcon');
                if (detailIcon) detailIcon.classList.remove('rotate-180');
                const toggleText = document.getElementById('cartDetailToggleText');
                if (toggleText) toggleText.innerText = 'Lihat Rincian';
            }

            document.getElementById('cartCountBadge').innerText = totalCount;
            document.getElementById('cartSummaryText').innerText = `${totalCount} Pesanan Dipilih`;
            document.getElementById('cartTotalPrice').innerText = totalPrice > 0 ? `Rp ${totalPrice.toLocaleString('id-ID')}` : 'Sesuai Layanan';
            document.getElementById('cartDetailList').innerHTML = listHtml;
            document.getElementById('checkoutTotalText').innerText = totalPrice > 0 ? `Rp ${totalPrice.toLocaleString('id-ID')}` : 'Sesuai Layanan';
        }

        function toggleCartDetail() {
            const list = document.getElementById('cartDetailList');
            const icon = document.getElementById('cartDetailIcon');
            const toggleText = document.getElementById('cartDetailToggleText');

            if (list.classList.contains('hidden')) {
                list.classList.remove('hidden');
                icon.classList.add('rotate-180');
                toggleText.innerText = 'Sembunyikan';
            } else {
                list.classList.add('hidden');
                icon.classList.remove('rotate-180');
                toggleText.innerText = 'Lihat Rincian';
            }
        }

        // Checkout Modal Functions
        function openCheckoutModal() {
            // Bukti dari transaksi sebelumnya tidak boleh dipakai ulang, termasuk pada order manual.
            clearPaymentProof();
            const selectedItems = Object.values(cart);
            if (selectedItems.length && selectedItems.every(item => item.type === 'print' || item.type === 'service')) {
                sendOrderToWA(true);
                return;
            }
            const modal = document.getElementById('checkoutModal');
            const content = document.getElementById('checkoutModalContent');
            const deliverySection = document.getElementById('deliverySection');
            const hasWarungItems = selectedItems.some(item => item.type === 'warung');
            if (deliverySection) deliverySection.classList.toggle('hidden', !hasWarungItems);
            if (!hasWarungItems) {
                document.getElementById('deliveryPlace').value = '';
                updateDeliverySubOptions();
            }
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                content.classList.remove('scale-95');
            }, 10);
            selectPaymentMethod(null);
        }

        // MENGATUR SUB PILIHAN TEMPAT KIRIM
function updateDeliverySubOptions() {

    const place = document.getElementById('deliveryPlace');
    const wrap = document.getElementById('deliverySubPlaceWrap');
    const sub = document.getElementById('deliverySubPlace');

    // Kolom deskripsi tempat lainnya
    const otherWrap = document.getElementById('deliveryOtherPlaceWrap');
    const otherInput = document.getElementById('deliveryOtherPlace');

    if (!place || !wrap || !sub) return;

    // Daftar titik pengiriman
    const options = {
        DJ2: [
            'Gerbang Depan',
            'Gerbang Blok A',
            'Gazebo'
        ],

        DJ3: [
            'Gerbang Atas',
            'Gerbang Bawah',
            'Gerbang Dekat Rak Sepatu',
            'Gazebo'
        ]
    };

    const choices = options[place.value] || [];

    // Mengatur pilihan titik pengiriman
    sub.innerHTML =
        '<option value="">-- Pilih titik pengiriman --</option>' +
        choices.map(value =>
            `<option value="${value}">${value}</option>`
        ).join('');

    wrap.classList.toggle('hidden', choices.length === 0);

    // Menampilkan deskripsi jika memilih LAINNYA
    const isOtherPlace = place.value === 'LAINNYA';

    if (otherWrap) {
        otherWrap.classList.toggle('hidden', !isOtherPlace);
    }

    // Kosongkan deskripsi jika berpindah ke tempat lain
    if (!isOtherPlace && otherInput) {
        otherInput.value = '';
    }
}

        function requiresPaymentProof(method = selectedPayment) {
            return ['qris', 'split'].includes(method);
        }

        function clearPaymentProof() {
            paymentProofFile = null;
            const input = document.getElementById('paymentProofInput');
            const name = document.getElementById('paymentProofName');
            const preview = document.getElementById('paymentProofPreview');
            if (input) input.value = '';
            if (name) name.textContent = 'Belum ada foto yang dipilih.';
            if (preview) {
                if (preview.src && preview.src.startsWith('blob:')) URL.revokeObjectURL(preview.src);
                preview.removeAttribute('src');
                preview.classList.add('hidden');
            }
            updateSubmitOrderButton();
        }

        function updateSubmitOrderButton() {
            const submitBtn = document.getElementById('submitOrderBtn');
            if (!submitBtn) return;

            const needsProof = requiresPaymentProof();
            const hasProof = Boolean(paymentProofFile && paymentProofFile.type && paymentProofFile.type.startsWith('image/'));
            const canSubmit = Boolean(selectedPayment) && (!needsProof || hasProof);
            submitBtn.disabled = !canSubmit;
            submitBtn.className = canSubmit
                ? 'w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-2xl font-bold text-xs tracking-wide shadow-lg transition active:scale-95 flex items-center justify-center gap-2'
                : 'w-full bg-gray-300 text-white py-3 rounded-2xl font-bold text-xs tracking-wide shadow transition flex items-center justify-center gap-2 cursor-not-allowed';

            const requirement = document.getElementById('paymentProofRequirement');
            if (requirement && needsProof) {
                requirement.textContent = hasProof
                    ? '✓ Bukti pembayaran sudah dipilih. Tombol pesan sekarang aktif.'
                    : 'Wajib upload bukti pembayaran sebelum lanjut ke WhatsApp.';
                requirement.classList.toggle('text-emerald-600', hasProof);
                requirement.classList.toggle('text-red-600', !hasProof);
            }
        }

        function previewPaymentProof(event) {
            const file = event.target.files && event.target.files[0];
            const name = document.getElementById('paymentProofName');
            const preview = document.getElementById('paymentProofPreview');
            paymentProofFile = null;
            if (!file) {
                name.textContent = 'Belum ada foto yang dipilih.';
                preview.removeAttribute('src');
                preview.classList.add('hidden');
                updateSubmitOrderButton();
                return;
            }
            if (!file.type || !file.type.startsWith('image/')) {
                alert('Silakan pilih file gambar sebagai bukti pembayaran.');
                event.target.value = '';
                name.textContent = 'Belum ada foto yang dipilih.';
                preview.removeAttribute('src');
                preview.classList.add('hidden');
                updateSubmitOrderButton();
                return;
            }
            paymentProofFile = file;
            name.textContent = `Dipilih: ${file.name}`;
            if (preview.src && preview.src.startsWith('blob:')) URL.revokeObjectURL(preview.src);
            preview.src = URL.createObjectURL(file);
            preview.classList.remove('hidden');
            updateSubmitOrderButton();
        }

        function closeCheckoutModal() {
            const modal = document.getElementById('checkoutModal');
            const content = document.getElementById('checkoutModalContent');
            modal.classList.add('opacity-0');
            content.classList.add('scale-95');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
        }

        function selectPaymentMethod(method) {
            // Setiap pergantian metode meminta bukti baru agar bukti lama tidak terpakai ulang.
            if (selectedPayment !== method) clearPaymentProof();
            selectedPayment = method;

            document.querySelectorAll('.payment-opt-btn').forEach(btn => {
                btn.classList.remove('border-pinky-500', 'bg-pink-50', 'ring-2', 'ring-pinky-400');
                btn.classList.add('border-pink-200', 'bg-white');
            });

            const box = document.getElementById('paymentDetailBox');
            const viewQris = document.getElementById('view-qris');
            const viewCash = document.getElementById('view-cash');
            const viewSplit = document.getElementById('view-split');
            const proofBox = document.getElementById('paymentProofBox');

            if (!method) {
                box.classList.add('hidden');
                updateSubmitOrderButton();
                return;
            }

            box.classList.remove('hidden');
            viewQris.classList.add('hidden');
            viewCash.classList.add('hidden');
            viewSplit.classList.add('hidden');
            if (proofBox) proofBox.classList.add('hidden');

            const activeBtn = document.getElementById(`payBtn-${method}`);
            if (activeBtn) {
                activeBtn.classList.remove('border-pink-200', 'bg-white');
                activeBtn.classList.add('border-pinky-500', 'bg-pink-50', 'ring-2', 'ring-pinky-400');
            }

            if (method === 'qris') {
                viewQris.classList.remove('hidden');
                if (proofBox) proofBox.classList.remove('hidden');
            } else if (method === 'cash') {
                viewCash.classList.remove('hidden');
            } else if (method === 'split') {
                viewSplit.classList.remove('hidden');
                if (proofBox) proofBox.classList.remove('hidden');
            }
            updateSubmitOrderButton();
        }

        function confirmAndSendWA() {
            if (!selectedPayment) return;
            const hasWarungItems = Object.values(cart).some(item => item.type === 'warung');
            if (hasWarungItems) {
            const customerName = document.getElementById('customerName').value.trim();
                if (!customerName) {
                    alert('Silakan masukkan nama pemesan terlebih dahulu.');
                    document.getElementById('customerName').focus();
                    return;
                }
                const place = document.getElementById('deliveryPlace').value;
                const subWrap = document.getElementById('deliverySubPlaceWrap');
                const subPlace = document.getElementById('deliverySubPlace').value;

                if (!place) {
                    alert('Silakan pilih tempat kirim terlebih dahulu.');
                    document.getElementById('deliveryPlace').focus();
                    return;
                }

                // Mengambil deskripsi tempat lainnya
                const otherPlace =
                    document.getElementById('deliveryOtherPlace')?.value.trim() || '';
                // WAJIB mengisi deskripsi jika memilih LAINNYA
                if (place === 'LAINNYA' && !otherPlace) {
                    alert('Silakan tuliskan deskripsi tempat pengiriman.');
                    document.getElementById('deliveryOtherPlace').focus();
                    return;
                }
                if (subWrap && !subWrap.classList.contains('hidden') && !subPlace) {
                    alert('Silakan pilih titik pengiriman untuk ' + place + '.');
                    return;
                }
            }
            if (requiresPaymentProof() && (!paymentProofFile || !paymentProofFile.type || !paymentProofFile.type.startsWith('image/'))) {
                updateSubmitOrderButton();
                alert('Pembayaran QRIS dan QRIS + Tunai wajib disertai foto bukti pembayaran sebelum pesanan dapat dikirim ke WhatsApp.');
                document.getElementById('paymentProofInput')?.click();
                return;
            }
            sendOrderToWA(false);
        }

        async function sendOrderToWA(manualQuote) {
            // Pemeriksaan lapis kedua agar pesanan non-manual tidak bisa melewati kewajiban upload.
            if (!manualQuote && (!selectedPayment || (requiresPaymentProof() && (!paymentProofFile || !paymentProofFile.type || !paymentProofFile.type.startsWith('image/'))))) {
                updateSubmitOrderButton();
                alert('Pilih metode pembayaran dan upload bukti pembayaran QRIS terlebih dahulu sebelum melanjutkan.');
                return;
            }

            let hasPrint = false;
            let orderLines = [];
            let totalPrice = 0;

            for (let id in cart) {
                let item = cart[id];
                if (item.type === 'print') hasPrint = true;
                let subText = [];
                if (item.lauk) subText.push(`Lauk: ${item.lauk}`);
                if (item.variant) subText.push(`Varian: ${item.variant}`);
                if (item.noRice) subText.push('Tanpa Nasi');
                if (item.noEgg) subText.push('Tanpa Telur');
                if (item.sambal) subText.push(`Sambal: ${item.sambal}`);
                if (item.level) subText.push(`Level: ${item.level}`);
                if (item.topings && item.topings.length > 0) subText.push(`Toping Seblak: ${item.topings.join(', ')}`);
                let extraInfo = subText.length > 0 ? ` [${subText.join(', ')}]` : '';
                // Jika tanpa nasi, hapus kata "Nasi" di awal nama menu
                const displayName = item.noRice
                    ? item.name.replace(/^Nasi\s+/i, '')
                    : item.name;

                orderLines.push(`• ${displayName}${extraInfo} (${item.qty}x)${item.price > 0 ? ' - Rp ' + (item.price * item.qty).toLocaleString('id-ID') : ''}`);
                                totalPrice += item.price * item.qty;
                            }

            let paymentText = '';
            let targetWA = hasPrint ? PINK_PRINT_WA_NUMBER : MAIN_WA_NUMBER;
            if (manualQuote) {
                paymentText = '*Harga dan pembayaran akan dihitung manual oleh admin/teknisi.*';
            } else if (selectedPayment === 'qris') {
                paymentText = 'Metode Pembayaran: *QRIS*';
            } else if (selectedPayment === 'cash') {
                paymentText = 'Metode Pembayaran: *Tunai di Tempat*';
            } else if (selectedPayment === 'split') {
                let qVal = document.getElementById('splitQrisAmount').value || '0';
                let cVal = document.getElementById('splitCashAmount').value || '0';
                paymentText = `Metode Pembayaran: *QRIS + Tunai*\n- QRIS: Rp ${Number(qVal).toLocaleString('id-ID')}\n- Tunai: Rp ${Number(cVal).toLocaleString('id-ID')}`;
            }

            let deliveryText = '';
            let customerText = '';

            const hasWarungItems = Object.values(cart).some(item => item.type === 'warung');

            if (!manualQuote && hasWarungItems) {

                // Mengambil nama pemesan
                const customerName = document.getElementById('customerName').value.trim();

                customerText = `Nama Pemesan: *${customerName}*\n`;

                // Mengambil tempat kirim
                const place = document.getElementById('deliveryPlace').value;
                const subWrap = document.getElementById('deliverySubPlaceWrap');
                const subPlace = document.getElementById('deliverySubPlace').value;
                // Mengambil deskripsi tempat lainnya
                const otherPlace =
                    document.getElementById('deliveryOtherPlace')?.value.trim() || '';
                // Menentukan alamat akhir
                let finalPlace = place;
                if (place === 'LAINNYA') {
                    finalPlace = `Lainnya - ${otherPlace}`;
                } else if (
                    subWrap &&
                    !subWrap.classList.contains('hidden') &&
                    subPlace
                ) {
                    finalPlace = `${place} - ${subPlace}`;
                }
                // Menyusun detail pengiriman WhatsApp
                deliveryText = `Tempat Kirim: *${finalPlace}*\n`;
            }

            let canSharePaymentProof = false;
            if (!manualQuote && paymentProofFile && navigator.share && navigator.canShare) {
                try {
                    canSharePaymentProof = navigator.canShare({ files: [paymentProofFile] });
                } catch (_) {
                    canSharePaymentProof = false;
                }
            }
            let proofText = paymentProofFile
                ? `\nBukti pembayaran: *${paymentProofFile.name}* ${canSharePaymentProof ? '(akan dilampirkan melalui menu berbagi)' : '(silakan lampirkan foto ini secara manual di WhatsApp)'}.`
                : '';
            let message = `Halo Kak, saya ingin membuat pesanan baru di *PINK GROUP*:\n\n` +
                          `${orderLines.join('\n')}\n\n` +
                          (manualQuote ? '*Mohon info total harga dan proses selanjutnya ya kak.*\n\n' : (totalPrice > 0 ? `*Total Tagihan: Rp ${totalPrice.toLocaleString('id-ID')}*\n\n` : '')) +
                          `${customerText}${deliveryText}${paymentText}${proofText}\n\n` +
                          `Mohon segera diproses ya kak. Terima kasih!`;

            const whatsappUrl = `https://wa.me/${targetWA}?text=${encodeURIComponent(message)}`;

            // wa.me tidak menyediakan cara untuk memasukkan file lokal sebagai lampiran.
            // Gunakan Web Share API bila browser mendukung berbagi file; pengguna memilih WhatsApp di menu berbagi.
            if (!manualQuote && paymentProofFile) {
                if (canSharePaymentProof) {
                    const shareData = {
                        title: 'Pesanan PINK GROUP - Bukti Pembayaran',
                        text: message,
                        files: [paymentProofFile]
                    };
                    try {
                        await navigator.share(shareData);
                        closeCheckoutModal();
                        return;
                    } catch (error) {
                        if (error && error.name === 'AbortError') return;
                        console.error('Berbagi bukti pembayaran gagal:', error);
                        alert('Fitur berbagi file gagal dibuka. WhatsApp akan dibuka; silakan lampirkan foto bukti pembayaran secara manual.');
                        const fallbackMessage = message.replace('(akan dilampirkan melalui menu berbagi)', '(silakan lampirkan foto ini secara manual di WhatsApp)');
                        window.open(`https://wa.me/${targetWA}?text=${encodeURIComponent(fallbackMessage)}`, '_blank');
                        closeCheckoutModal();
                        return;
                    }
                }
                alert('Browser/perangkat ini belum mendukung pengiriman foto otomatis. WhatsApp akan dibuka; lampirkan foto bukti pembayaran melalui ikon lampiran.');
                window.open(whatsappUrl, '_blank');
                closeCheckoutModal();
                return;
            }

            window.open(whatsappUrl, '_blank');
            if (!manualQuote) closeCheckoutModal();
        }

        function downloadQrisImage() {
            let imgEl = document.querySelector('#view-qris img');
            if (!imgEl) return;

            let link = document.createElement('a');
            link.download = 'QRIS-Warung-Pink.png';
            link.href = imgEl.src;
            link.click();
        }

        // QR Web Modal Handlers
        function toggleQRModal() {
            const modal = document.getElementById('qrModal');
            const content = document.getElementById('qrModalContent');
            if (modal.classList.contains('hidden')) {
                modal.classList.remove('hidden');
                setTimeout(() => {
                    modal.classList.remove('opacity-0');
                    content.classList.remove('scale-95');
                }, 10);
            } else {
                modal.classList.add('opacity-0');
                content.classList.add('scale-95');
                setTimeout(() => {
                    modal.classList.add('hidden');
                }, 300);
            }
        }

        function initQRCode(text) {
            const container = document.getElementById('qrcode');
            if (!container) return;
            container.innerHTML = "";
            qrCodeInstance = new QRCode(container, {
                text: text,
                width: 180,
                height: 180,
                colorDark: "#66001f",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }

        function updateQRCode() {
            let urlInput = document.getElementById('customWebUrl').value;
            if (!urlInput) {
                alert('Silakan masukkan link web terlebih dahulu!');
                return;
            }
            initQRCode(urlInput);
        }

        function downloadQR() {
            const img = document.querySelector('#qrcode img') || document.querySelector('#qrcode canvas');
            if (!img) return;
            let dataUrl = img.tagName === 'CANVAS' ? img.toDataURL('image/png') : img.src;
            let link = document.createElement('a');
            link.download = 'Barcode-Pink-Group.png';
            link.href = dataUrl;
            link.click();
        }

        function printQR() {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`<html><head><title>Cetak Barcode Pink Group</title><link rel="stylesheet" href="${new URL('./css/style.css', window.location.href).href}"></head><body class="qr-print-page"><h2>💖 PINK GROUP 💖</h2><p>Scan untuk membuka layanan Warung Pink, Pink Print & Pink Service</p><div class="qr-print-code">${document.getElementById('qrcode').innerHTML}</div><p class="qr-print-note">Silakan pajang di meja kasir / toko Anda</p></body></html>`);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
        }

        function orderViaWA(text) {
            let encoded = encodeURIComponent(text);
            window.open(`https://wa.me/${MAIN_WA_NUMBER}?text=${encoded}`, '_blank');
        }


/* --------------------------------------------------------------------------
 * Declarative event wiring
 * HTML buttons/inputs use data-action-* attributes; interaction logic stays here.
 * -------------------------------------------------------------------------- */
function dispatchDataAction(event, eventType) {
    const element = event.target && event.target.closest
        ? event.target.closest(`[data-action-${eventType}]`)
        : null;
    if (!element) return;

    const actionName = element.dataset[`action${eventType[0].toUpperCase()}${eventType.slice(1)}`];
    if (!actionName) return;

    if (actionName === 'closeMenuImageBackdrop') {
        if (event.target === element) closeMenuImage();
        return;
    }

    const rawArgs = element.dataset[`actionArgs${eventType[0].toUpperCase()}${eventType.slice(1)}`];
    let args = [];
    if (rawArgs) {
        try {
            args = JSON.parse(rawArgs).map(value => {
                if (value === '__element__') return element;
                if (value === '__event__') return event;
                return value;
            });
        } catch (error) {
            console.error('Parameter aksi HTML tidak valid:', actionName, error);
            return;
        }
    }

    const handler = window[actionName];
    if (typeof handler === 'function') handler(...args);
}

['click', 'change', 'keyup', 'input'].forEach(eventType => {
    document.addEventListener(eventType, event => dispatchDataAction(event, eventType));
});

// Fallback image handling tanpa atribut onerror inline.
document.addEventListener('error', event => {
    const image = event.target;
    if (!image || image.tagName !== 'IMG' || !image.dataset.fallbackSrc || image.dataset.fallbackApplied === 'true') return;
    image.dataset.fallbackApplied = 'true';
    image.src = image.dataset.fallbackSrc;
}, true);
