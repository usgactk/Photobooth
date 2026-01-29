const state = { 
    stream: null, photos: [], filter: 'none', overlayImg: 'none', 
    count: 0, max: 4, layout: 'v-strip-34', 
    shape: 'rect', color: '#ffffff', pattern: 'none', 
    note: '', noteColor: '#000000', noteFont: 'Lora', 
    noteScale: 1.0, noteBold: false,
    ratio: 'portrait',
    mirrored: true 
};

// Yardımcı Fonksiyonlar (Dışarıda tanımlanması daha güvenlidir)
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
function loadImage(src) { return new Promise((r, rej) => { let i=new Image(); i.onload=()=>r(i); i.onerror=rej; i.src=src; }); }

document.addEventListener('DOMContentLoaded', () => {
    console.log("Uygulama başlatıldı");

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

    // --- DOSYA SEÇME MANTIĞI ---
    const galleryInput = document.getElementById('gallery-input');
    const galleryBtn = document.getElementById('btn-gallery-trigger');

    if(galleryBtn && galleryInput) {
        galleryBtn.onclick = () => galleryInput.click();

        galleryInput.onchange = async (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;

            for (let file of files) {
                if (state.photos.length < state.max) {
                    const reader = new FileReader();
                    const promise = new Promise(resolve => {
                        reader.onload = () => resolve(reader.result);
                    });
                    reader.readAsDataURL(file);
                    const base64 = await promise;
                    state.photos.push(base64);
                }
            }
            
            state.count = state.photos.length;
            if(els.counter) els.counter.innerText = state.count;

            if (state.count < state.max) {
                alert(`Şu an ${state.count} fotoğraf seçildi. Lütfen ${state.max - state.count} tane daha seçin.`);
                galleryInput.value = ""; 
            } else {
                els.landing.classList.add('hidden');
                els.editor.classList.remove('hidden');
                renderFront();
                renderBack();
            }
        };
    }

    // --- BAŞLAT MANTIĞI ---
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
            } catch (err) { 
                alert("Kamera izni verilmedi veya cihazda kamera bulunamadı."); 
            }
        };
    }

    // --- FOTOĞRAF ÇEKME ---
    const captureBtn = document.getElementById('btn-capture');
    if(captureBtn) {
        captureBtn.onclick = async () => {
            if (state.count >= state.max) return;
            const cd = document.getElementById('countdown'); 
            cd.classList.remove('hidden');
            for(let i=3; i>0; i--) { cd.innerText = i; await wait(1000); }
            cd.classList.add('hidden');
            
            const ctx = els.canvasCapture.getContext('2d'); 
            els.canvasCapture.width = els.video.videoWidth; 
            els.canvasCapture.height = els.video.videoHeight;
            
            ctx.save();
            if (state.mirrored) {
                ctx.translate(els.canvasCapture.width, 0); 
                ctx.scale(-1, 1); 
            }
            ctx.filter = state.filter; 
            ctx.drawImage(els.video, 0, 0);
            ctx.restore();

            state.photos.push(els.canvasCapture.toDataURL()); 
            state.count++; 
            els.counter.innerText = state.count;

            if(state.count === state.max) {
                if(state.stream) state.stream.getTracks().forEach(t => t.stop());
                els.camera.classList.add('hidden'); 
                els.editor.classList.remove('hidden');
                renderFront(); renderBack();
            }
        };
    }

    // --- EDİTÖR FONKSİYONLARI ---
    window.setLayout = (l) => { state.layout = l; renderFront(); renderBack(); };
    window.setShape = (s) => { state.shape = s; renderFront(); };
    window.setPattern = (p, color = null) => { 
        state.pattern = p; 
        if(color) state.color = color; 
        renderFront(); renderBack(); 
    };

    async function renderFront() {
        const ctx = els.canvasFront.getContext('2d');
        let W = 900, H = 1200; 
        // Basit boyutlandırma mantığı
        if (state.layout.includes('v-strip')) { W = 400; H = 2000; }
        els.canvasFront.width = W; els.canvasFront.height = H;
        
        ctx.fillStyle = state.color;
        ctx.fillRect(0, 0, W, H);
        
        const imgs = await Promise.all(state.photos.map(src => loadImage(src)));
        imgs.forEach((img, i) => {
            ctx.drawImage(img, 50, 50 + (i * 450), 300, 400); // Örnek yerleşim
        });
    }

    async function renderBack() {
        const ctx = els.canvasBack.getContext('2d');
        els.canvasBack.width = els.canvasFront.width;
        els.canvasBack.height = els.canvasFront.height;
        ctx.fillStyle = "#fffcf0";
        ctx.fillRect(0, 0, els.canvasBack.width, els.canvasBack.height);
    }

    window.rotateCard = () => {
        els.flipWrapper.classList.toggle('flipped');
    };
});

