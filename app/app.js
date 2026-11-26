// Anggaran Kita — render & interaksi (hash routes, semua kontrol bekerja).
// Halaman: #/dashboard, #/transaksi, #/anggaran, #/tagihan, #/tabungan, #/laporan.
// Setiap perubahan (tambah/edit/hapus transaksi, ubah anggaran, tandai lunas,
// tambah setoran) disimpan ke localStorage dan langsung mengubah semua halaman,
// karena semuanya dihitung ulang dari STATE yang sama di data.js.
(function () {
  'use strict';

  var AK = window.AnggaranKita;
  var state = AK.loadState();
  var editingId = null;

  var CATEGORY_COLORS = {
    'Belanja Pasar': '#12395b',
    'Makan & Jajan': '#e9a13b',
    'Transport': '#c96f4a',
    'Listrik & Air': '#4a7fa5',
    'Sekolah Anak': '#7b5ea7',
    'Hiburan': '#c4556b',
    'Kesehatan': '#8c5a3c',
    'Lainnya': '#5b7a8c',
    'Tabungan': '#2e6b4f'
  };

  var EXPENSE_CATEGORIES = ['Belanja Pasar', 'Makan & Jajan', 'Transport', 'Listrik & Air', 'Sekolah Anak', 'Hiburan', 'Kesehatan', 'Lainnya', 'Tabungan'];
  var INCOME_CATEGORIES = ['Gaji', 'Freelance', 'Jualan', 'Lainnya'];

  function el(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function pct(part, whole) {
    return whole > 0 ? Math.round(part / whole * 100) : 0;
  }

  function statusOf(spent, limit) {
    var p = pct(spent, limit);
    if (p >= 100) { return { label: 'Lewat batas', cls: 'over' }; }
    if (p >= 80) { return { label: 'Waspada', cls: 'warn' }; }
    return { label: 'Aman', cls: 'ok' };
  }

  function nextId(list) {
    var max = 0;
    for (var i = 0; i < list.length; i++) { if (list[i].id > max) { max = list[i].id; } }
    return max + 1;
  }

  function sortedTx() {
    return state.transactions.slice().sort(function (a, b) {
      if (a.date !== b.date) { return b.date < a.date ? -1 : 1; }
      return b.id - a.id;
    });
  }

  // ---------- Dashboard ----------
  function renderDashboard() {
    var t = AK.totals(state);
    var spent = AK.spentByCategory(state);
    el('stat-balance').textContent = AK.fmtRp(t.balance);
    el('stat-income').textContent = AK.fmtRp(t.income);
    el('stat-expense').textContent = AK.fmtRp(t.expense);
    el('stat-budget-left').textContent = AK.fmtRp(t.budgetLeft);
    el('stat-budget-total').textContent = 'dari anggaran ' + AK.fmtRp(t.budgetTotal);
    el('stat-savings-rate').textContent = 'Tingkat tabungan ' + t.savingsRate + '% dari pemasukan';

    // Donat kategori (conic-gradient dihitung dari pengeluaran nyata).
    var entries = state.budgets.map(function (b) {
      return { category: b.category, amount: spent[b.category] || 0 };
    }).filter(function (e) { return e.amount > 0; });
    var parts = [];
    var acc = 0;
    entries.forEach(function (e) {
      var share = t.expense > 0 ? e.amount / t.expense * 100 : 0;
      parts.push((CATEGORY_COLORS[e.category] || '#888') + ' ' + acc.toFixed(1) + '% ' + (acc + share).toFixed(1) + '%');
      acc += share;
    });
    var donut = el('donut');
    donut.style.background = 'conic-gradient(' + parts.join(', ') + ')';
    donut.innerHTML = '<span class="donut-center"><strong>' + AK.fmtRp(t.expense) + '</strong><small>Total belanja</small></span>';
    el('donut-legend').innerHTML = entries.map(function (e) {
      return '<li><span class="dot" style="background:' + (CATEGORY_COLORS[e.category] || '#888') + '"></span>' +
        esc(e.category) + ' <strong>' + AK.fmtRp(e.amount) + '</strong> · ' + pct(e.amount, t.expense) + '%</li>';
    }).join('');

    // 3 peringatan: kategori dengan pemakaian anggaran tertinggi (>=80%).
    var warnings = state.budgets.map(function (b) {
      return { category: b.category, spent: spent[b.category] || 0, limit: b.limit, p: pct(spent[b.category] || 0, b.limit) };
    }).filter(function (w) { return w.p >= 80; }).sort(function (a, b) { return b.p - a.p; }).slice(0, 3);
    el('warnings').innerHTML = warnings.length ? warnings.map(function (w) {
      return '<article class="warn-card"><div class="warn-head"><strong>' + esc(w.category) + '</strong>' +
        '<span class="badge warn">' + w.p + '% terpakai</span></div>' +
        '<p>Sudah ' + AK.fmtRp(w.spent) + ' dari ' + AK.fmtRp(w.limit) + ' — sisa ' + AK.fmtRp(Math.max(0, w.limit - w.spent)) + ' sampai akhir bulan.</p></article>';
    }).join('') : '<p>Semua kategori masih aman bulan ini.</p>';

    // Transaksi terbaru (5).
    el('recent-list').innerHTML = sortedTx().slice(0, 5).map(txRow).join('');

    // Target tabungan bulan ini (ringkas).
    el('dash-goals').innerHTML = state.goals.map(function (g) {
      var p = pct(g.saved, g.target);
      return '<div class="goal-mini"><div class="goal-mini-head"><strong>' + esc(g.name) + '</strong><span>' + AK.fmtRp(g.saved) + ' / ' + AK.fmtRp(g.target) + '</span></div>' +
        '<div class="bar"><span style="width:' + p + '%"></span></div><small>' + p + '% tercapai</small></div>';
    }).join('');
  }

  function txRow(t) {
    var sign = t.type === 'income' ? '+' : '−';
    return '<tr><td>' + AK.fmtDate(t.date) + '</td><td>' + esc(t.desc) + '</td>' +
      '<td><span class="cat-chip" style="--c:' + (CATEGORY_COLORS[t.category] || '#5b7a8c') + '">' + esc(t.category) + '</span></td>' +
      '<td class="num ' + t.type + '">' + sign + ' ' + AK.fmtRp(t.amount) + '</td></tr>';
  }

  // ---------- Transaksi ----------
  function renderTransactions() {
    var filterCat = el('filter-category').value;
    var query = (el('filter-search').value || '').toLowerCase();
    var rows = sortedTx().filter(function (t) {
      if (filterCat !== 'Semua' && t.category !== filterCat) { return false; }
      if (query && (t.desc.toLowerCase().indexOf(query) === -1 && t.category.toLowerCase().indexOf(query) === -1)) { return false; }
      return true;
    });
    var t = AK.totals(state);
    el('tx-count').textContent = rows.length + ' dari ' + state.transactions.length + ' transaksi · Pengeluaran ' + AK.fmtRp(t.expense) + ' · Pemasukan ' + AK.fmtRp(t.income);
    el('tx-body').innerHTML = rows.length ? rows.map(function (tx) {
      return '<tr><td>' + AK.fmtDate(tx.date) + '</td><td>' + esc(tx.desc) + '</td>' +
        '<td><span class="cat-chip" style="--c:' + (CATEGORY_COLORS[tx.category] || '#5b7a8c') + '">' + esc(tx.category) + '</span></td>' +
        '<td class="num ' + tx.type + '">' + (tx.type === 'income' ? '+' : '−') + ' ' + AK.fmtRp(tx.amount) + '</td>' +
        '<td class="actions"><button type="button" data-edit="' + tx.id + '">Ubah</button>' +
        '<button type="button" class="danger" data-del="' + tx.id + '">Hapus</button></td></tr>';
    }).join('') : '<tr><td colspan="5" class="empty">Tidak ada transaksi yang cocok. Ubah filter atau kata kunci pencarian.</td></tr>';

    var typeSel = el('tx-type');
    var catSel = el('tx-category');
    var cats = typeSel.value === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    var currentCat = catSel.value;
    catSel.innerHTML = cats.map(function (c) { return '<option' + (c === currentCat ? ' selected' : '') + '>' + c + '</option>'; }).join('');
    if (cats.indexOf(currentCat) === -1) { catSel.value = cats[0]; }
    el('tx-form-title').textContent = editingId ? 'Ubah transaksi #' + editingId : 'Tambah transaksi baru';
    el('tx-submit').textContent = editingId ? 'Simpan perubahan' : 'Tambah transaksi';
  }

  function submitTransaction(ev) {
    ev.preventDefault();
    var desc = el('tx-desc').value.trim();
    var amount = Math.round(parseFloat(el('tx-amount').value));
    var date = el('tx-date').value;
    var type = el('tx-type').value;
    var category = el('tx-category').value;
    if (!desc || !amount || amount <= 0 || !date) { el('tx-msg').textContent = 'Lengkapi deskripsi, nominal, dan tanggal dulu.'; return; }
    if (editingId) {
      for (var i = 0; i < state.transactions.length; i++) {
        if (state.transactions[i].id === editingId) {
          state.transactions[i] = { id: editingId, date: date, desc: desc, category: category, type: type, amount: amount };
        }
      }
      el('tx-msg').textContent = 'Transaksi berhasil diubah — semua halaman ikut diperbarui.';
      editingId = null;
    } else {
      state.transactions.push({ id: nextId(state.transactions), date: date, desc: desc, category: category, type: type, amount: amount });
      el('tx-msg').textContent = 'Transaksi baru tersimpan — saldo dan anggaran ikut diperbarui.';
    }
    AK.saveState(state);
    ev.target.reset();
    el('tx-date').value = '2026-11-27';
    el('tx-type').value = 'expense';
    renderAll();
  }

  // ---------- Anggaran ----------
  function renderBudgets() {
    var spent = AK.spentByCategory(state);
    var t = AK.totals(state);
    el('budget-summary').textContent = 'Total anggaran ' + AK.fmtRp(t.budgetTotal) + ' · Terpakai ' + AK.fmtRp(t.expense) + ' · Sisa ' + AK.fmtRp(t.budgetLeft);
    el('budget-list').innerHTML = state.budgets.map(function (b) {
      var s = spent[b.category] || 0;
      var p = pct(s, b.limit);
      var st = statusOf(s, b.limit);
      return '<article class="budget-card"><div class="budget-head"><h3>' + esc(b.category) + '</h3>' +
        '<span class="badge ' + st.cls + '">' + st.label + ' · ' + p + '%</span></div>' +
        '<div class="bar big"><span class="' + st.cls + '" style="width:' + Math.min(100, p) + '%"></span></div>' +
        '<p class="budget-nums"><strong>' + AK.fmtRp(s) + '</strong> dari ' + AK.fmtRp(b.limit) + ' · Sisa <strong>' + AK.fmtRp(Math.max(0, b.limit - s)) + '</strong></p>' +
        '<label>Ubah anggaran <span class="sr">untuk ' + esc(b.category) + '</span><span class="budget-edit">' +
        '<input type="number" min="0" step="10000" value="' + b.limit + '" data-budget="' + esc(b.category) + '" aria-label="Anggaran ' + esc(b.category) + '">' +
        '<button type="button" data-save-budget="' + esc(b.category) + '">Simpan</button></span></label></article>';
    }).join('');
  }

  // ---------- Tagihan ----------
  function renderBills() {
    var total = 0, paidTotal = 0, unpaidTotal = 0, unpaidCount = 0;
    state.bills.forEach(function (b) {
      total += b.amount;
      if (b.paid) { paidTotal += b.amount; } else { unpaidTotal += b.amount; unpaidCount++; }
    });
    el('bill-summary').textContent = 'Total tagihan bulan ini ' + AK.fmtRp(total) + ' · Sudah lunas ' + AK.fmtRp(paidTotal) + ' · Belum lunas ' + AK.fmtRp(unpaidTotal) + ' (' + unpaidCount + ' tagihan)';
    el('bill-list').innerHTML = state.bills.slice().sort(function (a, b) { return a.due - b.due; }).map(function (b) {
      return '<article class="bill-card' + (b.paid ? ' paid' : '') + '"><div class="bill-date"><strong>' + b.due + '</strong><small>Nov</small></div>' +
        '<div class="bill-info"><h3>' + esc(b.name) + '</h3><p>Jatuh tempo ' + b.due + ' November 2026 · ' + esc(b.category) + '</p></div>' +
        '<div class="bill-right"><strong>' + AK.fmtRp(b.amount) + '</strong>' +
        '<span class="badge ' + (b.paid ? 'ok' : 'warn') + '">' + (b.paid ? 'Lunas' : 'Belum lunas') + '</span>' +
        '<button type="button" data-bill="' + b.id + '">' + (b.paid ? 'Batalkan lunas' : 'Tandai lunas') + '</button></div></article>';
    }).join('');
  }

  function toggleBill(id) {
    for (var i = 0; i < state.bills.length; i++) {
      var b = state.bills[i];
      if (b.id !== id) { continue; }
      if (!b.paid) {
        b.paid = true;
        var tx = { id: nextId(state.transactions), date: '2026-11-27', desc: 'Bayar ' + b.name, category: b.category, type: 'expense', amount: b.amount };
        state.transactions.push(tx);
        b.paidTxId = tx.id;
        el('bill-msg').textContent = b.name + ' ditandai lunas — ' + AK.fmtRp(b.amount) + ' tercatat sebagai pengeluaran di Transaksi dan saldo berkurang.';
      } else {
        b.paid = false;
        if (b.paidTxId) {
          state.transactions = state.transactions.filter(function (t) { return t.id !== b.paidTxId; });
          b.paidTxId = null;
        }
        el('bill-msg').textContent = b.name + ' dikembalikan ke belum lunas.';
      }
    }
    AK.saveState(state);
    renderAll();
  }

  // ---------- Tabungan ----------
  function renderGoals() {
    var totalSaved = 0, totalTarget = 0;
    state.goals.forEach(function (g) { totalSaved += g.saved; totalTarget += g.target; });
    el('goal-summary').textContent = 'Total terkumpul ' + AK.fmtRp(totalSaved) + ' dari target ' + AK.fmtRp(totalTarget) + ' (' + pct(totalSaved, totalTarget) + '%)';
    el('goal-list').innerHTML = state.goals.map(function (g) {
      var p = pct(g.saved, g.target);
      return '<article class="goal-card"><div class="goal-head"><h3>' + esc(g.name) + '</h3><span class="badge ok">' + p + '%</span></div>' +
        '<p>' + esc(g.note) + '</p>' +
        '<div class="bar big"><span style="width:' + p + '%"></span></div>' +
        '<p class="budget-nums"><strong>' + AK.fmtRp(g.saved) + '</strong> dari ' + AK.fmtRp(g.target) + ' · Kurang <strong>' + AK.fmtRp(Math.max(0, g.target - g.saved)) + '</strong></p>' +
        '<label>Tambah setoran (Rp)<span class="budget-edit">' +
        '<input type="number" min="10000" step="10000" value="100000" data-deposit="' + g.id + '" aria-label="Setoran ' + esc(g.name) + '">' +
        '<button type="button" data-add-deposit="' + g.id + '">Setor</button></span></label></article>';
    }).join('');
  }

  function addDeposit(id) {
    var input = document.querySelector('[data-deposit="' + id + '"]');
    var amount = Math.round(parseFloat(input.value));
    if (!amount || amount <= 0) { el('goal-msg').textContent = 'Masukkan nominal setoran yang benar.'; return; }
    for (var i = 0; i < state.goals.length; i++) {
      if (state.goals[i].id === id) {
        state.goals[i].saved += amount;
        state.transactions.push({ id: nextId(state.transactions), date: '2026-11-27', desc: 'Setoran — ' + state.goals[i].name, category: 'Tabungan', type: 'expense', amount: amount });
        el('goal-msg').textContent = 'Setoran ' + AK.fmtRp(amount) + ' ke ' + state.goals[i].name + ' tersimpan — saldo dompet berkurang sebesar itu dan tercatat di Transaksi.';
      }
    }
    AK.saveState(state);
    renderAll();
  }

  // ---------- Laporan ----------
  function renderReport() {
    var t = AK.totals(state);
    var spent = AK.spentByCategory(state);
    el('report-income').textContent = AK.fmtRp(t.income);
    el('report-expense').textContent = AK.fmtRp(t.expense);
    el('report-balance').textContent = AK.fmtRp(t.balance);
    el('report-savings').textContent = AK.fmtRp(t.income - t.expense) + ' (' + t.savingsRate + '%)';
    var biggest = state.budgets.map(function (b) { return { category: b.category, amount: spent[b.category] || 0 }; })
      .sort(function (a, b) { return b.amount - a.amount; })[0];
    el('report-biggest').textContent = biggest.category + ' — ' + AK.fmtRp(biggest.amount) + ' (' + pct(biggest.amount, t.expense) + '% dari pengeluaran)';

    // Grafik batang 6 bulan: pemasukan (madu) vs pengeluaran (biru laut).
    var months = state.history.concat([{ month: 'Nov 2026', income: t.income, expense: t.expense }]);
    var maxVal = 0;
    months.forEach(function (m) { if (m.income > maxVal) { maxVal = m.income; } if (m.expense > maxVal) { maxVal = m.expense; } });
    el('chart').innerHTML = months.map(function (m) {
      var ih = Math.round(m.income / maxVal * 100);
      var eh = Math.round(m.expense / maxVal * 100);
      return '<div class="chart-col"><div class="chart-bars">' +
        '<span class="bar-in" style="height:' + ih + '%" title="Pemasukan ' + AK.fmtRp(m.income) + '"></span>' +
        '<span class="bar-out" style="height:' + eh + '%" title="Pengeluaran ' + AK.fmtRp(m.expense) + '"></span></div>' +
        '<small>' + m.month + '</small><small class="chart-val">' + AK.fmtRp(m.expense) + '</small></div>';
    }).join('');
    var avgExpense = 0;
    months.forEach(function (m) { avgExpense += m.expense; });
    avgExpense = Math.round(avgExpense / months.length);
    el('report-avg').textContent = 'Rata-rata pengeluaran 6 bulan terakhir: ' + AK.fmtRp(avgExpense) + ' per bulan. November ini ' +
      (t.expense <= avgExpense ? 'di bawah rata-rata — bagus!' : 'di atas rata-rata — lihat tips di bawah.');

    // 3 tips hemat dari 3 kategori dengan pemakaian anggaran tertinggi.
    var ranked = state.budgets.map(function (b) {
      return { category: b.category, p: pct(spent[b.category] || 0, b.limit), spent: spent[b.category] || 0, limit: b.limit };
    }).sort(function (a, b) { return b.p - a.p; }).slice(0, 3);
    var tips = {
      'Makan & Jajan': 'Masak di rumah 3 kali seminggu ganti makan di luar — sekali makan di luar keluarga sekitar Rp165.000, masak sendiri sekitar Rp60.000.',
      'Sekolah Anak': 'Beli buku dan alat tulis sekaligus di awal semester di toko grosir — biasanya lebih murah 15–20% daripada beli satuan.',
      'Listrik & Air': 'Matikan lampu dan AC saat ruangan kosong dan cuci baju sekaligus 2–3 hari sekali — tagihan token bisa turun sekitar Rp50.000 sebulan.',
      'Belanja Pasar': 'Buat daftar belanja sebelum ke pasar dan belanja seminggu sekali — belanja tanpa daftar mudah kelebihan sekitar Rp100.000.',
      'Transport': 'Servis motor rutin tiap 3 bulan mencegah kerusakan besar — sekali servis Rp180.000 jauh lebih murah daripada turun mesin.',
      'Kesehatan': 'Siapkan kotak P3K dan vitamin di rumah — berobat ringan yang tertangani cepat menghemat biaya klinik.',
      'Hiburan': 'Ganti satu kali bioskop sebulan dengan malam film di rumah — hemat sekitar Rp150.000 tanpa mengurangi serunya.',
      'Lainnya': 'Cek langganan yang jarang dipakai tiap awal bulan — satu langganan tak terpakai Rp54.000 sebulan jadi Rp648.000 setahun.'
    };
    el('tips').innerHTML = ranked.map(function (r, idx) {
      return '<li><strong>Tip ' + (idx + 1) + ' — ' + esc(r.category) + ' (' + r.p + '% dari anggaran ' + AK.fmtRp(r.limit) + ')</strong><p>' + (tips[r.category] || 'Tahan pengeluaran kategori ini sampai akhir bulan.') + '</p></li>';
    }).join('');
  }

  // ---------- Router & wiring ----------
  var PAGES = ['dashboard', 'transaksi', 'anggaran', 'tagihan', 'tabungan', 'laporan'];

  function renderAll() {
    renderDashboard();
    renderTransactions();
    renderBudgets();
    renderBills();
    renderGoals();
    renderReport();
  }

  function showPage() {
    var hash = (window.location.hash || '#/dashboard').replace('#/', '');
    if (PAGES.indexOf(hash) === -1) { hash = 'dashboard'; }
    PAGES.forEach(function (p) {
      var sec = el('page-' + p);
      if (sec) { sec.hidden = (p !== hash); }
    });
    var links = document.querySelectorAll('.nav a');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href') || '';
      if (href === '#/' + hash) { links[i].setAttribute('aria-current', 'page'); }
      else { links[i].removeAttribute('aria-current'); }
    }
    document.title = 'Anggaran Kita — ' + hash.charAt(0).toUpperCase() + hash.slice(1);
    window.scrollTo(0, 0);
  }

  function bind() {
    window.addEventListener('hashchange', showPage);
    el('tx-form').addEventListener('submit', submitTransaction);
    el('tx-type').addEventListener('change', renderTransactions);
    el('filter-category').addEventListener('change', renderTransactions);
    el('filter-search').addEventListener('input', renderTransactions);
    el('reset-data').addEventListener('click', function () {
      state = AK.resetState();
      editingId = null;
      AK.saveState(state);
      renderAll();
      el('tx-msg').textContent = 'Data dikembalikan ke contoh awal November 2026.';
    });

    document.addEventListener('click', function (ev) {
      var btn = ev.target.closest('button');
      if (!btn) { return; }
      var editId = btn.getAttribute('data-edit');
      var delId = btn.getAttribute('data-del');
      var billId = btn.getAttribute('data-bill');
      var saveBudget = btn.getAttribute('data-save-budget');
      var depositId = btn.getAttribute('data-add-deposit');
      if (editId) {
        var tx = null;
        for (var i = 0; i < state.transactions.length; i++) { if (state.transactions[i].id === parseInt(editId, 10)) { tx = state.transactions[i]; } }
        if (tx) {
          editingId = tx.id;
          el('tx-desc').value = tx.desc;
          el('tx-amount').value = tx.amount;
          el('tx-date').value = tx.date;
          el('tx-type').value = tx.type;
          renderTransactions();
          el('tx-desc').focus();
          window.scrollTo(0, 0);
        }
      } else if (delId) {
        var id = parseInt(delId, 10);
        state.transactions = state.transactions.filter(function (t) { return t.id !== id; });
        if (editingId === id) { editingId = null; }
        AK.saveState(state);
        el('tx-msg').textContent = 'Transaksi dihapus — saldo dan anggaran ikut diperbarui.';
        renderAll();
      } else if (billId) {
        toggleBill(parseInt(billId, 10));
      } else if (saveBudget) {
        var input = document.querySelector('[data-budget="' + saveBudget.replace(/"/g, '') + '"]');
        var val = Math.round(parseFloat(input.value));
        if (val >= 0) {
          for (var j = 0; j < state.budgets.length; j++) {
            if (state.budgets[j].category === saveBudget) { state.budgets[j].limit = val; }
          }
          AK.saveState(state);
          renderAll();
          el('budget-summary').textContent += ' — Anggaran ' + saveBudget + ' diubah menjadi ' + AK.fmtRp(val) + '.';
        }
      } else if (depositId) {
        addDeposit(parseInt(depositId, 10));
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    el('tx-date').value = '2026-11-27';
    bind();
    renderAll();
    showPage();
  });
})();
