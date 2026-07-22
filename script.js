// DOM Elements
const dino = document.getElementById('dino');
const gameContainer = document.getElementById('gameContainer');
const currentScoreEl = document.getElementById('currentScore');
const highScoreEl = document.getElementById('highScore');
const gameOverScreen = document.getElementById('gameOverScreen');

// Physics & Game Constants
const GRAVITY = 0.6;
const JUMP_FORCE = -11;
const INITIAL_SPEED = 5;

// Game State Variables
let dinoY = 0;
let dinoVelocityY = 0;
let isJumping = false;
let isGameOver = false;
let gameStarted = false;

let obstacles = [];
let score = 0;
let gameSpeed = INITIAL_SPEED;
let frameCount = 0;
let animationFrameId;

// High Score Setup
let highScore = localStorage.getItem('dino_high_score') || 0;
highScoreEl.textContent = String(Math.floor(highScore)).padStart(5, '0');

// Event Listeners for Controls
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJumpAction();
    }
});

document.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleJumpAction();
});

function handleJumpAction() {
    if (!gameStarted || isGameOver) {
        resetGame();
    } else if (!isJumping) {
        isJumping = true;
        dinoVelocityY = JUMP_FORCE;
    }
}

function resetGame() {
    // Clear existing obstacles from DOM
    obstacles.forEach(obstacle => obstacle.element.remove());
    obstacles = [];

    // Reset game state
    score = 0;
    gameSpeed = INITIAL_SPEED;
    dinoY = 0;
    dinoVelocityY = 0;
    isJumping = false;
    isGameOver = false;
    gameStarted = true;

    gameOverScreen.classList.add('hidden');

    cancelAnimationFrame(animationFrameId);
    gameLoop();
}

function spawnObstacle() {
    const obstacleEl = document.createElement('div');
    obstacleEl.classList.add('cactus');
    
    // Randomize cactus sizes
    const height = Math.floor(Math.random() * 20) + 30; // 30px to 50px
    const width = Math.floor(Math.random() * 10) + 15;  // 15px to 25px
    obstacleEl.style.height = height + 'px';
    obstacleEl.style.width = width + 'px';

    gameContainer.appendChild(obstacleEl);

    obstacles.push({
        element: obstacleEl,
        x: 600,
        width: width,
        height: height
    });
}

function gameLoop() {
    frameCount++;

    // 1. Dino Physics Update
    dinoY += dinoVelocityY;
    dinoVelocityY += GRAVITY;

    if (dinoY <= 0) {
        dinoY = 0;
        dinoVelocityY = 0;
        isJumping = false;
    }
    dino.style.bottom = dinoY + 'px';

    // 2. Spawn Obstacles dynamically
    const spawnInterval = Math.max(50, Math.floor(100 - gameSpeed * 2));
    if (frameCount % spawnInterval === 0 && Math.random() > 0.3) {
        spawnObstacle();
    }

    // 3. Move & Check Collision for Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= gameSpeed;
        obs.element.style.left = obs.x + 'px';

        // Hitbox Collision Detection
        const dinoHitbox = { left: 50, right: 80, bottom: dinoY, top: dinoY + 40 };
        const obsHitbox = { left: obs.x, right: obs.x + obs.width, bottom: 0, top: obs.height };

        const isColliding = 
            dinoHitbox.right - 5 > obsHitbox.left &&
            dinoHitbox.left + 5 < obsHitbox.right &&
            dinoHitbox.bottom < obsHitbox.top - 5;

        if (isColliding) {
            endGame();
            return;
        }

        // Remove off-screen obstacles
        if (obs.x < -30) {
            obs.element.remove();
            obstacles.splice(i, 1);
        }
    }

    // 4. Update Score & Difficulty Speed
    score += 0.15;
    currentScoreEl.textContent = String(Math.floor(score)).padStart(5, '0');
    
    // Increase game speed gradually
    gameSpeed += 0.001;

    if (!isGameOver) {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

function endGame() {
    isGameOver = true;
    gameStarted = false;
    gameOverScreen.classList.remove('hidden');

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('dino_high_score', highScore);
        highScoreEl.textContent = String(Math.floor(highScore)).padStart(5, '0');
    }
}