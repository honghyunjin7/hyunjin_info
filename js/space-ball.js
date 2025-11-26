
document.addEventListener('DOMContentLoaded', () => {
    // Scene setup
    const container = document.getElementById('space-ball-container');
    if (!container) return;

    // Three.js Scene
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
    directionalLight.position.set(10, 20, 5);
    scene.add(directionalLight);

    // Cannon.js World
    const world = new CANNON.World();
    world.gravity.set(0, -9.82, 0); // m/s²

    // Ground
    const groundPhysMat = new CANNON.Material('groundMaterial');
    const groundBody = new CANNON.Body({
        mass: 0, // mass == 0 makes the body static
        material: groundPhysMat,
        shape: new CANNON.Plane(),
    });
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);

    const groundMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(30, 40),
        new THREE.MeshStandardMaterial({ color: 0x444444 })
    );
    groundMesh.rotation.x = -Math.PI / 2;
    scene.add(groundMesh);

    // Player Car
    const playerPhysMat = new CANNON.Material('playerMaterial');
    const playerBody = new CANNON.Body({
        mass: 5,
        position: new CANNON.Vec3(0, 1, 15),
        shape: new CANNON.Box(new CANNON.Vec3(1, 0.5, 2)),
        material: playerPhysMat
    });
    world.addBody(playerBody);

    const playerMesh = new THREE.Mesh(
        new THREE.BoxGeometry(2, 1, 4),
        new THREE.MeshStandardMaterial({ color: 0x00aaff })
    );
    scene.add(playerMesh);

    // Ball
    const ballPhysMat = new CANNON.Material('ballMaterial');
    const ballBody = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(0, 1, 0),
        shape: new CANNON.Sphere(1),
        material: ballPhysMat
    });
    world.addBody(ballBody);

    const ballMesh = new THREE.Mesh(
        new THREE.SphereGeometry(1, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    scene.add(ballMesh);

    // Physics contact materials
    const groundPlayerContactMat = new CANNON.ContactMaterial(groundPhysMat, playerPhysMat, { friction: 0.3, restitution: 0.3 });
    world.addContactMaterial(groundPlayerContactMat);
    const groundBallContactMat = new CANNON.ContactMaterial(groundPhysMat, ballPhysMat, { friction: 0.4, restitution: 0.7 });
    world.addContactMaterial(groundBallContactMat);
    const playerBallContactMat = new CANNON.ContactMaterial(playerPhysMat, ballPhysMat, { friction: 0.1, restitution: 0.9 });
    world.addContactMaterial(playerBallContactMat);

    camera.position.set(0, 20, 25);
    camera.lookAt(0, 0, 0);

    // Player Controls
    const keys = {};
    document.addEventListener('keydown', (e) => keys[e.code] = true);
    document.addEventListener('keyup', (e) => keys[e.code] = false);

    function applyCarForce() {
        const force = 15;
        const impulse = 5;
        if (keys['ArrowUp']) playerBody.applyForce(new CANNON.Vec3(0, 0, -force), playerBody.position);
        if (keys['ArrowDown']) playerBody.applyForce(new CANNON.Vec3(0, 0, force), playerBody.position);
        if (keys['ArrowLeft']) playerBody.applyForce(new CANNON.Vec3(-force, 0, 0), playerBody.position);
        if (keys['ArrowRight']) playerBody.applyForce(new CANNON.Vec3(force, 0, 0), playerBody.position);
    }
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);

        world.step(1 / 60); // Update physics

        // Update meshes
        playerMesh.position.copy(playerBody.position);
        playerMesh.quaternion.copy(playerBody.quaternion);
        ballMesh.position.copy(ballBody.position);
        ballMesh.quaternion.copy(ballBody.quaternion);
        
        applyCarForce();

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
