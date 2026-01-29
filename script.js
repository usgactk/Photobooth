const state = { 
    stream: null, photos: [], filter: 'none', overlayImg: 'none', 
    count: 0, max: 4, layout: 'v-strip-34', 
    shape: 'rect', color: '#ffffff', pattern: 'none', 
    note: '', noteColor: '#000000', noteFont: 'Lora', 
    noteScale: 1.0, noteBold: false,
    ratio: 'portrait',
    mirrored: true 
};

document.addEventListener('DOMContentLoaded', () => {
    const els = {
        landing: document.getElementById('scene-landing'), 
        camera: document.getElementById('scene-camera'), 
        editor: document.getElementById('scene-editor'),
        video: document.getElementById('video-feed'), 
        canvasCapture: document.getElementById('capture-canvas'), 
        canvasFront: document.getElementById('canvas-front'), 
        canvasBack: document.getElementById('canvas-back'),
        frame: document.getElementById('camera-frame'), 
        counter: document.getElementById('photo-counter'), 
        flipWrapper: document.getElementById('flip-wrapper'), 
        noteArea: document.getElementById('note-area-small'),
        overlayEl: document.getElementById('camera-overlay-img')
    };

    const galleryInput = document.getElementById('gallery-input');
    const galleryBtn = document.getElementById('btn-gallery-trigger');

    // --- GALERİ VE ÇOKLU SEÇİM ---
    if(galleryBtn) {
        galleryBtn.onclick = () => {
            galleryInput.click();
        };
    }

    if(galleryInput) {
        galleryInput.onchange = async (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;

            state.photos = []; // Önceki seçimleri temizle
            const limit = Math.min(files.length, state.max);
            
            for (let i = 0; i < limit; i++) {
                const base64 = await fileToDataURL(files[i]);
                state.photos.push(base64);
            }
            
            state.count = state.photos.length;

            if (state.count > 0) {
                els.landing.classList.add('hidden');
                els.editor.classList.remove('hidden');
                renderFront();
                renderBack();
            }
        };
    }

    // --- KAMERA BAŞLAT ---
    const startBtn = document.getElementById('btn-start');
    if(startBtn) {
        startBtn.onclick = async () => {
            els.landing.classList.add('hidden'); 
            els.camera.classList.remove('hidden'); 
            try { 
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); 
                els.video.srcObject = stream; 
                state.stream = stream; 
                els.video.style.transform = "scaleX(-1)";
            } catch (err) { alert("Kamera Hatası!"); }
        };
    }

    // --- EDİTÖR NAVİGASYON ---
    window.switchTab = (tabId, clickedBtn) => {
        // Tüm içerikleri gizle
        const tabs = document.getElementsByClassName('tab-content');
        for (let tab of tabs) tab.classList.remove('active');
        
        const tabBtns = document.getElementsByClassName('glass-tab');
        for (let btn of tabBtns) btn.classList.remove('active');

        // Seçileni göster
        document.getElementById(tabId).classList.add('active');
        if(clickedBtn) clickedBtn.classList.add('active');

        // Not sekmesindeyse kartı çevir
        if(tabId === 'tab-note') rotateCard(true); else rotateCard(false);
    };

    window.rotateCard = (forceBack) => {
        if(forceBack === true) els.flipWrapper.classList.add('flipped');
        else if(forceBack === false) els.flipWrapper.classList.remove('flipped');
        else els.flipWrapper.classList.toggle('flipped');
    };

    // --- ÇİZİM VE RENDER ---
    async function renderFront() {
        const ctx = els.canvasFront.getContext('2d');
        const W = 800, H = 1200;
        els.canvasFront.width = W; els.canvasFront.height = H;
        
        // Arkaplan
        ctx.fillStyle = state.color;
        ctx.fillRect(0, 0, W, H);

        const imgs = await Promise.all(state.photos.map(src => loadImage(src)));
        imgs.forEach((img, i) => {
            const yPos = 50 + (i * 280);
            ctx.drawImage(img, 100, yPos, 600, 250); 
        });
    }

    async function renderBack() {
        const ctx = els.canvasBack.getContext('2d');
        els.canvasBack.width = 800; els.canvasBack.height = 1200;
        ctx.fillStyle = "#fffcf0";
        ctx.fillRect(0, 0, 800, 1200);
        
        ctx.fillStyle = state.noteColor;
        ctx.font = `40px ${state.noteFont}`;
        ctx.textAlign = "center";
        ctx.fillText(state.note, 400, 600);
    }

    // --- YARDIMCI ARAÇLAR ---
    function fileToDataURL(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
    }

    function loadImage(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = src;
        });
    }

    // Global Fonksiyonlar (HTML içinden erişim için)
    window.setLayout = (l) => { state.layout = l; renderFront(); };
    window.setPattern = (p, c) => { if(c) state.color = c; state.pattern = p; renderFront(); };
    window.updateNote = (v) => { state.note = v; renderBack(); };
});

