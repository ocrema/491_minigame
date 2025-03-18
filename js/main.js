import * as THREE from 'three';
import { GameEngine } from './gameengine.js';
import { Entity } from './entity.js';
import * as Util from './util.js';

export const engine = new GameEngine(function () {

	let score = 0;

	const asteroidTexture = engine.getTexture('asteroid');
	asteroidTexture.wrapS = THREE.RepeatWrapping;
	asteroidTexture.wrapT = THREE.RepeatWrapping;
	asteroidTexture.repeat.set(2, 2);

	const asteroids = [];
	for (let i = 0; i < 100; i++) {
		const asteroid = new Entity(new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8), new THREE.MeshLambertMaterial({ map: asteroidTexture })));
		asteroid.position.set(Math.random() * 200 - 100, Math.random() * 200 - 100, Math.random() * 200 - 100);
		asteroid.scale = Math.random() * 3 + 0.5;
		asteroid.mesh.scale.set(asteroid.scale, asteroid.scale, asteroid.scale);
		asteroid.xRotateSpeed = Math.random() * .4 - .2;
		asteroid.yRotateSpeed = Math.random() * .4 - .2;
		asteroid.zRotateSpeed = Math.random() * .4 - .2;
		asteroid.update = function () {
			this.rotation.x += this.xRotateSpeed * engine.dt;
			this.rotation.y += this.yRotateSpeed * engine.dt;
			this.rotation.z += this.zRotateSpeed * engine.dt;
		};
		asteroids.push(asteroid);
	}
	

	const spaceship = new Entity(engine.getModel('spaceship'));
	spaceship.mesh.scale.set(0.2, 0.2, 0.2);
	spaceship.position.add(new THREE.Vector3(0, 0, 2));
	spaceship.lazerCooldown = 0;
	spaceship.lazerMaxCooldown = .15;
	spaceship.acc = new THREE.Vector3(0,0,0);
	spaceship.vel = new THREE.Vector3(0,0,0);
	spaceship.update = function () {

		const maxTurnSpeed = 1.5;
		const controlDeadzoneRadius = .07;
		const controlMaxRadius = .7;
		const forwardSpeed = 20;
		const speed = 10;
		const mouseX = engine.keys['mouseX'] - window.innerWidth/2;
		const mouseY = engine.keys['mouseY'] - window.innerHeight/2;
		const distance = Math.sqrt(mouseX * mouseX + mouseY * mouseY) / (window.innerHeight/2);

		if (distance > controlDeadzoneRadius) {
			const mult = Math.min( 1, (distance - controlDeadzoneRadius) / (controlMaxRadius - controlDeadzoneRadius) );
			Util.rotateYNoGBL(this.rotation, maxTurnSpeed * mult * (mouseX / (Math.abs(mouseX) + Math.abs(mouseY))) * engine.dt * -1);
			Util.rotateXNoGBL(this.rotation, maxTurnSpeed * mult * (mouseY / (Math.abs(mouseX) + Math.abs(mouseY))) * engine.dt);
		}
		const oldPos = new THREE.Vector3().copy(this.position);
		if (engine.keys['e']) Util.rotateZNoGBL(this.rotation, maxTurnSpeed * engine.dt);
		if (engine.keys['q']) Util.rotateZNoGBL(this.rotation, maxTurnSpeed * engine.dt * -1);

		this.acc.set(0,0,0);
		if (engine.keys['shift']) this.acc.z += forwardSpeed;//.add(new THREE.Vector3(0,0,1).applyEuler(this.rotation).multiplyScalar(forwardSpeed * engine.dt));
		else if (engine.keys['w']) this.acc.z += speed;//this.position.add(new THREE.Vector3(0,0,1).applyEuler(this.rotation).multiplyScalar(speed * engine.dt));
		if (engine.keys['s']) this.acc.z -= speed; //this.position.add(new THREE.Vector3(0,0,1).applyEuler(this.rotation).multiplyScalar(speed * engine.dt * -1));
		if (engine.keys['a']) this.acc.x += speed;//this.position.add(new THREE.Vector3(1,0,0).applyEuler(this.rotation).multiplyScalar(speed * engine.dt));
		if (engine.keys['d']) this.acc.x -= speed;//this.position.add(new THREE.Vector3(1,0,0).applyEuler(this.rotation).multiplyScalar(speed * engine.dt * -1));
		if (engine.keys['control']) this.acc.y -= speed;//this.position.add(new THREE.Vector3(0,1,0).applyEuler(this.rotation).multiplyScalar(speed * engine.dt * -1));
		if (engine.keys[' ']) this.acc.y += speed;//this.position.add(new THREE.Vector3(0,1,0).applyEuler(this.rotation).multiplyScalar(speed * engine.dt));
		this.acc.applyEuler(this.rotation);
		this.acc.multiplyScalar(engine.dt);

		this.vel.add(this.acc);
		let velCopy = new THREE.Vector3();
		velCopy.copy(this.vel);
		velCopy.multiplyScalar(engine.dt);
		this.position.add(velCopy);
		this.vel.multiplyScalar(Math.pow(.3, engine.dt));
		//console.log("acc: " + this.acc + ", vel: " + this.vel + ", pos: " + this.position);
		//console.log(this.vel)
		
		if (this.position.length() > 150) this.position.copy(oldPos);

		if (this.lazerCooldown > 0) this.lazerCooldown -= engine.dt;
		if (this.lazerCooldown <= 0 && engine.keys['m0']) {
			this.lazerCooldown = this.lazerMaxCooldown;
			engine.playSound('lazer');

			const lazerMesh = new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,2,16), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
			lazerMesh.rotation.copy(this.rotation);
			lazerMesh.position.copy(this.position);
			const lazer1 = new Entity(lazerMesh.clone());
			const lazer2 = new Entity(lazerMesh);
			lazer1.position.add(new THREE.Vector3(.7, 0, 1.2).applyEuler(this.rotation));
			lazer2.position.add(new THREE.Vector3(-.7, 0, 1.2).applyEuler(this.rotation));

			for (const lazer of [lazer1, lazer2]) {
				Util.rotateXNoGBL(lazer.rotation, Math.PI/2);
				lazer.timer = 3;

				Util.rotateZNoGBL(lazer.rotation, (mouseX / (window.innerHeight/2)) * Math.PI/4);
				Util.rotateXNoGBL(lazer.rotation, (mouseY / (window.innerHeight/2)) * Math.PI/4);

				lazer.update = function() {
					this.timer -= engine.dt;
					this.position.add(new THREE.Vector3(0,1,0).applyEuler(this.rotation).multiplyScalar(100 * engine.dt));
					if (this.timer <= 0) this.removeFromWorld = true;

					for (let i = asteroids.length - 1; i >= 0; i--) {
						if (this.position.distanceTo(asteroids[i].position) < asteroids[i].scale + 1) {
							asteroids[i].removeFromWorld = true;
							this.removeFromWorld = true;
							asteroids.splice(i, 1);
							engine.playSound('asteroid_break', .5);
							score += 100;
						}
					}
				}
			}
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
	backgroundTexture.repeat.set(3, 2);

	const backgroundMaterial = new THREE.MeshBasicMaterial({
		map: backgroundTexture,
		side: THREE.BackSide
	});

	const backgroundMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 5), backgroundMaterial);
	backgroundMesh.renderOrder = -999;
	backgroundMesh.frustumCulled = false;
	backgroundMesh.material.depthTest = false;
	backgroundMesh.material.depthWrite = false;

	const background = new Entity(backgroundMesh);

	background.update = function () {
		this.position.copy(engine.camera.position);
	};

	const planetMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10), new THREE.MeshLambertMaterial({ color: 0x0022ff }));
	planetMesh.renderOrder = -998;
	planetMesh.frustumCulled = false;
	planetMesh.material.depthTest = false;
	planetMesh.material.depthWrite = false;
	const planet = new Entity(planetMesh);
	planet.update = function() {
		this.position.copy(engine.camera.position);
		this.position.add(new THREE.Vector3(1, 2, -4))
	}


	const amblight = new Entity(new THREE.AmbientLight(0xffffff, .5));
	const sunlight = new Entity(new THREE.DirectionalLight(0xffffee, 2)).position.set(1, 1, 0);


	const hudManager = new Entity(null);
	engine.overlay.style.cursor = 'none';
	hudManager.bigcircle = document.createElement("div");
	hudManager.bigcircle.style.cssText = "display:inline-block; width:250px; height:250px; border-radius:125px;border-color:rgba(255,255,255,.5);border-style: solid;border-width: medium;";
	engine.overlay.appendChild(hudManager.bigcircle);
	hudManager.smallcircle = document.createElement("div");
	hudManager.smallcircle.style.cssText = "position:absolute; top:0; left:0; width:30px; height:30px; border-radius:15px; border-color:rgba(255,255,255,.5);border-style: solid;border-width: medium;";
	engine.overlay.appendChild(hudManager.smallcircle);
	hudManager.score = document.createElement("p");
	hudManager.score.style.cssText = "position:absolute; top:0; left:10px; font-size:40px; color:white;font-family: Verdana, Geneva, Tahoma, sans-serif;";
	engine.overlay.appendChild(hudManager.score);
	hudManager.update = function () {
		this.bigcircle.style.width = window.innerHeight * .2 + 'px';
		this.bigcircle.style.height = window.innerHeight * .2 + 'px';
		this.bigcircle.style['border-radius'] = window.innerHeight * .1 + 'px';

		this.smallcircle.style.top = engine.keys['mouseY'] - 15 + "px";
		this.smallcircle.style.left = engine.keys['mouseX'] - 15 + "px";

		if (score < 10000) this.score.textContent = "Score: " + score;
		else this.score.textContent = "You Win!";
    };
});

