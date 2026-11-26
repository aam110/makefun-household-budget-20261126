// Anggaran Kita — data awal & state (satu sumber data untuk semua halaman).
// Semua angka di situs dihitung dari objek STATE di bawah ini, jadi total
// pengeluaran di Dashboard selalu sama dengan jumlah transaksi, dan sisa
// anggaran selalu anggaran dikurangi realisasi. Disimpan di localStorage.
(function () {
  'use strict';

  var SEED = {
    family: 'Keluarga Budi & Sari',
    city: 'Jakarta',
    monthLabel: 'November 2026',
    openingBalance: 2400000,
    budgets: [
      { category: 'Belanja Pasar', limit: 1800000 },
      { category: 'Makan & Jajan', limit: 600000 },
      { category: 'Transport', limit: 700000 },
      { category: 'Listrik & Air', limit: 650000 },
      { category: 'Sekolah Anak', limit: 1100000 },
      { category: 'Hiburan', limit: 400000 },
      { category: 'Kesehatan', limit: 500000 },
      { category: 'Lainnya', limit: 400000 }
    ],
    transactions: [
      { id: 1, date: '2026-11-01', desc: 'Gaji bulanan — Budi', category: 'Gaji', type: 'income', amount: 8500000 },
      { id: 2, date: '2026-11-14', desc: 'Freelance desain — Sari', category: 'Freelance', type: 'income', amount: 1200000 },
      { id: 3, date: '2026-11-20', desc: 'Jualan online — barang preloved', category: 'Jualan', type: 'income', amount: 650000 },
      { id: 4, date: '2026-11-01', desc: 'Pasar Minggu — sayur & buah', category: 'Belanja Pasar', type: 'expense', amount: 185000 },
      { id: 5, date: '2026-11-04', desc: 'Pasar — ayam & ikan', category: 'Belanja Pasar', type: 'expense', amount: 240000 },
      { id: 6, date: '2026-11-08', desc: 'Supermarket — beras 10 kg', category: 'Belanja Pasar', type: 'expense', amount: 145000 },
      { id: 7, date: '2026-11-15', desc: 'Supermarket — minyak, telur, susu', category: 'Belanja Pasar', type: 'expense', amount: 265000 },
      { id: 8, date: '2026-11-03', desc: 'Warung makan keluarga', category: 'Makan & Jajan', type: 'expense', amount: 85000 },
      { id: 9, date: '2026-11-12', desc: 'Makan di luar — ayam geprek', category: 'Makan & Jajan', type: 'expense', amount: 180000 },
      { id: 10, date: '2026-11-16', desc: 'Bakso keluarga', category: 'Makan & Jajan', type: 'expense', amount: 95000 },
      { id: 11, date: '2026-11-26', desc: 'Makan di luar — soto & es teh', category: 'Makan & Jajan', type: 'expense', amount: 165000 },
      { id: 12, date: '2026-11-02', desc: 'Bensin motor', category: 'Transport', type: 'expense', amount: 50000 },
      { id: 13, date: '2026-11-06', desc: 'Bensin motor', category: 'Transport', type: 'expense', amount: 50000 },
      { id: 14, date: '2026-11-09', desc: 'Servis motor bulanan', category: 'Transport', type: 'expense', amount: 180000 },
      { id: 15, date: '2026-11-14', desc: 'Bensin motor', category: 'Transport', type: 'expense', amount: 55000 },
      { id: 16, date: '2026-11-23', desc: 'Bensin motor', category: 'Transport', type: 'expense', amount: 50000 },
      { id: 17, date: '2026-11-05', desc: 'Token listrik', category: 'Listrik & Air', type: 'expense', amount: 200000 },
      { id: 18, date: '2026-11-13', desc: 'Air PDAM', category: 'Listrik & Air', type: 'expense', amount: 185000 },
      { id: 19, date: '2026-11-21', desc: 'Token listrik', category: 'Listrik & Air', type: 'expense', amount: 150000 },
      { id: 20, date: '2026-11-07', desc: 'SPP sekolah anak', category: 'Sekolah Anak', type: 'expense', amount: 750000 },
      { id: 21, date: '2026-11-17', desc: 'Les matematika anak', category: 'Sekolah Anak', type: 'expense', amount: 200000 },
      { id: 22, date: '2026-11-08', desc: 'Langganan streaming', category: 'Hiburan', type: 'expense', amount: 54000 },
      { id: 23, date: '2026-11-15', desc: 'Bioskop keluarga', category: 'Hiburan', type: 'expense', amount: 150000 },
      { id: 24, date: '2026-11-10', desc: 'Obat & vitamin', category: 'Kesehatan', type: 'expense', amount: 120000 },
      { id: 25, date: '2026-11-18', desc: 'Periksa gigi anak', category: 'Kesehatan', type: 'expense', amount: 250000 },
      { id: 26, date: '2026-11-06', desc: 'Pulsa & paket data', category: 'Lainnya', type: 'expense', amount: 100000 },
      { id: 27, date: '2026-11-14', desc: 'Sabun & kebutuhan rumah', category: 'Lainnya', type: 'expense', amount: 85000 },
      { id: 28, date: '2026-11-22', desc: 'Peralatan dapur', category: 'Lainnya', type: 'expense', amount: 120000 }
    ],
    bills: [
      { id: 1, name: 'Internet IndiHome', amount: 350000, due: 10, paid: false, category: 'Lainnya', paidTxId: null },
      { id: 2, name: 'Air PDAM', amount: 185000, due: 15, paid: true, category: 'Listrik & Air', paidTxId: null },
      { id: 3, name: 'SPP Sekolah Anak', amount: 750000, due: 7, paid: true, category: 'Sekolah Anak', paidTxId: null },
      { id: 4, name: 'BPJS Kesehatan', amount: 210000, due: 5, paid: true, category: 'Kesehatan', paidTxId: null },
      { id: 5, name: 'Listrik PLN', amount: 420000, due: 20, paid: false, category: 'Listrik & Air', paidTxId: null },
      { id: 6, name: 'Langganan Streaming', amount: 54000, due: 8, paid: true, category: 'Hiburan', paidTxId: null },
      { id: 7, name: 'Arisan RT', amount: 500000, due: 28, paid: false, category: 'Lainnya', paidTxId: null },
      { id: 8, name: 'Cicilan Motor', amount: 850000, due: 25, paid: false, category: 'Lainnya', paidTxId: null }
    ],
    goals: [
      { id: 1, name: 'Dana Darurat', target: 10000000, saved: 6250000, note: 'Untuk keadaan tak terduga — target 6 bulan pengeluaran pokok.' },
      { id: 2, name: 'Liburan Keluarga', target: 5000000, saved: 2150000, note: 'Liburan ke Yogyakarta saat libur sekolah Desember.' },
      { id: 3, name: 'DP Motor Baru', target: 12000000, saved: 3800000, note: 'Ganti motor lama yang sudah sering servis.' }
    ],
    // Riwayat 5 bulan sebelumnya (tetap); November dihitung dari transaksi.
    history: [
      { month: 'Jun 2026', income: 9800000, expense: 4120000 },
      { month: 'Jul 2026', income: 10100000, expense: 4580000 },
      { month: 'Agu 2026', income: 10350000, expense: 4310000 },
      { month: 'Sep 2026', income: 10200000, expense: 4760000 },
      { month: 'Okt 2026', income: 10350000, expense: 4520000 }
    ]
  };

  var KEY = 'anggarankita-v1';

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function loadState() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.transactions && parsed.budgets && parsed.bills && parsed.goals) {
          return parsed;
        }
      }
    } catch (e) { /* localStorage tidak tersedia: pakai data awal */ }
    return clone(SEED);
  }

  function saveState(state) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) { /* abaikan: situs tetap jalan untuk sesi ini */ }
  }

  function resetState() {
    try { window.localStorage.removeItem(KEY); } catch (e) { /* abaikan */ }
    return clone(SEED);
  }

  // ---- Hitungan turunan: SATU sumber kebenaran untuk semua halaman ----
  function sumBy(list, type) {
    var total = 0;
    for (var i = 0; i < list.length; i++) {
      if (list[i].type === type) { total += list[i].amount; }
    }
    return total;
  }

  function totals(state) {
    var income = sumBy(state.transactions, 'income');
    var expense = sumBy(state.transactions, 'expense');
    var budgetTotal = 0;
    for (var i = 0; i < state.budgets.length; i++) { budgetTotal += state.budgets[i].limit; }
    return {
      income: income,
      expense: expense,
      balance: state.openingBalance + income - expense,
      budgetTotal: budgetTotal,
      budgetLeft: budgetTotal - expense,
      savingsRate: income > 0 ? Math.round((income - expense) / income * 100) : 0
    };
  }

  function spentByCategory(state) {
    var map = {};
    for (var i = 0; i < state.budgets.length; i++) { map[state.budgets[i].category] = 0; }
    for (var j = 0; j < state.transactions.length; j++) {
      var t = state.transactions[j];
      if (t.type === 'expense' && Object.prototype.hasOwnProperty.call(map, t.category)) {
        map[t.category] += t.amount;
      }
    }
    return map;
  }

  function fmtRp(n) {
    return 'Rp' + n.toLocaleString('id-ID');
  }

  function fmtDate(iso) {
    var parts = iso.split('-');
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return parseInt(parts[2], 10) + ' ' + months[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
  }

  window.AnggaranKita = {
    SEED: SEED,
    loadState: loadState,
    saveState: saveState,
    resetState: resetState,
    totals: totals,
    spentByCategory: spentByCategory,
    fmtRp: fmtRp,
    fmtDate: fmtDate,
    storageKey: KEY
  };
})();
