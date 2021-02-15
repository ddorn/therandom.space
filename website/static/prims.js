function animation() {
    const NB_POINTS = Math.max(window.innerHeight, window.innerWidth) / 20;
    const MAX_VEL = 0.2;
    const FADE_DURATION = 3;
    const PI = Math.PI;
    const INF = 999999;
    const COLORS = [ '#ffa500',  '#ff3c00', '#ffd100'];
    let running = true;
    let canvas = document.getElementById('bg-canvas');
    let ctx = canvas.getContext('2d');

    let w = window.innerWidth;
    let h = window.innerHeight;
    let mouse = { x: w / 2, y: h / 2 };
    let lastScroll = window.scrollY;
    resize()

    let points = [];
    let edges = [];
    let oldEdges = [];
    let edge_show = 0;

    function rand(mini, maxi) { return Math.random() * (maxi - mini) + mini}
    function dist(a, b) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }
    function dist(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
    function ease(x) { return 1 - 3*x**2 + 2*x**3; }
    function adjust(color, amount) {
        // From https://stackoverflow.com/a/57401891
        return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
    }
    function toIdx(p) { return p.x + ' ' + p.y; }
    function fromIdx(idx) { let [x, y] = idx.split(' ').map(Number); return {x, y}; }
    function pause() { running = false; }
    function resume() { if (running === false) requestAnimationFrame(animationFrame); running = true; }

    function init() {
        points.push({
            x: mouse.x,
            y: mouse.y,
            vx: 0,
            vy: 0,
            color: COLORS[Math.floor(rand(0, COLORS.length))],
        })
        for (let i = 0; i < NB_POINTS; i++) {
            points.push({
                x: rand(0, w),
                y: rand(0, h),
                vx: rand(-MAX_VEL, MAX_VEL),
                vy: rand(-MAX_VEL, MAX_VEL),
                color: COLORS[Math.floor(rand(0, COLORS.length))],
            })
        }

        edges = prims(points);
        // edge.t is the time when the edge was created.
        // If it is negative, it is the time when it was removed
        for (const [i, e] of edges.entries()) {
            e.t = i;
        }
    }

    function prims(points) {
        let edges = [];
        let inside = new Set([0]);
        const dists = points.map(p => points.map(q => dist(p, q)));
        let costs = points.map(p => dist(p, points[0]));
        let direction = points.map(p => 0);

        for (let steps = 1; steps < points.length; steps++) {
            // Find cheapest crossing edge
            let mini = INF;
            let best = null;
            for (let i = 0; i < costs.length; i++) {
                if (!inside.has(i) && inside.has(direction[i]) && costs[i] < mini) {
                    mini = costs[i];
                    best = i;
                }
            }
            edges.push([direction[best], best])
            inside.add(best)
            // Update costs
            for (let i = 0; i < costs.length; i++) {
                if (dists[best][i] < costs[i]) {
                    costs[i] = dists[best][i];
                    direction[i] = best;
                }
            }
        }

        return edges;
    }

    function draw_line(p1, p2, prop) {
        let p = Math.max(0, Math.min(prop, 1));
        let grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
        grad.addColorStop(0, p1.color);
        grad.addColorStop(1, p2.color);

        ctx.beginPath();
        ctx.strokeStyle = grad;
        ctx.moveTo(p1.x, p1.y);
        ctx.lineWidth = 2;
        ctx.lineTo(
            p * p2.x + (1 - p) * p1.x,
            p * p2.y + (1 - p) * p1.y,
        );
        ctx.stroke();
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);

        oldEdges.forEach(edge => draw_line(points[edge.j], points[edge.i], edge.t + FADE_DURATION - edge_show))
        edges.forEach(edge => {
            let p1 = points[edge[0]],
                p2 = points[edge[1]];
            draw_line(p1, p2, (edge_show - edge.t) / FADE_DURATION);
        })

        points.forEach(p => {
            ctx.beginPath();
            ctx.fillStyle = p.color;
            ctx.arc(p.x, p.y, 4, 0, PI * 2);
            ctx.fill();
        })
    }

    function update(_) {
        edge_show += 1/8;

        if (edge_show > edges.length) {
            // start moving points
            points.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) { p.x = 0; p.vx *= -1; }
                if (p.y < 0) { p.y = 0; p.vy *= -1; }
                if (p.x > w) { p.x = w; p.vx *= -1; }
                if (p.y > h) { p.y = h; p.vy *= -1; }
            })

            if (true) {
                toStr = e => e[0] + ' ' + e[1];
                let before = {}
                edges.forEach(e => before[toStr(e)] = e)
                edges = prims(points);
                let now = new Set(edges.map(toStr));

                for (const e in before) {
                    if (!now.has(e)) {  // deleted
                        let [i, j] = e.split(' ').map(Number);
                        oldEdges.push({
                            t: edge_show, i, j,
                        })
                    }
                }

                edges.forEach(e => {
                    let s = toStr(e);
                    if (s in before) {  // added
                        e.t = before[s].t;
                    } else {
                        e.t = edge_show;
                    }
                })
            }
            oldEdges = oldEdges.filter(e => e.t < edge_show + FADE_DURATION)
        }
    }

    function animationFrame(now) {
        update(now);
        draw();
        if (running) {
            requestAnimationFrame(animationFrame);
        }
    }

    // Event handeling

    function resize() {
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = w;
        canvas.height = h;
    }
    function onMouseMove(event) {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
        // points[0].x = mouse.x;
        // points[0].y = mouse.y;
    }
    function onScroll() {
        let scroll = window.scrollY - lastScroll;
        // Do anything
        lastScroll = window.scrollY;
    }

    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('scroll', onScroll)

    init();
    requestAnimationFrame(animationFrame);

    return {
        pause: pause,
        resume: resume,
        isPaused: () => { return !running; }
    }
}

animation()
