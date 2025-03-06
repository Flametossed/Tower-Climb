const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");
canvas.width = 400;
canvas.height = 600;

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.style.background = "#000";

// Game elements
const spaceship = { 
    x: 180, 
    y: 500, 
    width: 30, 
    height: 40, 
    speed: 4,
    thruster: 0 // For animation
};

const obstacles = [];
const stars = [];
const floors = [];
let scrollY = 0;
let currentFloor = 1;
let totalFloors = 100;
let gameOver = false;
let gameStarted = false;
let score = 0;

// Controls - support both WASD and arrow keys
const keys = {};
document.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (!gameStarted && (e.key === 'w' || e.key === 'ArrowUp')) {
        gameStarted = true;
    }
});
document.addEventListener("keyup", (e) => (keys[e.key] = false));

// Create background stars
for (let i = 0; i < 100; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 3,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 0.5 + 0.5
    });
}

// Generate tower structure
for (let i = 0; i < totalFloors; i++) {
    // Tower floors/walls
    floors.push({ 
        x: 50, 
        y: -i * 200, 
        width: 300, 
        height: 10,
        floorNumber: i + 1
    });
    
    // Add obstacles with increasing frequency and speed as floors increase
    const obstacleChance = Math.min(0.8, 0.3 + (i / totalFloors) * 0.5);
    if (Math.random() < obstacleChance) {
        // Basic horizontal obstacles
        const speed = 1 + (i / totalFloors) * 4; // Increase speed with height
        obstacles.push({ 
            x: Math.random() * 250 + 50, 
            y: -i * 200 - 100, 
            width: 50 + Math.random() * 30, 
            height: 10, 
            speed: speed, 
            dir: Math.random() > 0.5 ? 1 : -1,
            type: 'horizontal'
        });
        
        // Add vertical moving obstacles at higher floors
        if (i > 20 && Math.random() < 0.3) {
            obstacles.push({ 
                x: Math.random() * 250 + 50, 
                y: -i * 200 - 150, 
                width: 10, 
                height: 40, 
                speed: speed * 0.7, 
                dir: Math.random() > 0.5 ? 1 : -1,
                amplitude: 50 + Math.random() * 50,
                initialY: -i * 200 - 150,
                phase: Math.random() * Math.PI * 2,
                type: 'vertical'
            });
        }
    }
}

function update() {
    if (gameOver || !gameStarted) return;

    // Player movement
    if (keys['w'] || keys['ArrowUp']) {
        spaceship.y -= spaceship.speed;
        spaceship.thruster = (spaceship.thruster + 1) % 4; // Animate thruster
    }
    if (keys['s'] || keys['ArrowDown']) spaceship.y += spaceship.speed * 0.5; // Slower when going down
    if (keys['a'] || keys['ArrowLeft']) spaceship.x -= spaceship.speed;
    if (keys['d'] || keys['ArrowRight']) spaceship.x += spaceship.speed;

    // Keep player in bounds - constrain to tower width with some padding
    spaceship.x = Math.max(60, Math.min(canvas.width - 60 - spaceship.width, spaceship.x));
    
    // Constant upward scroll to simulate ascent
    scrollY += 1;
    
    // Additional scroll when moving up
    if (spaceship.y < 250) {
        const scrollSpeed = 2;
        scrollY += scrollSpeed;
        spaceship.y += scrollSpeed;
    }

    // Calculate current floor based on scroll position
    currentFloor = Math.floor(scrollY / 200) + 1;
    currentFloor = Math.min(currentFloor, totalFloors);
    
    // Update score based on height
    score = Math.max(score, currentFloor * 100);

    // Move stars for parallax effect
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = -10;
            star.x = Math.random() * canvas.width;
        }
    });

    // Move obstacles
    obstacles.forEach(obs => {
        if (obs.type === 'horizontal') {
            // Horizontal movement
            obs.x += obs.speed * obs.dir;
            if (obs.x < 60 || obs.x > canvas.width - 60 - obs.width) {
                obs.dir *= -1;
            }
        } else if (obs.type === 'vertical') {
            // Vertical oscillation
            obs.y = obs.initialY + Math.sin(obs.phase) * obs.amplitude;
            obs.phase += 0.02;
        }
    });

    // Collision detection
    obstacles.forEach(obs => {
        if (
            spaceship.x < obs.x + obs.width &&
            spaceship.x + spaceship.width > obs.x &&
            spaceship.y < obs.y + scrollY + obs.height &&
            spaceship.y + spaceship.height > obs.y + scrollY
        ) {
            gameOver = true;
        }
    });

    // Tower wall collisions
    if (spaceship.x < 50 || spaceship.x + spaceship.width > 350) {
        gameOver = true;
    }

    // Win condition
    if (currentFloor >= totalFloors) {
        gameOver = true;
        // Victory animation can be added here
    }
}

