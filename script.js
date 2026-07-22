const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const gameOverEl = document.getElementById('game-over');
const startMessageEl = document.getElementById('start-message');
const currentScoreEl = document.getElementById('current-score');
const highScoreEl = document.getElementById('high-score');

// Canvas setup
canvas.width = 800;
canvas.height = 300;

// Game state
let gameStarted = false;
let gameOver = false;
let score = 0;
let highScore = localStorage.getItem('dinoHighScore') || 0;
let gameSpeed = 6;
let gravity = 0.6;
let frameCount = 0;

highScoreEl.textContent = String(highScore).padStart(5, '0');

// Dino
const dino = {
    x: 50,
    y: 220,
    width: 44,
    height: 48,
    velocityY: 0,
    jumping: false,
    ducking: false,
    duckHeight: 30,
    
    draw() {
        ctx.fillStyle = '#535353';
        const h = this.ducking ? this.duckHeight : this.height;
        const y = this.ducking ? this.y + (this.height - this.duckHeight) : this.y;
        
        // Body
        ctx.fillRect(this.x, y, this.width, h);
        
        // Eye
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 30, y + 6, 8, 8);
        ctx.fillStyle = '#535353';
        ctx.fillRect(this.x + 34, y + 8, 4, 4);
        
        // Legs (animated)
        if (!this.jumping) {
            const legOffset = Math.floor(frameCount / 5) % 2 === 0 ? 0 : 6;
            ctx.fillRect(this.x + 8, y + h, 8, 10 - legOffset);
            ctx.fillRect(this.x + 24, y + h, 8, 4 + legOffset);
        } else {
            ctx.fillRect(this.x + 8, y + h, 8, 10);
            ctx.fillRect(this.x + 24, y + h, 8, 10);
        }
    },
    
    jump() {
        if (!this.jumping && !this.ducking) {
            this.velocityY = -13;
            this.jumping = true;
        }
    },
    
    duck(isDucking) {
        if (!this.jumping) {
            this.ducking = isDucking;
        }
    },
    
    update() {
        this.velocityY += gravity;
        this.y += this.velocityY;
        
        if (this.y >= 220) {
            this.y = 220;
            this.jumping = false;
            this.velocityY = 0;
        }
    },
    
    getBounds() {
        const h = this.ducking ? this.duckHeight : this.height;
        const y = this.ducking ? this.y + (this.height - this.duckHeight) : this.y;
        return {
            x: this.x + 5,
            y: y + 5,
            width: this.width - 10,
            height: h - 10
        };
    }
};

// Obstacles
const obstacles = [];

class Obstacle {
    constructor(type) {
        this.type = type;
        
        if (type === 'cactus-small') {
            this.width = 20;
            this.height = 40;
            this.y = 228;
        } else if (type === 'cactus-large') {
            this.width = 30;
            this.height = 55;
            this.y = 213;
        } else if (type === 'cactus-group') {
            this.width = 50;
            this.height = 45;
            this.y = 223;
        } else if (type === 'bird') {
            this.width = 46;
            this.height = 30;
            this.y = Math.random() < 0.5 ? 180 : 230;
        }
        
        this.x = canvas.width;
    }
    
    draw() {
        ctx.fillStyle = '#535353';
        
        if (this.type === 'bird') {
            // Bird body
            ctx.fillRect(this.x, this.y + 10, 40, 15);
            // Wing (animated)
            const wingY = Math.floor(frameCount / 8) % 2 === 0 ? -8 : 8;
            ctx.fillRect(this.x + 10, this.y + 10 + wingY, 20, 10);
            // Beak
            ctx.fillRect(this.x + 40, this.y + 14, 10, 6);
        } else {
            // Cactus
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Cactus arms
            if (this.type !== 'cactus-group') {
                ctx.fillRect(this.x - 8, this.y + 10, 8, 15);
                ctx.fillRect(this.x + this.width, this.y + 20, 8, 12);
            }
        }
    }
    
    update() {
        this.x -= gameSpeed;
    }
    
    getBounds() {
        return {
            x: this.x + 3,
            y: this.y + 3,
            width: this.width - 6,
            height: this.height - 6
        };
    }
}

