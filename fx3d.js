(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let css = `
.logo{perspective:260px}
.mark{animation:lqSpin 9s ease-in-out infinite;transform-style:preserve-3d;filter:drop-shadow(0 4px 6px rgba(0,0,0,.35))}
@keyframes lqSpin{0%,55%{transform:rotateY(0)}80%,100%{transform:rotateY(360deg)}}
.view{z-index:1}
html.lq-3d .pad{padding-top:214px}
#lq3d{position:fixed;top:calc(56px + env(safe-area-inset-top,0px));left:0;width:100%;height:170px;z-index:0;pointer-events:none}
body[data-tab=reels] #lq3d{display:none}
.btn{box-shadow:0 5px 0 rgba(140,10,50,.5),0 12px 20px -6px rgba(224,36,94,.45);transition:transform .1s,box-shadow .1s}
.btn:active{transform:translateY(4px);box-shadow:0 1px 0 rgba(140,10,50,.5),0 4px 8px -4px rgba(224,36,94,.4)}
.btn.ghost{box-shadow:0 4px 0 var(--ln)}
.btn.ghost:active{box-shadow:0 1px 0 var(--ln)}
.btn:disabled{box-shadow:none}
.place,.stat div,.fin,.vcard{box-shadow:0 10px 22px -12px rgba(40,20,80,.45);transition:transform .25s ease,box-shadow .25s}
.lq-t{transform:perspective(520px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg)) scale(.97)!important;transition:transform .08s!important;box-shadow:0 16px 28px -10px rgba(40,20,80,.6)!important}
@keyframes lqIn{from{opacity:0;transform:perspective(700px) translateY(22px) rotateX(-16deg)}}
.place,.vcard,.feat,.stat div{animation:lqIn .55s cubic-bezier(.2,.8,.2,1) backwards}
nav{box-shadow:0 -10px 30px -12px rgba(30,10,60,.35)}
nav button svg{transition:transform .25s,filter .25s}
nav button.on svg{transform:translateY(-3px) scale(1.2);filter:drop-shadow(0 6px 5px rgba(224,36,94,.5))}
@media (prefers-reduced-motion:reduce){.mark,.place,.vcard,.feat,.stat div{animation:none!important}}
`;
  for (let i = 2; i <= 8; i++) {
    const d = ((i - 1) * 0.06).toFixed(2);
    css += `.place:nth-child(${i}),.vcard:nth-child(${i}){animation-delay:${d}s}`;
  }
  const st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);
  if (reduce) return;

  /* touch tilt on cards */
  let cur = null;
  const sel = '.place,.vcard,.feat,.stat div';
  const tilt = (el, e) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--rx', (-y * 14) + 'deg');
    el.style.setProperty('--ry', (x * 14) + 'deg');
  };
  addEventListener('pointerdown', e => {
    const el = e.target.closest && e.target.closest(sel);
    if (!el) return;
    cur = el; el.classList.add('lq-t'); tilt(el, e);
  }, { passive: true });
  addEventListener('pointermove', e => { if (cur) tilt(cur, e); }, { passive: true });
  const end = () => { if (cur) { cur.classList.remove('lq-t'); cur = null; } };
  addEventListener('pointerup', end);
  addEventListener('pointercancel', end);

  /* 3D donut hero */
  import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js').then(T => {
    const cv = document.createElement('canvas');
    cv.id = 'lq3d';
    document.body.appendChild(cv);
    let r;
    try { r = new T.WebGLRenderer({ canvas: cv, alpha: true, antialias: true }); }
    catch (e) { cv.remove(); return; }
    r.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    const sc = new T.Scene();
    const cam = new T.PerspectiveCamera(35, 1, 0.1, 50);
    cam.position.set(0, 0, 5.4);
    sc.add(new T.AmbientLight(0xffffff, 1.1));
    const d1 = new T.DirectionalLight(0xffffff, 2.2); d1.position.set(3, 5, 4); sc.add(d1);
    const d2 = new T.DirectionalLight(0xff9dbb, 1); d2.position.set(-4, -2, 3); sc.add(d2);
    const pivot = new T.Group(), don = new T.Group();
    pivot.add(don); sc.add(pivot);
    const dough = new T.Mesh(new T.TorusGeometry(1, 0.45, 28, 72), new T.MeshStandardMaterial({ color: 0xe8a35a, roughness: 0.7 }));
    dough.rotation.x = Math.PI / 2; dough.position.y = -0.08; don.add(dough);
    const ice = new T.Mesh(new T.TorusGeometry(1, 0.47, 28, 72), new T.MeshStandardMaterial({ color: 0xff5d8f, roughness: 0.3, metalness: 0.05 }));
    ice.rotation.x = Math.PI / 2; ice.scale.z = 0.55; ice.position.y = 0.14; don.add(ice);
    const cols = [0xffffff, 0xffe14d, 0x7be0c3, 0x6aa7ff];
    for (let i = 0; i < 46; i++) {
      const a = Math.random() * Math.PI * 2;
      const t = Math.PI / 2 + (Math.random() - 0.5) * 1.5;
      const rr = 1 + 0.47 * Math.cos(t);
      const s = new T.Mesh(new T.CapsuleGeometry(0.035, 0.13, 4, 8), new T.MeshStandardMaterial({ color: cols[i % 4], roughness: 0.5 }));
      s.position.set(rr * Math.cos(a), 0.14 + 0.47 * 0.55 * Math.sin(t) + 0.02, rr * Math.sin(a));
      s.rotation.set(0, Math.random() * Math.PI, Math.PI / 2);
      don.add(s);
    }
    pivot.rotation.x = 0.95;
    const size = () => {
      const w = innerWidth;
      r.setSize(w, 170, false);
      cam.aspect = w / 170;
      cam.updateProjectionMatrix();
    };
    size();
    addEventListener('resize', size);
    document.documentElement.classList.add('lq-3d');
    const t0 = performance.now();
    const loop = n => {
      requestAnimationFrame(loop);
      if (document.hidden || document.body.dataset.tab === 'reels') return;
      const v = document.querySelector('.view.on');
      const sy = v ? v.scrollTop : 0;
      const o = Math.max(0, 1 - sy / 170);
      cv.style.opacity = o;
      if (o <= 0) return;
      const t = (n - t0) / 1000;
      don.rotation.y = t * 0.6 + sy * 0.012;
      pivot.rotation.x = 0.95 + Math.sin(t * 0.7) * 0.12;
      pivot.position.y = Math.sin(t * 1.2) * 0.06;
      r.render(sc, cam);
    };
    requestAnimationFrame(loop);
  }).catch(() => {});
})();
