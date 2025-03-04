const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");
canvas.width = 800; // Increased width to 2x
canvas.height = 600;

document.body.style.margin = "0";
document.body.style.overflow = "hidden";

const player = { x: 380, y: 500, width: 20, height: 20, speed: 3 };
const obstacles = [];
const floors = [];
let scrollY = 0;
let floorCount = 1;
let gameOver = false;

const keys = {};
document.addEventListener("keydown", (e) => (keys[e.key] = true));
document.addEventListener("keyup", (e) => (keys[e.key] = false));

// Generate floors and obstacles dynamically
for (let i = 0; i < 100; i++) {
    floors.push({ x: 0, y: -i * 100, width: 800, height: 10 }); // Adjusted for new width
    if (i % 5 === 0) {
        obstacles.push({ x: Math.random() * 750, y: -i * 100 - 50, width: 50, height: 10, speed: 2, dir: 1 });
    }
}

function update() {
    if (gameOver) return;

    // Player movement
    if (keys['w']) player.y -= player.speed;
    if (keys['s']) player.y += player.speed;
    if (keys['a']) player.x -= player.speed;
    if (keys['d']) player.x += player.speed;

    // Keep player in bounds
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

    // Scroll screen when moving up
    if (player.y < 250) {
        scrollY += 2;
        player.y += 2;
    }

    // Move obstacles
    obstacles.forEach(obs => {
        obs.x += obs.speed * obs.dir;
        if (obs.x < 0 || obs.x > canvas.width - obs.width) obs.dir *= -1;
    });

    // Collision detection
    obstacles.forEach(obs => {
        if (
            player.x < obs.x + obs.width &&
            player.x + player.width > obs.x &&
            player.y < obs.y + scrollY + obs.height &&
            player.y + player.height > obs.y + scrollY
        ) {
            gameOver = true;
            alert("Game Over! Reload to try again.");
        }
    });

    // Win condition
    if (scrollY > 10000) {
        gameOver = true;
        alert("You Win!");
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    ctx.fillStyle = "gray";
    floors.forEach(floor => ctx.fillRect(floor.x, floor.y + scrollY, floor.width, floor.height));
    
    ctx.fillStyle = "red";
    obstacles.forEach(obs => ctx.fillRect(obs.x, obs.y + scrollY, obs.width, obs.height));
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}
loop();
