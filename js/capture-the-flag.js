document.addEventListener('DOMContentLoaded', () => {
    const gameId = 'capture-the-flag';
    const container = document.getElementById('capture-the-flag-container');
    if (!container) return;

    const blueWinScreen = document.getElementById('blue-win-screen');
    const redWinScreen = document.getElementById('red-win-screen');

    container.addEventListener('mouseover', () => window.activeGame = gameId);
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
    blueBase.position.set(-12, 0.1, 0);
    scene.add(blueBase);
    const redBase = new THREE.Mesh(baseGeometry, redBaseMaterial);
    redBase.position.set(12, 0.1, 0);
    scene.add(redBase);

    // Flags
    const flagGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
    const blueFlagMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff, emissive: 0x0000cc });
    const redFlagMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xcc0000 });
    const blueFlag = new THREE.Mesh(flagGeometry, blueFlagMaterial);
    blueFlag.position.set(-12, 1, 0);
    scene.add(blueFlag);
    const redFlag = new THREE.Mesh(flagGeometry, redFlagMaterial);
    redFlag.position.set(12, 1, 0);
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

    // Player Movement & Interaction
    const keys = {};
    const pickupDistance = 1.5;

    document.addEventListener('keydown', (e) => {
        if (gameOver) return; // Disable input if game is over
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
        // Blue player wins
        const blueBaseBounds = new THREE.Box3().setFromObject(blueBase);
        if (redFlag.parent === player1 && blueBaseBounds.containsPoint(player1.position)) {
            gameOver = true;
            if (blueWinScreen) blueWinScreen.style.display = 'flex';
        }

        // Red player wins
        const redBaseBounds = new THREE.Box3().setFromObject(redBase);
        if (blueFlag.parent === player2 && redBaseBounds.containsPoint(player2.position)) {
            gameOver = true;
            if (redWinScreen) redWinScreen.style.display = 'flex';
        }
    }

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        if (!gameOver && window.activeGame === gameId) {
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