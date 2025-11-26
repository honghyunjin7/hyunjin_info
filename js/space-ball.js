document.addEventListener('DOMContentLoaded', () => {
    // Scene setup
    const container = document.getElementById('space-ball-container');
    if (!container) return;

    // Three.js Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Cannon.js World
    const world = new CANNON.World();
    world.gravity.set(0, -20, 0); // Stronger gravity

    // Materials
    const groundMat = new CANNON.Material('ground');
    const player1Mat = new CANNON.Material('player1');
    const player2Mat = new CANNON.Material('player2');
    const ballMat = new CANNON.Material('ball');

    // Ground
    const groundBody = new CANNON.Body({ mass: 0, material: groundMat, shape: new CANNON.Plane() });
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);
    const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(30, 40), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Player 1 (Blue)
    const player1Body = new CANNON.Body({ mass: 10, position: new CANNON.Vec3(5, 1, 15), shape: new CANNON.Box(new CANNON.Vec3(1, 0.5, 2)), material: player1Mat });
    world.addBody(player1Body);
    const player1Mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 4), new THREE.MeshStandardMaterial({ color: 0x00aaff }));
    player1Mesh.castShadow = true;
    scene.add(player1Mesh);

    // Player 2 (Red)
    const player2Body = new CANNON.Body({ mass: 10, position: new CANNON.Vec3(-5, 1, -15), shape: new CANNON.Box(new CANNON.Vec3(1, 0.5, 2)), material: player2Mat });
    world.addBody(player2Body);
    const player2Mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 4), new THREE.MeshStandardMaterial({ color: 0xff4444 }));
    player2Mesh.castShadow = true;
    scene.add(player2Mesh);

    // Ball
    const ballBody = new CANNON.Body({ mass: 1, position: new CANNON.Vec3(0, 5, 0), shape: new CANNON.Sphere(1), material: ballMat });
    world.addBody(ballBody);
    const ballMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    ballMesh.castShadow = true;
    scene.add(ballMesh);
    
    // Contact Materials
    world.addContactMaterial(new CANNON.ContactMaterial(groundMat, player1Mat, { friction: 0.1, restitution: 0.1 }));
    world.addContactMaterial(new CANNON.ContactMaterial(groundMat, player2Mat, { friction: 0.1, restitution: 0.1 }));
    world.addContactMaterial(new CANNON.ContactMaterial(groundMat, ballMat, { friction: 0.4, restitution: 0.6 }));
    world.addContactMaterial(new CANNON.ContactMaterial(player1Mat, ballMat, { friction: 0.1, restitution: 0.9 }));
    world.addContactMaterial(new CANNON.ContactMaterial(player2Mat, ballMat, { friction: 0.1, restitution: 0.9 }));
    world.addContactMaterial(new CANNON.ContactMaterial(player1Mat, player2Mat, { friction: 0.0, restitution: 1.0 }));


    camera.position.set(0, 25, 28);
    camera.lookAt(0, 0, 0);

    // Controls
    const keys = {};
    document.addEventListener('keydown', (e) => keys[e.code] = true, false);
    document.addEventListener('keyup', (e) => keys[e.code] = false, false);

    function handleControls() {
        const moveSpeed = 10;
        const linearDamping = 0.95; // A bit of drag

        // Player 1 (Arrows)
        let p1_vx = player1Body.velocity.x;
        let p1_vz = player1Body.velocity.z;
        if (keys['ArrowUp']) p1_vz = -moveSpeed;
        if (keys['ArrowDown']) p1_vz = moveSpeed;
        if (keys['ArrowLeft']) p1_vx = -moveSpeed;
        if (keys['ArrowRight']) p1_vx = moveSpeed;
        player1Body.velocity.x = p1_vx;
        player1Body.velocity.z = p1_vz;
        player1Body.velocity.x *= linearDamping;
        player1Body.velocity.z *= linearDamping;

        // Player 2 (WASD)
        let p2_vx = player2Body.velocity.x;
        let p2_vz = player2Body.velocity.z;
        if (keys['KeyW']) p2_vz = -moveSpeed;
        if (keys['KeyS']) p2_vz = moveSpeed;
        if (keys['KeyA']) p2_vx = -moveSpeed;
        if (keys['KeyD']) p2_vx = moveSpeed;
        player2Body.velocity.x = p2_vx;
        player2Body.velocity.z = p2_vz;
        player2Body.velocity.x *= linearDamping;
        player2Body.velocity.z *= linearDamping;
    }
    
    // Animation loop
    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        
        const deltaTime = clock.getDelta();
        world.step(1/60, deltaTime, 3);

        handleControls();

        // Update meshes
        player1Mesh.position.copy(player1Body.position);
        player1Mesh.quaternion.copy(player1Body.quaternion);
        player2Mesh.position.copy(player2Body.position);
        player2Mesh.quaternion.copy(player2Body.quaternion);
        ballMesh.position.copy(ballBody.position);
        ballMesh.quaternion.copy(ballBody.quaternion);

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