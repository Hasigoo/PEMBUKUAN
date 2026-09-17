// ======================================
// BUKU KAS - VERSI LENGKAP & DIPERBAIKI
// ======================================

const KUNCI_STORAGE = {
    produksi: 'bukukas_produksi_v2',
    keuangan: 'bukukas_keuangan_v2'
};

let dataProduksi = [];
let dataKeuangan = [];
let modeAdmin = false;
let grafikProduksiObj = null;
let grafikKeuanganObj = null;

// ======================================
// FUNGSI DASAR
// ======================================

function bersihkanTeks(str) {
    const temp = document.createElement('div');
    temp.textContent = str || '';
    return temp.innerHTML;
}

function formatAngka(angka, desimal = 2) {
    return parseFloat(angka || 0).toFixed(desimal);
}

function formatRupiah(angka) {
    const num = parseInt(angka) || 0;
    return 'Rp ' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatTanggal(tgl) {
    if (!tgl) return '-';
    try {
        return new Date(tgl + 'T00:00:00').toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    } catch {
        return tgl;
    }
}

// ======================================
// SIMPAN & MUAT DATA
// ======================================

function simpanData() {
    try {
        localStorage.setItem(KUNCI_STORAGE.produksi, JSON.stringify(dataProduksi));
        localStorage.setItem(KUNCI_STORAGE.keuangan, JSON.stringify(dataKeuangan));
        return true;
    } catch (e) {
        alert('⚠️ Penyimpanan penuh! Hapus beberapa data lama.');
        return false;
    }
}

function muatData() {
    try {
        const p = localStorage.getItem(KUNCI_STORAGE.produksi);
        const k = localStorage.getItem(KUNCI_STORAGE.keuangan);
        dataProduksi = p ? JSON.parse(p) : [];
        dataKeuangan = k ? JSON.parse(k) : [];
    } catch (e) {
        dataProduksi = [];
        dataKeuangan = [];
        simpanData();
    }
}

// ======================================
// LOGIN & KELUAR
// ======================================

function masukAdmin() {
    modeAdmin = true;
    tampilkanHalamanUtama();
    bukaTab('beranda');
}

function masukViewer() {
    modeAdmin = false;
    tampilkanHalamanUtama();
    bukaTab('beranda');
}

function keluar() {
    document.getElementById('halamanLogin').style.display = 'flex';
    document.getElementById('halamanUtama').style.display = 'none';
}

function tampilkanHalamanUtama() {
    document.getElementById('halamanLogin').style.display = 'none';
    document.getElementById('halamanUtama').style.display = 'block';
    
    if (modeAdmin) {
        document.getElementById('statusMode').textContent = 'Mode Admin';
        document.getElementById('statusMode').style.background = '#28a745';
        document.getElementById('formProduksiWrapper').style.display = 'block';
        document.getElementById('formKeuanganWrapper').style.display = 'block';
        document.getElementById('kolomAksiProduksi').style.display = '';
        document.getElementById('kolomAksiKeuangan').style.display = '';
        document.getElementById('peringatanLihat').style.display = 'none';
        document.getElementById('btnHapusSemua').style.display = 'inline-block';
    } else {
        document.getElementById('statusMode').textContent = 'Lihat Saja';
        document.getElementById('statusMode').style.background = '#ffc107';
        document.getElementById('formProduksiWrapper').style.display = 'none';
        document.getElementById('formKeuanganWrapper').style.display = 'none';
        document.getElementById('kolomAksiProduksi').style.display = 'none';
        document.getElementById('kolomAksiKeuangan').style.display = 'none';
        document.getElementById('peringatanLihat').style.display = 'block';
        document.getElementById('btnHapusSemua').style.display = 'none';
    }
    renderSemua();
    if (!grafikProduksiObj) inisialisasiGrafik();
}

function salinLink() {
    const el = document.getElementById('linkBagikan');
    if (el) {
        el.value = window.location.href;
        el.select();
        try {
            document.execCommand('copy');
            alert('✅ Link disalin! Bagikan ke orang lain');
        } catch (e) {
            alert('⚠️ Salin manual dari alamat browser');
        }
    }
}

// ======================================
// BUKA TAB / MENU
// ======================================

function bukaTab(namaTab, event) {
    // Sembunyikan semua konten
    document.querySelectorAll('.konten').forEach(el => el.classList.remove('aktif'));
    // Tampilkan yang dipilih
    const target = document.getElementById('tab' + namaTab.charAt(0).toUpperCase() + namaTab.slice(1));
    if (target) target.classList.add('aktif');
    // Ubah menu aktif
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    else document.querySelector(.nav-link[onclick*="${namaTab}"])?.classList.add('active');
}

// ======================================
// PRODUKSI - TAMBAH & HAPUS
// ======================================

document.addEventListener('submit', function(e) {
    if (e.target.id === 'formProduksi') {
        e.preventDefault();
        simpanProduksi();
    }
    if (e.target.id === 'formKeuangan') {
        e.preventDefault();
        simpanTransaksi();
    }
});

function simpanProduksi() {
    const data = {
        id: Date.now(),
        tanggal: document.getElementById('tglProduksi').value,
        namaBarang: bersihkanTeks(document.getElementById('nmBarang').value.trim()),
        jmlProduksi: parseFloat(document.getElementById('jmlHasil').value) || 0,
        jmlTerjual: parseFloat(document.getElementById('jmlJual').value) || 0,
        keterangan: bersihkanTeks(document.getElementById('ketProduksi').value.trim())
    };

    // Validasi
    let error = [];
    if (!data.tanggal) error.push('Tanggal wajib diisi');
    if (!data.namaBarang) error.push('Nama barang wajib diisi');
    if (data.jmlProduksi < 0) error.push('Jumlah tidak boleh negatif');
    if (data.jmlTerjual > data.jmlProduksi) error.push('Terjual tidak boleh lebih dari produksi');
    
    if (error.length > 0) {
        alert('⚠️ ' + error.join('\n'));
        return;
    }

    dataProduksi.unshift(data);
    if (simpanData()) {
        renderSemua();
        inisialisasiGrafik();
        alert('✅ Data produksi disimpan!');
        document.getElementById('formProduksi').reset();
        document.getElementById('tglProduksi').value = new Date().toISOString().split('T')[0];
    }
}

function hapusProduksi(id) {
    if (!confirm('⚠️ Yakin hapus data ini?')) return;
    dataProduksi = dataProduksi.filter(i => i.id !== id);
    simpanData();
    renderSemua();
    inisialisasiGrafik();
}

// ======================================
// KEUANGAN - TAMBAH & HAPUS
// ======================================

function simpanTransaksi() {
    const data = {
        id: Date.now(),
        tanggal: document.getElementById('tglTransaksi').value,
        jenis: document.getElementById('jenisTransaksi').value,
        kategori: bersihkanTeks(document.getElementById('kategoriTransaksi').value.trim()),
        jumlah: parseInt(document.getElementById('nilaiTransaksi').value) || 0,
        keterangan: bersihkanTeks(document.getElementById('ketTransaksi').value.trim())
    };

    let error = [];
    if (!data.tanggal) error.push('Tanggal wajib diisi');
    if (!data.kategori) error.push('Kategori wajib diisi');
    if (data.jumlah <= 0) error.push('Jumlah harus lebih dari nol');
    
    if (error.length > 0) {
        alert('⚠️ ' + error.join('\n'));
        return;
    }

    dataKeuangan.unshift(data);
    if (simpanData()) {
        renderSemua();
        inisialisasiGrafik();
        alert('✅ Transaksi disimpan!');
        document.getElementById('formKeuangan').reset();
        document.getElementById('tglTransaksi').value = new Date().toISOString().split('T')[0];
    }
}

function hapusTransaksi(id) {
    if (!confirm('⚠️ Yakin hapus transaksi ini?')) return;
    dataKeuangan = dataKeuangan.filter(i => i.id !== id);
    simpanData();
    renderSemua();
    inisialisasiGrafik();
}

function hapusSemuaData() {
    if (!confirm('⚠️ YAKIN HAPUS SEMUA DATA?')) return;
    if (!confirm('🚨 TEKAN OK JIKA ANDA SANGAT YAKIN!')) return;
    dataProduksi = [];
    dataKeuangan = [];
    simpanData();
    renderSemua();
    inisialisasiGrafik();
    alert('✅ Semua data telah dihapus!');
}

// ======================================
// FILTER DATA
// ======================================

function terapkanFilter() { renderSemua(); }
function resetFilter() {
    document.getElementById('tglAwal').value = '';
    document.getElementById('tglAkhir').value = '';
    document.getElementById('pilihJenis').value = 'semua';
    document.getElementById('pilihKategori').value = 'semua';
    renderSemua();
}

function ambilDataTerfilter() {
    const tAwal = document.getElementById('tglAwal')?.value;
    const tAkhir = document.getElementById('tglAkhir')?.value;
    const jenis = document.getElementById('pilihJenis')?.value || 'semua';
    const kat = document.getElementById('pilihKategori')?.value || 'semua';
    
    let p = [...dataProduksi], k = [...dataKeuangan];
    if (tAwal) { p = p.filter(i => i.tanggal >= tAwal); k = k.filter(i => i.tanggal >= tAwal); }
    if (tAkhir) { p = p.filter(i => i.tanggal <= tAkhir); k = k.filter(i => i.tanggal <= tAkhir); }
    if (kat !== 'semua') { p = p.filter(i => i.namaBarang === kat); k = k.filter(i => i.kategori === kat); }
    if (jenis === 'produksi') k = [];
    if (jenis === 'keuangan') p = [];
    return { produksi: p, keuangan: k };
}

function updateFilterKategori() {
    const sel = document.getElementById('pilihKategori');
    if (!sel) return;
    const setKat = new Set();
    dataProduksi.forEach(i => setKat.add(i.namaBarang));
    dataKeuangan.forEach(i => setKat.add(i.kategori));
    const val = sel.value;
    sel.innerHTML = '<option value="semua">Semua Kategori</option>';
    [...setKat].sort().forEach(k => sel.innerHTML += <option value="${bersihkanTeks(k)}">${bersihkanTeks(k)}</option>);
    sel.value = val;
}

// ======================================
// TAMPILKAN DATA KE TABEL
// ======================================

function tampilkanTabelProduksi(data, idTabel, adaAksi) {
    const tb = document.getElementById(idTabel);
    const jml = document.getElementById('jumDataProduksi');
    if (jml && idTabel === 'daftarProduksi') jml.textContent = (${data.length} data);
    
    if (!data || data.length === 0) {
        tb.innerHTML = '<tr><td colspan="7" class="kosong">Belum ada data produksi 👆</td></tr>';
        return;
    }
    tb.innerHTML = '';
    data.forEach((item, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${formatTanggal(item.tanggal)}</td>
            <td>${bersihkanTeks(item.namaBarang)}</td>
            <td>${formatAngka(item.jmlProduksi)} Kg</td>
            <td>${formatAngka(item.jmlTerjual)} Kg</td>
            <td>${bersihkanTeks(item.keterangan) || '-'}</td>
            ${adaAksi && modeAdmin ? <td><button class="btn-hapus" onclick="hapusProduksi(${item.id})">🗑️</button></td> : ''}
        `;
        tb.appendChild(tr);
    });
}

function tampilkanTabelKeuangan(data, idTabel, adaAksi) {
    const tb = document.getElementById(idTabel);
    const jml = document.getElementById('jumDataKeuangan');
    if (jml && idTabel === 'daftarTransaksi') jml.textContent = (${data.length} transaksi);
    
    if (!data || data.length === 0) {
        tb.innerHTML = '<tr><td colspan="7" class="kosong">Belum ada transaksi keuangan 👆</td></tr>';
        return;
    }
    tb.innerHTML = '';
    data.forEach((item, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${formatTanggal(item.tanggal)}</td>
            <td>${bersihkanTeks(item.kategori)}</td>
            <td>${bersihkanTeks(item.keterangan) || '-'}</td>
            <td>${item.jenis === 'masuk' ? '✅ Masuk' : '💸 Keluar'}</td>
            <td style="color:${item.jenis === 'masuk' ? '#28a745' : '#dc3545'};font-weight:600">
                ${item.jenis === 'masuk' ? '+' : '-'}${formatRupiah(item.jumlah)}
            </td>
            ${adaAksi && modeAdmin ? <td><button class="btn-hapus" onclick="hapusTransaksi(${item.id})">🗑️</button></td> : ''}
        `;
        tb.appendChild(tr);
    });
}

function hitungRingkasan() {
    const tP = dataProduksi.reduce((s, i) => s + (i.jmlProduksi || 0), 0);
    const tT = dataProduksi.reduce((s, i) => s + (i.jmlTerjual || 0), 0);
    const tM = dataKeuangan.filter(i => i.jenis === 'masuk').reduce((s, i) => s + (i.jumlah || 0), 0);
    const tK = dataKeuangan.filter(i => i.jenis === 'keluar').reduce((s, i) => s + (i.jumlah || 0), 0);
    
    document.getElementById('jmlProduksi').textContent = formatAngka(tP) + ' Kg';
    document.getElementById('jmlTerjual').textContent = formatAngka(tT) + ' Kg';
    document.getElementById('sisaStok').textContent = formatAngka(tP - tT) + ' Kg';
    document.getElementById('totalMasuk').textContent = formatRupiah(tM);
    document.getElementById('totalKeluar').textContent = formatRupiah(tK);
    document.getElementById('saldoAkhir').textContent = formatRupiah(tM - tK);
}

function renderSemua() {
    const { produksi: p, keuangan: k } = ambilDataTerfilter();
    tampilkanTabelProduksi(dataProduksi, 'daftarProduksi', true);
    tampilkanTabelKeuangan(dataKeuangan, 'daftarTransaksi', true);
    tampilkanTabelProduksi(p, 'laporanProduksi', false);
    tampilkanTabelKeuangan(k, 'laporanKeuangan', false);
    hitungRingkasan();
    updateFilterKategori();
}

// ======================================
// GRAFIK
// ======================================

function ambilKunciTanggal(tgl, periode) {
    const d = new Date(tgl + 'T00:00:00');
    if (periode === 'hari') return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
    if (periode === 'minggu') return Minggu ${Math.ceil((d.getDate() + 6 - d.getDay()) / 7)};
    if (periode === 'bulan') return d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
    return tgl;
}

function siapkanDataGrafik(periode) {
    const kelompok = {};
    dataProduksi.forEach(i => {
        const k = ambilKunciTanggal(i.tanggal, periode);
        if (!kelompok[k]) kelompok[k] = { p: 0, t: 0, m: 0, k: 0 };
        kelompok[k].p += i.jmlProduksi || 0;
        kelompok[k].t += i.jmlTerjual || 0;
    });
    dataKeuangan.forEach(i => {
        const k = ambilKunciTanggal(i.tanggal, periode);
        if (!kelompok[k]) kelompok[k] = { p: 0, t: 0, m: 0, k: 0 };
        if (i.jenis === 'masuk') kelompok[k].m += i.jumlah || 0;
        else kelompok[k].k += i.jumlah || 0;
    });
    const urut = Object.keys(kelompok).sort().slice(-7);
    return {
        labels: urut,
        produksi: urut.map(k => formatAngka(kelompok[k].p)),
        terjual: urut.map(k => formatAngka(kelompok[k].t)),
        masuk: urut.map(k => kelompok[k].m),
        keluar: urut.map(k => kelompok[k].k)
    };
}

function inisialisasiGrafik() {
    const c1 = document.getElementById('grafikProduksi');
    const c2 = document.getElementById('grafikKeuangan');
    if (!c1 || !c2 || typeof Chart === 'undefined') return;
    const ctx1 = c1.getContext('2d');
    const ctx2 = c2.getContext('2d');
    
    if (grafikProduksiObj) grafikProduksiObj.destroy();
    if (grafikKeuanganObj) grafikKeuanganObj.destroy();
    
    const d = siapkanDataGrafik('hari');
    grafikProduksiObj = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: d.labels,
            datasets: [
                { label: 'Produksi (Kg)', data: d.produksi, backgroundColor: '#007bff' },
                { label: 'Terjual (Kg)', data: d.terjual, backgroundColor: '#28a745' }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
    grafikKeuanganObj = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: d.labels,
            datasets: [
                { label: 'Pemasukan', data: d.masuk, backgroundColor: '#28a745' },
                { label: 'Pengeluaran', data: d.keluar, backgroundColor: '#dc3545' }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function ubahGrafik(p) {
    if (!grafikProduksiObj || !grafikKeuanganObj) return;
    const d = siapkanDataGrafik(p);
    grafikProduksiObj.data.labels = d.labels;
    grafikProduksiObj.data.datasets[0].data = d.produksi;
    grafikProduksiObj.data.datasets[1].data = d.terjual;
    grafikProduksiObj.update();
    
    grafikKeuanganObj.data.labels = d.labels;
    grafikKeuanganObj.data.datasets[0].data = d.masuk;
    grafikKeuanganObj.data.datasets[1].data = d.keluar;
    grafikKeuanganObj.update();
}

// ======================================
// EKSPOR KE EXCEL
// ======================================

function unduhExcel() {
    if (dataProduksi.length === 0 && dataKeuangan.length === 0) {
        alert('⚠️ Belum ada data untuk diekspor!');
        return;
    }
    if (typeof XLSX === 'undefined') {
        alert('⚠️ Tunggu sebentar lalu coba lagi');
        return;
    }
    try {
        let ws1 = [['PRODUKSI HARIAN'], ['No', 'Tanggal', 'Nama Barang', 'Produksi (Kg)', 'Terjual (Kg)', 'Keterangan']];
        dataProduksi.forEach((d, i) => ws1.push([i + 1, formatTanggal(d.tanggal), d.namaBarang, d.jmlProduksi, d.jmlTerjual, d.keterangan]));
        
        let ws2 = [['TRANSAKSI KEUANGAN'], ['No', 'Tanggal', 'Kategori', 'Keterangan', 'Jenis', 'Jumlah (Rp)']];
        dataKeuangan.forEach((d, i) => ws2.push([i + 1, formatTanggal(d.tanggal), d.kategori, d.keterangan, d.jenis === 'masuk' ? 'Pemasukan' : 'Pengeluaran', d.jumlah]));
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ws1), 'Produksi');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ws2), 'Keuangan');
        XLSX.writeFile(wb, 'BUKU_KAS_' + new Date().toISOString().slice(0,
