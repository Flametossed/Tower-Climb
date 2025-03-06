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
    speed: 5, // Increased from 4
    thruster: 0
};

const obstacles = [];
const stars = [];
const floors = [];
let scrollY = 0;
let currentFloor = 1;
let totalFloors = 100;
let gameOver = false;
let gameStarted = false;
let gamePaused = false;

// Controls - support both WASD and arrow keys
const keys = {};
document.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (!gameStarted && (e.key === 'w' || e.key === 'ArrowUp')) {
        gameStarted = true;
    }
    // Pause game when 'p' or 'Escape' is pressed
    if ((e.key === 'p' || e.key === 'Escape') && gameStarted && !gameOver) {
        gamePaused = !gamePaused;
    }
});
document.addEventListener("keyup", (e) => (keys[e.key] = false));

// Add mouse click listener for buttons
canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Check if game over refresh button was clicked
    if (gameOver) {
        // Refresh button dimensions
        const refreshBtnX = canvas.width / 2 - 70;
        const refreshBtnY = canvas.height / 2 + 70;
        const refreshBtnWidth = 140;
        const refreshBtnHeight = 40;
        
        if (
            clickX >= refreshBtnX && 
            clickX <= refreshBtnX + refreshBtnWidth &&
            clickY >= refreshBtnY && 
            clickY <= refreshBtnY + refreshBtnHeight
        ) {
            resetGame();
        }
    }
    
    // Check if pause button was clicked
    if (gameStarted && !gameOver) {
        const pauseBtnX = canvas.width - 50;
        const pauseBtnY = 20;
        const pauseBtnRadius = 15;
        
        const distance = Math.sqrt(
            Math.pow(clickX - pauseBtnX, 2) + 
            Math.pow(clickY - pauseBtnY, 2)
        );
        
        if (distance <= pauseBtnRadius) {
            gamePaused = !gamePaused;
        }
    }
});

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
function generateTower() {
    // Clear existing obstacles and floors
    obstacles.length = 0;
    floors.length = 0;
    
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
            // Choose random movement patterns with more variety
            const movementType = Math.random();
            
            if (movementType < 0.4) { // Horizontal obstacles
                const baseSpeed = 1.5 + (i / totalFloors) * 5; // Increased speed
                const speed = baseSpeed * (0.8 + Math.random() * 0.4); // Add some variance
                
                obstacles.push({ 
                    x: Math.random() * 250 + 50, 
                    y: -i * 200 - 100, 
                    width: 40 + Math.random() * 40, // More width variance
                    height: 8 + Math.random() * 5, // Height variance
                    speed: speed, 
                    dir: Math.random() > 0.5 ? 1 : -1,
                    type: 'horizontal'
                });
            } 
            else if (movementType < 0.65) { // Vertical oscillating obstacles
                const baseSpeed = 1.5 + (i / totalFloors) * 3;
                
                obstacles.push({ 
                    x: Math.random() * 250 + 50, 
                    y: -i * 200 - 150, 
                    width: 8 + Math.random() * 4, 
                    height: 30 + Math.random() * 30, 
                    speed: baseSpeed * 0.8, 
                    amplitude: 40 + Math.random() * 80, // Increased amplitude variance
                    initialY: -i * 200 - 150,
                    phase: Math.random() * Math.PI * 2,
                    phaseSpeed: 0.01 + Math.random() * 0.04, // Variable oscillation speed
                    type: 'vertical'
                });
            }
            else if (movementType < 0.8) { // Circular moving obstacles
                const radius = 20 + Math.random() * 40;
                const centerX = 150 + Math.random() * 100;
                const centerY = -i * 200 - 100;
                const speed = 0.02 + (i / totalFloors) * 0.03;
                
                obstacles.push({
                    x: centerX, 
                    y: centerY,
                    centerX: centerX,
                    centerY: centerY,
                    radius: radius,
                    width: 15,
                    height: 15,
                    angle: Math.random() * Math.PI * 2,
                    speed: speed,
                    type: 'circular'
                });
            }
            else { // Diagonal moving obstacles
                const size = 15 + Math.random() * 15;
                obstacles.push({
                    x: Math.random() * 250 + 50,
                    y: -i * 200 - 100,
                    width: size,
                    height: size,
                    speedX: (1 + (i / totalFloors) * 2) * (Math.random() > 0.5 ? 1 : -1),
                    speedY: (0.5 + (i / totalFloors)) * (Math.random() > 0.5 ? 1 : -1),
                    type: 'diagonal',
                    minY: -i * 200 - 150,
                    maxY: -i * 200 - 50
                });
            }
        }
    }
}

// Reset game function
function resetGame() {
    spaceship.x = 180;
    spaceship.y = 500;
    scrollY = 0;
    currentFloor = 1;
    gameOver = false;
    gameStarted = true;
    gamePaused = false;
    generateTower();
}

// Initial tower generation
generateTower();

