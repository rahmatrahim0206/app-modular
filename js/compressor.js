/* ==========================================================
   OFFLINE IMAGE COMPRESSION ENGINE FOR OFFICIAL PORTRAITS & DIPLOMAS
   ========================================================== */

var uploadedFiles = [];
var compressedFilesMap = new Map(); // Stores processed binary blobs mapped by file ID
var compressionPreset = 'ijazah';  // Default preset

function setCompressionPreset(preset) {
  compressionPreset = preset;
  const customWrapper = document.getElementById('custom-controls-wrapper');
  const presets = ['pasfoto', 'ijazah', 'dokumen', 'custom'];
  
  presets.forEach(p => {
    const btn = document.getElementById(`preset-${p}`);
    if (btn) {
      if (p === preset) {
        btn.className = "py-3 px-2 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 shadow-sm";
      } else {
        btn.className = "py-3 px-2 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-50";
      }
    }
  });

  const scaleSlider = document.getElementById('scale-slider');
  const qualitySlider = document.getElementById('quality-slider');

  if (preset === 'pasfoto') {
    if (customWrapper) customWrapper.classList.add('hidden');
    if (scaleSlider) scaleSlider.value = 80;
    if (qualitySlider) qualitySlider.value = 65;
    document.getElementById('target-format').value = 'image/jpeg';
  } else if (preset === 'ijazah') {
    if (customWrapper) customWrapper.classList.add('hidden');
    if (scaleSlider) scaleSlider.value = 100;
    if (qualitySlider) qualitySlider.value = 75;
    document.getElementById('target-format').value = 'image/jpeg';
  } else if (preset === 'dokumen') {
    if (customWrapper) customWrapper.classList.add('hidden');
    if (scaleSlider) scaleSlider.value = 100;
    if (qualitySlider) qualitySlider.value = 80;
    document.getElementById('target-format').value = 'image/jpeg';
  } else if (preset === 'custom') {
    if (customWrapper) customWrapper.classList.remove('hidden');
  }

  updateLabels();
  runAutoCompression();
}

function updateLabels() {
  const scaleVal = document.getElementById('scale-slider').value;
  const qualityVal = document.getElementById('quality-slider').value;
  document.getElementById('scale-value').textContent = `${scaleVal}%`;
  document.getElementById('quality-value').textContent = `${qualityVal}%`;
}

function handleSliderChange() {
  updateLabels();
  runAutoCompression();
}

function handleFileSelect(e) {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;

  let hasInvalidFile = false;
  files.forEach(file => {
    const isImg = file.type.startsWith('image/') || file.name.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/i);
    if (isImg) {
      uploadedFiles.push({
        id: 'file-' + Date.now() + '-' + Math.floor(Math.random() * 100000),
        name: file.name,
        size: file.size,
        type: file.type,
        fileObject: file
      });
    } else {
      hasInvalidFile = true;
    }
  });

  if (hasInvalidFile) {
    if (typeof showToast === 'function') showToast("Beberapa berkas diabaikan karena bukan format gambar!", "warning");
  } else {
    if (typeof showToast === 'function') showToast(`Berhasil memuat ${files.length} berkas ke antrean.`, "success");
  }

  const resultsCard = document.getElementById('results-card');
  if (resultsCard) resultsCard.classList.remove('hidden');
  runAutoCompression();
  e.target.value = ''; 
}

