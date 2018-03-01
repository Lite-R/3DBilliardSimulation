/**
	This program creates a simulation of a Billiard Game.
	There is an Elastic Collision Between Balls,
	Initially Moving at a Random Speed.
	"R-KeyPress" Puts the Camera at a Certain Height 
	to Show the Entire Table, Lamp & Ceiling.
	"S-KeyPress" Speeds Up the Balls Again (with attempted Rotation).
	KNOWN ISSUE: Due to a large time step, the balls may get stuck in each other 
	"S-KeyPress" Helps this situation.
*/

'use strict';

// Initialize webGL
const canvas = document.getElementById("mycanvas");
const renderer = new THREE.WebGLRenderer({canvas:canvas, antialias:true});
renderer.setClearColor('honeydew');    // Set background color to honeydew - Easier on the eyes
renderer.setSize(window.innerWidth, window.innerHeight); // Canvas Encompasses the Browser Window
renderer.shadowMap.enabled=true; //Important Step for showing Shadows in THREE.js
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Create a new THREE.js scene with camera and the required ambient light
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, canvas.width / canvas.height, 0.1, 1000 );
camera.position.set(0.1,2.5,10); //Camera Position Set at a Value to Enable Better view of Billiard Table
camera.lookAt(scene.position);   // Camera looks at origin
const ambientLight = new THREE.AmbientLight("white");
scene.add(ambientLight);

/* // Uncomment This Block To Show FPS using Stats.js
// Add Stats to the Document
const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom ); 
*/

document.addEventListener ("keydown", eventHandler); //EventListener for KeyPresses R & S respectively

//const axisHelper = new THREE.AxesHelper( 5 ); //Uncomment Axis Helper for Debugging Purposes
//scene.add( axisHelper );

//---Initialization of Default Settings for the Scene---//
const defaultSettings = {
	lightHeight: 7.5,
	lampRadius: 0.5,
	ceilingWidth: 20,
	ceilingHeight: 20,
	floorWidth: 10,
	floorHeight: 10,
	tableSize: 10, 
	legLength: 3.5,
	legSize: 0.25,
	tableWidth: 0.5,
	cushionSize: 0.25,
	cushionWidth: 0.25 + 0.45,
	nrOfBalls: 8, //Change This to Add More/Less Balls to the Billiard Table
	ballRadius: 0.20,
	massOfSphere: 1 //Mass Given to Spheres assumed as Same - Default: 1
};

let velocity = new Array(defaultSettings.nrOfBalls); 	//Array to Store the Different Velocities of the Balls

//Create the Lamp Light
const light = new THREE.SpotLight(0xffffff);
light.position.set(0,defaultSettings.lightHeight,0);
light.castShadow = true;
light.shadow.camera.near = 0.1; //Near & Far Plane Values for Shadows cast such that they are not more than necessary - Save Computation
light.shadow.camera.far = 40;
scene.add(light);

//NOTE: The following Meshes have been created using BufferGeometry where appropriate to save computational power
// Add a Lamp Sphere at the position of spotlight & Give it a Texture
const txtLoader = new THREE.TextureLoader(); //Texture Loader used for loading all Textures - All Images Resized as Appropriate
const lamp = new THREE.Mesh(new THREE.SphereBufferGeometry(defaultSettings.lampRadius, 32, 32),
                           new THREE.MeshBasicMaterial({map: txtLoader.load("lampTexture.jpg")}));
lamp.position.copy(light.position);
scene.add(lamp);

//Add a Ceiling at an Appropriate Position above Spotlight
const ceiling = new THREE.Mesh(new THREE.PlaneBufferGeometry(defaultSettings.ceilingWidth, defaultSettings.ceilingHeight, 32, 32),
                           new THREE.MeshBasicMaterial({map: txtLoader.load("ceilingTexture.jpg")}));
ceiling.position.copy(light.position);
ceiling.position.y += 2;
ceiling.rotateX(-Math.PI/2);
ceiling.rotateY(Math.PI);
scene.add(ceiling);


//Add a Cord between Lamp & Ceiling
const cordGeo = new THREE.Geometry();
cordGeo.vertices.push(ceiling.position);
cordGeo.vertices.push(lamp.position); //Connect both ceiling and light
const cord = new THREE.Line(cordGeo, new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.5 } ) );
scene.add(cord);


//Add a floor at a Position below Table
const floor = new THREE.Mesh(new THREE.PlaneBufferGeometry(defaultSettings.floorWidth, defaultSettings.floorHeight, 32, 32),
                           new THREE.MeshLambertMaterial({map: txtLoader.load("floorTexture.jpg")}));