function update() {
    if (gameOver || !gameStarted || gamePaused) return;

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
    
    // Constant upward scroll to simulate ascent - increased speed
    scrollY += 1.5; // Increased from 1
    
    // Additional scroll when moving up - increased speed
    if (spaceship.y < 250) {
        const scrollSpeed = 3; // Increased from 2
        scrollY += scrollSpeed;
        spaceship.y += scrollSpeed;
    }

    // Calculate current floor based on scroll position
    currentFloor = Math.floor(scrollY / 200) + 1;
    currentFloor = Math.min(currentFloor, totalFloors);

    // Move stars for parallax effect
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = -10;
            star.x = Math.random() * canvas.width;
        }
    });

    // Move obstacles with enhanced movement patterns
    obstacles.forEach(obs => {
        if (obs.type === 'horizontal') {
            // Horizontal movement
            obs.x += obs.speed * obs.dir;
            if (obs.x < 60 || obs.x > canvas.width - 60 - obs.width) {
                obs.dir *= -1;
            }
        } 
        else if (obs.type === 'vertical') {
            // Vertical oscillation with variable phase speed
            obs.y = obs.initialY + Math.sin(obs.phase) * obs.amplitude;
            obs.phase += obs.phaseSpeed;
        }
        else if (obs.type === 'circular') {
            // Circular movement
            obs.angle += obs.speed;
            obs.x = obs.centerX + Math.cos(obs.angle) * obs.radius;
            obs.y = obs.centerY + Math.sin(obs.angle) * obs.radius;
        }
        else if (obs.type === 'diagonal') {
            // Diagonal movement with bounds
            obs.x += obs.speedX;
            obs.y += obs.speedY;
            
            // Bounce off walls
            if (obs.x < 60 || obs.x > canvas.width - 60 - obs.width) {
                obs.speedX *= -1;
            }
            
            // Bounce off floor limits
            if (obs.y < obs.minY || obs.y > obs.maxY) {
                obs.speedY *= -1;
            }
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
    if ((keys['w'] || keys['ArrowUp']) && !gamePaused) {
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

function drawPauseButton() {
    // Draw pause button circle
    ctx.fillStyle = "#555";
    ctx.beginPath();
    ctx.arc(canvas.width - 50, 20, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw icon
    ctx.fillStyle = "#fff";
    if (gamePaused) {
        // Play icon when paused
        ctx.beginPath();
        ctx.moveTo(canvas.width - 45, 13);
        ctx.lineTo(canvas.width - 45, 27);
        ctx.lineTo(canvas.width - 35, 20);
        ctx.closePath();
        ctx.fill();
    } else {
        // Pause icon when playing
        ctx.fillRect(canvas.width - 55, 13, 4, 14);
        ctx.fillRect(canvas.width - 49, 13, 4, 14);
    }
}

function drawRefreshButton() {
    // Draw refresh button
    const btnX = canvas.width / 2 - 70;
    const btnY = canvas.height / 2 + 70;
    const btnWidth = 140;
    const btnHeight = 40;
    
    ctx.fillStyle = "#39f";
    ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
    
    ctx.fillStyle = "#fff";
    ctx.font = "18px Arial";
    ctx.fillText("Play Again", btnX + 30, btnY + 25);
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
    
    // Draw obstacles with different colors based on type
    obstacles.forEach(obs => {
        if (obs.y + scrollY > -100 && obs.y + scrollY < canvas.height + 100) {
            // Set colors based on obstacle type for visual variety
            switch(obs.type) {
                case 'horizontal':
                    ctx.fillStyle = "#f55"; // Red
                    break;
                case 'vertical':
                    ctx.fillStyle = "#f95"; // Orange
                    break;
                case 'circular':
                    ctx.fillStyle = "#5f5"; // Green
                    break;
                case 'diagonal':
                    ctx.fillStyle = "#f5f"; // Purple
                    break;
                default:
                    ctx.fillStyle = "#f55";
            }
            
            ctx.fillRect(obs.x, obs.y + scrollY, obs.width, obs.height);
        }
    });
    
    // Draw player ship
    drawSpaceShip(spaceship.x, spaceship.y);
    
    // Draw UI - only floor counter now (score removed as requested)
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText(`Floor: ${currentFloor}/${totalFloors}`, 10, 30);
    
    // Draw pause button if game is active
    if (gameStarted && !gameOver) {
        drawPauseButton();
    }
    
    // Draw pause screen
    if (gamePaused) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = "white";
        ctx.font = "30px Arial";
        ctx.fillText("PAUSED", canvas.width / 2 - 60, canvas.height / 2);
        
        ctx.font = "16px Arial";
        ctx.fillText("Click pause button or press P to resume", canvas.width / 2 - 130, canvas.height / 2 + 40);
    }
    
    // Game over screen
    if (gameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = "white";
        ctx.font = "30px Arial";
        if (currentFloor >= totalFloors) {
            ctx.fillText("Victory!", canvas.width / 2 - 60, canvas.height / 2 - 50);
            ctx.font = "20px Arial";
            ctx.fillText(`You reached floor ${totalFloors}!`, canvas.width / 2 - 100, canvas.height / 2);
        } else {
            ctx.fillText("Game Over", canvas.width / 2 - 80, canvas.height / 2 - 50);
            ctx.font = "20px Arial";
            ctx.fillText(`You reached floor ${currentFloor}`, canvas.width / 2 - 100, canvas.height / 2);
        }
        
        // Draw clickable refresh button
        drawRefreshButton();
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