function drawSpaceShip(x, y) {
    // Draw spaceship body
    ctx.fillStyle = "#39f";
    ctx.beginPath();
    ctx.moveTo(x + 15, y);
    ctx.lineTo(x, y + 30);
    ctx.lineTo(x + 30, y + 30);
    ctx.closePath();
    ctx.fill();
    
    // Draw cockpit
    ctx.fillStyle = "#9cf";
    ctx.beginPath();
    ctx.arc(x + 15, y + 10, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw thrusters
    ctx.fillStyle = "#f63";
    if (keys['w'] || keys['ArrowUp']) {
        const thrusterHeight = 5 + spaceship.thruster * 2;
        ctx.beginPath();
        ctx.moveTo(x + 5, y + 30);
        ctx.lineTo(x + 10, y + 30 + thrusterHeight);
        ctx.lineTo(x + 15, y + 30);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(x + 15, y + 30);
        ctx.lineTo(x + 20, y + 30 + thrusterHeight);
        ctx.lineTo(x + 25, y + 30);
        ctx.closePath();
        ctx.fill();
    }
}

function draw() {
    // Clear canvas
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars
    ctx.fillStyle = "white";
    stars.forEach(star => {
        ctx.fillRect(star.x, star.y - scrollY * star.speed * 0.3, star.size, star.size);
    });
    
    // Draw tower walls
    ctx.fillStyle = "#333";
    ctx.fillRect(0, 0, 50, canvas.height);
    ctx.fillRect(350, 0, 50, canvas.height);
    
    // Draw floors
    floors.forEach(floor => {
        if (floor.y + scrollY > -50 && floor.y + scrollY < canvas.height + 50) {
            // Draw only floors that are visible
            ctx.fillStyle = "#555";
            ctx.fillRect(floor.x, floor.y + scrollY, floor.width, floor.height);
            
            // Floor number on the left wall
            ctx.fillStyle = "#fff";
            ctx.font = "12px Arial";
            ctx.fillText(`F${floor.floorNumber}`, 10, floor.y + scrollY + 9);
        }
    });
    
    // Draw obstacles
    obstacles.forEach(obs => {
        if (obs.y + scrollY > -100 && obs.y + scrollY < canvas.height + 100) {
            // Draw only obstacles that are visible (performance optimization)
            ctx.fillStyle = "#f55";
            ctx.fillRect(obs.x, obs.y + scrollY, obs.width, obs.height);
        }
    });
    
    // Draw player ship
    drawSpaceShip(spaceship.x, spaceship.y);
    
    // Draw UI
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText(`Floor: ${currentFloor}/${totalFloors}`, 10, 30);
    ctx.fillText(`Score: ${score}`, 10, 60);
    
    // Game over screen
    if (gameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = "white";
        ctx.font = "30px Arial";
        if (currentFloor >= totalFloors) {
            ctx.fillText("Victory!", canvas.width / 2 - 60, canvas.height / 2 - 50);
        } else {
            ctx.fillText("Game Over", canvas.width / 2 - 80, canvas.height / 2 - 50);
        }
        
        ctx.font = "20px Arial";
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2 - 70, canvas.height / 2);
        ctx.fillText("Refresh to play again", canvas.width / 2 - 100, canvas.height / 2 + 50);
    }
    
    // Start screen
    if (!gameStarted) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = "white";
        ctx.font = "30px Arial";
        ctx.fillText("Space Tower Climb", canvas.width / 2 - 120, canvas.height / 2 - 50);
        
        ctx.font = "16px Arial";
        ctx.fillText("Use WASD or Arrow Keys to control", canvas.width / 2 - 120, canvas.height / 2);
        ctx.fillText("Press W or Up to start", canvas.width / 2 - 80, canvas.height / 2 + 40);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();