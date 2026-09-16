const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "admin123";
let dataProduksi = [], dataKeuangan = [], isAdmin = false;
let chartProduksi = null, chartKeuangan = null;

window.onload = function() {
    const today = new Date().toISOString().split('T')[0];
    const tP = document.getElementById('tanggalProduksi');
    const tT = document.getElementById('tanggal');
    if(tP) tP.value = today;
    if(tT) tT.value = today;
    
    muatData();
    
    const link = document.getElementById('linkShare');
    if(link) link.value = window.location.href;
    
    const fP = document.getElementById('formProduksi');
    const fT = document.getElementById('formTransaksi');
    if(fP) fP.addEventListener('submit', simpanProduksi);
    if(fT) fT.addEventListener('submit', simpanTransaksi);
    
    tampilkanSection('beranda');
};

// ===== AUTENTIKASI =====
function masukSebagaiViewer() {
    isAdmin = false;
    tampilkanHalamanUtama();
    tampilkanSection('beranda');
}
function login() {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value;
    const passSimpan = localStorage.getItem('adminPass') || DEFAULT_PASSWORD;
    
    if(u === DEFAULT_USERNAME && p === passSimpan) {
        isAdmin = true;
        tampilkanHalamanUtama();
        tampilkanSection('beranda');
    } else {
        const err = document.getElementById('pesanError');
        err.style.display = 'block';
        setTimeout(()=>err.style.display='none',3000);
    }
}
function logout() {
    isAdmin = false;
    document.getElementById('halamanLogin').style.display = 'flex';
    document.getElementById('halamanUtama').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

// ===== TAMPILAN =====
function tampilkanHalamanUtama() {
    document.getElementById('halamanLogin').style.display = 'none';
    document.getElementById('halamanUtama').style.display = 'block';
    
    if(isAdmin) {
        document.getElementById('modeBadge').textContent = 'Mode Admin';
        document.getElementById('modeBadge').style.background = '#28a745';
        document.getElementById('btnPengaturan').style.display = 'inline-block';
        document.getElementById('formProduksiBox').style.display = 'block';
        document.getElementById('formKeuanganBox').style.display = 'block';
        document.getElementById('colAksiProduksi').style.display = '';
        document.getElementById('colAksiKeuangan').style.display = '';
        document.getElementById('readonlyNotice').style.display = 'none';
        document.getElementById('btnHapusSemua').style.display = 'inline-block';
    } else {
        document.getElementById('modeBadge').textContent = 'Lihat Saja';
        document.getElementById('modeBadge').style.background = '#ffc107';
        document.getElementById('btnPengaturan').style.display = 'none';
        document.getElementById('formProduksiBox').style.display = 'none';
        document.getElementById('formKeuanganBox').style.display = 'none';
        document.getElementById('colAksiProduksi').style.display = 'none';
        document.getElementById('colAksiKeuangan').style.display = 'none';
        document.getElementById('readonlyNotice').style.display = 'block';
        document.getElementById('btnHapusSemua').style.display = 'none';
    }
    renderSemua();
    if(chartProduksi === null) initGrafik();
}

// ===== MENU NAVIGASI =====
function tampilkanSection(nama) {
    // Sembunyikan semua bagian
    document.querySelectorAll('.konten-section').forEach(el=>el.classList.remove('active'));
    // Aktifkan bagian yang dipilih
    document.getElementById('bagian'+nama.charAt(0).toUpperCase()+nama.slice(1)).classList.add('active');
    // Tandai menu aktif
    document.querySelectorAll('.nav-link').forEach(el=>el.classList.remove('active'));
    event.target.classList.add('active');
    // Tutup pengaturan jika terbuka
    document.getElementById('bagianSetting').classList.remove('active');
}

// ===== PENGATURAN =====
function toggleSetting() {
    const el = document.getElementById('bagianSetting');
    el.classList.toggle('active');
}
function ubahPassword() {
    const lama = document.getElementById('passLama').value;
    const baru = document.getElementById('passBaru').value;
    const ulang = document.getElementById('passUlang').value;
    const simpan = localStorage.getItem('adminPass') || DEFAULT_PASSWORD;
    
    if(!lama||!baru||!ulang) return alert('⚠️ Lengkapi semua kolom!');
    if(lama !== simpan) return alert('❌ Password lama salah!');
    if(baru !== ulang) return alert('❌ Password baru tidak cocok!');
    if(baru.length < 4) return alert('⚠️ Minimal 4 karakter!');
    
    localStorage.setItem('adminPass', baru);
    alert('✅ Password berhasil diubah!');
    document.getElementById('passLama').value = '';
    document.getElementById('passBaru').value = '';
    document.getElementById('passUlang').value = '';
    toggleSetting();
}

// ===== BERBAGI LINK =====
function salinLink() {
    const el = document.getElementById('linkShare');
    el.select();
    document.execCommand('copy');
    alert('✅ Link disalin! Bagikan ke orang lain untuk mode Lihat Saja');
}

// ===== PENYIMPANAN DATA =====
function simpanKeLocal() {
    localStorage.setItem('dataProduksi', JSON.stringify(dataProduksi));
    localStorage.setItem('dataKeuangan', JSON.stringify(dataKeuangan));
}
function muatData() {
    const p = localStorage.getItem('dataProduksi');
    const k = localStorage.getItem('dataKeuangan');
    if(p) dataProduksi = JSON.parse(p);
    if(k) dataKeuangan = JSON.parse(k);
}

// ===== PRODUKSI =====
function simpanProduksi(e) {
    e.preventDefault();
    dataProduksi.unshift({
        id: Date.now(),
        tanggal: document.getElementById('tanggalProduksi').value,
        namaBarang: document.getElementById('namaBarang').value,
        jmlProduksi: parseFloat(document.getElementById('jmlProduksi').value)||0,
        jmlTerjual: parseFloat(document.getElementById('jmlTerjual').value)||0,
        keterangan: document.getElementById('ketProduksi').value
    });
    simpanKeLocal();
    renderSemua();
    initGrafik();
    alert('✅ Data produksi disimpan!');
    e.target.reset();
    document.getElementById('tanggalProduksi').value = new Date().toISOString().split('T')[0];
}
function hapusProduksi(id) {
    if(!confirm('Yakin hapus data ini?')) return;
    dataProduksi = dataProduksi.filter(i=>i.id!==id);
    simpanKeLocal();
    renderSemua();
    initGrafik();
}

// ===== KEUANGAN =====
function simpanTransaksi(e) {
    e.preventDefault();
    dataKeuangan.unshift({
        id: Date.now(),
        tanggal: document.getElementById('tanggal').value,
        jenis: document.getElementById('jenis').value,
        kategori: document.getElementById('kategori').value,
        jumlah: parseInt(document.getElementById('jumlah').value)||0,
        keterangan: document.getElementById('keterangan').value
    });
    simpanKeLocal();
    renderSemua();
    initGrafik();
    alert('✅ Transaksi disimpan!');
    e.target.reset();
    document.getElementById('tanggal').value = new Date().toISOString().split('T')[0];
}
function hapusTransaksi(id) {
    if(!confirm('Yakin hapus transaksi ini?')) return;
    dataKeuangan = dataKeuangan.filter(i=>i.id!==id);
    simpanKeLocal();
    renderSemua();
    initGrafik();
}
function hapusSemua() {
    if(!confirm('⚠️ YAKIN HAPUS SEMUA DATA?')) return;
    if(!confirm('⚠️ TEKAN OK JIKA YAKIN SEKALI!')) return;
    dataProduksi = [];
    dataKeuangan = [];
    simpanKeLocal();
    renderSemua();
    initGrafik();
    alert('✅ Semua data dihapus!');
}

// ===== FILTER =====
function terapkanFilter() { renderSemua(); }
function resetFilter() {
    document.getElementById('tglMulai').value = '';
    document.getElementById('tglAkhir').value = '';
    document.getElementById('filterJenis').value = 'semua';
    document.getElementById('filterKategori').value = 'semua';
    renderSemua();
}
function dapatkanDataTerfilter() {
    const tM = document.getElementById('tglMulai').value;
    const tA = document.getElementById('tglAkhir').value;
    const j = document.getElementById('filterJenis').value;
    const k = document.getElementById('filterKategori').value;
    
    let p = [...dataProduksi], kk = [...dataKeuangan];
    if(tM) {p=p.filter(i=>i.tanggal>=tM);kk=kk.filter(i=>i.tanggal>=tM);}
    if(tA) {p=p.filter(i=>i.tanggal<=tA);kk=kk.filter(i=>i.tanggal<=tA);}
    if(k!=='semua') {p=p.filter(i=>i.namaBarang===k);kk=kk.filter(i=>i.kategori===k);}
    if(j==='produksi') kk=[];
    if(j==='keuangan') p=[];
    return {produksi:p, keuangan:kk};
}
function updateFilterKategori() {
    const sel = document.getElementById('filterKategori');
    const set = new Set();
    dataProduksi.forEach(i=>set.add(i.namaBarang));
    dataKeuangan.forEach(i=>set.add(i.kategori));
    const val = sel.value;
    sel.innerHTML = '<option value="semua">Semua Kategori</option>';
    [...set].sort().forEach(k=>sel.innerHTML+=<option value="${k}">${k}</option>);
    sel.value = val;
}

// ===== RENDER DATA =====
function renderSemua() {
    const {produksi:p, keuangan:k} = dapatkanDataTerfilter();
    renderTabelProduksi(dataProduksi, 'daftarProduksi', true);
    renderTabelKeuangan(dataKeuangan, 'daftarTransaksi', true);
    renderTabelProduksi(p, 'laporanProduksi', false);
    renderTabelKeuangan(k, 'laporanKeuangan', false);
    hitungRingkasan();
    updateFilterKategori();
}
function renderTabelProduksi(data, idTabel, tampilkanAksi) {
    const tb = document.getElementById(idTabel);
    const jml = document.getElementById('jumlahDataProduksi');
    if(jml && idTabel==='daftarProduksi') jml.textContent = (${data.length} data);
    
    if(data.length===0) {
        tb.innerHTML='<tr><td colspan="7" class="kosong">Belum ada data produksi 👆</td></tr>';
        return;
    }
    tb.innerHTML = '';
    data.forEach((item,i)=>{
        const tr = document.createElement('tr');
        tr.innerHTML = <td>${i+1}</td><td>${formatTanggal(item.tanggal)}</td><td>${item.namaBarang}</td><td>${item.jmlProduksi.toFixed(2)} Kg</td><td>${item.jmlTerjual.toFixed(2)} Kg</td><td>${item.keterangan||'-'}</td>${tampilkanAksi&&isAdmin?<td><button class="btn-hapus" onclick="hapusProduksi(${item.id})">🗑️</button></td>:''};
        tb.appendChild(tr);
    });
}
function renderTabelKeuangan(data, idTabel, tampilkanAksi) {
    const tb = document.getElementById(idTabel);
    const jml = document.getElementById('jumlahDataKeuangan');
    if(jml && idTabel==='daftarTransaksi') jml.textContent = (${data.length} transaksi);
    
    if(data.length===0) {
        tb.innerHTML='<tr><td colspan="7" class="kosong">Belum ada transaksi keuangan 👆</td></tr>';
        return;
    }
    tb.innerHTML = '';
    data.forEach((item,i)=>{
        const tr = document.createElement('tr');
        tr.innerHTML = <td>${i+1}</td><td>${formatTanggal(item.tanggal)}</td><td>${item.kategori}</td><td>${item.keterangan||'-'}</td><td>${item.jenis==='masuk'?'✅ Masuk':'💸 Keluar'}</td><td style="color:${item.jenis==='masuk'?'#28a745':'#dc3545'};font-weight:600">${item.jenis==='masuk'?'+':'-'}${formatRupiah(item.jumlah)}</td>${tampilkanAksi&&isAdmin?<td><button class="btn-hapus" onclick="hapusTransaksi(${item.id})">🗑️</button></td>:''};
        tb.appendChild(tr);
    });
}
function hitungRingkasan() {
    const tP = dataProduksi.reduce((s,i)=>s+i.jmlProduksi,0);
    const tT = dataProduksi.reduce((s,i)=>s+i.jmlTerjual,0);
    const tM = dataKeuangan.filter(i=>i.jenis==='masuk').reduce((s,i)=>s+i.jumlah,0);
    const tK = dataKeuangan.filter(i=>i.jenis==='keluar').reduce((s,i)=>s+i.jumlah,0);
    
    document.getElementById('totalBarang').textContent = tP.toFixed(2)+' Kg';
    document.getElementById('totalTerjual').textContent = tT.toFixed(2)+' Kg';
    document.getElementById('sisaStok').textContent = (tP-tT).toFixed(2)+' Kg';
    document.getElementById('totalMasuk').textContent = formatRupiah(tM);
    document.getElementById('totalKeluar').textContent = formatRupiah(tK);
    document.getElementById('saldoAkhir').textContent = formatRupiah(tM-tK);
}

// ===== GRAFIK =====
function initGrafik() {
    const c1 = document.getElementById('chartProduksi');
    const c2 = document.getElementById('chartKeuangan');
    if(!c1||!c2) return;
    const ctx1 = c1.getContext('2d');
    const ctx2 = c2.getContext('2d');
    
    if(chartProduksi) chartProduksi.destroy();
    if(chartKeuangan) chartKeuangan.destroy();
    
    const d = siapkanDataGrafik('hari');
    chartProduksi = new Chart(ctx1,{
        type:'bar',
        data:{
            labels:d.labels,
            datasets:[
                {label:'Produksi (Kg)',data:d.produksi,backgroundColor:'#007bff'},
                {label:'Terjual (Kg)',data:d.terjual,backgroundColor:'#28a745'}
            ]
        },
        options:{responsive:true,maintainAspectRatio:false}
    });
    chartKeuangan = new Chart(ctx2,{
        type:'bar',
        data:{
            labels:d.labels,
            datasets:[
                {label:'Pemasukan',data:d.masuk,backgroundColor:'#28a745'},
                {label:'Pengeluaran',data:d.keluar,backgroundColor:'#dc3545'}
            ]
        },
        options:{responsive:true,maintainAspectRatio:false}
    });
}
function updateGrafik(p) {
    if(!chartProduksi||!chartKeuangan) return;
    const d = siapkanDataGrafik(p);
    chartProduksi.data.labels = d.labels;
    chartProduksi.data.datasets[0].data = d.produksi;
    chartProduksi.data.datasets[1].data = d.terjual;
    chartProduksi.update();
    
    chartKeuangan.data.labels = d.labels;
    chartKeuangan.data.datasets[0].data = d.masuk;
    chartKeuangan.data.datasets[1].data = d.keluar;
    chartKeuangan.update();
}
function siapkanDataGrafik(periode) {
    let kelompok = {};
    dataProduksi.forEach(i=>{
        const k = ambilKunci(i.tanggal,periode);
        if(!kelompok[k]) kelompok[k]={p:0,t:0,m:0,k:0};
        kelompok[k].p += i.jmlProduksi;
        kelompok[k].t += i.jmlTerjual;
    });
    dataKeuangan.forEach(i=>{
        const k = ambilKunci(i.tanggal,periode);
        if(!kelompok[k]) kelompok[k]={p:0,t:0,m:0,k:0};
        if(i.jenis==='masuk') kelompok[k].m += i.jumlah;
        else kelompok[k].k += i.jumlah;
    });
    const urut = Object.keys(kelompok).sort().slice(-7);
    return {
        labels: urut,
        produksi: urut.map(k=>kelompok[k].p.toFixed(2)),
        terjual: urut.map(k=>kelompok[k].t.toFixed(2)),
        masuk: urut.map(k=>kelompok[k].m),
        keluar: urut.map(k=>kelompok[k].k)
    };
}
function ambilKunci(tgl,p) {
    const d = new Date(tgl);
    if(p==='hari') return d.toLocaleDateString('id-ID',{day:'2-digit',month:'2-digit'});
    if(p==='minggu') return Minggu ${getWeek(d)};
    if(p==='bulan') return d.toLocaleDateString('id-ID',{month:'short',year:'numeric'});
    return tgl;
}
function getWeek(d) {
    const tdt = new Date(d.valueOf());
    const dayn = (d.getDay()+6)%7;
    tdt.setDate(tdt.getDate()-dayn+3);
    const first = tdt.valueOf();
    tdt.setMonth(0,1);
    if(tdt.getDay()!==4) tdt.setMonth(0,1+((4-tdt.getDay())+7)%7);
    return 1+Math.ceil((first-tdt)/604800000);
}

// ===== EKSPOR EXCEL =====
function ekspsporKeExcel() {
    if(dataProduksi.length===0&&dataKeuangan.length===0) return alert('⚠️ Belum ada data!');
    let ws1 = [['PRODUKSI HARIAN'],['No','Tanggal','Nama Barang','Produksi (Kg)','Terjual (Kg)','Keterangan']];
    dataProduksi.forEach((d,i)=>ws1.push([i+1,formatTanggal(d.tanggal),d.namaBarang,d.jmlProduksi,d.jmlTerjual,d.keterangan]));
    let ws2 = [['TRANSAKSI KEUANGAN'],['No','Tanggal','Kategori','Keterangan','Jenis','Jumlah (Rp)']];
    dataKeuangan.forEach((d,i)=>ws2.push([i+1,formatTanggal(d.tanggal),d.kategori,d.keterangan,d.jenis==='masuk'?'Pemasukan':'Pengeluaran',d.jumlah]));
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(ws1),'Produksi');
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(ws2),'Keuangan');
    XLSX.writeFile(wb,BukuKasTambang_${new Date().toLocaleDateString('id-ID').replace(/\//g,'-')}.xlsx);
    alert('✅ Laporan berhasil diekspor!');
}

// ===== FORMAT =====
function formatRupiah(a) {return 'Rp '+a.toString().replace(/\B(?=(\d{3})+(?!\d))/g,'.');}
function formatTanggal(t) {
    if(!t) return '-';
    return new Date(t).toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'});
}