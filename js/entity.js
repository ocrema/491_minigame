import * as THREE from "three";
import { engine } from "./main.js";

export class Entity {

    constructor(mesh) {
        
        if (!mesh) mesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial());

        Object.defineProperty(this, "mesh", { value: mesh });
        Object.defineProperty(this, "subMeshes", { value: [] });
        Object.defineProperty(this, "position", { value: this.mesh.position });
        Object.defineProperty(this, "rotation", { value: this.mesh.rotation });

        engine.entities.push(this);
        engine.scene.add(this.mesh);
        console.log('created entity at index ' + (engine.entities.length - 1));
    }

    /**
     * is called every frame
     */
    update() {}

    addSubMesh(subMesh) {
        this.subMeshes.push(subMesh);
        this.mesh.add(subMesh);
    }

    removeSubMesh(subMesh) {
        let index = this.subMeshes.indexOf(subMesh);
        this.subMeshes.splice(index, 1);
        subMesh.removeFromParent();
    }

    disposeMesh() {
        this.subMeshes.forEach(m => m.removeFromParent());
        this.mesh.removeFromParent();
    }
}