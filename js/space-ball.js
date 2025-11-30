document.addEventListener('DOMContentLoaded', () => {
    const gameId = 'space-ball';
    const container = document.getElementById('space-ball-container');
    if (!container) return;

    container.addEventListener('mouseover', () => window.activeGame = gameId);
    container.addEventListener('mouseout', () => window.activeGame = null);

    const blueWinScreen = document.getElementById('sb-blue-win-screen');
    const redWinScreen = document.getElementById('sb-red-win-screen');
    const drawScreen = document.getElementById('sb-draw-screen');

    const blueRestartButton = blueWinScreen.querySelector('.restart-btn');
    const redRestartButton = redWinScreen.querySelector('.restart-btn');
    const drawRestartButton = drawScreen.querySelector('.restart-btn');

    let scorePlayer1 = 0;
    let scorePlayer2 = 0;

    const scoreDisplayP1 = document.getElementById('space-ball-score-p1');
    const scoreDisplayP2 = document.getElementById('space-ball-score-p2');
    const timerDisplay = document.getElementById('space-ball-timer');

    const gameDuration = 3 * 60; // 3 minutes in seconds
    let remainingTime = gameDuration;
    let timerInterval;

    function gameOver() {
        clearInterval(timerInterval);
        if (scorePlayer1 > scorePlayer2) {
            blueWinScreen.style.display = 'flex';
        } else if (scorePlayer2 > scorePlayer1) {
            redWinScreen.style.display = 'flex';
        } else {
            drawScreen.style.display = 'flex';
        }
        scoreDisplayP1.style.display = 'none';
        scoreDisplayP2.style.display = 'none';
        timerDisplay.style.display = 'none';
    }

    const player1InitialPosition = new CANNON.Vec3(-5, 1, -15);
    const player2InitialPosition = new CANNON.Vec3(5, 1, 15);
    const player3InitialPosition = new CANNON.Vec3(-5, 1, -10);
    const player4InitialPosition = new CANNON.Vec3(5, 1, 10);

    function resetGame() {
        console.log("Resetting Space Ball game...");
        scorePlayer1 = 0;
        scorePlayer2 = 0;
        remainingTime = gameDuration;

        blueWinScreen.style.display = 'none';
        redWinScreen.style.display = 'none';
        drawScreen.style.display = 'none';

        scoreDisplayP1.style.display = 'block';
        scoreDisplayP2.style.display = 'block';
        timerDisplay.style.display = 'block';

        player1Body.position.copy(player1InitialPosition);
        player1Body.velocity.set(0, 0, 0);
        player1Body.angularVelocity.set(0, 0, 0);
        player2Body.position.copy(player2InitialPosition);
        player2Body.velocity.set(0, 0, 0);
        player2Body.angularVelocity.set(0, 0, 0);
        player3Body.position.copy(player3InitialPosition);
        player3Body.velocity.set(0, 0, 0);
        player3Body.angularVelocity.set(0, 0, 0);
        player4Body.position.copy(player4InitialPosition);
        player4Body.velocity.set(0, 0, 0);
        player4Body.angularVelocity.set(0, 0, 0);
        
        resetBall();
        startGameTimer();
    }

    blueRestartButton.addEventListener('click', resetGame);
    redRestartButton.addEventListener('click', resetGame);
    drawRestartButton.addEventListener('click', resetGame);
    
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

    // Greenhouse boundaries
    const fieldWidth = 30; // X-axis
    const fieldLength = 45; // Z-axis, extends beyond goals
    const fieldHeight = 15; // Y-axis

    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, transparent: true, opacity: 0.1 });
    const physicsWallMaterial = new CANNON.Material('wall');

    // Ceiling
    const ceilingShape = new CANNON.Box(new CANNON.Vec3(fieldWidth / 2, 1, fieldLength / 2));
    const ceilingBody = new CANNON.Body({ mass: 0, material: physicsWallMaterial });
    ceilingBody.addShape(ceilingShape);
    ceilingBody.position.set(0, fieldHeight, 0);
    world.addBody(ceilingBody);

    const ceilingMesh = new THREE.Mesh(new THREE.BoxGeometry(fieldWidth, 2, fieldLength), wallMaterial);
    ceilingMesh.position.set(0, fieldHeight, 0);
    scene.add(ceilingMesh);

    // Walls
    const wallThickness = 5.0;

    // Wall Left (Negative X)
    const wallLeftShape = new CANNON.Box(new CANNON.Vec3(wallThickness / 2, fieldHeight / 2, fieldLength / 2));
    const wallLeftBody = new CANNON.Body({ mass: 0, material: physicsWallMaterial, position: new CANNON.Vec3(-fieldWidth / 2, fieldHeight / 2, 0) });
    wallLeftBody.addShape(wallLeftShape);
    world.addBody(wallLeftBody);

    const wallLeftMesh = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, fieldHeight, fieldLength), wallMaterial);
    wallLeftMesh.position.copy(wallLeftBody.position);
    scene.add(wallLeftMesh);

    // Wall Right (Positive X)
    const wallRightShape = new CANNON.Box(new CANNON.Vec3(wallThickness / 2, fieldHeight / 2, fieldLength / 2));
    const wallRightBody = new CANNON.Body({ mass: 0, material: physicsWallMaterial, position: new CANNON.Vec3(fieldWidth / 2, fieldHeight / 2, 0) });
    wallRightBody.addShape(wallRightShape);
    world.addBody(wallRightBody);

    const wallRightMesh = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, fieldHeight, fieldLength), wallMaterial);
    wallRightMesh.position.copy(wallRightBody.position);
    scene.add(wallRightMesh);

    // Wall Front (Negative Z)
    const wallFrontShape = new CANNON.Box(new CANNON.Vec3(fieldWidth / 2, fieldHeight / 2, wallThickness / 2));
    const wallFrontBody = new CANNON.Body({ mass: 0, material: physicsWallMaterial, position: new CANNON.Vec3(0, fieldHeight / 2, -fieldLength / 2) });
    wallFrontBody.addShape(wallFrontShape);
    world.addBody(wallFrontBody);

    const wallFrontMesh = new THREE.Mesh(new THREE.BoxGeometry(fieldWidth, fieldHeight, wallThickness), wallMaterial);
    wallFrontMesh.position.copy(wallFrontBody.position);
    scene.add(wallFrontMesh);

    // Wall Back (Positive Z)
    const wallBackShape = new CANNON.Box(new CANNON.Vec3(fieldWidth / 2, fieldHeight / 2, wallThickness / 2));
    const wallBackBody = new CANNON.Body({ mass: 0, material: physicsWallMaterial, position: new CANNON.Vec3(0, fieldHeight / 2, fieldLength / 2) });
    wallBackBody.addShape(wallBackShape);
    world.addBody(wallBackBody);

    const wallBackMesh = new THREE.Mesh(new THREE.BoxGeometry(fieldWidth, fieldHeight, wallThickness), wallMaterial);
    wallBackMesh.position.copy(wallBackBody.position);
    scene.add(wallBackMesh);

    // Player 1 (Blue)
    const player1Body = new CANNON.Body({ mass: 10, position: player1InitialPosition.clone(), shape: new CANNON.Box(new CANNON.Vec3(1, 0.5, 2)), material: player1Mat });
    world.addBody(player1Body);
    const player1Mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 4), new THREE.MeshStandardMaterial({ color: 0x00aaff }));
    player1Mesh.castShadow = true;
    scene.add(player1Mesh);

    // Player 2 (Red)
    const player2Body = new CANNON.Body({ mass: 10, position: player2InitialPosition.clone(), shape: new CANNON.Box(new CANNON.Vec3(1, 0.5, 2)), material: player2Mat });
    world.addBody(player2Body);
    const player2Mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 4), new THREE.MeshStandardMaterial({ color: 0xff4444 }));
    player2Mesh.castShadow = true;
    scene.add(player2Mesh);

    // AI Player 3 (Blue Team - AI)
    const player3Body = new CANNON.Body({ mass: 10, position: player3InitialPosition.clone(), shape: new CANNON.Box(new CANNON.Vec3(1, 0.5, 2)), material: player1Mat }); // Using player1Mat for consistency
    world.addBody(player3Body);
    const player3Mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 4), new THREE.MeshStandardMaterial({ color: 0x00aaff })); // Blue color
    player3Mesh.castShadow = true;
    scene.add(player3Mesh);

    // AI Player 4 (Red Team - AI)
    const player4Body = new CANNON.Body({ mass: 10, position: player4InitialPosition.clone(), shape: new CANNON.Box(new CANNON.Vec3(1, 0.5, 2)), material: player2Mat }); // Using player2Mat for consistency
    world.addBody(player4Body);
    const player4Mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 4), new THREE.MeshStandardMaterial({ color: 0xff4444 })); // Red color
    player4Mesh.castShadow = true;
    scene.add(player4Mesh);

    // Ball
    const ballBody = new CANNON.Body({ mass: 1, position: new CANNON.Vec3(0, 5, 0), shape: new CANNON.Sphere(1), material: ballMat });
    world.addBody(ballBody);

    function updateTimerDisplay() {
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        if (timerDisplay) {
            timerDisplay.textContent = `남은 시간: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }

    function gameOver() {
        clearInterval(timerInterval);
        if (scorePlayer1 > scorePlayer2) {
            blueWinScreen.style.display = 'flex';
        } else if (scorePlayer2 > scorePlayer1) {
            redWinScreen.style.display = 'flex';
        } else {
            drawScreen.style.display = 'flex';
        }
        scoreDisplayP1.style.display = 'none';
        scoreDisplayP2.style.display = 'none';
        timerDisplay.style.display = 'none';
    }

    function startGameTimer() {
        clearInterval(timerInterval); // Clear any existing timer
        timerInterval = setInterval(() => {
            remainingTime--;
            updateTimerDisplay();
            if (remainingTime <= 0) {
                gameOver();
            }
        }, 1000);
    }

    function resetBall() {
        ballBody.position.set(0, 5, 0);
        ballBody.velocity.set(0, 0, 0);
        ballBody.angularVelocity.set(0, 0, 0);

        // Reset player positions and velocities
        player1Body.position.copy(player1InitialPosition);
        player1Body.velocity.set(0, 0, 0);
        player1Body.angularVelocity.set(0, 0, 0);
        player2Body.position.copy(player2InitialPosition);
        player2Body.velocity.set(0, 0, 0);
        player2Body.angularVelocity.set(0, 0, 0);
        player3Body.position.copy(player3InitialPosition);
        player3Body.velocity.set(0, 0, 0);
        player3Body.angularVelocity.set(0, 0, 0);
        player4Body.position.copy(player4InitialPosition);
        player4Body.velocity.set(0, 0, 0);
        player4Body.angularVelocity.set(0, 0, 0);

        if (scoreDisplayP1) scoreDisplayP1.textContent = `블루 팀: ${scorePlayer1}`;
        if (scoreDisplayP2) scoreDisplayP2.textContent = `레드 팀: ${scorePlayer2}`;
        updateTimerDisplay(); // Update timer display on ball reset
    }
    resetBall(); // Initialize score display and timer display
    startGameTimer(); // Start the game timer

    ballBody.addEventListener('collide', function(e) {
        if (e.body === goal1Body) {
            scorePlayer2++;
            console.log('Player 2 Scored! Score: ' + scorePlayer1 + ' - ' + scorePlayer2);
            resetBall();
        } else if (e.body === goal2Body) {
            scorePlayer1++;
            console.log('Player 1 Scored! Score: ' + scorePlayer1 + ' - ' + scorePlayer2);
            resetBall();
        }
    });
    const ballMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    ballMesh.castShadow = true;
    scene.add(ballMesh);

    // Goal Materials
    const goal1Mat = new CANNON.Material('goal1');
        const goal2Mat = new CANNON.Material('goal2');
    
        // Goals
        const goalWidth = 10;
        const goalHeight = 5;
        const goalDepth = 1;
        const goalZOffset = 20; // Distance behind player start position
    
        // Player 1 Goal (Blue)
        const goal1Body = new CANNON.Body({ mass: 0, position: new CANNON.Vec3(0, goalHeight / 2, -goalZOffset), material: goal1Mat });
        goal1Body.addShape(new CANNON.Box(new CANNON.Vec3(goalWidth / 2, goalHeight / 2, goalDepth / 2)));
        goal1Body.isTrigger = true; // Make it a sensor
        world.addBody(goal1Body);
    
        const goal1Mesh = new THREE.Mesh(
            new THREE.BoxGeometry(goalWidth, goalHeight, goalDepth),
            new THREE.MeshStandardMaterial({ color: 0x00aaff, transparent: true, opacity: 0.3 })
        );
        goal1Mesh.position.copy(goal1Body.position);
        scene.add(goal1Mesh);
    
        // Player 2 Goal (Red)
        const goal2Body = new CANNON.Body({ mass: 0, position: new CANNON.Vec3(0, goalHeight / 2, goalZOffset), material: goal2Mat });
        goal2Body.addShape(new CANNON.Box(new CANNON.Vec3(goalWidth / 2, goalHeight / 2, goalDepth / 2)));
        goal2Body.isTrigger = true; // Make it a sensor
        world.addBody(goal2Body);
    
        const goal2Mesh = new THREE.Mesh(
            new THREE.BoxGeometry(goalWidth, goalHeight, goalDepth),
            new THREE.MeshStandardMaterial({ color: 0xff4444, transparent: true, opacity: 0.3 })
        );
        goal2Mesh.position.copy(goal2Body.position);
        scene.add(goal2Mesh);
        
        // Contact Materials    world.addContactMaterial(new CANNON.ContactMaterial(groundMat, player1Mat, { friction: 0.1, restitution: 0.1 }));
    world.addContactMaterial(new CANNON.ContactMaterial(groundMat, player2Mat, { friction: 0.1, restitution: 0.1 }));
    world.addContactMaterial(new CANNON.ContactMaterial(groundMat, ballMat, { friction: 0.4, restitution: 0.6 }));
    world.addContactMaterial(new CANNON.ContactMaterial(player1Mat, ballMat, { friction: 0.1, restitution: 0.9 }));
    world.addContactMaterial(new CANNON.ContactMaterial(player2Mat, ballMat, { friction: 0.1, restitution: 0.9 }));
    world.addContactMaterial(new CANNON.ContactMaterial(player1Mat, player2Mat, { friction: 0.0, restitution: 1.0 }));
    world.addContactMaterial(new CANNON.ContactMaterial(player1Mat, physicsWallMaterial, { friction: 0.1, restitution: 0.1 })); // Player-wall
    world.addContactMaterial(new CANNON.ContactMaterial(player2Mat, physicsWallMaterial, { friction: 0.1, restitution: 0.1 })); // Player-wall
    world.addContactMaterial(new CANNON.ContactMaterial(ballMat, physicsWallMaterial, { friction: 0.4, restitution: 0.8 })); // Ball-wall interaction


    camera.position.set(0, 25, 28);
    camera.lookAt(0, 0, 0);

    const kickStrength = 50; // How hard the ball is kicked
    const kickRange = 2.5;   // How close the player needs to be to the ball to kick

    // Controls
    const keys = {};
    document.addEventListener('keydown', (e) => {
        if (window.activeGame !== gameId) return;
        keys[e.code] = true;
    }, false);
    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    }, false);

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

        // Kick logic
        const p1_to_ball_vec = new CANNON.Vec3();
        ballBody.position.vsub(player1Body.position, p1_to_ball_vec); // Vector from P1 to Ball
        const p1_distance_to_ball = p1_to_ball_vec.length();

        const p2_to_ball_vec = new CANNON.Vec3();
        ballBody.position.vsub(player2Body.position, p2_to_ball_vec); // Vector from P2 to Ball
        const p2_distance_to_ball = p2_to_ball_vec.length();

        // Player 1 Kick (Blue Player - '/')
        if (keys['Slash'] && p1_distance_to_ball < kickRange) {
            p1_to_ball_vec.normalize();
            ballBody.applyImpulse(p1_to_ball_vec.scale(kickStrength), ballBody.position);
        }

        // Player 2 Kick (Red Player - 'ShiftLeft')
        if (keys['ShiftLeft'] && p2_distance_to_ball < kickRange) {
            p2_to_ball_vec.normalize();
            ballBody.applyImpulse(p2_to_ball_vec.scale(kickStrength), ballBody.position);
        }
    }
    
    function handleAILogic(playerBody, opponentGoalPosition, playerTeam) {
        const aiMoveSpeed = 8;
        const aiKickStrength = 80;
        const kickRange = 3.5;
        const maxSpeed = 10;

        const playerPos = playerBody.position;
        const ballPos = ballBody.position;

        // Determine if AI is on the correct side of the field to avoid own goals
        const isBlueTeam = playerTeam === 'blue';
        const isCorrectSide = isBlueTeam ? playerPos.z < ballPos.z : playerPos.z > ballPos.z;

        // Vector from AI to ball
        const toBall = ballPos.vsub(playerPos);
        toBall.y = 0; // Ignore vertical distance
        const distanceToBall = toBall.length();

        // Vector from ball to opponent's goal
        const toGoal = opponentGoalPosition.vsub(ballPos);
        toGoal.y = 0;
        const kickDirection = toGoal.unit();

        // If ball is close enough to kick
        if (distanceToBall < kickRange && isCorrectSide) {
            // Apply impulse to the ball
             ballBody.applyImpulse(kickDirection.scale(aiKickStrength), ballPos);
        } else {
            // Move towards the ball
            const moveDirection = toBall.unit();
            playerBody.velocity.x = moveDirection.x * aiMoveSpeed;
            playerBody.velocity.z = moveDirection.z * aiMoveSpeed;
        }

        // Limit AI speed
        if (playerBody.velocity.length() > maxSpeed) {
            playerBody.velocity.normalize();
            playerBody.velocity.scale(maxSpeed, playerBody.velocity);
        }
    }

    const clock = new THREE.Clock();
    const maxBallSpeed = 50; // Add this line

    function animate() {
        requestAnimationFrame(animate);
        
        const deltaTime = clock.getDelta();

        if (remainingTime > 0) { // Only update physics and controls if game is ongoing
            world.step(1/60, deltaTime, 3);

            if (window.activeGame === gameId) {
                handleControls();
                // Handle AI logic for Player 3 (Blue) and Player 4 (Red)
                // Player 3 (Blue AI) attacks Red Goal (goal2Body)
                handleAILogic(player3Body, goal2Body.position, 'blue');
                // Player 4 (Red AI) attacks Blue Goal (goal1Body)
                handleAILogic(player4Body, goal1Body.position, 'red');
            }

            // Clamp ball velocity
            if (ballBody.velocity.length() > maxBallSpeed) {
                ballBody.velocity.normalize();
                ballBody.velocity.scale(maxBallSpeed, ballBody.velocity);
            }

            // Hard boundary check for ceiling
            if (ballBody.position.y > fieldHeight) {
                ballBody.position.y = fieldHeight;
                ballBody.velocity.y = -Math.abs(ballBody.velocity.y);
            }

            // Update meshes
            player1Mesh.position.copy(player1Body.position);
            player1Mesh.quaternion.copy(player1Body.quaternion);
            player2Mesh.position.copy(player2Body.position);
            player2Mesh.quaternion.copy(player2Body.quaternion);
            player3Mesh.position.copy(player3Body.position); // Update AI Player 3 mesh
            player3Mesh.quaternion.copy(player3Body.quaternion);
            player4Mesh.position.copy(player4Body.position); // Update AI Player 4 mesh
            player4Mesh.quaternion.copy(player4Body.quaternion);
            ballMesh.position.copy(ballBody.position);
            ballMesh.quaternion.copy(ballBody.quaternion);
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