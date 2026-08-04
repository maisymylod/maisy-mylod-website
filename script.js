/* ═══════════════════════════════════════════════════════════════════
   Shared interactions.

   Motion rules for this site:
     - Animate transform and opacity only (plus stroke-dashoffset and the
       one width transition on .meter, which are cheap and non-layout).
     - Every effect has a prefers-reduced-motion path that lands on the
       final state immediately rather than being skipped.
     - IntersectionObserver for anything scroll-triggered. Exactly one
       rAF-throttled scroll listener, for the nav and the progress rule.
   ═══════════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const $  = (sel, root) => (root || document).querySelector(sel);
    const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

    /* ───────────────────── Scroll reveals ───────────────────── */

    function reveals() {
        const items = $$('.reveal, .fade-in');
        if (!items.length) return;

        // Assign a stagger delay to each child of a .stagger container.
        $$('.stagger').forEach(group => {
            Array.from(group.children).forEach((child, i) => {
                child.style.setProperty('--d', Math.min(i * 70, 420) + 'ms');
            });
        });

        if (REDUCED) {
            items.forEach(el => el.classList.add('in', 'visible'));
            return;
        }

        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('in', 'visible');
                io.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

        items.forEach(el => io.observe(el));
    }

    /* ───────────────────── Counters ─────────────────────
       data-counter holds the real value. The element renders "0" as a
       placeholder so there is no layout shift before the count runs. */

    function counters() {
        const nums = $$('[data-counter]');
        if (!nums.length) return;

        const format = (n) => n.toLocaleString('en-US');

        const run = (el) => {
            const target = parseFloat(el.dataset.counter);
            if (!isFinite(target)) return;
            if (REDUCED) { el.textContent = format(target); return; }

            const dur = 1400;
            const start = performance.now();

            const step = (now) => {
                const t = Math.min((now - start) / dur, 1);
                // out-expo, matching --ease-out
                const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
                el.textContent = format(Math.round(target * eased));
                if (t < 1) requestAnimationFrame(step);
                else el.textContent = format(target);
            };
            requestAnimationFrame(step);
        };

        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                run(entry.target);
                io.unobserve(entry.target);
            });
        }, { threshold: 0.5 });

        nums.forEach(el => io.observe(el));
    }

    /* ───────────────────── Measured meters ─────────────────────
       data-meter is a 0..1 fraction of the bar to fill. */

    function meters() {
        const bars = $$('.meter > i[data-meter]');
        if (!bars.length) return;

        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const pct = Math.max(0, Math.min(1, parseFloat(entry.target.dataset.meter) || 0));
                entry.target.style.width = (pct * 100).toFixed(1) + '%';
                io.unobserve(entry.target);
            });
        }, { threshold: 0.4 });

        bars.forEach(el => io.observe(el));
    }

    /* ───────────────────── Nav + scroll progress ─────────────────────
       One scroll listener, rAF-throttled, doing both jobs. */

    function navAndProgress() {
        const nav = $('.site-nav');
        const bar = $('.scroll-progress');
        let last = window.scrollY;
        let ticking = false;

        const update = () => {
            const y = window.scrollY;

            if (bar) {
                const max = document.documentElement.scrollHeight - window.innerHeight;
                bar.style.width = max > 0 ? ((y / max) * 100).toFixed(2) + '%' : '0%';
            }

            if (nav) {
                nav.classList.toggle('scrolled', y > 8);
                // Hide on downward scroll past the hero; always reveal on the way up.
                const goingDown = y > last && y > 260;
                nav.classList.toggle('hidden-up', goingDown && !menuOpen());
            }

            last = y;
            ticking = false;
        };

        const menuOpen = () => {
            const m = $('#mobile-menu');
            return m && !m.classList.contains('hidden');
        };

        window.addEventListener('scroll', () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(update);
        }, { passive: true });

        update();
    }

    /* ───────────────────── Mobile menu ───────────────────── */

    function mobileMenu() {
        const toggle = $('.nav-toggle');
        const menu = $('#mobile-menu');
        if (!toggle || !menu) return;

        toggle.addEventListener('click', () => {
            const open = menu.classList.toggle('hidden') === false;
            toggle.setAttribute('aria-expanded', String(open));
        });

        menu.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') menu.classList.add('hidden');
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 860) menu.classList.add('hidden');
        });
    }

    /* ───────────────────── Copy-to-clipboard commands ───────────────────── */

    function copyCommands() {
        $$('.copy-cmd').forEach(wrap => {
            const btn = $('.copy-icon', wrap);
            const code = $('code', wrap);
            if (!btn || !code) return;

            btn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(code.textContent.trim());
                    btn.classList.add('copied');
                    const label = btn.getAttribute('aria-label');
                    btn.setAttribute('aria-label', 'Copied');
                    setTimeout(() => {
                        btn.classList.remove('copied');
                        btn.setAttribute('aria-label', label);
                    }, 1400);
                } catch (err) {
                    /* Clipboard blocked (insecure context or denied permission).
                       Leave the command visible so it can still be selected. */
                }
            });
        });
    }

    /* ───────────────────── Command palette ───────────────────── */

    function palette() {
        const mask = $('.palette-mask');
        if (!mask) return;

        const input = $('.palette-input', mask);
        const list = $('.palette-list', mask);
        const all = $$('li', list);
        let cursor = 0;

        const visible = () => all.filter(li => li.style.display !== 'none');

        const paint = () => {
            const vis = visible();
            cursor = Math.max(0, Math.min(cursor, vis.length - 1));
            all.forEach(li => { li.classList.remove('active'); li.setAttribute('aria-selected', 'false'); });
            const active = vis[cursor];
            if (active) {
                active.classList.add('active');
                active.setAttribute('aria-selected', 'true');
                active.scrollIntoView({ block: 'nearest' });
            }
        };

        const open = () => {
            mask.classList.remove('hidden');
            input.value = '';
            all.forEach(li => { li.style.display = ''; });
            cursor = 0;
            paint();
            input.focus();
        };

        const close = () => mask.classList.add('hidden');
        const isOpen = () => !mask.classList.contains('hidden');

        const choose = (li) => {
            if (!li) return;
            close();
            const href = li.dataset.href;
            const section = li.dataset.section;
            if (href) {
                if (/^https?:|^mailto:/.test(href)) window.open(href, '_blank', 'noopener');
                else window.location.href = href;
            } else if (section) {
                const el = document.getElementById(section);
                if (el) el.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
            }
        };

        input.addEventListener('input', () => {
            const q = input.value.trim().toLowerCase();
            all.forEach(li => {
                const hay = (li.dataset.label || li.textContent).toLowerCase();
                li.style.display = !q || hay.includes(q) ? '' : 'none';
            });
            cursor = 0;
            paint();
        });

        list.addEventListener('click', (e) => {
            const li = e.target.closest('li');
            if (li) choose(li);
        });

        list.addEventListener('mousemove', (e) => {
            const li = e.target.closest('li');
            if (!li) return;
            const idx = visible().indexOf(li);
            if (idx > -1 && idx !== cursor) { cursor = idx; paint(); }
        });

        mask.addEventListener('mousedown', (e) => { if (e.target === mask) close(); });

        $$('[data-open-palette]').forEach(btn => btn.addEventListener('click', open));

        // g-then-key jump shortcuts, ignored while typing in a field.
        let awaitingG = false;
        let gTimer = null;
        const JUMPS = { h: 'index.html', e: 'experience.html', p: 'projects.html', d: 'dashboard.html', c: 'contact.html' };

        document.addEventListener('keydown', (e) => {
            const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);

            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                isOpen() ? close() : open();
                return;
            }

            if (isOpen()) {
                if (e.key === 'Escape') { e.preventDefault(); close(); }
                else if (e.key === 'ArrowDown') { e.preventDefault(); cursor++; paint(); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); cursor--; paint(); }
                else if (e.key === 'Enter') { e.preventDefault(); choose(visible()[cursor]); }
                return;
            }

            if (typing || e.metaKey || e.ctrlKey || e.altKey) return;

            if (awaitingG) {
                awaitingG = false;
                clearTimeout(gTimer);
                const dest = JUMPS[e.key.toLowerCase()];
                if (dest) { e.preventDefault(); window.location.href = dest; }
                return;
            }

            if (e.key.toLowerCase() === 'g') {
                awaitingG = true;
                gTimer = setTimeout(() => { awaitingG = false; }, 900);
            }
        });
    }

    /* ───────────────────── Hero diagram: the correction loop ─────────────────────

       Four nodes in a cycle. Edges draw themselves in with stroke-dashoffset,
       nodes fade in behind them, then a single packet circulates the loop
       forever at a slow, readable pace.

       Reduced motion: edges are already solid (the stylesheet clears the dash
       properties), nodes are already visible, and the packet never starts. */

    function correctionLoop() {
        const svg = $('#loop-svg');
        if (!svg) return;

        const edges = $$('.edge', svg);
        const nodes = $$('.node', svg);
        const packet = $('.packet', svg);

        if (REDUCED) {
            nodes.forEach(n => n.classList.add('lit'));
            return;
        }

        // Prime each edge as a fully-offset dash so it can draw in.
        const lengths = edges.map(edge => {
            const len = edge.getTotalLength();
            edge.style.strokeDasharray = len;
            edge.style.strokeDashoffset = len;
            edge.style.transition = 'none';
            return len;
        });

        let started = false;

        const draw = () => {
            if (started) return;
            started = true;

            nodes.forEach((node, i) => {
                setTimeout(() => node.classList.add('lit'), 120 + i * 130);
            });

            edges.forEach((edge, i) => {
                setTimeout(() => {
                    edge.style.transition = 'stroke-dashoffset 620ms cubic-bezier(0.16, 1, 0.3, 1)';
                    edge.style.strokeDashoffset = '0';
                }, 320 + i * 190);
            });

            setTimeout(circulate, 320 + edges.length * 190 + 700);
        };

        // Move the packet along the concatenated edge path, one segment at a time.
        function circulate() {
            if (!packet || !edges.length) return;

            const total = lengths.reduce((a, b) => a + b, 0);
            const SPEED = 58; // px of path per second — slow enough to follow
            const cycle = (total / SPEED) * 1000;
            let t0 = null;

            packet.style.opacity = '1';

            const frame = (now) => {
                if (t0 === null) t0 = now;
                const phase = ((now - t0) % cycle) / cycle;
                let travelled = phase * total;

                let i = 0;
                while (i < lengths.length - 1 && travelled > lengths[i]) {
                    travelled -= lengths[i];
                    i++;
                }

                const pt = edges[i].getPointAtLength(Math.min(travelled, lengths[i]));
                packet.setAttribute('cx', pt.x);
                packet.setAttribute('cy', pt.y);

                requestAnimationFrame(frame);
            };

            requestAnimationFrame(frame);
        }

        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                draw();
                io.disconnect();
            });
        }, { threshold: 0.25 });

        io.observe(svg);
    }

    /* ───────────────────── Boot ───────────────────── */

    function boot() {
        reveals();
        counters();
        meters();
        navAndProgress();
        mobileMenu();
        copyCommands();
        palette();
        correctionLoop();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
}());
