document.addEventListener('DOMContentLoaded', () => {
    const gameId = 'capture-the-flag';
    const container = document.getElementById('capture-the-flag-container');
    if (!container) return;

    const blueWinScreen = document.getElementById('blue-win-screen');
    const redWinScreen = document.getElementById('red-win-screen');
    const countdownOverlay = document.getElementById('countdown-overlay');
    const countdownText = document.getElementById('countdown-text');

    container.addEventListener('mouseover', () => {
        window.activeGame = gameId;
        if (!countdownStarted) {
            startCountdown();
            countdownStarted = true;
        }
    });
    container.addEventListener('mouseout', () => window.activeGame = null);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(30, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Bases
    const baseGeometry = new THREE.BoxGeometry(4, 0.2, 4);
    const blueBaseMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
    const redBaseMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const blueBase = new THREE.Mesh(baseGeometry, blueBaseMaterial);
    blueBase.position.set(12, 0.1, 0);
    scene.add(blueBase);
    const redBase = new THREE.Mesh(baseGeometry, redBaseMaterial);
    redBase.position.set(-12, 0.1, 0);
    scene.add(redBase);

    // Flags
    const flagGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
    const blueFlagMaterial = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x000000 });
    const redFlagMaterial = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x000000 });
    const blueFlag = new THREE.Mesh(flagGeometry, blueFlagMaterial);
    blueFlag.position.set(12, 1, 0);
    scene.add(blueFlag);
    const redFlag = new THREE.Mesh(flagGeometry, redFlagMaterial);
    redFlag.position.set(-12, 1, 0);
    scene.add(redFlag);

    blueFlag.originalPosition = blueFlag.position.clone();
    redFlag.originalPosition = redFlag.position.clone();

    // Player 1 (Blue)
    const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
    const player1Material = new THREE.MeshStandardMaterial({ color: 0x00aaff });
    const player1 = new THREE.Mesh(playerGeometry, player1Material);
    player1.position.set(10, 0.5, 0);
    scene.add(player1);

    // Player 2 (Red)
    const player2Material = new THREE.MeshStandardMaterial({ color: 0xff4444 });
    const player2 = new THREE.Mesh(playerGeometry, player2Material);
    player2.position.set(-10, 0.5, 0);
    scene.add(player2);

    camera.position.set(0, 15, 12);
    camera.lookAt(0, 0, 0);

    // Game State
    let gameOver = false;
    let gameStarted = false; // New flag for game start
    let countdownStarted = false; // New flag to ensure countdown runs only once

    // Player Movement & Interaction
    const keys = {};
    const pickupDistance = 1.5;

    document.addEventListener('keydown', (e) => {
        if (gameOver || !gameStarted) return; // Disable input if game is over or not started
        keys[e.code] = true; // Always update key state
        if (window.activeGame !== gameId) return; // Guard game-specific logic

        // Player 1 (Slash key) for Red Flag
        if (e.code === 'Slash') {
            if (redFlag.parent === player1) {
                // Drop the flag
                player1.remove(redFlag);
                scene.add(redFlag);
                redFlag.position.copy(redFlag.originalPosition);
            } else {
                // Try to pick up
                const distance = player1.position.distanceTo(redFlag.position);
                if (redFlag.parent === scene && distance < pickupDistance) {
                    scene.remove(redFlag);
                    player1.add(redFlag);
                    redFlag.position.set(0, 1, 0); // Position relative to player
                }
            }
        }

        // Player 2 (Left Shift) for Blue Flag
        if (e.code === 'ShiftLeft') {
            if (blueFlag.parent === player2) {
                // Drop the flag
                player2.remove(blueFlag);
                scene.add(blueFlag);
                blueFlag.position.copy(blueFlag.originalPosition);
            } else {
                // Try to pick up
                const distance = player2.position.distanceTo(blueFlag.position);
                if (blueFlag.parent === scene && distance < pickupDistance) {
                    scene.remove(blueFlag);
                    player2.add(blueFlag);
                    blueFlag.position.set(0, 1, 0); // Position relative to player
                }
            }
        }
    });

    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });

    const playerSpeed = 0.1;

    function updatePlayersPosition() {
        // Player 1 (Arrows)
        if (keys['ArrowUp']) player1.position.z -= playerSpeed;
        if (keys['ArrowDown']) player1.position.z += playerSpeed;
        if (keys['ArrowLeft']) player1.position.x -= playerSpeed;
        if (keys['ArrowRight']) player1.position.x += playerSpeed;

        // Player 2 (WASD)
        if (keys['KeyW']) player2.position.z -= playerSpeed;
        if (keys['KeyS']) player2.position.z += playerSpeed;
        if (keys['KeyA']) player2.position.x -= playerSpeed;
        if (keys['KeyD']) player2.position.x += playerSpeed;

        // Simple boundary checks
        [player1, player2].forEach(p => {
            p.position.x = Math.max(-14.5, Math.min(14.5, p.position.x));
            p.position.z = Math.max(-9.5, Math.min(9.5, p.position.z));
        });
    }

    function checkWinConditions() {
        // Blue player (player1) wins condition
        if (redFlag.parent === player1) {
            const p1x = player1.position.x;
            const p1z = player1.position.z;
            const blueBaseX = blueBase.position.x;
            const blueBaseZ = blueBase.position.z;
            // Base width and depth are 4, so radius is 2
            if (p1x > blueBaseX - 2 && p1x < blueBaseX + 2 &&
                p1z > blueBaseZ - 2 && p1z < blueBaseZ + 2) {
                gameOver = true;
                if (blueWinScreen) blueWinScreen.style.display = 'flex';
            }
        }

        // Red player (player2) wins condition
        if (blueFlag.parent === player2) {
            const p2x = player2.position.x;
            const p2z = player2.position.z;
            const redBaseX = redBase.position.x;
            const redBaseZ = redBase.position.z;
            // Base width and depth are 4, so radius is 2
            if (p2x > redBaseX - 2 && p2x < redBaseX + 2 &&
                p2z > redBaseZ - 2 && p2z < redBaseZ + 2) {
                gameOver = true;
                if (redWinScreen) redWinScreen.style.display = 'flex';
            }
        }
    }

    // Countdown logic
    function startCountdown() {
        if (countdownOverlay && countdownText) {
            countdownOverlay.style.display = 'flex';
            let count = 3;
            countdownText.textContent = count;

            const timer = setInterval(() => {
                count--;
                if (count > 0) {
                    countdownText.textContent = count;
                } else if (count === 0) {
                    countdownText.textContent = 'GO!';
                } else {
                    clearInterval(timer);
                    countdownOverlay.style.display = 'none';
                    gameStarted = true;
                }
            }, 1000);
        }
    }

    const blueRestartButton = blueWinScreen.querySelector('.restart-btn');
    const redRestartButton = redWinScreen.querySelector('.restart-btn');

    function resetGame() {
        // Reset game state
        gameOver = false;
        gameStarted = false;
        countdownStarted = false;

        // Hide win screens
        blueWinScreen.style.display = 'none';
        redWinScreen.style.display = 'none';

        // Reset player positions
        player1.position.set(10, 0.5, 0);
        player2.position.set(-10, 0.5, 0);

        // Reset flags
        if (redFlag.parent !== scene) {
            player1.remove(redFlag);
            scene.add(redFlag);
        }
        redFlag.position.copy(redFlag.originalPosition);

        if (blueFlag.parent !== scene) {
            player2.remove(blueFlag);
            scene.add(blueFlag);
        }
        blueFlag.position.copy(blueFlag.originalPosition);

        // Restart countdown if player is still hovering
        if (window.activeGame === gameId) {
            startCountdown();
            countdownStarted = true;
        }
    }

    blueRestartButton.addEventListener('click', resetGame);
    redRestartButton.addEventListener('click', resetGame);

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        if (!gameOver && gameStarted && window.activeGame === gameId) {
            updatePlayersPosition();
            checkWinConditions();
        }
        renderer.render(scene, camera);
    }

    animate();

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
});