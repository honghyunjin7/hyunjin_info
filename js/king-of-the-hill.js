
document.addEventListener('DOMContentLoaded', () => {
    // Scene setup
    const container = document.getElementById('king-of-the-hill-container');
    if (!container) return;

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
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Hill
    const hillGeometry = new THREE.CylinderGeometry(4, 4, 0.2, 32);
    const neutralMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const player1CapturedMaterial = new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x0077aa });
    const player2CapturedMaterial = new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0xcc0000 });
    const hill = new THREE.Mesh(hillGeometry, neutralMaterial);
    hill.position.y = 0.1;
    scene.add(hill);

    // Players
    const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
    const player1Material = new THREE.MeshStandardMaterial({ color: 0x00aaff });
    const player1 = new THREE.Mesh(playerGeometry, player1Material);
    player1.position.set(5, 0.5, 0);
    scene.add(player1);

    const player2Material = new THREE.MeshStandardMaterial({ color: 0xff4444 });
    const player2 = new THREE.Mesh(playerGeometry, player2Material);
    player2.position.set(-5, 0.5, 0);
    scene.add(player2);

    camera.position.set(0, 12, 12);
    camera.lookAt(0, 0, 0);

    // Player Movement
    const keys = {};
    document.addEventListener('keydown', (e) => keys[e.code] = true);
    document.addEventListener('keyup', (e) => keys[e.code] = false);

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

        // Boundary checks
        [player1, player2].forEach(p => {
            p.position.x = Math.max(-9.5, Math.min(9.5, p.position.x));
            p.position.z = Math.max(-9.5, Math.min(9.5, p.position.z));
        });
    }

    // Game Logic
    function checkHillCapture() {
        const p1OnHill = player1.position.distanceTo(hill.position) < 4;
        const p2OnHill = player2.position.distanceTo(hill.position) < 4;

        if (p1OnHill && !p2OnHill) {
            hill.material = player1CapturedMaterial;
        } else if (!p1OnHill && p2OnHill) {
            hill.material = player2CapturedMaterial;
        } else {
            hill.material = neutralMaterial; // Contested or empty
        }
    }

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        updatePlayersPosition();
        checkHillCapture();
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