floor.rotateX(Math.PI/2); //Apply appropriate rotation to ensure correct normal view of the floor
floor.rotateY(Math.PI);
floor.receiveShadow = true; //Floor Receives the Shadow of the Table
floor.position.y = -defaultSettings.legLength - defaultSettings.tableWidth/2 - 0.01;
scene.add(floor);

//Add a Table at Position : Origin
const tableGeo = new THREE.BoxBufferGeometry( defaultSettings.tableSize, defaultSettings.tableSize/2, defaultSettings.tableWidth);
const tableMat = new THREE.MeshPhongMaterial( {map: txtLoader.load("tableTexture.jpg"), wireframe:false} );
const table = new THREE.Mesh( tableGeo, tableMat );
table.rotateX(Math.PI/2);
table.rotateY(Math.PI);
table.rotateZ(Math.PI/2);
scene.add(table);
table.castShadow = true; //Table Casts a Shadow on the Floor & Receives Shadows of the Balls
table.receiveShadow = true;


//Add 4 Cushions Around The Table - Cushion 1 & 2 are long cushions whereas Cushion 3 & 4 are Short Cushions to give a realistic billiard table appearance
//Long Cushion Geometry
const longCushionGeo = new THREE.BoxBufferGeometry( defaultSettings.tableSize + defaultSettings.cushionSize*2, defaultSettings.cushionSize, defaultSettings.cushionWidth );
const cushionMat = new THREE.MeshPhongMaterial( {map: txtLoader.load("cushionTexture.jpg"), wireframe:false} );

const cushion1 = new THREE.Mesh( longCushionGeo, cushionMat );
table.add( cushion1 );
cushion1.position.y = defaultSettings.tableSize/4 + defaultSettings.cushionSize/2; //TableSize / 4 Gives Side Pos & Add Width of Cushion
cushion1.position.z = (defaultSettings.cushionWidth-defaultSettings.tableWidth)/2;
cushion1.receiveShadow = false;
cushion1.castShadow = true;

const cushion2 = new THREE.Mesh(longCushionGeo, cushionMat);
table.add(cushion2 );
cushion2.position.y = -(defaultSettings.tableSize/4 + defaultSettings.cushionSize/2);
cushion2.position.z = (defaultSettings.cushionWidth-defaultSettings.tableWidth)/2;
cushion2.receiveShadow = false;
cushion2.castShadow = true;

//Short Cushion Geometry
const shortCushionGeo = new THREE.BoxBufferGeometry(defaultSettings.cushionSize, defaultSettings.tableSize/2, defaultSettings.cushionWidth );

const cushion3 = new THREE.Mesh(shortCushionGeo, cushionMat);
table.add(cushion3 );
cushion3.position.x = -(defaultSettings.tableSize/2 + defaultSettings.cushionSize/2);
cushion3.position.z = (defaultSettings.cushionWidth-defaultSettings.tableWidth)/2;
cushion3.receiveShadow = false;
cushion3.castShadow = true;

const cushion4 = new THREE.Mesh(shortCushionGeo, cushionMat);
table.add(cushion4 );
cushion4.position.x = (defaultSettings.tableSize/2 + defaultSettings.cushionSize/2);
cushion4.position.z = (defaultSettings.cushionWidth-defaultSettings.tableWidth)/2;
cushion4.receiveShadow = false;
cushion4.castShadow = true;

//Add 4 Legs Around The Table Using Similar Logic
const legGeo = new THREE.BoxBufferGeometry( defaultSettings.legSize, defaultSettings.legSize, defaultSettings.legLength );
const legMat = new THREE.MeshPhongMaterial( {color: 0x000000, wireframe:false} );

const leg1 = new THREE.Mesh( legGeo, legMat );
table.add(leg1);
leg1.position.x = defaultSettings.tableSize/2 - defaultSettings.legSize/2;
leg1.position.y = defaultSettings.tableSize/4 - defaultSettings.legSize/2;
leg1.position.z = -defaultSettings.legLength/2 - defaultSettings.tableWidth/2;

const leg2 = new THREE.Mesh( legGeo, legMat );
table.add(leg2);
leg2.position.x = -(defaultSettings.tableSize/2 - defaultSettings.legSize/2);
leg2.position.y = defaultSettings.tableSize/4 - defaultSettings.legSize/2;
leg2.position.z = -defaultSettings.legLength/2 - defaultSettings.tableWidth/2;

