document.addEventListener('DOMContentLoaded', () => {
    const gameId = 'king-of-the-hill';
    const container = document.getElementById('king-of-the-hill-container');
    if (!container) return;

    // --- Win Screen Elements ---
    const blueWinScreen = document.getElementById('koth-blue-win-screen');
    const redWinScreen = document.getElementById('koth-red-win-screen');

    // --- Game State ---
    let gameOver = false;
    window.activeGame = null;

    container.addEventListener('mouseover', () => window.activeGame = gameId);
    container.addEventListener('mouseout', () => window.activeGame = null);

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
    world.gravity.set(0, -30, 0); // A bit stronger gravity

    // --- Materials ---
    const groundMaterial = new CANNON.Material('ground');
    const playerMaterial = new CANNON.Material('player');
    world.addContactMaterial(new CANNON.ContactMaterial(groundMaterial, playerMaterial, {
        friction: 0.3,
        restitution: 0.1,
    }));
    world.addContactMaterial(new CANNON.ContactMaterial(playerMaterial, playerMaterial, {
        friction: 0.0,
        restitution: 0.5, // Make players bounce off each other slightly
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
    const player1Body = new CANNON.Body({ mass: 70, shape: playerShape, material: playerMaterial, position: new CANNON.Vec3(5, 0.5, 0) });
    world.addBody(player1Body);

    // Player 2 (Red)
    const player2Material = new THREE.MeshStandardMaterial({ color: 0xff4444 });
    const player2Mesh = new THREE.Mesh(playerGeometry, player2Material);
    scene.add(player2Mesh);
    const player2Body = new CANNON.Body({ mass: 70, shape: playerShape, material: playerMaterial, position: new CANNON.Vec3(-5, 0.5, 0) });
    world.addBody(player2Body);


    // ===================================
    // CONTROLS & PUSHING MECHANIC
    // ===================================
    const keys = {};
    const player1KeyPresses = [];
    const player2KeyPresses = [];
    const keyPressTimeWindow = 500; // ms
    const pushForce = 80;

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
    });

    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });

    function handleMovement() {
        const moveForce = 40;

        // Player 1 (Arrows)
        if (keys['ArrowUp']) player1Body.applyForce(new CANNON.Vec3(0, 0, -moveForce), player1Body.position);
        if (keys['ArrowDown']) player1Body.applyForce(new CANNON.Vec3(0, 0, moveForce), player1Body.position);
        if (keys['ArrowLeft']) player1Body.applyForce(new CANNON.Vec3(-moveForce, 0, 0), player1Body.position);
        if (keys['ArrowRight']) player1Body.applyForce(new CANNON.Vec3(moveForce, 0, 0), player1Body.position);

        // Player 2 (WASD)
        if (keys['KeyW']) player2Body.applyForce(new CANNON.Vec3(0, 0, -moveForce), player2Body.position);
        if (keys['KeyS']) player2Body.applyForce(new CANNON.Vec3(0, 0, moveForce), player2Body.position);
        if (keys['KeyA']) player2Body.applyForce(new CANNON.Vec3(-moveForce, 0, 0), player2Body.position);
        if (keys['KeyD']) player2Body.applyForce(new CANNON.Vec3(moveForce, 0, 0), player2Body.position);
    }
    
    // Collision handler for pushing
    player1Body.addEventListener('collide', (event) => {
        if (gameOver) return;
        if (event.body === player2Body) {
            const now = Date.now();
            const p1power = player1KeyPresses.filter(t => now - t < keyPressTimeWindow).length;
            const p2power = player2KeyPresses.filter(t => now - t < keyPressTimeWindow).length;

            const direction = player2Body.position.vsub(player1Body.position).unit();

            if (p1power > p2power) {
                player2Body.applyImpulse(direction.scale(pushForce), player2Body.position);
            } else if (p2power > p1power) {
                player1Body.applyImpulse(direction.scale(-pushForce), player1Body.position);
            }
        }
    });


    // ===================================
    // GAME LOGIC & WIN CONDITION
    // ===================================
    function checkWinCondition() {
        // Use XZ distance for hill check, ignoring Y
        const p1Dist = Math.sqrt(Math.pow(player1Body.position.x - hill.position.x, 2) + Math.pow(player1Body.position.z - hill.position.z, 2));
        const p2Dist = Math.sqrt(Math.pow(player2Body.position.x - hill.position.x, 2) + Math.pow(player2Body.position.z - hill.position.z, 2));
        
        const p1OnHill = p1Dist < 4;
        const p2OnHill = p2Dist < 4;

        if (p1OnHill && !p2OnHill) {
            hill.material = player1CapturedMaterial;
            gameOver = true;
            if(blueWinScreen) blueWinScreen.style.display = 'flex';
        } else if (!p1OnHill && p2OnHill) {
            hill.material = player2CapturedMaterial;
            gameOver = true;
            if(redWinScreen) redWinScreen.style.display = 'flex';
        } else {
            hill.material = neutralMaterial; // Contested or empty
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
            checkWinCondition();
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