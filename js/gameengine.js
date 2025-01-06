import * as THREE from 'three';
import { AssetManager } from './assetmanager.js';

export class GameEngine {
    constructor(callback) {
        this.assetManager = new AssetManager();
        this.assetManager.loadAll(this.finishConstruction.bind(this, callback));
    }

    finishConstruction(callback) {
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer( { antialias : true } );
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.clock = new THREE.Clock();
        this.dt = 0;
        this.entities = [];
        this.keys = {};
        this.overlay = document.getElementById('overlay');

        window.addEventListener( 'resize', this.resizeWindow.bind(this), false );
        this.renderer.setAnimationLoop( this.gameLoop.bind(this) );
        document.body.appendChild( this.renderer.domElement );

        window.addEventListener("keydown", event => this.keys[event.key] = true);
        window.addEventListener("keyup", event => this.keys[event.key] = false);
        window.addEventListener("mousedown", event => this.keys['m' + event.button] = true);
        window.addEventListener("mouseup", event => this.keys['m' + event.button] = false);
        
        window.addEventListener( 'mousemove', (function(e) {
            this.keys['mouseX'] = e.clientX;
            this.keys['mouseY'] = e.clientY;
        }).bind(this), false );

        callback();
    }

    resizeWindow() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );
    }

    gameLoop() {
        this.dt = Math.min(this.clock.getDelta(), 1/20);

        this.entities.forEach(e => e.update());

        for (let i = this.entities.length - 1; i > 0; i--) {
            if (this.entities[i].removeFromWorld) {
                this.entities[i].disposeMesh();
                this.entities.splice(i, 1);
                console.log('deleted entity at index ' + i);
            }
        }

        this.renderer.render( this.scene, this.camera );
    }

    getTexture(name) {
        return this.assetManager.textures[name];
    }

    getModel(name) {
        return this.assetManager.models[name].clone();
    }

    playSound(name) {
        //todo
    }
}