const leg3 = new THREE.Mesh( legGeo, legMat );
table.add(leg3);
leg3.position.x = -(defaultSettings.tableSize/2 - defaultSettings.legSize/2);
leg3.position.y = -(defaultSettings.tableSize/4 - defaultSettings.legSize/2);
leg3.position.z = -defaultSettings.legLength/2 - defaultSettings.tableWidth/2;

const leg4 = new THREE.Mesh( legGeo, legMat );
table.add(leg4);
leg4.position.x = defaultSettings.tableSize/2 - defaultSettings.legSize/2;
leg4.position.y = -(defaultSettings.tableSize/4 - defaultSettings.legSize/2);
leg4.position.z = -defaultSettings.legLength/2 - defaultSettings.tableWidth/2;

//Create the Billiard Balls & Add them as children to the table
createBilliardBalls(table);

function createBilliardBalls(parent) {
	for(let i = 0; i<defaultSettings.nrOfBalls; i++) {
		let textureString = "Ball"+(i+8)+".jpg"; //Load Ball Textures Starting from Ball8 Onwards - 8Ball is always at pos table.children(8)
		const ballGeo = new THREE.SphereBufferGeometry(defaultSettings.ballRadius, 10, 10 );
		const ballMat = new THREE.MeshPhongMaterial( {map: txtLoader.load(textureString), wireframe: false} );
		const billiardBall = new THREE.Mesh( ballGeo, ballMat );
		billiardBall.matrixAutoUpdate = false; //Disable Matrix Auto Update to Enable Rotation
		getBallPosition(billiardBall); //Setup Ball In a Random Position on the Board
		velocity[i] = getBallVelocity(); //Give a Randomized Velocity to the Ball
		parent.add(billiardBall);
		billiardBall.castShadow = true; //Ball Casts a Shadow on the Table
	}
}

function getBallPosition(BB) {
	BB.position.x =((Math.random()-0.5)*100)%((defaultSettings.tableSize)/2 - defaultSettings.ballRadius);
	BB.position.y = ((Math.random()-0.5)*100)%((defaultSettings.tableSize)/4 - defaultSettings.ballRadius);
	BB.position.z = defaultSettings.tableWidth - 0.05; //Margin of 0.05 to Set it Down to the Table Properly
	for(let i = 0; i<table.children.length-8;i++){ //Check if the ball doesn't collide with another ball
			if(BB.position.distanceTo(table.children[i+8].position) < defaultSettings.ballRadius*2)
						getBallPosition(BB);	//Recursive Call to Create new Pos if there's a collision
		}
}

function getBallVelocity() {
	return new THREE.Vector3((Math.random()-0.5 )*6,(Math.random()-0.5 )*6,0); //Return a Random Velocity to the Ball
}

let currentTime = new Date().getTime();
let currentSecond = Math.floor((currentTime / 1000) % 60);
let previousSec = currentSecond;
let clock = new THREE.Clock();
let rollFric = 0.8; //Decrease Velocity by 20%
let colliFric = 0.7; //Decrease Velocity by 20%

// Draw everything
const controls = new THREE.TrackballControls( camera, canvas );
function render() {
	//stats.begin(); //Uncomment this block for Stats
	requestAnimationFrame(render);
	
	let dt = clock.getDelta();
	
	currentTime += Math.round(dt * 1000); //Check the current Time per frame & current second accordingly
	currentSecond = Math.floor((currentTime / 1000) % 60);
	
for(let i = 0; i < defaultSettings.nrOfBalls; i++){
		
		if(dt>0.15) break; //Ensure There isn't a huge Time Step between Frames
		
		let ball = table.children[i+8]; //First 8 children positions are occupied by Cushions & Legs
		
		collisionVel(ball, i); //Elastic Collision Detection Between Balls
		
		// Calculate Axis of rotation
		let rotationAxis = new THREE.Vector3(0,0,1);
		rotationAxis.cross(velocity[i]).normalize();
		let omega = velocity[i].length() / defaultSettings.ballRadius; 

		
		// Translation along straight lines
		let pos = ball.position.add(velocity[i].clone().multiplyScalar(dt));
		ball.matrix.setPosition(pos);
		ball.position.copy(pos);

		// Rotation according to the Velocity
		const changedRotation = new THREE.Matrix4();
		changedRotation.makeRotationAxis(rotationAxis, omega * dt);
		ball.matrix.multiply(changedRotation);
		
		
		if(ball.position.x > (defaultSettings.tableSize / 2 - defaultSettings.ballRadius))  { //Collision of Short Cushion
			velocity[i].x = -Math.abs(velocity[i].x);
			velocity[i].multiplyScalar(rollFric); //Drop speed by 20% at each Collision
		}
		else if(ball.position.x < - (defaultSettings.tableSize / 2 - defaultSettings.ballRadius)){
			velocity[i].x = Math.abs(velocity[i].x);
			velocity[i].multiplyScalar(rollFric); //Drop speed by 20% at each Collision
		}
		
		if(ball.position.y > (defaultSettings.tableSize / 4 - defaultSettings.ballRadius))  { //Collision of Long Cushion
			velocity[i].y = -Math.abs(velocity[i].y);
			velocity[i].multiplyScalar(rollFric); //Drop speed by 20% at each Collision
		}
		else if(ball.position.y < - (defaultSettings.tableSize / 4 - defaultSettings.ballRadius)){
			velocity[i].y = Math.abs(velocity[i].y);
			velocity[i].multiplyScalar(rollFric); //Drop speed by 20% at each Collision
		}
		
		// Check If One Second Has Elapsed
		if (currentSecond !== previousSec) { // A second has passed
			for (let i = 0; i < defaultSettings.nrOfBalls; i++) {
				velocity[i].multiplyScalar(rollFric); //Drop speed by 20% after each second
		
				// Calculate Axis of rotation
				omega = velocity[i].length() / defaultSettings.ballRadius;
				let rotationAxis = new THREE.Vector3(0,0,1);
				rotationAxis.cross(velocity[i]).normalize();
				
			}
			previousSec = currentSecond; // Update Time Elapsed
		}
}

	//stats.end(); //Uncomment this block for Stats
	controls.update();
	renderer.render(scene, camera);
}
render();

