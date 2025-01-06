import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class AssetManager {
    constructor() {
        this.textures = {};
        this.models = {};
        this.audio = {};
    }

    loadAll(callback) {
        let modelList = [
            {name: 'spaceship', url:'models/spaceship.glb'},
        ];
        let textureList = [
            {name: 'asteroid', url:'textures/asteroid.jpg'},
            {name: 'space', url:'textures/space.jpg'},
        ];
        let audioList = [

        ];
        let assetsToLoad = modelList.length + textureList.length + audioList.length;
        let gtlfLoader = new GLTFLoader();
        let textureLoader = new THREE.TextureLoader();

        for (let info of modelList) {
            gtlfLoader.load(info.url, (function(gtlf) {
                this.models[info.name] = gtlf.scene;
                console.log('loaded model "' + info.name + '" from ' + info.url);
                assetsToLoad--;
            }).bind(this));
        }
        for (let info of textureList) {
            textureLoader.load(info.url, (function(texture) {
                this.textures[info.name] = texture;
                console.log('loaded texture "' + info.name + '" from ' + info.url);
                assetsToLoad--;
            }).bind(this));
        }
        for (let info of audioList) {
            // todo
        }

        const waitFunc = function() {
            if (assetsToLoad === 0) {
                callback();
            } else {
                setTimeout(waitFunc, 10);
            }
        }
        waitFunc();
    }

}