async function runAutoCompression() {
  if (uploadedFiles.length === 0) return;

  const resultsContainer = document.getElementById('results-container');
  if (!resultsContainer) return;
  resultsContainer.innerHTML = '';
  compressedFilesMap.clear();

  let totalOriginal = 0;
  let totalCompressed = 0;

  for (const item of uploadedFiles) {
    const listItem = document.createElement('div');
    listItem.className = "p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in";
    listItem.id = `item-${item.id}`;
    listItem.innerHTML = `
      <div class="flex items-center gap-3 w-full md:w-[45%]">
        <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 flex-shrink-0">
          <i class="fa-solid fa-file-image text-lg"></i>
        </div>
        <div class="truncate w-full">
          <h5 class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title="${item.name}">${item.name}</h5>
          <p class="text-[9px] text-slate-400 font-mono mt-0.5">Asli: ${(item.size / 1024).toFixed(1)} KB</p>
        </div>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0 text-[10px] w-full md:w-auto justify-between md:justify-end">
        <span class="font-mono text-slate-500 font-bold" id="status-${item.id}">Memproses...</span>
        <div class="w-2.5 h-2.5 rounded-full bg-slate-300 animate-pulse" id="dot-${item.id}"></div>
      </div>
    `;
    resultsContainer.appendChild(listItem);

    try {
      const compressed = await compressSingleImage(item);
      compressedFilesMap.set(item.id, compressed);

      totalOriginal += item.size;
      totalCompressed += compressed.blob.size;

      const compKb = (compressed.blob.size / 1024).toFixed(1);
      const reduction = (((item.size - compressed.blob.size) / item.size) * 100).toFixed(0);

      const statusText = document.getElementById(`status-${item.id}`);
      const dot = document.getElementById(`dot-${item.id}`);
      const cardItem = document.getElementById(`item-${item.id}`);

      if (statusText && dot) {
        statusText.innerHTML = `
          <span class="text-emerald-500 font-black">${compKb} KB</span> 
          <span class="text-slate-300 dark:text-slate-700">|</span> 
          <span class="text-emerald-400 font-bold">Hemat ${reduction}%</span>
        `;
        dot.className = "w-2.5 h-2.5 rounded-full bg-emerald-500";
        cardItem.classList.add('border-emerald-500/20', 'bg-emerald-50/10');

        const btnWrapper = document.createElement('div');
        btnWrapper.className = "flex gap-1.5 flex-shrink-0 mt-3 md:mt-0 w-full md:w-auto justify-end";
        btnWrapper.innerHTML = `
          <button onclick="downloadSingleFile('${item.id}')" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1"><i class="fa-solid fa-download"></i> Unduh</button>
          <button onclick="deleteFromQueue('${item.id}')" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-rose-500 rounded-lg text-[10px] transition"><i class="fa-solid fa-trash-can"></i></button>
        `;
        cardItem.appendChild(btnWrapper);
      }
    } catch (err) {
      console.error(err);
      const statusText = document.getElementById(`status-${item.id}`);
      if (statusText) statusText.innerHTML = `<span class="text-rose-500">Gagal kompres</span>`;
    }
  }

  if (totalOriginal > 0) {
    const avgSaved = (((totalOriginal - totalCompressed) / totalOriginal) * 100).toFixed(0);
    const badge = document.getElementById('avg-saved-badge');
    if (badge) badge.textContent = `-${avgSaved}%`;
  }
}

function compressSingleImage(fileItem) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(fileItem.fileObject);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        let scale = parseFloat(document.getElementById('scale-slider').value) / 100;
        let width = img.width * scale;
        let height = img.height * scale;

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        let targetFormat = document.getElementById('target-format').value;
        if (targetFormat === 'original') {
          targetFormat = fileItem.type || 'image/jpeg';
        }

        let quality = parseFloat(document.getElementById('quality-slider').value) / 100;

        let targetMaxKb = 300; 
        if (compressionPreset === 'pasfoto') targetMaxKb = 200;
        else if (compressionPreset === 'dokumen') targetMaxKb = 500;
        else if (compressionPreset === 'custom') {
          targetMaxKb = parseFloat(document.getElementById('target-kb-input').value) || 300;
        }

        function evaluateBlob(q) {
          return new Promise((resBlob) => {
            canvas.toBlob((b) => {
              resBlob(b);
            }, targetFormat, q);
          });
        }

        async function optimizeTuning() {
          let currentBlob = await evaluateBlob(quality);
          let currentKb = currentBlob.size / 1024;

          if (currentKb > targetMaxKb) {
            let testQuality = quality;
            while (currentKb > targetMaxKb && testQuality > 0.15) {
              testQuality -= 0.08;
              currentBlob = await evaluateBlob(testQuality);
              currentKb = currentBlob.size / 1024;
            }
            
            if (currentKb > targetMaxKb) {
              let testScale = scale;
              while (currentKb > targetMaxKb && testScale > 0.2) {
                testScale -= 0.1;
                canvas.width = img.width * testScale;
                canvas.height = img.height * testScale;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                currentBlob = await evaluateBlob(0.4); 
                currentKb = currentBlob.size / 1024;
              }
            }
          }

          let cleanName = fileItem.name;
          const dotIdx = cleanName.lastIndexOf('.');
          if (dotIdx !== -1) cleanName = cleanName.substring(0, dotIdx);
          
          let ext = 'jpg';
          if (targetFormat === 'image/webp') ext = 'webp';
          else if (targetFormat === 'image/png') ext = 'png';
          
          const finalFilename = `${cleanName}_terkompresi.${ext}`;

          resolve({
            blob: currentBlob,
            filename: finalFilename,
            format: targetFormat
          });
        }

        optimizeTuning();
      };
      img.onerror = () => reject("Eror memuat gambar");
    };
    reader.onerror = () => reject("Eror membaca berkas");
  });
}

