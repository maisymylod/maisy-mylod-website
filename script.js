/* Site-wide interactions. All features detect-and-skip if their elements are absent. */
(function () {
    'use strict';

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /**
     * Set up a canvas: size its drawing buffer to match its CSS box at the
     * current devicePixelRatio. Re-sizes on viewport resize + on ResizeObserver
     * so it survives slow layout (fonts loading, fade-in transforms, etc.).
     * Returns { ctx, dpr, ready } — `ready` is a Promise that resolves the
     * first time the canvas has nonzero dimensions.
     */
    function setupCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        let sized = false;
        let resolveReady;
        const ready = new Promise(res => { resolveReady = res; });
        const resize = () => {
            const r = canvas.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) return;
            canvas.width = Math.round(r.width * dpr);
            canvas.height = Math.round(r.height * dpr);
            if (!sized) { sized = true; resolveReady(); }
        };
        resize();
        if ('ResizeObserver' in window) {
            const ro = new ResizeObserver(resize);
            ro.observe(canvas);
        }
        window.addEventListener('resize', resize);
        return { ctx, dpr, ready };
    }

    // ─── Sticky-nav hide on scroll-down, show on scroll-up ────────────
    (function nav() {
        const nav = document.querySelector('.site-nav');
        if (!nav) return;
        let lastY = window.scrollY;
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const y = window.scrollY;
                if (y > lastY && y > 120) nav.classList.add('hidden');
                else nav.classList.remove('hidden');
                lastY = y;
                ticking = false;
            });
        }, { passive: true });
    }());

    // ─── Scroll-progress bar ───────────────────────────────────────────
    (function progress() {
        const bar = document.querySelector('.scroll-progress');
        if (!bar) return;
        const update = () => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
            bar.style.width = pct + '%';
        };
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        update();
    }());

    // ─── Reveal-on-scroll via IntersectionObserver ────────────────────
    (function reveals() {
        if (reducedMotion) {
            document.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
            return;
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add('visible');
                    io.unobserve(e.target);
                }
            });
        }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
        document.querySelectorAll('.fade-in').forEach(el => io.observe(el));
    }());

    // ─── Animated counters (fire once on enter; never ship zeros) ─────
    (function counters() {
        const els = document.querySelectorAll('[data-counter]');
        if (!els.length) return;
        const animate = (el) => {
            const target = Number(el.dataset.counter);
            if (!Number.isFinite(target)) return;
            if (reducedMotion) { el.textContent = target.toLocaleString(); return; }
            const dur = 1400;
            const start = performance.now();
            const tick = (now) => {
                const t = Math.min((now - start) / dur, 1);
                const eased = 1 - Math.pow(1 - t, 3);
                el.textContent = Math.round(target * eased).toLocaleString();
                if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        };
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); }
            });
        }, { threshold: 0.4 });
        els.forEach(el => { el.textContent = '0'; io.observe(el); });
    }());

    // ─── Marquee: duplicate inner items in-place for a seamless -50% loop ─
    (function marquee() {
        document.querySelectorAll('.marquee-track').forEach(track => {
            Array.from(track.children).forEach(child => {
                const c = child.cloneNode(true);
                c.setAttribute('aria-hidden', 'true');
                track.appendChild(c);
            });
        });
    }());

    // ─── Copy-command buttons ─────────────────────────────────────────
    (function copyCmd() {
        document.querySelectorAll('.copy-icon').forEach(btn => {
            btn.addEventListener('click', async () => {
                const target = btn.closest('.copy-cmd').querySelector('code');
                if (!target) return;
                try {
                    await navigator.clipboard.writeText(target.innerText.replace(/^\$\s*/, ''));
                    btn.classList.add('copied');
                    setTimeout(() => btn.classList.remove('copied'), 1200);
                } catch (_) { /* noop */ }
            });
        });
    }());

    // ─── Command palette (Cmd/Ctrl-K + arrow keys + Enter + Esc) ──────
    (function palette() {
        const mask = document.querySelector('.palette-mask');
        if (!mask) return;
        const input = mask.querySelector('.palette-input');
        const list = mask.querySelector('.palette-list');
        const items = Array.from(list.querySelectorAll('li'));
        let activeIdx = 0;

        const setActive = (i) => {
            activeIdx = (i + items.length) % items.length;
            items.forEach((it, idx) => it.classList.toggle('active', idx === activeIdx));
            items[activeIdx].scrollIntoView({ block: 'nearest' });
        };
        const filter = (q) => {
            const needle = q.trim().toLowerCase();
            let firstVisible = -1;
            items.forEach((it, i) => {
                const match = !needle || it.dataset.label.toLowerCase().includes(needle);
                it.style.display = match ? '' : 'none';
                if (match && firstVisible === -1) firstVisible = i;
            });
            if (firstVisible >= 0) setActive(firstVisible);
        };
        const visibleItems = () => items.filter(it => it.style.display !== 'none');
        const move = (delta) => {
            const vis = visibleItems();
            if (!vis.length) return;
            const currentVisIdx = vis.indexOf(items[activeIdx]);
            const next = vis[(currentVisIdx + delta + vis.length) % vis.length];
            setActive(items.indexOf(next));
        };
        const execute = () => {
            const it = items[activeIdx];
            if (!it || it.style.display === 'none') return;
            const href = it.dataset.href;
            const section = it.dataset.section;
            close();
            if (href) window.location.href = href;
            else if (section) {
                const el = document.getElementById(section);
                if (el) el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
            }
        };
        const open = () => {
            mask.classList.remove('hidden');
            input.value = '';
            filter('');
            setActive(0);
            setTimeout(() => input.focus(), 30);
        };
        const close = () => mask.classList.add('hidden');

        document.addEventListener('keydown', (e) => {
            const meta = e.metaKey || e.ctrlKey;
            if (meta && e.key.toLowerCase() === 'k') { e.preventDefault(); open(); return; }
            if (mask.classList.contains('hidden')) return;
            if (e.key === 'Escape')        { e.preventDefault(); close(); }
            else if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
            else if (e.key === 'ArrowUp')   { e.preventDefault(); move(-1); }
            else if (e.key === 'Enter')     { e.preventDefault(); execute(); }
        });

        input.addEventListener('input', () => filter(input.value));
        items.forEach((it, i) => {
            it.addEventListener('click', () => { setActive(i); execute(); });
            it.addEventListener('mouseenter', () => setActive(i));
        });
        mask.addEventListener('click', (e) => { if (e.target === mask) close(); });

        // Trigger button (in nav)
        document.querySelectorAll('[data-open-palette]').forEach(b => {
            b.addEventListener('click', open);
        });
    }());

    // ─── Mobile menu toggle ───────────────────────────────────────────
    (function mobileMenu() {
        const toggle = document.querySelector('.nav-toggle');
        const menu = document.getElementById('mobile-menu');
        if (!toggle || !menu) return;
        toggle.addEventListener('click', () => {
            menu.classList.toggle('hidden');
        });
        menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.add('hidden')));
    }());

    // ─── Cycling stack list ───────────────────────────────────────────
    (function cycle() {
        document.querySelectorAll('.cycling-list').forEach(list => {
            const items = list.querySelectorAll('.item');
            if (!items.length) return;
            let i = 0;
            items[0].classList.add('active');
            if (reducedMotion) return;
            setInterval(() => {
                items[i].classList.remove('active');
                i = (i + 1) % items.length;
                items[i].classList.add('active');
            }, 2400);
        });
    }());

    // ─── HERO SHOWPIECE: spectral graph community detection ──────────
    async function showpieceMain() {
        const left = document.getElementById('showpiece-raw');
        const right = document.getElementById('showpiece-cluster');
        if (!left || !right) return;

        const COMMUNITY_COLORS = ['#8ec07c', '#d3869b', '#fabd2f', '#83a598'];
        const NUM_NODES = 60;
        const NUM_COMMUNITIES = 4;

        // Build a planted partition graph (nodes split into k clusters; dense within, sparse across)
        const nodes = [];
        const edges = [];
        for (let i = 0; i < NUM_NODES; i++) {
            nodes.push({
                id: i,
                community: i % NUM_COMMUNITIES,
                x: Math.random(), y: Math.random(),
                vx: 0, vy: 0
            });
        }
        for (let i = 0; i < NUM_NODES; i++) {
            for (let j = i + 1; j < NUM_NODES; j++) {
                const sameC = nodes[i].community === nodes[j].community;
                const pIn = 0.22, pOut = 0.018;
                if (Math.random() < (sameC ? pIn : pOut)) {
                    edges.push({ a: i, b: j, cross: !sameC });
                }
            }
        }

        const leftCtx = setupCanvas(left);
        const rightCtx = setupCanvas(right);
        await Promise.all([leftCtx.ready, rightCtx.ready]);

        // Independent node positions for each side so we can run different physics.
        const cloneNodes = () => nodes.map(n => ({ ...n }));
        let rawNodes = cloneNodes();
        let cluNodes = cloneNodes();

        // Cluster anchors for the right-side layout
        const clusterAnchor = (c, t) => {
            const angle = (c / NUM_COMMUNITIES) * Math.PI * 2 + t * 0.05;
            return { x: 0.5 + 0.27 * Math.cos(angle), y: 0.5 + 0.27 * Math.sin(angle) };
        };

        const step = (set, mode, t) => {
            // Forces
            for (let i = 0; i < set.length; i++) {
                const ni = set[i];
                let fx = 0, fy = 0;
                // Repulsion
                for (let j = 0; j < set.length; j++) {
                    if (i === j) continue;
                    const nj = set[j];
                    let dx = ni.x - nj.x, dy = ni.y - nj.y;
                    let d2 = dx * dx + dy * dy + 0.0008;
                    const f = 0.00025 / d2;
                    fx += dx * f; fy += dy * f;
                }
                // Centering / cluster pull
                if (mode === 'cluster') {
                    const anc = clusterAnchor(ni.community, t);
                    fx += (anc.x - ni.x) * 0.022;
                    fy += (anc.y - ni.y) * 0.022;
                } else {
                    fx += (0.5 - ni.x) * 0.006;
                    fy += (0.5 - ni.y) * 0.006;
                }
                ni.vx = (ni.vx + fx) * 0.86;
                ni.vy = (ni.vy + fy) * 0.86;
            }
            // Spring edges
            for (const e of edges) {
                const a = set[e.a], b = set[e.b];
                const dx = b.x - a.x, dy = b.y - a.y;
                const d = Math.sqrt(dx * dx + dy * dy) + 1e-6;
                const target = (mode === 'cluster' && e.cross) ? 0.32 : (mode === 'cluster' ? 0.06 : 0.13);
                const k = (e.cross && mode === 'cluster') ? 0.005 : 0.025;
                const f = (d - target) * k;
                const nx = dx / d, ny = dy / d;
                a.vx += nx * f; a.vy += ny * f;
                b.vx -= nx * f; b.vy -= ny * f;
            }
            // Integrate + clamp
            for (const n of set) {
                n.x += n.vx; n.y += n.vy;
                if (n.x < 0.04) { n.x = 0.04; n.vx *= -0.4; }
                if (n.x > 0.96) { n.x = 0.96; n.vx *= -0.4; }
                if (n.y < 0.04) { n.y = 0.04; n.vy *= -0.4; }
                if (n.y > 0.96) { n.y = 0.96; n.vy *= -0.4; }
            }
        };

        const draw = (canvas, ctx, set, mode) => {
            const w = canvas.width, h = canvas.height;
            ctx.clearRect(0, 0, w, h);
            // edges
            ctx.lineWidth = 1 * (ctx.dpr || 1);
            for (const e of edges) {
                const a = set[e.a], b = set[e.b];
                if (mode === 'cluster') {
                    if (e.cross) {
                        ctx.strokeStyle = 'rgba(235,219,178,0.05)';
                    } else {
                        const c = COMMUNITY_COLORS[a.community];
                        ctx.strokeStyle = c + '55';
                    }
                } else {
                    ctx.strokeStyle = 'rgba(235,219,178,0.13)';
                }
                ctx.beginPath();
                ctx.moveTo(a.x * w, a.y * h);
                ctx.lineTo(b.x * w, b.y * h);
                ctx.stroke();
            }
            // nodes
            const dpr = window.devicePixelRatio || 1;
            for (const n of set) {
                const r = 4 * dpr;
                const color = mode === 'cluster' ? COMMUNITY_COLORS[n.community] : '#928374';
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(n.x * w, n.y * h, r, 0, Math.PI * 2);
                ctx.fill();
                if (mode === 'cluster') {
                    ctx.fillStyle = color + '33';
                    ctx.beginPath();
                    ctx.arc(n.x * w, n.y * h, r * 2.2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        };

        // Init: settle each side for a few frames
        for (let s = 0; s < 200; s++) step(rawNodes, 'raw', 0);
        for (let s = 0; s < 200; s++) step(cluNodes, 'cluster', 0);

        leftCtx.ctx.dpr = leftCtx.dpr;
        rightCtx.ctx.dpr = rightCtx.dpr;

        if (reducedMotion) {
            draw(left, leftCtx.ctx, rawNodes, 'raw');
            draw(right, rightCtx.ctx, cluNodes, 'cluster');
            return;
        }

        let t = 0;
        const loop = () => {
            t += 0.01;
            step(rawNodes, 'raw', t);
            step(cluNodes, 'cluster', t);
            draw(left, leftCtx.ctx, rawNodes, 'raw');
            draw(right, rightCtx.ctx, cluNodes, 'cluster');
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
    showpieceMain();

    // ─── MATH DEMO 1: Monte Carlo / GBM ───────────────────────────────
    async function monteCarloMain() {
        const canvas = document.getElementById('monte-carlo-canvas');
        if (!canvas) return;
        const { ctx, dpr, ready } = setupCanvas(canvas);
        await ready;

        const PATHS = 28, STEPS = 120;
        const S0 = 100, mu = 0.08, sigma = 0.22, T = 1, dt = T / STEPS;

        const generate = () => {
            const out = [];
            for (let p = 0; p < PATHS; p++) {
                const path = [S0];
                let s = S0;
                for (let i = 1; i <= STEPS; i++) {
                    const z = Math.sqrt(-2 * Math.log(Math.random() || 1e-9)) * Math.cos(2 * Math.PI * Math.random());
                    s = s * Math.exp((mu - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * z);
                    path.push(s);
                }
                out.push(path);
            }
            return out;
        };

        const draw = (paths, frame) => {
            const w = canvas.width, h = canvas.height;
            ctx.clearRect(0, 0, w, h);
            // background gridlines
            ctx.strokeStyle = 'rgba(235,219,178,0.05)';
            ctx.lineWidth = 1 * dpr;
            for (let i = 1; i < 5; i++) {
                ctx.beginPath();
                ctx.moveTo(0, (i / 5) * h);
                ctx.lineTo(w, (i / 5) * h);
                ctx.stroke();
            }
            // find range
            let lo = Infinity, hi = -Infinity;
            for (const p of paths) for (const v of p) { if (v < lo) lo = v; if (v > hi) hi = v; }
            const pad = (hi - lo) * 0.05;
            lo -= pad; hi += pad;
            const xStep = w / STEPS;
            const yFor = v => h - ((v - lo) / (hi - lo)) * h;

            const drawUpto = Math.min(STEPS, Math.floor(frame));
            for (let p = 0; p < paths.length; p++) {
                const path = paths[p];
                ctx.strokeStyle = p < PATHS - 1 ? 'rgba(142,192,124,0.22)' : 'rgba(211,134,155,0.85)';
                ctx.lineWidth = (p === PATHS - 1 ? 1.6 : 0.9) * dpr;
                ctx.beginPath();
                ctx.moveTo(0, yFor(path[0]));
                for (let i = 1; i <= drawUpto; i++) ctx.lineTo(i * xStep, yFor(path[i]));
                ctx.stroke();
            }
            // axes labels
            ctx.fillStyle = 'rgba(235,219,178,0.4)';
            ctx.font = `${10 * dpr}px 'B612 Mono', monospace`;
            ctx.fillText('S₀=100  μ=0.08  σ=0.22', 8 * dpr, 16 * dpr);
        };

        let paths = generate();
        let frame = 0;
        if (reducedMotion) { draw(paths, STEPS); return; }
        const tick = () => {
            frame += 1.4;
            if (frame > STEPS + 60) { frame = 0; paths = generate(); }
            draw(paths, frame);
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }
    monteCarloMain();

    // ─── MATH DEMO 2: Spectral graph (smaller, denser, looped) ────────
    async function spectralDemoMain() {
        const canvas = document.getElementById('graph-canvas');
        if (!canvas) return;
        const { ctx, dpr, ready } = setupCanvas(canvas);
        await ready;

        const COLORS = ['#8ec07c', '#d3869b', '#fabd2f'];
        const N = 24, K = 3;
        const nodes = [];
        for (let i = 0; i < N; i++) {
            nodes.push({ c: i % K, x: 0.5 + 0.05 * (Math.random() - 0.5), y: 0.5 + 0.05 * (Math.random() - 0.5), vx: 0, vy: 0 });
        }
        const edges = [];
        for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
            if (Math.random() < (nodes[i].c === nodes[j].c ? 0.35 : 0.04)) edges.push({ a: i, b: j });
        }

        const draw = (t) => {
            const w = canvas.width, h = canvas.height;
            ctx.clearRect(0, 0, w, h);
            // simple force step
            for (let i = 0; i < N; i++) {
                const ni = nodes[i];
                const anc = { x: 0.5 + 0.28 * Math.cos((ni.c / K) * Math.PI * 2 + t * 0.08), y: 0.5 + 0.28 * Math.sin((ni.c / K) * Math.PI * 2 + t * 0.08) };
                ni.vx = (ni.vx + (anc.x - ni.x) * 0.04) * 0.84;
                ni.vy = (ni.vy + (anc.y - ni.y) * 0.04) * 0.84;
                for (let j = 0; j < N; j++) {
                    if (i === j) continue;
                    const nj = nodes[j];
                    const dx = ni.x - nj.x, dy = ni.y - nj.y;
                    const d2 = dx * dx + dy * dy + 0.001;
                    ni.vx += dx * 0.0003 / d2;
                    ni.vy += dy * 0.0003 / d2;
                }
                ni.x += ni.vx; ni.y += ni.vy;
            }
            // edges
            ctx.lineWidth = 1 * dpr;
            for (const e of edges) {
                const a = nodes[e.a], b = nodes[e.b];
                const sameC = a.c === b.c;
                ctx.strokeStyle = sameC ? (COLORS[a.c] + '60') : 'rgba(235,219,178,0.06)';
                ctx.beginPath();
                ctx.moveTo(a.x * w, a.y * h);
                ctx.lineTo(b.x * w, b.y * h);
                ctx.stroke();
            }
            // nodes
            for (const n of nodes) {
                ctx.fillStyle = COLORS[n.c];
                ctx.beginPath();
                ctx.arc(n.x * w, n.y * h, 5 * dpr, 0, Math.PI * 2);
                ctx.fill();
            }
        };
        if (reducedMotion) { for (let s = 0; s < 120; s++) draw(s * 0.01); return; }
        let t = 0;
        const tick = () => { t += 0.012; draw(t); requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
    }
    spectralDemoMain();

    // ─── MATH DEMO 3: Persistent homology (Rips complex growing) ──────
    async function topologyDemoMain() {
        const canvas = document.getElementById('topology-canvas');
        if (!canvas) return;
        const { ctx, dpr, ready } = setupCanvas(canvas);
        await ready;

        // 24 points roughly on two concentric circles + noise (so H1 = 2 should emerge)
        const points = [];
        for (let i = 0; i < 14; i++) {
            const a = (i / 14) * Math.PI * 2;
            points.push({ x: 0.5 + 0.28 * Math.cos(a) + (Math.random() - 0.5) * 0.02, y: 0.5 + 0.28 * Math.sin(a) + (Math.random() - 0.5) * 0.02 });
        }
        for (let i = 0; i < 10; i++) {
            const a = (i / 10) * Math.PI * 2 + 0.2;
            points.push({ x: 0.5 + 0.12 * Math.cos(a) + (Math.random() - 0.5) * 0.015, y: 0.5 + 0.12 * Math.sin(a) + (Math.random() - 0.5) * 0.015 });
        }

        const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
        const PAIRS = [];
        for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++)
            PAIRS.push({ i, j, d: dist(points[i], points[j]) });
        PAIRS.sort((a, b) => a.d - b.d);

        const draw = (radius) => {
            const w = canvas.width, h = canvas.height;
            ctx.clearRect(0, 0, w, h);
            // triangles when 3 points are mutually within 2*radius (loose)
            // skipped for perf; edges suffice for the visual
            ctx.lineWidth = 1 * dpr;
            ctx.strokeStyle = 'rgba(142,192,124,0.32)';
            for (const p of PAIRS) {
                if (p.d > 2 * radius) break;
                const a = points[p.i], b = points[p.j];
                ctx.beginPath();
                ctx.moveTo(a.x * w, a.y * h);
                ctx.lineTo(b.x * w, b.y * h);
                ctx.stroke();
            }
            for (const pt of points) {
                ctx.fillStyle = 'rgba(216,134,155,0.35)';
                ctx.beginPath();
                ctx.arc(pt.x * w, pt.y * h, radius * Math.min(w, h), 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#d3869b';
                ctx.beginPath();
                ctx.arc(pt.x * w, pt.y * h, 3 * dpr, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        if (reducedMotion) { draw(0.08); return; }
        let r = 0.005, dir = 1;
        const tick = () => {
            r += 0.0008 * dir;
            if (r > 0.16) dir = -1;
            if (r < 0.005) dir = 1;
            draw(r);
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }
    topologyDemoMain();

    // ─── Hero ambient flow field ───────────────────────────────────────
    // Full-bleed drifting particle field behind the hero. Particles follow a
    // smooth pseudo-noise vector field (no noise lib); soft trails come from a
    // faint per-frame fade. Palette = accent green / accent-light / cyan-purple.
    // Reduced motion → settle a static frame and stop. Pauses when off-screen.
    (function heroFlow() {
        const canvas = document.getElementById('hero-flow');
        if (!canvas) return;
        const { ctx, dpr, ready } = setupCanvas(canvas);

        // theme tokens as "rgba(r,g,b," prefixes — alpha appended per stroke
        const COLORS = [
            'rgba(142,192,124,',  // --accent
            'rgba(184,187,38,',   // --accent-light
            'rgba(211,134,155,',  // --cyan
        ];
        const SPEED = 0.55 * dpr;
        let particles = [];

        const rand = (a, b) => a + Math.random() * (b - a);

        function newParticle() {
            return {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                life: Math.random() * 200,
                maxLife: rand(140, 320),
                c: COLORS[(Math.random() * COLORS.length) | 0],
                w: rand(0.5, 1.4),
            };
        }

        // Smooth, cheap, divergence-y angle field. t animates the whole field.
        function field(x, y, t) {
            const s = 0.0011 / dpr;
            return (
                Math.sin(x * s + t) +
                Math.cos(y * s * 1.3 - t * 0.8) +
                Math.sin((x + y) * s * 0.6 + t * 0.5)
            ) * 1.05 * Math.PI;
        }

        function advance(p, t) {
            const px = p.x, py = p.y;
            const a = field(p.x, p.y, t);
            p.x += Math.cos(a) * SPEED;
            p.y += Math.sin(a) * SPEED;
            p.life++;
            const fade = Math.sin((p.life / p.maxLife) * Math.PI); // 0 → 1 → 0
            ctx.strokeStyle = p.c + (0.42 * fade).toFixed(3) + ')';
            ctx.lineWidth = p.w * dpr;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
            if (p.life > p.maxLife ||
                p.x < -30 || p.x > canvas.width + 30 ||
                p.y < -30 || p.y > canvas.height + 30) {
                Object.assign(p, newParticle(), { life: 0 });
            }
        }

        function fadeFrame() {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = 'rgba(29,32,33,0.075)'; // --bg-deep wash → soft trails
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'lighter';
        }

        function spawnToFill() {
            const count = Math.min(
                240,
                Math.round((canvas.width * canvas.height) / (11000 * dpr * dpr))
            );
            particles = Array.from({ length: count }, newParticle);
        }

        ready.then(() => {
            spawnToFill();

            if (reducedMotion) {
                // No animation: trace each particle as one frozen flow-line at a
                // constant alpha (skip the life-based fade so the still is visible).
                // Re-render on resize — assigning canvas.width (in setupCanvas's
                // own ResizeObserver) clears the buffer, so a one-shot draw would
                // be wiped when fonts finish loading and the hero reflows.
                const renderStatic = () => {
                    spawnToFill();
                    ctx.clearRect(0, 0, canvas.width, canvas.height); // idempotent across resizes
                    ctx.globalCompositeOperation = 'lighter';
                    ctx.lineCap = 'round';
                    for (const p of particles) {
                        ctx.strokeStyle = p.c + '0.85)';
                        ctx.lineWidth = (p.w + 0.6) * dpr;
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        for (let i = 0; i < 80; i++) {
                            const a = field(p.x, p.y, 0.6);
                            p.x += Math.cos(a) * SPEED * 1.8;
                            p.y += Math.sin(a) * SPEED * 1.8;
                            ctx.lineTo(p.x, p.y);
                        }
                        ctx.stroke();
                    }
                };
                renderStatic();
                if ('ResizeObserver' in window) {
                    new ResizeObserver(renderStatic).observe(canvas);
                }
                return;
            }

            let t = 0;
            let running = false;
            const loop = () => {
                if (!running) return;
                t += 0.0016;
                fadeFrame();
                for (const p of particles) advance(p, t);
                requestAnimationFrame(loop);
            };

            // Only animate while the hero is on screen.
            const hero = document.getElementById('hero');
            if ('IntersectionObserver' in window && hero) {
                const io = new IntersectionObserver((entries) => {
                    const visible = entries[0].isIntersecting;
                    if (visible && !running) { running = true; requestAnimationFrame(loop); }
                    else if (!visible) { running = false; }
                }, { threshold: 0 });
                io.observe(hero);
            } else {
                running = true;
                requestAnimationFrame(loop);
            }
        });
    }());

}());
