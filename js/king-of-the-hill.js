
document.addEventListener('DOMContentLoaded', () => {
    // Scene setup
    const container = document.getElementById('king-of-the-hill-container');
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
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
    const capturedMaterial = new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x0077aa });
    const hill = new THREE.Mesh(hillGeometry, neutralMaterial);
    hill.position.y = 0.1;
    scene.add(hill);

    // Player
    const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x00aaff });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.y = 0.5;
    scene.add(player);

    camera.position.set(0, 10, 10);
    camera.lookAt(0, 0, 0);

    // Player Movement
    const keys = {};
    document.addEventListener('keydown', (e) => keys[e.code] = true);
    document.addEventListener('keyup', (e) => keys[e.code] = false);

    const playerSpeed = 0.1;

    function updatePlayerPosition() {
        if (keys['ArrowUp']) player.position.z -= playerSpeed;
        if (keys['ArrowDown']) player.position.z += playerSpeed;
        if (keys['ArrowLeft']) player.position.x -= playerSpeed;
        if (keys['ArrowRight']) player.position.x += playerSpeed;
        
        // Simple boundary check
        player.position.x = Math.max(-9.5, Math.min(9.5, player.position.x));
        player.position.z = Math.max(-9.5, Math.min(9.5, player.position.z));
    }

    // Game Logic
    function checkHillCapture() {
        const distance = player.position.distanceTo(hill.position);
        if (distance < 4) { // Player is on the hill
            hill.material = capturedMaterial;
        } else {
            hill.material = neutralMaterial;
        }
    }

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        updatePlayerPosition();
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