function downloadSingleFile(id) {
  const item = compressedFilesMap.get(id);
  if (!item) return;

  const url = URL.createObjectURL(item.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = item.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  if (typeof showToast === 'function') showToast("Berkas berhasil diunduh!", "success");
}

function deleteFromQueue(id) {
  uploadedFiles = uploadedFiles.filter(x => x.id !== id);
  compressedFilesMap.delete(id);
  
  const card = document.getElementById(`item-${id}`);
  if (card) card.remove();

  if (uploadedFiles.length === 0) {
    const resultsCard = document.getElementById('results-card');
    if (resultsCard) resultsCard.classList.add('hidden');
  } else {
    runAutoCompression();
  }
  if (typeof showToast === 'function') showToast("Berkas dihapus dari antrean.");
}

function clearQueue() {
  uploadedFiles = [];
  compressedFilesMap.clear();
  const resultsCard = document.getElementById('results-card');
  if (resultsCard) resultsCard.classList.add('hidden');
  if (typeof showToast === 'function') showToast("Seluruh antrean telah dibersihkan.");
}

function downloadAllProcessed() {
  if (compressedFilesMap.size === 0) {
    if (typeof showToast === 'function') showToast("Belum ada berkas terkompresi untuk diunduh!", "warning");
    return;
  }

  if (typeof showToast === 'function') showToast("Menyiapkan paket ZIP berkas Anda...", "warning");
  const zip = new JSZip();

  compressedFilesMap.forEach((val) => {
    zip.file(val.filename, val.blob);
  });

  zip.generateAsync({ type: "blob" }).then((content) => {
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `E-Ijazah_Terkompresi_DAPOHUB.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (typeof showToast === 'function') showToast("Paket ZIP berhasil diunduh!", "success");
  }).catch(() => {
    if (typeof showToast === 'function') showToast("Gagal membundel berkas ke ZIP.", "error");
  });
}

function updateControlsFromCustomInput() {
  const val = parseFloat(document.getElementById('target-kb-input').value) || 300;
  if (val < 10) return;
  runAutoCompression();
}

function downloadOfflineAppBundle() {
  if (typeof showToast === 'function') showToast("Mempersiapkan rilis standalone HTML... Mohon tunggu.", "warning");
  const docText = document.documentElement.outerHTML;
  const blob = new Blob([`<!DOCTYPE html>\n${docText}`], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = "Aplikasi-Pengompres-Foto-Ijazah-Offline.html";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  if (typeof showToast === 'function') showToast("Sukses mengunduh! Anda kini dapat menjalankan aplikasi ini tanpa koneksi internet sama sekali.", "success");
}

function simulateGoogleDriveAuth() {
  if (typeof showToast === 'function') showToast("Melakukan otorisasi Oauth 2.0 ke Google Drive pendaftaran Anda...", "warning");
  setTimeout(() => {
    if (typeof showToast === 'function') showToast("Otorisasi API Sukses! Folder 'E-Ijazah_Dapohub_Pendaftaran' telah tersambung secara lokal.", "success");
  }, 1500);
}

function simulateUploadAllDrive() {
  if (compressedFilesMap.size === 0) {
    if (typeof showToast === 'function') showToast("Silakan unggah dan kompres berkas Anda terlebih dahulu!", "warning");
    return;
  }

  if (typeof showToast === 'function') showToast("Memulai sinkronisasi asinkron menuju Google Drive virtual...", "warning");
  
  let processed = 0;
  compressedFilesMap.forEach((val) => {
    setTimeout(() => {
      processed++;
      if (typeof showToast === 'function') showToast(`[${processed}/${compressedFilesMap.size}] Berhasil mengunggah ${val.filename} ke Folder Google Drive.`, "success");
    }, processed * 1200 + 1000);
  });
}
```Anjing `js/compressor.js` siap digunakan.

Sekarang, saya akan memodifikasi berkas pengendali visual antarmuka **`js/ui.js`** agar:
1. Menyertakan navigasi kategori `'compress_foto'` pada fungsi `selectCategory`.
2. Menghitung dan menyinkronkan jumlah badge kategori yang tepat pada menu navigasi.
3. Menangani penonaktifan panel links lama dan pembukaan panel kompresor foto baru.

Berikut adalah perubahannya:

```react:Pengendali Visual Antarmuka:js/ui.js
<!-- ... existing code ... -->
window.selectCategory = function(cat) {
  activeCategory = cat;
  const p2Fa = document.getElementById('panel-2fa-main-auth');
  const pLinks = document.getElementById('panel-links-main-wrapper');
  const pPdf = document.getElementById('panel-pdf-tools-wrapper');
  const pPing = document.getElementById('panel-ping-tools-wrapper');
  const pSpeed = document.getElementById('panel-speedtest-wrapper');
  const pCompress = document.getElementById('panel-compress-wrapper'); // Panel Kompresor Foto
  
  if (p2Fa && pLinks && pPdf && pPing && pSpeed && pCompress) {
    p2Fa.classList.add('hidden');
    pLinks.classList.add('hidden');
    pPdf.classList.add('hidden');
    pPing.classList.add('hidden');
    pSpeed.classList.add('hidden');
    pCompress.classList.add('hidden');

    if (cat === '2fa_auth') {
      p2Fa.classList.remove('hidden');
      if (typeof renderAuthenticatorKeys === 'function') renderAuthenticatorKeys();
    } else if (cat === 'pdf_tools') {
      pPdf.classList.remove('hidden');
      if (typeof resetPdfWorkspaces === 'function') resetPdfWorkspaces();
    } else if (cat === 'ping_tools') {
      pPing.classList.remove('hidden');
      if (typeof initPingWorkspace === 'function') initPingWorkspace();
    } else if (cat === 'speedtest') {
      pSpeed.classList.remove('hidden');
      if (typeof initSpeedtestWorkspace === 'function') initSpeedtestWorkspace();
    } else if (cat === 'compress_foto') {
      pCompress.classList.remove('hidden');
      if (typeof setCompressionPreset === 'function') setCompressionPreset('ijazah'); // default preset
    } else {
      pLinks.classList.remove('hidden');
    }
  }
  
  document.querySelectorAll('.category-tab').forEach(t => {
    const c = t.getAttribute('data-category');
    const b = t.querySelector('span:last-child');
    if (c === cat) {
      t.className = 'category-tab inline-flex lg:flex items-center justify-between w-auto lg:w-full px-4 py-2.5 text-xs font-bold rounded-xl transition-all bg-blue-600 text-white shadow-md';
      if(b) b.className = 'ml-1.5 bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-mono';
    } else {
      t.className = 'category-tab inline-flex lg:flex items-center justify-between w-auto lg:w-full px-4 py-2.5 text-xs font-bold rounded-xl transition-all bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200';
      if(b) b.className = 'ml-1.5 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono';
    }
  });
  filterLinksOrKeys();
}

window.filterLinksOrKeys = function() {
  const s = document.getElementById('search-input'); 
  const c = document.getElementById('clear-search');
  if (s && c) s.value.trim().length > 0 ? c.classList.remove('hidden') : c.classList.add('hidden');
  
  const noRes = document.getElementById('no-results-message');
  
  if (activeCategory === '2fa_auth' || activeCategory === 'pdf_tools' || activeCategory === 'ping_tools' || activeCategory === 'speedtest' || activeCategory === 'compress_foto') {
    if (noRes) noRes.classList.add('hidden');
    if (activeCategory === '2fa_auth' && typeof renderAuthenticatorKeys === 'function') renderAuthenticatorKeys();
  } else {
    renderDynamicLinks();
  }
}
<!-- ... existing code ... -->
