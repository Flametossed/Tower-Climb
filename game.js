// Add these variables to your existing game elements section:
const bullets = [];
const bulletSpeed = 8;
const bulletSize = 5;
const bulletCooldown = 300; // milliseconds between shots
let lastShotTime = 0;
const destroyedObstacles = []; // Track destroyed obstacles for animation

// Add this near your other event listeners
canvas.addEventListener("mousedown", (e) => {
    if (gameStarted && !gameOver && !gamePaused) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const currentTime = Date.now();
        if (currentTime - lastShotTime > bulletCooldown) {
            // Calculate direction vector from spaceship to mouse position
            const shipCenterX = spaceship.x + spaceship.width / 2;
            const shipCenterY = spaceship.y + spaceship.height / 2;
            
            const dirX = mouseX - shipCenterX;
            const dirY = mouseY - shipCenterY;
            
            // Normalize the direction vector
            const length = Math.sqrt(dirX * dirX + dirY * dirY);
            const normalizedDirX = dirX / length;
            const normalizedDirY = dirY / length;
            
            // Create new bullet
            bullets.push({
                x: shipCenterX,
                y: shipCenterY,
                dirX: normalizedDirX,
                dirY: normalizedDirY,
                size: bulletSize,
                active: true
            });
            
            lastShotTime = currentTime;
        }
    }
});

// Add this function to update bullets
function updateBullets() {
    // Move bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        // Update position
        bullet.x += bullet.dirX * bulletSpeed;
        bullet.y += bullet.dirY * bulletSpeed;
        
        // Check if bullet is out of bounds
        if (
            bullet.x < 0 || 
            bullet.x > canvas.width || 
            bullet.y < 0 || 
            bullet.y > canvas.height
        ) {
            bullets.splice(i, 1);
            continue;
        }
        
        // Check for collision with obstacles
        for (let j = obstacles.length - 1; j >= 0; j--) {
            const obs = obstacles[j];
            
            // Calculate obstacle position with scroll
            const obsScreenY = obs.y + scrollY;
            
            // Check collision
            if (
                bullet.active &&
                bullet.x > obs.x && 
                bullet.x < obs.x + obs.width &&
                bullet.y > obsScreenY && 
                bullet.y < obsScreenY + obs.height
            ) {
                // Add to destroyed obstacles for animation
                destroyedObstacles.push({
                    x: obs.x,
                    y: obs.y,
                    width: obs.width,
                    height: obs.height,
                    type: obs.type,
                    alpha: 1,
                    particles: generateExplosionParticles(obs.x + obs.width/2, obsScreenY + obs.height/2)
                });
                
                // Remove obstacle and bullet
                obstacles.splice(j, 1);
                bullet.active = false;
                bullets.splice(i, 1);
                break;
            }
        }
    }
    
    // Update explosion animations
    for (let i = destroyedObstacles.length - 1; i >= 0; i--) {
        const explosion = destroyedObstacles[i];
        explosion.alpha -= 0.05;
        
        // Update explosion particles
        for (let j = 0; j < explosion.particles.length; j++) {
            const particle = explosion.particles[j];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.size *= 0.95;
        }
        
        if (explosion.alpha <= 0) {
            destroyedObstacles.splice(i, 1);
        }
    }
}

// Generate explosion particles
function generateExplosionParticles(x, y) {
    const particles = [];
    const particleCount = 15;
    
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 4 + 2,
            color: getExplosionColor()
        });
    }
    
    return particles;
}

// Get random explosion color
function getExplosionColor() {
    const colors = ["#ff0000", "#ff7700", "#ffff00", "#ff5500"];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Add this to your draw function
function drawBullets() {
    // Draw bullets
    ctx.fillStyle = "#ff0";
    bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw explosions
    destroyedObstacles.forEach(explosion => {
        // Draw particles
        explosion.particles.forEach(particle => {
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = explosion.alpha;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
    });
    
    ctx.globalAlpha = 1;
}

// Draw crosshair at mouse position
let mouseX = 0;
let mouseY = 0;

// Add mouse move listener
canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

function drawCrosshair() {
    if (gameStarted && !gameOver && !gamePaused) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        
        // Draw crosshair
        const size = 10;
        ctx.beginPath();
        ctx.moveTo(mouseX - size, mouseY);
        ctx.lineTo(mouseX + size, mouseY);
        ctx.moveTo(mouseX, mouseY - size);
        ctx.lineTo(mouseX, mouseY + size);
        ctx.stroke();
        
        // Draw small circle in the middle
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 2, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// Update the update() function to include bullet updates
// Find the update() function and modify it:
function update() {
    if (gameOver || !gameStarted || gamePaused) return;
    
    // Existing player movement code...
    
    // Add bullet updates here:
    updateBullets();
    
    // Rest of the existing update function...
}

// Update the draw() function to include bullet rendering
// Find the draw() function and add these calls:
function draw() {
    // Existing drawing code...
    
    // Add these lines before drawing the UI:
    drawBullets();
    drawCrosshair();
    
    // Rest of existing drawing code...
}

// Update the start screen text to mention shooting
// Find the start screen section in the draw() function and add:
if (!gameStarted) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.fillText("Space Tower Climb", canvas.width / 2 - 120, canvas.height / 2 - 70);
    
    ctx.font = "16px Arial";
    ctx.fillText("Use WASD or Arrow Keys to control", canvas.width / 2 - 120, canvas.height / 2 - 20);
    ctx.fillText("Click to shoot and destroy obstacles", canvas.width / 2 - 120, canvas.height / 2 + 10);
    ctx.fillText("Press W or Up to start", canvas.width / 2 - 80, canvas.height / 2 + 40);
}
