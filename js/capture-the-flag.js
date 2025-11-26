
document.addEventListener('DOMContentLoaded', () => {
    // Scene setup
    const container = document.getElementById('capture-the-flag-container');
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

    // Player
    const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x00aaff });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.y = 0.5;
    scene.add(player);

    camera.position.set(0, 15, 12);
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
        player.position.x = Math.max(-14.5, Math.min(14.5, player.position.x));
        player.position.z = Math.max(-9.5, Math.min(9.5, player.position.z));
    }
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        updatePlayerPosition();
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
