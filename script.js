/**
 * OMANSTUDIO Color Toolkit - Main Script (Full Update)
 */

// ==========================================
// 1. DEKLARASI ELEMEN DOM
// ==========================================
const colorPicker = document.getElementById('base-color-picker');
const textInput = document.getElementById('color-text-input');
const applyTextBtn = document.getElementById('apply-text-btn');
const quickPicksGallery = document.getElementById('quick-picks');

const originalDisplay = document.getElementById('original-display');
const originalHex = document.getElementById('original-hex');
const rgbDisplay = document.getElementById('rgb-display');
const rgbHexDisplay = document.getElementById('rgb-hex');
const useRgbBtn = document.getElementById('use-rgb-btn');

const sliderR = document.getElementById('slider-r');
const sliderG = document.getElementById('slider-g');
const sliderB = document.getElementById('slider-b');
const valR = document.getElementById('val-r');
const valG = document.getElementById('val-g');
const valB = document.getElementById('val-b');

const combo2Container = document.getElementById('combo-2');
const combo3Container = document.getElementById('combo-3');
const lightnessTableBody = document.querySelector('#lightness-table tbody');

// ==========================================
// 2. FUNGSI UTILITAS
// ==========================================
function getHarmoniousTextColor(hex) {
    const color = tinycolor(hex);
    const hsl = color.toHsl();
    return color.isLight() 
        ? tinycolor({ h: hsl.h, s: hsl.s, l: 0.15 }).toHexString().toUpperCase() 
        : tinycolor({ h: hsl.h, s: hsl.s, l: 0.95 }).toHexString().toUpperCase();
}

function copyText(txt) {
    navigator.clipboard.writeText(txt).then(() => alert(`${txt} berhasil disalin!`));
}

// ==========================================
// 3. RENDER KONEKSI (Heksagon & Tabel)
// ==========================================
function renderQuickPicks() {
    const rowLengths = [5, 6, 7, 8, 9, 10, 11, 10, 9, 8, 7, 6, 5];
    let html = '';
    const centerRowIndex = 6;
    const maxRadius = 6; 

    rowLengths.forEach((len, rowIndex) => {
        html += '<div class="hex-row">';
        for (let colIndex = 0; colIndex < len; colIndex++) {
            let dy = rowIndex - centerRowIndex; 
            let dx = colIndex - (len / 2 - 0.5);
            let distance = Math.sqrt(dx * dx + dy * dy);
            
            let angle = Math.atan2(dy, dx) * (180 / Math.PI);
            if (angle < 0) angle += 360;

            let h = Math.round(angle); 
            let s = distance === 0 ? 0 : Math.min(100, (distance / maxRadius) * 100 + 10);
            let l = distance === 0 ? 95 : Math.max(35, 80 - (distance / maxRadius) * 45);

            let hexColor = tinycolor({ h: h, s: s / 100, l: l / 100 }).toHexString().toUpperCase();
            html += `<div class="hex-swatch" style="background-color: ${hexColor};" onclick="setMainColor('${hexColor}')" title="${hexColor}"></div>`;
        }
        html += '</div>';
    });
    quickPicksGallery.innerHTML = html;
}

function createLargeBox(hex, name) {
    const textColor = getHarmoniousTextColor(hex);
    const upperHex = hex.toUpperCase();
    return `
        <div class="large-color-box" style="background-color: ${hex}; color: ${textColor};" onclick="copyText('${upperHex}')">
            <div class="large-color-details" style="color: #333;">
                <strong>${name}</strong>
                <span>${upperHex}</span><br>
                <small style="color: #666;">Teks: <strong>${textColor}</strong></small>
            </div>
        </div>
    `;
}

function generateLightnessTable(baseColorHex) {
    let htmlRows = '';
    const hsl = tinycolor(baseColorHex).toHsl();
    for (let l = 100; l >= 0; l -= 10) {
        let newColor = tinycolor({ h: hsl.h, s: hsl.s, l: l / 100 });
        let hex = newColor.toHexString().toUpperCase();
        let textColor = getHarmoniousTextColor(hex);

        htmlRows += `
            <tr style="background-color: ${hex}; color: ${textColor}; cursor: pointer;" onclick="copyText('${hex}')">
                <td>${l}%</td>
                <td><strong>${hex}</strong></td>
                <td>${newColor.toRgbString()}</td>
                <td>${textColor}</td>
            </tr>
        `;
    }
    lightnessTableBody.innerHTML = htmlRows;
}

