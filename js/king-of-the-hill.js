document.addEventListener('DOMContentLoaded', () => {
    const gameId = 'king-of-the-hill';
    const container = document.getElementById('king-of-the-hill-container');
    if (!container) return;

    // --- Win Screen Elements ---
    const blueWinScreen = document.getElementById('koth-blue-win-screen');
    const redWinScreen = document.getElementById('koth-red-win-screen');

    // Game State
    let gameOver = false;
    let player1IsGrounded = false; // Grounded state for jump
    let player2IsGrounded = false; // Grounded state for jump
    const jumpForce = 15; // Force applied for jump

    window.activeGame = null;

    container.addEventListener('mouseover', () => {
        window.activeGame = gameId;
        console.log(`King of the Hill: Mouse Over. activeGame set to: ${window.activeGame}`);
    });
    container.addEventListener('mouseout', () => {
        window.activeGame = null;
        console.log(`King of the Hill: Mouse Out. activeGame set to: ${window.activeGame}`);
    });

    // Add focus/blur listeners for robustness
    container.addEventListener('focus', () => {
        window.activeGame = gameId;
        console.log(`King of the Hill: Focus Gained. activeGame set to: ${window.activeGame}`);
    });
    container.addEventListener('blur', () => {
        window.activeGame = null;
        console.log(`King of the Hill: Focus Lost. activeGame set to: ${window.activeGame}`);
    });

    // ===================================
    // RENDERER & SCENE SETUP
    // ===================================
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    camera.position.set(0, 12, 12);
    camera.lookAt(0, 0, 0);

    // ===================================
    // LIGHTING
    // ===================================
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // ===================================
    // PHYSICS (CANNON.js) SETUP
    // ===================================
    const world = new CANNON.World();
    world.gravity.set(0, -30, 0);

    // --- Materials ---
    const groundMaterial = new CANNON.Material('ground');
    const playerMaterial = new CANNON.Material('player');
    world.addContactMaterial(new CANNON.ContactMaterial(groundMaterial, playerMaterial, {
        friction: 0.3,
        restitution: 0.1,
    }));
    world.addContactMaterial(new CANNON.ContactMaterial(playerMaterial, playerMaterial, {
        friction: 0.1,
        restitution: 0.5,
    }));


    // ===================================
    // MESHES & PHYSICS BODIES
    // ===================================

    // --- Ground ---
    const groundBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane(), material: groundMaterial });
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);
    const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({ color: 0x444444 }));
    groundMesh.rotation.x = -Math.PI / 2;
    scene.add(groundMesh);


    // --- Hill ---
    const hillGeometry = new THREE.CylinderGeometry(4, 4, 0.2, 32);
    const neutralMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const player1CapturedMaterial = new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x0077aa });
    const player2CapturedMaterial = new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0xcc0000 });
    const hill = new THREE.Mesh(hillGeometry, neutralMaterial);
    hill.position.y = 0.1;
    scene.add(hill);

    // --- Players ---
    const playerShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
    const playerGeometry = new THREE.BoxGeometry(1, 1, 1);

    // Player 1 (Blue)
    const player1Material = new THREE.MeshStandardMaterial({ color: 0x00aaff });
    const player1Mesh = new THREE.Mesh(playerGeometry, player1Material);
    scene.add(player1Mesh);
    const player1Body = new CANNON.Body({ mass: 70, shape: playerShape, material: playerMaterial, position: new CANNON.Vec3(5, 0.5, 0), linearDamping: 0.9 });
    world.addBody(player1Body);

    // Player 2 (Red)
    const player2Material = new THREE.MeshStandardMaterial({ color: 0xff4444 });
    const player2Mesh = new THREE.Mesh(playerGeometry, player2Material);
    scene.add(player2Mesh);
    const player2Body = new CANNON.Body({ mass: 70, shape: playerShape, material: playerMaterial, position: new CANNON.Vec3(-5, 0.5, 0), linearDamping: 0.9 });
    world.addBody(player2Body);


    // ===================================
    // CONTROLS & PUSHING MECHANIC
    // ===================================
    const keys = {};
    const player1KeyPresses = [];
    const player2KeyPresses = [];
    const keyPressTimeWindow = 500; // ms
    const pushImpulse = 80; // Increased to make pushing stronger

    document.addEventListener('keydown', (e) => {
        if (gameOver || window.activeGame !== gameId) return;
        keys[e.code] = true;
        const now = Date.now();
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
            player1KeyPresses.push(now);
        }
        if (['KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(e.code)) {
            player2KeyPresses.push(now);
        }

        // Player 1 Jump (Slash key)
        if (e.code === 'Slash' && player1IsGrounded) {
            player1Body.velocity.y = jumpForce;
            player1IsGrounded = false; // Set to false immediately after jump
        }
        // Player 2 Jump (Left Shift)
        if (e.code === 'ShiftLeft' && player2IsGrounded) {
            player2Body.velocity.y = jumpForce;
            player2IsGrounded = false; // Set to false immediately after jump
        }
    });

    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });

    function handleMovement() {
        const moveSpeed = 6; // Increased by 1.2 times (5 * 1.2)
        
        // Player 1 (Arrows) - Set velocity directly
        const p1_vel = new CANNON.Vec3(0, player1Body.velocity.y, 0);
        if (keys['ArrowUp']) p1_vel.z = -moveSpeed;
        else if (keys['ArrowDown']) p1_vel.z = moveSpeed;
        if (keys['ArrowLeft']) p1_vel.x = -moveSpeed;
        else if (keys['ArrowRight']) p1_vel.x = moveSpeed;
        player1Body.velocity.x = p1_vel.x;
        player1Body.velocity.z = p1_vel.z;
        
        // Player 2 (WASD) - Set velocity directly
        const p2_vel = new CANNON.Vec3(0, player2Body.velocity.y, 0);
        if (keys['KeyW']) p2_vel.z = -moveSpeed;
        else if (keys['KeyS']) p2_vel.z = moveSpeed;
        if (keys['KeyA']) p2_vel.x = -moveSpeed;
        else if (keys['KeyD']) p2_vel.x = moveSpeed;
        player2Body.velocity.x = p2_vel.x;
        player2Body.velocity.z = p2_vel.z;
    }
    
    // Collision handler for pushing
    player1Body.addEventListener('collide', (event) => {
        if (gameOver) return;
        if (event.body === player2Body) {
            // Apply mutual push on collision
            const direction = player2Body.position.vsub(player1Body.position).unit();
            player2Body.applyImpulse(direction.scale(pushImpulse), player2Body.position);
            player1Body.applyImpulse(direction.scale(-pushImpulse), player1Body.position);
        }
        // Check if player 1 is grounded
        if (event.body === groundBody) {
            const contact = event.contact;
            // Ensure contact normal points significantly upwards (player on top of ground)
            if (contact.ni.y > 0.5) {
                player1IsGrounded = true;
            }
        }
    });

    player2Body.addEventListener('collide', (event) => {
        if (gameOver) return;
        // Check if player 2 is grounded
        if (event.body === groundBody) {
            const contact = event.contact;
            if (contact.ni.y > 0.5) {
                player2IsGrounded = true;
            }
        }
    });


    // ===================================
    // GAME LOGIC & WIN CONDITION
    // ===================================
    function checkWinCondition() { // Removed deltaTime from signature
        const hillRadius = 4;
        const p1Dist = Math.sqrt(Math.pow(player1Body.position.x - hill.position.x, 2) + Math.pow(player1Body.position.z - hill.position.z, 2));
        const p2Dist = Math.sqrt(Math.pow(player2Body.position.x - hill.position.x, 2) + Math.pow(player2Body.position.z - hill.position.z, 2));
        
        const p1OnHill = p1Dist < hillRadius;
        const p2OnHill = p2Dist < hillRadius;

        if (gameOver) {
            return;
        }

        if (p1OnHill && !p2OnHill) {
            // Player 1 wins: P1 is on hill, P2 is off hill
            hill.material = player1CapturedMaterial;
            gameOver = true;
            if (blueWinScreen) blueWinScreen.style.display = 'flex';
        } else if (!p1OnHill && p2OnHill) {
            // Player 2 wins: P2 is on hill, P1 is off hill
            hill.material = player2CapturedMaterial;
            gameOver = true;
            if (redWinScreen) redWinScreen.style.display = 'flex';
        } else if (p1OnHill && p2OnHill) {
            // Contested: Both are on the hill
            hill.material = neutralMaterial;
        } else {
            // Nobody on the hill or other states (e.g., both off)
            hill.material = neutralMaterial;
        }
    }

    // ===================================
    // ANIMATION LOOP
    // ===================================
    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);

        const deltaTime = clock.getDelta();
        world.step(1 / 60, deltaTime, 3);

        if (!gameOver && window.activeGame === gameId) {
            handleMovement();
            checkWinCondition(); // No longer passing deltaTime
        }

        // Update mesh positions from physics bodies
        player1Mesh.position.copy(player1Body.position);
        player1Mesh.quaternion.copy(player1Body.quaternion);
        player2Mesh.position.copy(player2Body.position);
        player2Mesh.quaternion.copy(player2Body.quaternion);

        renderer.render(scene, camera);
    }

    animate();

    // ===================================
    // UTILITY
    // ===================================
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
});
