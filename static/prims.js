function animation() {
    let w = window.innerWidth;
    let h = window.innerHeight;

    const NB_POINTS = w * h / 100 / 100
    const ANIM_SPEED = 0.1;
    const MAX_VEL = 0.2;
    const FADE_DURATION = 6;
    const WAIT_LAST_ANIM = 0;
    const ANIMATE = 1;
    const SKIP_SPAWN = 0;
    const PI = Math.PI;
    const INF = 999999;
    const END_SPAWN = NB_POINTS * (WAIT_LAST_ANIM ? FADE_DURATION : 1);

    let running = true;
    let canvas = document.getElementById('bg-canvas'),
        ctx = canvas.getContext('2d');
    ctx.lineCap = 'round'

    let mouse = { x: w / 2, y: h / 2 };
    let lastScroll = window.scrollY;
    resize()

    let points = [],
        colors = [],
        grad,
        edges = [],
        oldEdges = [],
        progression = 0;


    let abs = Math.abs
    function rand(mini, maxi) { return Math.random() * (maxi - mini) + mini}
    function choose(array) { return array[Math.floor(rand(0, array.length))]; }
    function dist(a, b) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }
    function ease(x) { x = x < 0 ? 0 : x > 1 ? 1 : x; return 1 - 3*x**2 + 2*x**3; }
    function adjust(color, amount) {
        // From https://stackoverflow.com/a/57401891
        return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
    }
    function toIdx(p) { return p.x + ' ' + p.y; }
    function fromIdx(idx) { let [x, y] = idx.split(' ').map(Number); return {x, y}; }
    function pause() { running = false; }
    function resume() { if (running === false) requestAnimationFrame(animationFrame); running = true; }

    function init() {
        points = [];
        edges = [];
        oldEdges = [];
        progression = SKIP_SPAWN ? END_SPAWN : 0;
        colors = choose([
            [ '#ffa500',  '#ff3c00', '#ffd100'],
            ['#c6ffdd', '#fbd786', '#f7797d'],
            ['rgba(253,239,132,1)', 'rgba(247,198,169,1)', 'rgba(21,186,196,1)'],
            ['rgba(111,71,133,1)', 'rgba(232,129,166,1)', 'rgba(237,237,183,1)'],
            ['rgba(73,235,221,1)', 'rgba(83,222,219,1)', 'rgba(105,191,217,1)', 'rgba(127,157,214,1)', 'rgba(155,113,208,1)', 'rgba(178,73,201,1)', 'rgba(200,45,192,1)', 'rgba(213,42,180,1)', 'rgba(232,44,145,1)', 'rgba(239,45,128,1)', 'rgba(249,66,107,1)', 'rgba(252,105,98,1)', 'rgba(252,105,98,1)', 'rgba(254,145,92,1)', 'rgba(255,189,86,1)', 'rgba(254,227,80,1)', 'rgba(254,248,75,1)'],
        ])
        grad = ctx.createLinearGradient(0, 0, w, h);
        for (let i = 0; i < colors.length; i++) {
            grad.addColorStop(i / (colors.length - 1), colors[i]);
        }

        let addPoint = (x, y, vx, vy) => {points.push({x, y, vx: vx || 0, vy: vy || 0, color: choose(colors), next: []})}
        // addPoint(0, 0)
        for (let i = 0; i < NB_POINTS; i++) {
            addPoint(
                rand(0, w), rand(0, h),
                rand(-MAX_VEL, MAX_VEL),
                rand(-MAX_VEL, MAX_VEL),
            )
        }
        // addPoint(mouse.x, mouse.y)

        // initLabyrinth();
        edges = prims(points);

        // Sort edges with A*
        // edges.forEach(e => {
        //     let [i, j] = e;
        //     points[i].next.push(j);
        //     points[j].next.push(i);
        // })
        // let path = shortestPath(0, points.length - 1, points, dist);
        // edges = [];
        // for (let i = 0; i < path.length - 1; i++) {
        //     edges.push([path[i], path[i + 1]])
        // }
        // edge.t is the time when the edge was created.
        for (const [i, e] of edges.entries()) {
            e.t = i * (WAIT_LAST_ANIM ? FADE_DURATION : 1);
        }
    }

    function initLabyrinth() {
        points.splice(0, points.length);
        for (let i = 0; i < w / 40; i++) {
            for (let j = 0; j < h / 30; j++) {
                points.push({
                    x: 40 * i, y: 30 * j,
                    vx: 0, vy: 0,
                    color: colors[Math.floor(rand(0, colors.length))],
                })
            }
        }
    }

    function computeDists(points) {
        // return  points.map(p => points.map(q => {
        //     if (p.x === q.x && p.y === q.y) { return 0;}
        //     else if ((p.x === q.x ^ p.y === q.y) && (abs(p.x - q.x) === 40 || abs(p.y - q.y) === 30)) { return rand(1, 10); }
        //     else { return INF; }
        // }));
        return  points.map(p => points.map(q => dist(p, q)));
    }

    function prims(points) {
        dists = computeDists(points);

        let edges = [];
        let inside = new Set([0]);
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
        let p = 1 - ease(Math.max(0, Math.min(prop, 1)));
        if (p === 0) return;
        let grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
        grad.addColorStop(0, p1.color);
        grad.addColorStop(1, p2.color);

        ctx.beginPath();
        ctx.globalAlpha = prop;
        ctx.strokeStyle = grad;
        ctx.moveTo(p1.x, p1.y);
        p = 1;
        ctx.lineTo(
            p * p2.x + (1 - p) * p1.x,
            p * p2.y + (1 - p) * p1.y,
        );
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);

        ctx.lineWidth = 5;
        oldEdges.forEach(edge => draw_line(points[edge.j], points[edge.i], (edge.t + FADE_DURATION - progression) / FADE_DURATION))
        edges.forEach(edge => {
            let p1 = points[edge[0]],
                p2 = points[edge[1]];
            draw_line(p1, p2, (progression - edge.t) / FADE_DURATION);
        })

        points.forEach(p => {
            ctx.beginPath();
            ctx.fillStyle = p.color;
            ctx.arc(p.x, p.y, 4, 0, PI * 2);
            ctx.fill();

            // Outline
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.strokeStyle = p.color;
            ctx.arc(p.x, p.y, 8, 0, PI * 2);
            ctx.stroke();
        })
    }

    function update(_) {
        progression += ANIM_SPEED;

        if (ANIMATE && progression > END_SPAWN) {
            // start moving points
            points.forEach(p => {
                let mouseDist = dist(mouse, p);
                let mouseDir = [(mouse.x - p.x) / mouseDist, (mouse.y - p.y)  / mouseDist];
                let coeff = ease(mouseDist / 200) * (1) * 2 ;
                p.x += p.vx - mouseDir[0] * coeff;
                p.y += p.vy - mouseDir[1] * coeff;

                if (p.x < 0) { p.x = 0; p.vx *= -1; }
                if (p.y < 0) { p.y = 0; p.vy *= -1; }
                if (p.x > w) { p.x = w; p.vx *= -1; }
                if (p.y > h) { p.y = h; p.vy *= -1; }
            })

            // Update spanning tree
            toStr = e => e[0] + ' ' + e[1];
            let before = {}
            edges.forEach(e => before[toStr(e)] = e)
            edges = prims(points);
            let now = new Set(edges.map(toStr));

            // Find its evolution
            for (const e in before) {
                if (!now.has(e)) {  // deleted
                    let [i, j] = e.split(' ').map(Number);
                    oldEdges.push({ t: progression, i, j, })
                }
            }
            edges.forEach(e => {
                let s = toStr(e);
                if (s in before) {  // added
                    e.t = before[s].t;
                } else {
                    e.t = progression;
                }
            })

            oldEdges = oldEdges.filter(e => e.t + FADE_DURATION > progression)
        } else if ( progression > END_SPAWN + 22 * FADE_DURATION) {
            init();
        }
    }

    // Positions of the shortest path between A and B.
    // If there is no path, return undefined.
    function shortestPath(start, goal, vertices, dist) {
        /// A* path finding
        let heap = new MinHeap([{ idx: start, dist: dist(vertices[start], vertices[goal]) }],
            (p, q) => p.dist === q.dist ? 0 : p.dist < q.dist ? -1 : 1);

        let visited = {}
        loop: while (heap.size() !== 0) {
            let current = heap.pop();
            let vert = vertices[current.idx]
            for (const next of vert.next) {
                if (next === goal) {
                    visited[goal] = current.idx;
                    break loop;
                } else if (next in visited) {
                    // Already seen : do nothing
                } else {
                    visited[next] = current.idx;
                    heap.push({ idx: next, dist: dist(vertices[next], vertices[goal]) });
                }
            }
        }

        // Backtrack the path
        if (visited[goal] === undefined) {
            return undefined;
        }
        let path = []
        let pos = goal;
        while (pos !== start) {
            path.push(pos);
            pos = visited[pos]
        }
        path.push(start)

        return path.reverse();
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


// Taken from http://www.digitaltsunami.net/projects/javascript/minheap/index.html

/**
 * @fileOverview Implementation of a min heap.  Allows a comparator
 * to be provided so that the heap may contain objects that involve a
 * more complex comparison.
 */

/**
 * Implementation of a min heap allowing for a comparator
 * to be provided so that the heap may contain objects that involve a
 * more complex comparison.
 * <br>
 * This constructor constructs a MinHeap instance and takes two optional
 * parameters: an array and comparator.  If the array is provided, it
 * will be used as the backing store for the heap. Therefore, all
 * operations on the heap will be reflected in the provided array.
 * Usage
 * @example
 * Sample Usage:
 var heapq = new MinHeap();
 heapq.push(5);
 heapq.push(2);
 heapq.push(1);
 heapq.pop()); // returns 1
 heapq.pop()); // returns 2
 * @param array Array to use heapify or null to start with an empty
 * heap.
 * @param comparator alternate comparator used to compare each
 * item within the heap.  If not provided, the default will perform
 * a simple comparison on the item.
 *
 * @returns instance of MinHeap
 * @constructor
 */
function MinHeap(array, comparator) {

    /**
     * Storage for heap.
     * @private
     */
    this.heap = array || new Array();

    /**
     * Default comparator used if an override is not provided.
     * @private
     */
    this.compare = comparator || function(item1, item2) {
        return item1 == item2 ? 0 : item1 < item2 ? -1 : 1;
    };

    /**
     * Retrieve the index of the left child of the node at index i.
     * @private
     */
    this.left = function(i) {
        return 2 * i + 1;
    };
    /**
     * Retrieve the index of the right child of the node at index i.
     * @private
     */
    this.right = function(i) {
        return 2 * i + 2;
    };
    /**
     * Retrieve the index of the parent of the node at index i.
     * @private
     */
    this.parent = function(i) {
        return Math.ceil(i / 2) - 1;
    };

    /**
     * Ensure that the contents of the heap don't violate the
     * constraint.
     * @private
     */
    this.heapify = function(i) {
        var lIdx = this.left(i);
        var rIdx = this.right(i);
        var smallest;
        if (lIdx < this.heap.length
            && this.compare(this.heap[lIdx], this.heap[i]) < 0) {
            smallest = lIdx;
        } else {
            smallest = i;
        }
        if (rIdx < this.heap.length
            && this.compare(this.heap[rIdx], this.heap[smallest]) < 0) {
            smallest = rIdx;
        }
        if (i != smallest) {
            var temp = this.heap[smallest];
            this.heap[smallest] = this.heap[i];
            this.heap[i] = temp;
            this.heapify(smallest);
        }
    };

    /**
     * Starting with the node at index i, move up the heap until parent value
     * is less than the node.
     * @private
     */
    this.siftUp = function(i) {
        var p = this.parent(i);
        if (p >= 0 && this.compare(this.heap[p], this.heap[i]) > 0) {
            var temp = this.heap[p];
            this.heap[p] = this.heap[i];
            this.heap[i] = temp;
            this.siftUp(p);
        }
    };

    /**
     * Heapify the contents of an array.
     * This function is called when an array is provided.
     * @private
     */
    this.heapifyArray = function() {
        // for loop starting from floor size/2 going up and heapify each.
        var i = Math.floor(this.heap.length / 2) - 1;
        for (; i >= 0; i--) {
            //	jstestdriver.console.log("i: ", i);
            this.heapify(i);
        }
    };

    // If an initial array was provided, then heapify the array.
    if (array != null) {
        this.heapifyArray();
    }
    ;
}

/**
 * Place an item in the heap.
 * @param item
 * @function
 */
MinHeap.prototype.push = function(item) {
    this.heap.push(item);
    this.siftUp(this.heap.length - 1);
};

/**
 * Insert an item into the heap.
 * @param item
 * @function
 */
MinHeap.prototype.insert = function(item) {
    this.push(item);
};

/**
 * Pop the minimum valued item off of the heap. The heap is then updated
 * to float the next smallest item to the top of the heap.
 * @returns the minimum value contained within the heap.
 * @function
 */
MinHeap.prototype.pop = function() {
    var value;
    if (this.heap.length > 1) {
        value = this.heap[0];
        // Put the bottom element at the top and let it drift down.
        this.heap[0] = this.heap.pop();
        this.heapify(0);
    } else {
        value = this.heap.pop();
    }
    return value;
};

/**
 * Remove the minimum item from the heap.
 * @returns the minimum value contained within the heap.
 * @function
 */
MinHeap.prototype.remove = function() {
    return this.pop();
};


/**
 * Returns the minimum value contained within the heap.  This will
 * not remove the value from the heap.
 * @returns the minimum value within the heap.
 * @function
 */
MinHeap.prototype.getMin = function() {
    return this.heap[0];
};

/**
 * Return the current number of elements within the heap.
 * @returns size of the heap.
 * @function
 */
MinHeap.prototype.size = function() {
    return this.heap.length;
};


animation()
