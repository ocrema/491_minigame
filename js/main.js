import * as THREE from 'three';
import { GameEngine } from './gameengine.js';
import { Entity } from './entity.js';
import * as Util from './util.js';

export const engine = new GameEngine(function () {

	// demo code

	/*
	some notes:
	- for some reason three.js doesn't work when you try to directly open the html file, so id recommend getting the 'live server' extension on vscode to run it
	- three.js docs -> https://threejs.org/docs/
	- all the 'demo' code is within this function (besides a little bit in the asset manager)
	- in the real game we should usually make classes that inherit from entity rather than modifing instances like i do here
	- this engine is not final but is hopefully its pretty close hopefully
	
	*/

	const asteroidTexture = engine.getTexture('asteroid');
	asteroidTexture.wrapS = THREE.RepeatWrapping;
	asteroidTexture.wrapT = THREE.RepeatWrapping;
	asteroidTexture.repeat.set(2, 2);
	const asteroid = new Entity(new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8), new THREE.MeshLambertMaterial({ map: asteroidTexture })));
	asteroid.update = function () {
		this.rotation.x += .1 * engine.dt;
		this.rotation.y += .2 * engine.dt;
	};


	const spaceship = new Entity(engine.getModel('spaceship'));
	spaceship.mesh.scale.set(0.2, 0.2, 0.2);
	spaceship.position.add(new THREE.Vector3(0, 0, 2));
	spaceship.lazerCooldown = 0;
	spaceship.lazerMaxCooldown = .15;
	spaceship.update = function () {

		const maxTurnSpeed = 1.5;
		const controlDeadzoneRadius = .2;
		const controlMaxRadius = .7;
		const forwardSpeed = 5;
		const speed = 2;
		const mouseX = engine.keys['mouseX'] - window.innerWidth/2;
		const mouseY = engine.keys['mouseY'] - window.innerHeight/2;
		const distance = Math.sqrt(mouseX * mouseX + mouseY * mouseY) / (window.innerHeight/2);

		if (distance > controlDeadzoneRadius) {
			const mult = Math.min( 1, (distance - controlDeadzoneRadius) / (controlMaxRadius - controlDeadzoneRadius) );
			Util.rotateYNoGBL(this.rotation, maxTurnSpeed * mult * (mouseX / (Math.abs(mouseX) + Math.abs(mouseY))) * engine.dt * -1);
			Util.rotateXNoGBL(this.rotation, maxTurnSpeed * mult * (mouseY / (Math.abs(mouseX) + Math.abs(mouseY))) * engine.dt);
		}

		if (engine.keys['e']) Util.rotateZNoGBL(this.rotation, maxTurnSpeed * engine.dt);
		if (engine.keys['q']) Util.rotateZNoGBL(this.rotation, maxTurnSpeed * engine.dt * -1);
		if (engine.keys['w']) this.position.add(new THREE.Vector3(0,0,1).applyEuler(this.rotation).multiplyScalar(forwardSpeed * engine.dt));
		if (engine.keys['s']) this.position.add(new THREE.Vector3(0,0,1).applyEuler(this.rotation).multiplyScalar(speed * engine.dt * -1));
		if (engine.keys['a']) this.position.add(new THREE.Vector3(1,0,0).applyEuler(this.rotation).multiplyScalar(speed * engine.dt));
		if (engine.keys['d']) this.position.add(new THREE.Vector3(1,0,0).applyEuler(this.rotation).multiplyScalar(speed * engine.dt * -1));
		if (engine.keys['Shift']) this.position.add(new THREE.Vector3(0,1,0).applyEuler(this.rotation).multiplyScalar(speed * engine.dt * -1));
		if (engine.keys[' ']) this.position.add(new THREE.Vector3(0,1,0).applyEuler(this.rotation).multiplyScalar(speed * engine.dt));

		if (this.lazerCooldown > 0) this.lazerCooldown -= engine.dt;
		if (this.lazerCooldown <= 0 && engine.keys['m0']) {
			this.lazerCooldown = this.lazerMaxCooldown;

			const lazerMesh = new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,2,16), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
			lazerMesh.rotation.copy(this.rotation);
			lazerMesh.position.copy(this.position);
			const lazer1 = new Entity(lazerMesh.clone());
			const lazer2 = new Entity(lazerMesh);
			lazer1.position.add(new THREE.Vector3(.7, 0, 1.2).applyEuler(this.rotation));
			lazer2.position.add(new THREE.Vector3(-.7, 0, 1.2).applyEuler(this.rotation));
			Util.rotateXNoGBL(lazer1.rotation, Math.PI/2);
			Util.rotateXNoGBL(lazer2.rotation, Math.PI/2);
			lazer1.timer = 3;
			lazer2.timer = 3;
			const lazerUpdateFunc = function() {
				this.timer -= engine.dt;
				this.position.add(new THREE.Vector3(0,1,0).applyEuler(this.rotation).multiplyScalar(100 * engine.dt));
                if (this.timer <= 0) this.removeFromWorld = true;
			}
			lazer1.update = lazerUpdateFunc;
			lazer2.update = lazerUpdateFunc;
		}
	};


	const cameraController = new Entity(null);
	cameraController.update = function () {

		let moveToVector = new THREE.Vector3();
		moveToVector.copy(spaceship.position);
		moveToVector.add((new THREE.Vector3(0, 1, -3.5)).applyEuler(spaceship.rotation));
		moveToVector.sub(engine.camera.position);
		moveToVector.multiplyScalar(5 * engine.dt);
		engine.camera.position.add(moveToVector);

		engine.camera.rotation.copy(spaceship.rotation);
		Util.rotateYNoGBL(engine.camera.rotation, Math.PI);
	}



	const backgroundTexture = engine.getTexture("space");
	backgroundTexture.wrapS = THREE.RepeatWrapping;
	backgroundTexture.wrapT = THREE.RepeatWrapping;
	backgroundTexture.repeat.set(2, 2);

	const backgroundMaterial = new THREE.MeshBasicMaterial({
		map: backgroundTexture,
		side: THREE.BackSide
	});
	backgroundMaterial.depthTest = false;

	const backgroundMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 10), backgroundMaterial);
	backgroundMesh.renderOrder = -999;
	backgroundMesh.frustumCulled = false;

	const background = new Entity(backgroundMesh);

	background.update = function () {
		this.position.copy(engine.camera.position);
	};


	const amblight = new Entity(new THREE.AmbientLight(0xffffffff, .5));
	const sunlight = new Entity(new THREE.DirectionalLight(0xffffffff, 2)).position.set(1, 1, 0);


	const hudManager = new Entity(null);
	engine.overlay.style.cursor = 'none';
	hudManager.bigcircle = document.createElement("div");
	hudManager.bigcircle.style.cssText = "display:inline-block; width:250px; height:250px; border-radius:125px;border-color:rgba(255,255,255,.5);border-style: solid;border-width: medium;";
	engine.overlay.appendChild(hudManager.bigcircle);
	hudManager.smallcircle = document.createElement("div");
	hudManager.smallcircle.style.cssText = "position:absolute; top:0; left:0; width:30px; height:30px; border-radius:15px; border-color:rgba(255,255,255,.5);border-style: solid;border-width: medium;";
	engine.overlay.appendChild(hudManager.smallcircle);
	hudManager.fpsDisplay = document.createElement("p");
	hudManager.fpsDisplay.style.cssText = "position:absolute; top:0; left:10px; font-size:20px; color:white;";
	engine.overlay.appendChild(hudManager.fpsDisplay);
	hudManager.update = function () {
		this.bigcircle.style.width = window.innerHeight * .2 + 'px';
		this.bigcircle.style.height = window.innerHeight * .2 + 'px';
		this.bigcircle.style['border-radius'] = window.innerHeight * .1 + 'px';

		this.smallcircle.style.top = engine.keys['mouseY'] - 15 + "px";
		this.smallcircle.style.left = engine.keys['mouseX'] - 15 + "px";

		this.fpsDisplay.textContent = "FPS: " + Math.round(1 / engine.dt);
    };
});