// ==========================================
// 4. LOGIKA UTAMA (State & RGB Preview)
// ==========================================
function setMainColor(colorValue) {
    const color = tinycolor(colorValue);
    if (!color.isValid()) return alert("Kode warna tidak valid!");

    const hex = color.toHexString().toUpperCase();
    const rgb = color.toRgb();

    colorPicker.value = hex;
    textInput.value = hex;

    // Update Split Preview Bagian Atas
    originalDisplay.style.backgroundColor = hex;
    originalHex.textContent = hex;
    originalDisplay.style.color = getHarmoniousTextColor(hex);

    // Set nilai slider tanpa memicu infinite loop
    sliderR.value = rgb.r; 
    sliderG.value = rgb.g; 
    sliderB.value = rgb.b; 
    
    updateRgbPreview();
    generateLightnessTable(hex);
    fetchColorSchemes(hex);
}

// MENGATUR PREVIEW RGB & BACKGROUND SLIDER SECARA LANGSUNG
function updateRgbPreview() {
    const r = sliderR.value;
    const g = sliderG.value;
    const b = sliderB.value;
    
    const color = tinycolor(`rgb(${r}, ${g}, ${b})`);
    const hex = color.toHexString().toUpperCase();

    // Update Label
    valR.textContent = r;
    valG.textContent = g;
    valB.textContent = b;

    // Terapkan Gradient ke masing-masing box-slider
    sliderR.style.background = `linear-gradient(to right, rgb(0, ${g}, ${b}), rgb(255, ${g}, ${b}))`;
    sliderG.style.background = `linear-gradient(to right, rgb(${r}, 0, ${b}), rgb(${r}, 255, ${b}))`;
    sliderB.style.background = `linear-gradient(to right, rgb(${r}, ${g}, 0), rgb(${r}, ${g}, 255))`;

    // Update Split Preview Bagian Bawah
    rgbDisplay.style.backgroundColor = hex;
    rgbHexDisplay.textContent = hex;
    rgbDisplay.style.color = getHarmoniousTextColor(hex);
}

async function fetchColorSchemes(hex) {
    const cleanHex = hex.replace('#', '');
    combo2Container.innerHTML = '<p>Memuat referensi...</p>';
    combo3Container.innerHTML = '<p>Memuat referensi...</p>';

    try {
        const [res2, res3] = await Promise.all([
            fetch(`https://www.thecolorapi.com/scheme?hex=${cleanHex}&mode=complement&count=2`),
            fetch(`https://www.thecolorapi.com/scheme?hex=${cleanHex}&mode=analogic&count=3`)
        ]);
        
        const data2 = await res2.json();
        const data3 = await res3.json();

        combo2Container.innerHTML = data2.colors.map(c => createLargeBox(c.hex.value, c.name.value)).join('');
        combo3Container.innerHTML = data3.colors.map(c => createLargeBox(c.hex.value, c.name.value)).join('');
    } catch (e) {
        console.error(e);
        combo2Container.innerHTML = '<p style="color: red;">Gagal memuat API.</p>';
        combo3Container.innerHTML = '<p style="color: red;">Gagal memuat API.</p>';
    }
}

// ==========================================
// 5. EVENT LISTENERS
// ==========================================
let debounceTimeout;
colorPicker.addEventListener('input', (e) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => setMainColor(e.target.value), 200);
});

applyTextBtn.addEventListener('click', () => setMainColor(textInput.value));
textInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') setMainColor(textInput.value);
});

// Setiap Slider Digeser, warna box-nya langsung menyesuaikan
sliderR.addEventListener('input', updateRgbPreview);
sliderG.addEventListener('input', updateRgbPreview);
sliderB.addEventListener('input', updateRgbPreview);

useRgbBtn.addEventListener('click', () => setMainColor(rgbHexDisplay.textContent));

// Inisialisasi
renderQuickPicks();
setMainColor('#6D8196');