// Ground
const ground = {
    x: 0,
    
    draw() {
        ctx.fillStyle = '#535353';
        ctx.fillRect(0, 268, canvas.width, 2);
        
        // Ground texture
        ctx.fillStyle = '#9e9e9e';
        for (let i = 0; i < canvas.width; i += 20) {
            const offset = (this.x + i) % 40;
            ctx.fillRect(i - offset, 275, 10, 2);
            ctx.fillRect(i - offset + 5, 280, 6, 2);
        }
    },
    
    update() {
        this.x = (this.x + gameSpeed) % 40;
    }
};

// Clouds
const clouds = [];

class Cloud {
    constructor() {
        this.x = canvas.width + Math.random() * 200;
        this.y = 30 + Math.random() * 60;
        this.width = 60 + Math.random() * 40;
    }
    
    draw() {
        ctx.fillStyle = '#e8e8e8';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.width / 2, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(this.x - 20, this.y + 5, this.width / 4, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(this.x + 20, this.y + 5, this.width / 4, 10, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    update() {
        this.x -= gameSpeed * 0.2;
    }
}

// Collision detection
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Spawn obstacles
function spawnObstacle() {
    const types = ['cactus-small', 'cactus-large', 'cactus-group'];
    if (score > 300) types.push('bird');
    
    const type = types[Math.floor(Math.random() * types.length)];
    obstacles.push(new Obstacle(type));
}

// Update score display
function updateScore() {
    score++;
    currentScoreEl.textContent = String(score).padStart(5, '0');
    
    // Increase speed every 100 points
    if (score % 100 === 0) {
        gameSpeed = Math.min(gameSpeed + 0.5, 15);
    }
}

// Game loop
function gameLoop() {
    if (gameOver) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    frameCount++;
    
    // Update and draw clouds
    if (Math.random() < 0.005) clouds.push(new Cloud());
    clouds.forEach((cloud, index) => {
        cloud.update();
        cloud.draw();
        if (cloud.x + cloud.width < 0) clouds.splice(index, 1);
    });
    
    // Ground
    ground.update();
    ground.draw();
    
    // Dino
    dino.update();
    dino.draw();
    
    // Obstacles
    if (frameCount % Math.floor(100 - gameSpeed * 3) === 0) {
        spawnObstacle();
    }
    
    obstacles.forEach((obstacle, index) => {
        obstacle.update();
        obstacle.draw();
        
        // Remove off-screen obstacles
        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(index, 1);
        }
        
        // Collision check
        if (checkCollision(dino.getBounds(), obstacle.getBounds())) {
            endGame();
        }
    });
    
    updateScore();
    
    requestAnimationFrame(gameLoop);
}

// End game
function endGame() {
    gameOver = true;
    gameOverEl.style.display = 'block';
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('dinoHighScore', highScore);
        highScoreEl.textContent = String(highScore).padStart(5, '0');
    }
}

// Reset game
function resetGame() {
    gameOver = false;
    score = 0;
    gameSpeed = 6;
    frameCount = 0;
    obstacles.length = 0;
    clouds.length = 0;
    dino.y = 220;
    dino.velocityY = 0;
    dino.jumping = false;
    dino.ducking = false;
    
    currentScoreEl.textContent = '00000';
    gameOverEl.style.display = 'none';
    
    gameLoop();
}

// Start game
function startGame() {
    if (!gameStarted) {
        gameStarted = true;
        startMessageEl.style.display = 'none';
        gameLoop();
    }
}

// Event listeners
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!gameStarted) {
            startGame();
        } else if (gameOver) {
            resetGame();
        } else {
            dino.jump();
        }
    }
    if (e.code === 'ArrowDown') {
        e.preventDefault();
        dino.duck(true);
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowDown') {
        dino.duck(false);
    }
});

// Touch support
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!gameStarted) {
        startGame();
    } else if (gameOver) {
        resetGame();
    } else {
        dino.jump();
    }
});

document.getElementById('restart-btn').addEventListener('click', resetGame);

// Initial draw
ground.draw();
dino.draw();
