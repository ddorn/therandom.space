function windBackground() {
    const VMAX = 2;
    const NB_BUBBLES = 80;
    const SIZE_MAX = 10;
    const SIZE_MIN = 4;
    const MAX_SCALE = 6;
    const INFLUENCE = 400;  // px
    const PI = Math.PI;
    let canvas = document.createElement('canvas');
    canvas = document.getElementById('bg-canvas');
    ctx = canvas.getContext('2d');

    let colors = [ '#ffa500', 'rebeccapurple', 'yellow', '#00a5ff'];
    let bubbles = [];
    let w = window.innerWidth;
    let h = window.innerHeight;
    let mouse = { x: 0, y: 0 }
    canvas.width = w;
    canvas.height = h;

    function dist(b1, b2) {
        return Math.sqrt(Math.min(
            (b1.x - b2.x) ** 2 + (b1.y - b2.y) ** 2,
            (Math.abs(b1.x - b2.x) - w) ** 2 + (b1.y - b2.y) ** 2,
            (Math.abs(b1.x - b2.x) - w) ** 2 + (Math.abs(b1.y - b2.y) - h) ** 2,
            (b1.x - b2.x) ** 2 + (Math.abs(b1.y - b2.y) - h) ** 2,
        ))
    }
    function ease(x) { return 1 - 3*x**2 + 2*x**3; }
    function scaledRadius(bubble) { return bubble.radius * (1 + MAX_SCALE*ease(Math.min(1, dist(bubble, mouse) / INFLUENCE))); }

    function randomBubble() {
        return {

            x: Math.random() * w,
            y: Math.random() * h,
            vel: Math.random() * VMAX,
            angle: Math.random() * PI / 3- PI / 6,
            vangle: Math.random() * 0.01 - 0.005,
            color: colors[Math.floor(Math.random() * colors.length)],
            radius: Math.random() * (SIZE_MAX - SIZE_MIN) + SIZE_MIN,
            fill: Math.round(Math.random()),
            offset: Math.random(),
        }
    }


    function draw() {
        ctx.clearRect(0, 0, w, h);
        bubbles.map(bubble => {
            ctx.beginPath();
            ctx.arc(bubble.x, bubble.y, scaledRadius(bubble), 0, Math.PI * 2);
            ctx.strokeStyle = bubble.color;
            ctx.fillStyle = bubble.color;
            bubble.fill ? ctx.fill() : ctx.stroke()
        })
    }

    function update(t) {
        bubbles.forEach(bubble => {
            // let closest = null;
            // let best_dist = 70;
            // bubbles.forEach(b => {
            //     if (b !== bubble && dist(b, bubble) < best_dist) {
            //         closest = b;
            //         best_dist = dist(b, bubble);
            //     }
            // })
            // if (closest !== null) {
            //     const c = 0.01;
            //     bubble.vx = (bubble.vx + c * closest.vx) / (1 + c);
            //     bubble.vy = (bubble.vy + c * closest.vy) / (1 + c);
            // }

            let angle = bubble.angle + Math.sin(t / 3000 + bubble.offset * PI * 2) * PI / 6

            bubble.x += bubble.vel * Math.cos(angle);
            bubble.y += bubble.vel * Math.sin(angle);
            let r = scaledRadius(bubble)
            if (bubble.x < -r) bubble.x = w + r;
            if (bubble.x > w+r) bubble.x = -r;
            if (bubble.y < -r) bubble.y = h + r;
            if (bubble.y > h+r) bubble.y = -r;

        })
    }

    function animationFrame(now) {
        update(now);
        draw();
        requestAnimationFrame(animationFrame)
    }

    for (let i = 0; i < NB_BUBBLES; i++) {
        bubbles.push(randomBubble());
    }

    window.addEventListener('resize', () => {
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = w;
        canvas.height = h;
    })
    window.addEventListener('mousemove', (event) => {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
        console.log(mouse)
    });

    requestAnimationFrame(animationFrame)
}

windBackground()