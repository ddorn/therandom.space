function windBackground() {
    const VMAX = 1.5
    const NB_BUBBLES = 80;
    const SIZE_MAX = 10;
    const SIZE_MIN = 4;
    const MAX_SCALE = 6;
    const PI = Math.PI;
    const INFLUENCE_PROP = 1/4;
    let canvas = document.getElementById('bg-canvas');
    ctx = canvas.getContext('2d');

    let colors = [ '#ffa500', '#663399', '#ffff00', '#00a5ff'];
    let bubbles = [];
    let running = true;
    let mouse = { x: 0, y: 0 }
    let w = window.innerWidth;
    let h = window.innerHeight;
    let influence = Math.min(w, h) * INFLUENCE_PROP;
    canvas.width = w;
    canvas.height = h;

    function rand(mini, maxi) { return Math.random() * (maxi - mini) + mini}
    function dist(b1, b2) {
        // On a torus
        return Math.sqrt(Math.min(
            (b1.x - b2.x) ** 2 + (b1.y - b2.y) ** 2,
            (Math.abs(b1.x - b2.x) - w) ** 2 + (b1.y - b2.y) ** 2,
            (Math.abs(b1.x - b2.x) - w) ** 2 + (Math.abs(b1.y - b2.y) - h) ** 2,
            (b1.x - b2.x) ** 2 + (Math.abs(b1.y - b2.y) - h) ** 2,
        ))
    }
    function ease(x) { return 1 - 3*x**2 + 2*x**3; }
    function scaledRadius(bubble) { return bubble.radius * (1 + MAX_SCALE*ease(Math.min(1, dist(bubble, mouse) / influence))); }
    function pause() { running = false; }
    function resume() { if (running === false) requestAnimationFrame(animationFrame); running = true; }

    function randomBubble() {
        return {
            x: rand(0, w),
            y: rand(0, h),
            vel: rand(0.3, VMAX),
            angle: rand(-PI/3, PI/3),
            vangle: rand(-0.005, 0.005),
            color: colors[Math.floor(rand(0, colors.length))],
            radius: rand(SIZE_MIN, SIZE_MAX),
            fill: Math.round(rand(0, 1)),
            offset: rand(0, 1),
            shape: Math.floor(rand(0, 5)),
            squareAngle: rand(0, PI),
            squareAngleVel: rand(-0.03, 0.03),
        }
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);
        bubbles.map(bubble => {
            let r = scaledRadius(bubble),
                x = bubble.x,
                y = bubble.y,
                a = bubble.squareAngle;
            ctx.strokeStyle = bubble.color;
            ctx.fillStyle = bubble.color;
            ctx.beginPath();
            if (bubble.shape === 0) {
                ctx.arc(bubble.x, bubble.y, r, 0, Math.PI * 2);
            } else {
                ctx.moveTo(x + r * Math.cos(a), y + r * Math.sin(a));
                for (let i = 0; i < 2 + bubble.shape; i++) {
                    a += 2 * PI / (2 + bubble.shape);
                    ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a))
                }
            }
            bubble.fill ? ctx.fill() : ctx.stroke()
        })
    }

    function update(t) {
        bubbles.forEach(bubble => {
            let angle = bubble.angle + Math.sin(t / 3000 + bubble.offset * PI * 2) * PI / 6
            bubble.squareAngle += bubble.squareAngleVel;

            bubble.x += bubble.vel * Math.cos(angle);
            bubble.y += bubble.vel * Math.sin(angle);
            let r = scaledRadius(bubble)
            if (bubble.x < -2*r) bubble.x = w + r;
            if (bubble.x > w+2*r) bubble.x = -r;
            if (bubble.y < -2*r) bubble.y = h + r;
            if (bubble.y > h+2*r) bubble.y = -r;

        })
    }

    function animationFrame(now) {
        update(now);
        draw();
        if (running) {
            requestAnimationFrame(animationFrame);
        }
    }

    for (let i = 0; i < NB_BUBBLES; i++) {
        bubbles.push(randomBubble());
    }

    window.addEventListener('resize', () => {
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = w;
        canvas.height = h;
        influence = Math.min(w, h) * INFLUENCE_PROP;
    })
    window.addEventListener('mousemove', (event) => {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
    });

    requestAnimationFrame(animationFrame)

    return {
        pause: pause,
        resume: resume,
        isPaused: () => { return !running; }
    }
}

windAnimation = windBackground()