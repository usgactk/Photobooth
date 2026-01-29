const state = { 
    stream: null, photos: [], filter: 'none', overlayImg: 'none', 
    count: 0, max: 4, layout: 'v-strip-34', 
    shape: 'rect', color: '#ffffff', pattern: 'none', 
    note: '', noteColor: '#000000', noteFont: 'Lora', 
    noteScale: 1.0, noteBold: false,
    ratio: 'portrait',
    mirrored: true // Varsayılan aynalı mod
};

document.addEventListener('DOMContentLoaded', () => {
    const els = {
        landing: document.getElementById('scene-landing'), camera: document.getElementById('scene-camera'), editor: document.getElementById('scene-editor'),
        video: document.getElementById('video-feed'), canvasCapture: document.getElementById('capture-canvas'), canvasFront: document.getElementById('canvas-front'), canvasBack: document.getElementById('canvas-back'),
        frame: document.getElementById('camera-frame'), counter: document.getElementById('photo-counter'), flipWrapper: document.getElementById('flip-wrapper'), noteArea: document.getElementById('note-area-small'),
        overlayEl: document.getElementById('camera-overlay-img')
    };
// DOMContentLoaded içine ekle
galleryInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Mevcut fotoğraflara ekleme yap (4'ü geçme)
    for (let i = 0; i < files.length; i++) {
        if (state.photos.length < state.max) {
            const base64 = await fileToDataURL(files[i]);
            state.photos.push(base64);
        }
    }
    
    state.count = state.photos.length;

    // Eğer henüz 4 fotoğraf olmadıysa kullanıcıya bilgi ver veya tekrar seçtir
    if (state.count < state.max) {
        alert(`Şu an ${state.count} fotoğraf seçildi. Lütfen ${state.max - state.count} tane daha seçin.`);
        // Inputu temizle ki aynı dosyayı tekrar seçebilsin
        galleryInput.value = ""; 
    } else {
        // 4 tamamlandığında editöre geç
        els.landing.classList.add('hidden');
        els.editor.classList.remove('hidden');
        renderFront();
        renderBack();
    }
});


// Yardımcı fonksiyon: Dosyayı Base64 formatına çevirir
function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

    // BAŞLAT
    const startBtn = document.getElementById('btn-start');
    if(startBtn) {
        startBtn.addEventListener('click', async () => {
            els.landing.classList.add('hidden'); els.camera.classList.remove('hidden'); setAspectRatio('portrait');
            try { 
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); 
                els.video.srcObject = stream; 
                state.stream = stream; 
                // İlk açılışta aynalamayı uygula
                els.video.style.transform = "scaleX(-1)";
            } 
            catch (err) { alert("Kamera Hatası!"); location.reload(); }
        });
    }

    // YENİ: Aynalama Değiştirme Butonu
    const mirrorBtn = document.getElementById('btn-mirror');
    if(mirrorBtn) {
        mirrorBtn.addEventListener('click', () => {
            state.mirrored = !state.mirrored;
            els.video.style.transform = state.mirrored ? "scaleX(-1)" : "scaleX(1)";
        });
    }

    // KAMERA AYARLARI
    window.setAspectRatio = (mode) => {
        state.ratio = mode; 
        if(mode === 'portrait') { els.frame.style.aspectRatio="3/4"; els.flipWrapper.style.aspectRatio="3/4"; } 
        else { els.frame.style.aspectRatio="4/3"; els.flipWrapper.style.aspectRatio="4/3"; }
    };

    window.applyEffect = (cssFilter, overlaySrc) => {
        const beautyBase = "blur(0.5px)";
        let finalFilter = (cssFilter === 'none') ? beautyBase : (beautyBase + cssFilter);
        state.filter = finalFilter;
        state.overlayImg = overlaySrc;
        els.video.style.filter = finalFilter;
        if (overlaySrc && overlaySrc !== 'none') {
            els.overlayEl.src = overlaySrc;
            els.overlayEl.style.display = 'block';
        } else {
            els.overlayEl.style.display = 'none';
        }
    };

    document.getElementById('btn-capture').addEventListener('click', async () => {
        if (state.count >= state.max) return;
        const cd = document.getElementById('countdown'); cd.classList.remove('hidden');
        for(let i=3; i>0; i--) { cd.innerText = i; await wait(1000); }
        cd.classList.add('hidden');
        
        const ctx = els.canvasCapture.getContext('2d'); 
        els.canvasCapture.width = els.video.videoWidth; 
        els.canvasCapture.height = els.video.videoHeight;
        
        // 1. Videoyu Çiz (Aynalama durumuna göre)
        ctx.save();
        if (state.mirrored) {
            ctx.translate(els.canvasCapture.width, 0); 
            ctx.scale(-1, 1); 
        }
        ctx.filter = state.filter; 
        ctx.drawImage(els.video, 0, 0);
        ctx.restore();

        // 2. Overlay (Aynasız, düz basılır)
        if (state.overlayImg && state.overlayImg !== 'none') {
            try {
                const overlayImage = await loadImage(state.overlayImg);
                ctx.globalCompositeOperation = 'screen'; 
                ctx.drawImage(overlayImage, 0, 0, els.canvasCapture.width, els.canvasCapture.height);
                ctx.globalCompositeOperation = 'source-over'; 
            } catch (e) { console.error("Overlay hatası", e); }
        }

        state.photos.push(els.canvasCapture.toDataURL()); 
        state.count++; 
        els.counter.innerText = state.count;

        if(state.count === state.max) {
            if(state.stream) state.stream.getTracks().forEach(t => t.stop());
            els.camera.classList.add('hidden'); 
            els.editor.classList.remove('hidden');
            renderFront(); renderBack();
        }
    });

    // ... (Geri kalan editor, render ve yardımcı fonksiyonlar aynı kalıyor)
    window.switchTab = (tabId, clickedBtn) => {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.glass-tab').forEach(btn => btn.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
        if(clickedBtn) clickedBtn.classList.add('active');
        if(tabId === 'tab-note') rotateCard(true); else rotateCard(false);
    };

    window.rotateCard = (forceBack) => {
        els.flipWrapper.classList.remove('flipped', 'flipped-rotate');
        let shouldFlip = (typeof forceBack === 'boolean') ? forceBack : !els.flipWrapper.classList.contains('flipped') && !els.flipWrapper.classList.contains('flipped-rotate');
        if(shouldFlip) { 
            if(state.layout.includes('v-strip') || state.layout === 'side-big' || state.layout === 'h-strip-43') els.flipWrapper.classList.add('flipped-rotate'); 
            else els.flipWrapper.classList.add('flipped'); 
        }
    };

    window.setLayout = (l) => { state.layout = l; renderFront(); renderBack(); };
    window.setShape = (s) => { state.shape = s; renderFront(); };
    window.setPattern = (p, color = null) => { state.pattern = p; if(color) state.color = color; renderFront(); renderBack(); };
    window.updateNote = (v) => { state.note = v; renderBack(); };
    window.setNoteColor = (c) => { state.noteColor = c; renderBack(); els.noteArea.style.color = c; };
    window.setNoteFont = (f) => { state.noteFont = f; renderBack(); els.noteArea.style.fontFamily = f; };
    window.toggleNoteBold = () => { state.noteBold = !state.noteBold; renderBack(); els.noteArea.style.fontWeight = state.noteBold ? 'bold' : 'normal'; };
    window.changeNoteSize = (delta) => { state.noteScale = Math.max(0.5, Math.min(3.0, state.noteScale + delta)); renderBack(); };

    async function renderFront() {
        const ctx = els.canvasFront.getContext('2d');
        let W = 900, H = 1200; 
        if (state.layout === 'v-strip-34') { W = 400; H = 2050; } 
        else if (state.layout === 'v-strip-43') { W = 400; H = 1200; } 
        else if (state.layout === 'h-strip-43') { W = 2050; H = 400; } 
        else if (state.layout === 'h-strip-34') { W = 1200; H = 400; }
        els.canvasFront.width = W; els.canvasFront.height = H;
        await drawBackground(ctx, W, H);
        const layouts = {
            'v-strip-34': [{x:20,y:30,w:360,h:480}, {x:20,y:530,w:360,h:480}, {x:20,y:1030,w:360,h:480}, {x:20,y:1530,w:360,h:480}], 
            'v-strip-43': [{x:20,y:40,w:360,h:270}, {x:20,y:330,w:360,h:270}, {x:20,y:620,w:360,h:270}, {x:20,y:910,w:360,h:270}],
            'h-strip-43': [{x:30,y:20,w:480,h:360}, {x:530,y:20,w:480,h:360}, {x:1030,y:20,w:480,h:360}, {x:1530,y:20,w:480,h:360}],
            'h-strip-34': [{x:40,y:20,w:270,h:360}, {x:330,y:20,w:270,h:360}, {x:620,y:20,w:270,h:360}, {x:910,y:20,w:270,h:360}],
            'grid': [{x:50,y:50,w:380,h:506}, {x:470,y:50,w:380,h:506}, {x:50,y:600,w:380,h:506}, {x:470,y:600,w:380,h:506}],
            'single': [{x:75,y:75,w:750,h:900}],
            'top-big': [{x:50,y:50,w:800,h:500}, {x:50,y:570,w:250,h:300}, {x:325,y:570,w:250,h:300}, {x:600,y:570,w:250,h:300}],
            'side-big': [{x:50,y:50,w:500,h:1100}, {x:570,y:50,w:280,h:350}, {x:570,y:425,w:280,h:350}, {x:570,y:800,w:280,h:350}]
        };
        const currentLayout = layouts[state.layout];
        const imgs = await Promise.all(state.photos.map(src => loadImage(src)));
        for(let i=0; i< (state.layout === 'single' ? 1 : imgs.length); i++) {
            if (!currentLayout[i]) continue;
            const pos = currentLayout[i];
            const img = imgs[i];
            ctx.save(); ctx.beginPath();
            if(state.shape==='rect') ctx.rect(pos.x,pos.y,pos.w,pos.h);
            else roundRect(ctx,pos.x,pos.y,pos.w,pos.h,30);
            ctx.clip();
            const sR = img.width/img.height, dR = pos.w/pos.h;
            let sW, sH, sX, sY;
            if(sR>dR) { sH=img.height; sW=img.height*dR; sX=(img.width-sW)/2; sY=0; }
            else { sW=img.width; sH=img.width/dR; sX=0; sY=(img.height-sH)/2; }
            ctx.drawImage(img,sX,sY,sW,sH,pos.x,pos.y,pos.w,pos.h);
            ctx.restore();
        }
    }

    async function renderBack() {
        const ctx = els.canvasBack.getContext('2d');
        const W = els.canvasFront.width, H = els.canvasFront.height;
        els.canvasBack.width = W; els.canvasBack.height = H;
        await drawBackground(ctx, W, H);
        if(state.note) {
            ctx.save();
            ctx.translate(W/2, H/2); ctx.scale(-1, 1); ctx.translate(-W/2, -H/2);
            ctx.fillStyle = state.noteColor;
            const baseFontSize = Math.min(W, H) * 0.05; 
            const finalFontSize = baseFontSize * state.noteScale; 
            ctx.font = `${state.noteBold ? 'bold ' : ''}${finalFontSize}px '${state.noteFont}'`; 
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            if(state.layout.includes('v-strip') || state.layout === 'side-big' || state.layout === 'h-strip-43') {
                ctx.translate(W/2, H/2); ctx.rotate(-Math.PI/2); ctx.translate(-W/2, -H/2);
                wrapText(ctx, state.note, W/2, H/2, H-200, finalFontSize * 1.3);
            } else { wrapText(ctx, state.note, W/2, H/2, W-100, finalFontSize * 1.3); }
            ctx.restore();
        }
    }

    async function drawBackground(ctx, W, H) {
        if (state.pattern && state.pattern !== 'none') {
            try { const img = await loadImage(state.pattern); const pattern = ctx.createPattern(img, 'repeat'); ctx.fillStyle = pattern; ctx.fillRect(0, 0, W, H); } 
            catch (e) { ctx.fillStyle = state.color; ctx.fillRect(0, 0, W, H); }
        } else { ctx.fillStyle = state.color; ctx.fillRect(0, 0, W, H); }
    }

    function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
    function loadImage(src) { return new Promise((r, rej) => { let i=new Image(); i.onload=()=>r(i); i.onerror=rej; i.src=src; }); }
    window.downloadFront = () => triggerDownload(els.canvasFront, 'On_Yuz');
    window.downloadBack = () => triggerDownload(els.canvasBack, 'Arka_Yuz');
    function triggerDownload(cvs, suffix) { const a = document.createElement('a'); a.download = `PhotoBooth_${suffix}_${Date.now()}.png`; a.href = cvs.toDataURL(); a.click(); }
    function roundRect(ctx,x,y,w,h,r) { ctx.beginPath(); ctx.roundRect(x,y,w,h,r); }
    function wrapText(ctx, text, x, y, maxWidth, lineHeight) { const words = text.split(' '); let line = ''; for(let n = 0; n < words.length; n++) { const testLine = line + words[n] + ' '; if (ctx.measureText(testLine).width > maxWidth && n > 0) { ctx.fillText(line, x, y); line = words[n] + ' '; y += lineHeight; } else { line = testLine; } } ctx.fillText(line, x, y); }

    // İndirme butonlarını bağla
    document.getElementById('btn-download-front').addEventListener('click', downloadFront);
    document.getElementById('btn-download-back').addEventListener('click', downloadBack);
});