//Function that Detects Collision Between Balls & Replaces their Velocities according to Elastic Collision Mathematics
function collisionVel(ball, ID) {
	for(let i = 0; i < table.children.length-8 ; i++){
		if(i == ID) continue; //Skip checking the ball against itself for collision
		if(ball.position.distanceTo(table.children[i+8].position) < defaultSettings.ballRadius*2) {
			let A = ball;
			let B = table.children[i+8];
			// First, find the normalized vector n from the center of
			// Ball1 to the center of Ball2
			let n = new THREE.Vector3();
			n = n.subVectors(B.position, A.position).normalize();

			// Find the length of the component of each of the velocity
			// vectors along n.
			// a1 = v1 . n - where v1 is the first objects velocity
			// a2 = v2 . n - where v2 is the second objects velocity
			let a1 = velocity[ID].dot(n);
			let a2 = velocity[i].dot(n);

			// Using the Optmized Elastic Collision Velocity Calculation, [Adapted from Thesis Preparation]
			// optimizedP =  2(a1 - a2)
			//              -----------
			//                m1 + m2
			let optimizedP = (2.0 * (a1 - a2)) / (defaultSettings.massOfSphere + defaultSettings.massOfSphere); //Due to Equal Mass - This is essentially a1-a2

			// Calculate v1', the new velocity vector of Ball1
			// v1' = v1 - optimizedP * m2 * n
			let scalarN = n.clone().multiplyScalar(optimizedP * defaultSettings.massOfSphere);
			let viPrime = new THREE.Vector3();
			let vdPrime = new THREE.Vector3();
			viPrime = viPrime.subVectors(velocity[ID], scalarN);
			vdPrime = vdPrime.addVectors(velocity[i],scalarN);

			velocity[ID] = viPrime;
			velocity[i] = vdPrime;
		}
	}
}

function eventHandler(event) {
	const keyCode = event.keyCode;
	if (keyCode == 82) { // R key pressed - Reset Position of Camera
		camera.position.set(6,7.5,17); //This Vector3 position gives a nice view of the Lamp, Table & Ceiling all in one
		camera.up.set(0,1,0);
	}
	else if (keyCode == 83) {
		for (let i = 0; i < defaultSettings.nrOfBalls; i++)
		{
			velocity[i].multiplyScalar(colliFric + colliFric); //Increase speed
			
			//Apply Rotation Again With Updated Speed
			let dt = clock.getDelta();
			let rotationAxis = new THREE.Vector3(0,0,1);
			rotationAxis.cross(velocity[i]).normalize();
			let omega = velocity[i].length() / defaultSettings.ballRadius; 
			
			let ball = table.children[i+8];
			
			// Translation along straight lines
			let pos = ball.position.add(velocity[i].clone().multiplyScalar(dt));
			ball.matrix.setPosition(pos);
			ball.position.copy(pos);

			// Rotation according to the Velocity
			const changedRotation = new THREE.Matrix4();
			changedRotation.makeRotationAxis(rotationAxis, omega * dt);
			ball.matrix.multiply(changedRotation);
			
		}
	}
}
