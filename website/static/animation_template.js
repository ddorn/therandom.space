function animation() {
    let running = true;
    let canvas = document.getElementById('bg-canvas');
    ctx = canvas.getContext('2d');

    let mouse = { x: 0, y: 0 };
    let w = window.innerWidth;
    let h = window.innerHeight;
    let lastScroll = window.scrollY;
    resize()

    function rand(mini, maxi) { return Math.random() * (maxi - mini) + mini}
    function dist(a, b) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }
    function ease(x) { return 1 - 3*x**2 + 2*x**3; }
    function adjust(color, amount) {
        // From https://stackoverflow.com/a/57401891
        return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
    }
    function pause() { running = false; }
    function resume() { if (running === false) requestAnimationFrame(animationFrame); running = true; }


    function draw() {
        ctx.clearRect(0, 0, w, h);
    }

    function update(t) {

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
    }
    function onScroll() {
        let scroll = window.scrollY - lastScroll;
        // Do anything
        lastScroll = window.scrollY;
    }

    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('scroll', onScroll)

    requestAnimationFrame(animationFrame)

    return {
        pause: pause,
        resume: resume,
        isPaused: () => { return !running; }
    }
}

