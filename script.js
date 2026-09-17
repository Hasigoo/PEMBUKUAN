(() => {
    'use strict';

    const STORAGE_KEYS = {
        produksi: 'bukukas_produksi_v1',
        keuangan: 'bukukas_keuangan_v1'
    };

    let dataProduksi = [];
    let dataKeuangan = [];
    let isAdminMode = false;
    let chartProduksi = null;
    let chartKeuangan = null;

    const sanitizeHTML = (str) => {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    };

    const formatAngka = (num, decimals = 2) => {
        return parseFloat(num || 0).toFixed(decimals);
    };

    const validasiInputProduksi = (data) => {
        const errors = [];
        if (!data.tanggal) errors.push('Tanggal wajib diisi');
        if (!data.namaBarang || data.namaBarang.trim().length === 0) errors.push('Nama barang wajib diisi');
        if (data.namaBarang && data.namaBarang.length > 50) errors.push('Nama barang maksimal 50 karakter');
        if (isNaN(data.jmlProduksi) || data.jmlProduksi < 0) errors.push('Jumlah produksi harus positif');
        if (isNaN(data.jmlTerjual) || data.jmlTerjual < 0) errors.push('Jumlah terjual tidak boleh negatif');
        if (data.jmlTerjual > data.jmlProduksi) errors.push('Jumlah terjual tidak boleh lebih besar dari produksi');
        return errors;
    };

    const validasiInputKeuangan = (data) => {
        const errors = [];
        if (!data.tanggal) errors.push('Tanggal wajib diisi');
        if (!data.kategori || data.kategori.trim().length === 0) errors.push('Kategori wajib diisi');
        if (data.kategori && data.kategori.length > 50) errors.push('Kategori maksimal 50 karakter');
        if (!data.jenis || !['masuk', 'keluar'].includes(data.jenis)) errors.push('Jenis tidak valid');
        if (isNaN(data.jumlah) || data.jumlah <= 0) errors.push('Jumlah harus lebih dari nol');
        return errors;
    };

    const muatData = () => {
        try {
            const p = localStorage.getItem(STORAGE_KEYS.produksi);
            const k = localStorage.getItem(STORAGE_KEYS.keuangan);
            dataProduksi = p ? JSON.parse(p) : [];
            dataKeuangan = k ? JSON.parse(k) : [];
        } catch (e) {
            console.error('❌ Gagal memuat data:', e);
            dataProduksi = [];
            dataKeuangan = [];
            simpanKeLocal();
        }
    };

    const simpanKeLocal = () => {
        try {
            localStorage.setItem(STORAGE_KEYS.produksi, JSON.stringify(dataProduksi));
            localStorage.setItem(STORAGE_KEYS.keuangan, JSON.stringify(dataKeuangan));
            return true;
        } catch (e) {
            console.error('❌ Gagal menyimpan data:', e);
            alert('⚠️ Penyimpanan penuh! Hapus beberapa data lama terlebih dahulu.');
            return false;
        }
    };

    window.masukSebagaiAdmin = () => {
        isAdminMode = true;
        tampilkanHalamanUtama();
        tampilkanSection('beranda');
    };

    window.masukSebagaiViewer = () => {
        isAdminMode = false;
        tampilkanHalamanUtama();
        tampilkanSection('beranda');
    };

    window.logout = () => {
        document.getElementById('halamanPilih').style.display = 'flex';
        document.getElementById('halamanUtama').style.display = 'none';
    };

    const tampilkanHalamanUtama = () => {
        document.getElementById('halamanPilih').style.display = 'none';
        document.getElementById('halamanUtama').style.display = 'block';
        
        if (isAdminMode) {
            document.getElementById('modeBadge').textContent = 'Mode Admin';
            document.getElementById('modeBadge').style.background = '#28a745';
            document.getElementById('formProduksiBox').style.display = 'block';
            document.getElementById('formKeuanganBox').style.display = 'block';
            document.getElementById('colAksiProduksi').style.display = '';
            document.getElementById('colAksiKeuangan').style.display = '';
            document.getElementById('readonlyNotice').style.display = 'none';
            document.getElementById('btnHapusSemua').style.display = 'inline-block';
        } else {
            document.getElementById('modeBadge').textContent = 'Lihat Saja';
            document.getElementById('modeBadge').style.background = '#ffc107';
            document.getElementById('formProduksiBox').style.display = 'none';
            document.getElementById('formKeuanganBox').style.display = 'none';
            document.getElementById('colAksiProduksi').style.display = 'none';
            document.getElementById('colAksiKeuangan').style.display = 'none';
            document.getElementById('readonlyNotice').style.display = 'block';
            document.getElementById('btnHapusSemua').style.display = 'none';
        }
        renderSemua();
        if (!chartProduksi) inisialisasiGrafik();
    };

    window.tampilkanSection = (nama) => {
        document.querySelectorAll('.konten-section').forEach(el => el.classList.remove('active'));
        const target = document.getElementById('bagian' + nama.charAt(0).toUpperCase() + nama.slice(1));
        if (target) target.classList.add('active');
        document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
        event.target.classList.add('active');
    };

    window.salinLink = () => {
        const el = document.getElementById('linkShare');
        if (el) {
            el.value = window.location.href;
            el.select();
            try {
                document.execCommand('copy');
                alert('✅ Link disalin! Bagikan ke orang lain untuk mode Lihat Saja');
            } catch (e) {
                alert('⚠️ Gagal menyalin. Salin manual dari alamat browser.');
            }
        }
    };

    window.simpanProduksi = (e) => {
        e.preventDefault();
        const data = {
            id: Date.now(),
            tanggal: document.getElementById('tanggalProduksi').value,
            namaBarang: sanitizeHTML(document.getElementById('namaBarang').value.trim()),
            jmlProduksi: parseFloat(document.getElementById('jmlProduksi').value) || 0,
            jmlTerjual: parseFloat(document.getElementById('jmlTerjual').value) || 0,
            keterangan: sanitizeHTML(document.getElementById('ketProduksi').value.trim())
        };

        const errors = validasiInputProduksi(data);
        if (errors.length > 0) {
            alert('⚠️ ' + errors.join('\n'));
            return;
        }

        dataProduksi.unshift(data);
        if (simpanKeLocal()) {
            renderSemua();
            inisialisasiGrafik();
            alert('✅ Data produksi disimpan!');
            e.target.reset();
            document.getElementById('tanggalProduksi').value = new Date().toISOString().split('T')[0];
        }
    };

    window.hapusProduksi = (id) => {
        if (!confirm('⚠️ Yakin hapus data ini? Tindakan ini tidak dapat dibatalkan!')) return;
        dataProduksi = dataProduksi.filter(i => i.id !== id);
        simpanKeLocal();
        renderSemua();
        inisialisasiGrafik();
    };

    window.simpanTransaksi = (e) => {
        e.preventDefault();
        const data = {
            id: Date.now(),
            tanggal: document.getElementById('tanggal').value,
            jenis: document.getElementById('jenis').value,
            kategori: sanitizeHTML(document.getElementById('kategori').value.trim()),
            jumlah: parseInt(document.getElementById('jumlah').value) || 0,
            keterangan: sanitizeHTML(document.getElementById('keterangan').value.trim())
        };

        const errors = validasiInputKeuangan(data);
        if (errors.length > 0) {
            alert('⚠️ ' + errors.join('\n'));
            return;
        }

        dataKeuangan.unshift(data);
        if (simpanKeLocal()) {
            renderSemua();
            inisialisasiGrafik();
            alert('✅ Transaksi disimpan!');
            e.target.reset();
            document.getElementById('tanggal').value = new Date().toISOString().split('T')[0];
        }
    };

    window.hapusTransaksi = (id) => {
        if (!confirm('⚠️ Yakin hapus transaksi ini? Tindakan ini tidak dapat dibatalkan!')) return;
        dataKeuangan = dataKeuangan.filter(i => i.id !== id);
        simpanKeLocal();
        renderSemua();
        inisialisasiGrafik();
    };

    window.hapusSemua = () => {
        if (!confirm('⚠️ YAKIN HAPUS SEMUA DATA?\nData tidak dapat dikembalikan!')) return;
        if (!confirm('🚨 TEKAN OK JIKA ANDA SANGAT YAKIN!')) return;
        dataProduksi = [];
        dataKeuangan = [];
        simpanKeLocal();
        renderSemua();
        inisialisasiGrafik();
        alert('✅ Semua data telah dihapus!');
    };

    window.terapkanFilter = () => renderSemua();
    window.resetFilter = () => {
        document.getElementById('tglMulai').value = '';
        document.getElementById('tglAkhir').value = '';
        document.getElementById('filterJenis').value = 'semua';
        document.getElementById('filterKategori').value = 'semua';
        renderSemua();
    };

    const getDataTerfilter = () => {
        const tM = document.getElementById('tglMulai')?.value;
        const tA = document.getElementById('tglAkhir')?.value;
        const j = document.getElementById('filterJenis')?.value || 'semua';
        const k = document.getElementById('filterKategori')?.value || 'semua';
        
        let p = [...dataProduksi], kk = [...dataKeuangan];
        if (tM) { p = p.filter(i => i.tanggal >= tM); kk = kk.filter(i => i.tanggal >= tM); }
        if (tA) { p = p.filter(i => i.tanggal <= tA); kk = kk.filter(i => i.tanggal <= tA); }
        if (k !== 'semua') { p = p.filter(i => i.namaBarang === k); kk = kk.filter(i => i.kategori === k); }
        if (j === 'produksi') kk = [];
        if (j === 'keuangan') p = [];
        return { produksi: p, keuangan: kk };
    };

    const updateFilterKategori = () => {
        const sel = document.getElementById('filterKategori');
        if (!sel) return;
        const setKat = new Set();
        dataProduksi.forEach(i => setKat.add(i.namaBarang));
        dataKeuangan.forEach(i => setKat.add(i.kategori));
        const val = sel.value;
        sel.innerHTML = '<option value="semua">Semua Kategori</option>';
        [...setKat].sort().forEach(k => sel.innerHTML += <option value="${sanitizeHTML(k)}">${sanitizeHTML(k)}</option>);
        sel.value = val;
    };

    const formatRupiah = (angka) => {
        const num = parseInt(angka) || 0;
        return 'Rp ' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const formatTanggal = (tgl) => {
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
    };

    const renderTabelProduksi = (data, idTabel, tampilkanAksi) => {
        const tb = document.getElementById(idTabel);
        const jml = document.getElementById('jumlahDataProduksi');
        if (jml && idTabel === 'daftarProduksi') {
            jml.textContent = (${data.length} data);
        }
        
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
                <td>${sanitizeHTML(item.namaBarang)}</td>
                <td>${formatAngka(item.jmlProduksi)} Kg</td>
                <td>${formatAngka(item.jmlTerjual)} Kg</td>
                <td>${sanitizeHTML(item.keterangan) || '-'}</td>
                ${tampilkanAksi && isAdminMode 
                    ? <td><button class="btn-hapus" onclick="hapusProduksi(${item.id})">🗑️</button></td> 
                    : ''}
            `;
            tb.appendChild(tr);
        });
    };

    const renderTabelKeuangan = (data, idTabel, tampilkanAksi) => {
        const tb = document.getElementById(idTabel);
        const jml = document.getElementById('jumlahDataKeuangan');
        if (jml && idTabel === 'daftarTransaksi') {
            jml.textContent = (${data.length} transaksi);
        }
        
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
                <td>${sanitizeHTML(item.kategori)}</td>
                <td>${sanitizeHTML(item.keterangan) || '-'}</td>
                <td>${item.jenis === 'masuk' ? '✅ Masuk' : '💸 Keluar'}</td>
                <td style="color:${item.jenis === 'masuk' ? '#28a745' : '#dc3545'};font-weight:600">
                    ${item.jenis === 'masuk' ? '+' : '-'}${formatRupiah(item.jumlah)}
                </td>
                ${tampilkanAksi && isAdminMode 
                    ? <td><button class="btn-hapus" onclick="hapusTransaksi(${item.id})">🗑️</button></td> 
                    : ''}
            `;
            tb.appendChild(tr);
        });
    };

    const hitungRingkasan = () => {
        const tP = dataProduksi.reduce((s, i) => s + (i.jmlProduksi || 0), 0);
        const tT = dataProduksi.reduce((s, i) => s + (i.jmlTerjual || 0), 0);
        const tM = dataKeuangan.filter(i => i.jenis === 'masuk').reduce((s, i) => s + (i.jumlah || 0), 0);
        const tK = dataKeuangan.filter(i => i.jenis === 'keluar').reduce((s, i) => s + (i.jumlah || 0), 0);
        
        document.getElementById('totalBarang').textContent = formatAngka(tP) + ' Kg';
        document.getElementById('totalTerjual').textContent = formatAngka(tT) + ' Kg';
        document.getElementById('sisaStok').textContent = formatAngka(tP - tT) + ' Kg';
        document.getElementById('totalMasuk').textContent = formatRupiah(tM);
        document.getElementById('totalKeluar').textContent = formatRupiah(tK);
        document.getElementById('saldoAkhir').textContent = formatRupiah(tM - tK);
    };

    const renderSemua = () => {
        const { produksi: p, keuangan: k } = getDataTerfilter();
        renderTabelProduksi(dataProduksi, 'daftarProduksi', true);
        renderTabelKeuangan(dataKeuangan, 'daftarTransaksi', true);
        renderTabelProduksi(p, 'laporanProduksi', false);
        renderTabelKeuangan(k, 'laporanKeuangan', false);
        hitungRingkasan();
        updateFilterKategori();
    };

    const getMinggu = (d) => {
        const tdt = new Date(d.valueOf());
        const dayn = (tdt.getDay() + 6) % 7;
        tdt.setDate(tdt.getDate() - dayn + 3);
        const first = tdt.valueOf();
        tdt.setMonth(0, 1);
        if (tdt.getDay() !== 4) tdt.setMonth(0, 1 + ((4 - tdt.getDay()) + 7) % 7);
        return 1 + Math.ceil(((first - tdt) / 86400000) / 7);
    };

    const ambilKunci = (tgl, p) => {
        const d = new Date(tgl + 'T00:00:00');
        if (p === 'hari') return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
        if (p === 'minggu') return Minggu ${getMinggu(d)};
        if (p === 'bulan') return d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
        return tgl;
    };

    const siapkanDataGrafik = (periode) => {
        const kelompok = {};
        dataProduksi.forEach(i => {
            const k = ambilKunci(i.tanggal, periode);
            if (!kelompok[k]) kelompok[k] = { p: 0, t: 0, m: 0, k: 0 };
            kelompok[k].p += i.jmlProduksi || 0;
            kelompok[k].t += i.jmlTerjual || 0;
        });
        dataKeuangan.forEach(i => {
            const k = ambilKunci(i.tanggal, periode);
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
    };

    const inisialisasiGrafik = () => {
        const c1 = document.getElementById('chartProduksi');
        const c2 = document.getElementById('chartKeuangan');
        if (!c1 || !c2 || typeof Chart === 'undefined') return;
        const ctx1 = c1.getContext('2d');
        const ctx2 = c2.getContext('2d');
        
        if (chartProduksi) chartProduksi.destroy();
        if (chartKeuangan) chartKeuangan.destroy();
        
        const d = siapkanDataGrafik('hari');
        chartProduksi = new Chart(ctx1, {
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
        chartKeuangan = new Chart(ctx2, {
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
    };

    window.ubahGrafik = (p) => {
        if (!chartProduksi || !chartKeuangan) return;
        const d = siapkanDataGrafik(p);
        chartProduksi.data.labels = d.labels;
        chartProduksi.data.datasets[0].data = d.produksi;
        chartProduksi.data.datasets[1].data = d.terjual;
        chartProduksi.update();
        
        chartKeuangan.data.labels = d.labels;
        chartKeuangan.data.datasets[0].data = d.masuk;
        chartKeuangan.data.datasets[1].data = d.keluar;
        chartKeuangan.update();
    };

    window.eksporKeExcel = () => {
        if (dataProduksi.length === 0 && dataKeuangan.length === 0) {
            alert('⚠️ Belum ada data untuk diekspor!');
            return;
        }
        if (typeof XLSX === 'undefined') {
            alert('⚠️ Fitur ekspor tidak tersedia. Coba buka ulang halaman.');
            return;
        }
        try {
            let ws1 = [['PRODUKSI HARIAN'], ['No', 'Tanggal', 'Nama Barang', 'Produksi (Kg)', 'Terjual (Kg)', 'Keterangan']];
            dataProduksi.forEach((d, i) => ws1.push([i + 1, formatTanggal(d.tanggal), d.namaBarang, d.jmlProduksi, d.jmlTerjual, d.keterangan]));
            
            let ws2 = [['TRANSAKSI KEUANGAN'], ['No', 'Tanggal', 'Kategori', 'Keterangan', 'Jenis', 'Jumlah (Rp)']];
            dataKeuangan.forEach((d, i) => ws2.push([i + 1, formatTanggal(d.tanggal), d.kategori, d.keterangan, d.jenis === 'masuk' ? 'Pemasukan' : 'Pengeluaran', d.jumlah]));
            
            const wb = XLSX.utils.book_new();
            XLSX.utils
