'use strict';

function snakeBackground(base_refresh) {
    const SNAKE_COLOR = '#405C0C';
    const APPLE_COLOR = '#5c100c';
    const START = [10, -10]
    const REFRESH = base_refresh;
    let refresh = REFRESH;  // miliseconds
    let container = document.createElement('div');
    document.body.insertBefore(container, document.body.firstChild)

    let snake = [START];
    let apple = [START[0], START[1] + 1];
    console.log(apple, snake.indexOf(apple), snake)
    let cases = {};
    createCase(true, snake[0]);
    createCase(false, apple);

    function toIdx(pos) { return pos[0] + ' ' + pos[1]; }
    function fromIdx(idx) { return idx.split(' ').map(Number) }
    function caseSize() { return 80; }
    function head(snake) { return snake[snake.length - 1]; }
    function listContains(list, pos) { return list.some(p => equal(p, pos)); }
    function equal(p1, p2) { return p1[0] === p2[0] && p1[1] === p2[1]}

    function reset() {
        for (let c in cases) { deleteCase(fromIdx(c)) }
        snake = [START];
        apple = [START[0], START[1] + 1];
        createCase(true, snake[0])
        createCase(false, apple)
    }
    function randomApple() {
        let [x, y] = snake[0];
        // Somewhere not on the snake
        while (listContains(snake, [x, y])) {
            x = Math.floor(Math.random() * window.innerWidth / caseSize());
            y = Math.floor(Math.random() * window.innerHeight / caseSize());
        }
        return [x, y];
    }
    function bindApple(elem) {
        elem.addEventListener('mouseover', _ => {
            refresh = REFRESH / 4;
            clearInterval(animationHandler)
            animationHandler = setInterval(() => requestAnimationFrame(animationFrame), refresh)
        })
        elem.addEventListener('mouseleave', _ => {
            refresh = REFRESH;
            clearInterval(animationHandler)
            animationHandler = setInterval(() => requestAnimationFrame(animationFrame), refresh)
        })
    }

    function createCase(isSnake, pos, attatch_to) {
        const padding = 5;

        // Compute the position/size offset to join the snake parts
        let dx, dy, dw, dh;
        if (attatch_to === undefined) {
            attatch_to = pos;
        }
        let x = pos[0] - attatch_to[0];
        let y = pos[1] - attatch_to[1]

        dw = (x !== 0) ? 2*padding : 0;
        dh = (y !== 0) ? 2*padding : 0;
        dx = (x > 0) ? -2*padding : 0;
        dy = (y > 0) ? -2*padding : 0;

        let c = document.createElement('div')
        let s = caseSize();
        let left =attatch_to[0] * s + padding + dx;
        let top = attatch_to[1] * s + padding + dy;
        c.style.position = 'absolute';
        c.style.left = left + 'px';
        c.style.top = top + 'px';
        c.style.backgroundColor = isSnake ? SNAKE_COLOR : APPLE_COLOR;
        c.style.height = s - 2*padding + dh + 'px';
        c.style.width = s - 2*padding + dw + 'px';
        c.style.transitionProperty = 'transform';
        c.style.transitionTimingFunction = 'linear'
        c.style.transitionDuration = refresh + 'ms';
        container.append(c);
        cases[toIdx(pos)] = c;

        setTimeout(() => {
            c.style.transform = `translateX(${x * s}px) translateY(${y * s}px)`;
        }, 3)
        setTimeout(() => {
            c.style.transitionProperty = 'none';
            c.style.transform = '';
            c.style.left = left + x * s + 'px';
            c.style.top = top + y * s + 'px';
        }, refresh + 3)

        if (!isSnake) {
            bindApple(c);
        }

        return c;
    }
    function deleteCase(pos) {
        let c = cases[toIdx(pos)]
        delete cases[toIdx(pos)]
        c.style.transitionProperty = 'transform';
        c.style.transitionDuration = 5*refresh + 'ms';
        c.style.transform = 'scaleX(0) scaleY(0)';
        c.style.zIndex = -1;
        setTimeout(() => c.remove(), 5*refresh)
    }

    function moveSnake(dx, dy) {
        if (snake.length > 42) { reset(); }

        let [hx, hy] = head(snake);
        let next = [hx + dx, hy + dy];
        if (equal(next, apple)) {
            deleteCase(apple)
            createCase(true, next, [hx, hy])
            snake.push(next);
            apple = randomApple();
            createCase(false, apple);
        } else if (toIdx(next) in cases) {
            reset();
        } else {
            createCase(true, next, [hx, hy]);
            snake.push(next)
            deleteCase(snake.shift())
        }
    }

    // Positions of the shortest path between A and B.
    // If there is no path, return undefined.
    function shortestPath(a, b, obstacles) {
        /// A* path finding
        let dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
        let heap = new MinHeap([{ pos: a, dist: dist(a, b) }],
            (p, q) => p.dist === q.dist ? 0 : p.dist < q.dist ? -1 : 1);

        const directions = [
            [1, 0],
            [0, 1],
            [-1, 0],
            [0, -1]
        ];
        let visited = {}
        loop: while (heap.size() !== 0) {
            let node = heap.pop();
            let pos = node.pos;
            for (const [dx, dy] of directions) {
                let next = [pos[0] + dx, pos[1] + dy];
                if (equal(next, b)) {
                    visited[toIdx(b)] = pos
                    break loop;
                } else if (toIdx(next) in visited || listContains(obstacles, next)) {
                } else {
                    visited[toIdx(next)] = pos;
                    heap.push({ pos: next, dist: dist(next, b) });
                }
            }
        }

        // Backtrack the path
        if (visited[toIdx(b)] === undefined) {
            return undefined;
        }
        let path = []
        let pos = b;
        while (!equal(pos, a)) {
            path.push(pos);
            pos = visited[toIdx(pos)]
        }
        path.push(a)

        return path.reverse();
    }

    function findDirection() {
        let h = head(snake);
        let path = shortestPath(h, apple, snake);
        if (path === undefined) {
            return [1, 0]
        }
        return [path[1][0] - h[0], path[1][1] - h[1]]
    }

    function animationFrame(_now) {
        let [dx, dy] = findDirection();
        moveSnake(dx, dy);
    }
    let animationHandler = setInterval(() => requestAnimationFrame(animationFrame), refresh)
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

