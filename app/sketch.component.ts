import { Component, OnInit } from '@angular/core';
import {NgGrid, NgGridItem} from 'angular2-grid';

declare var THREE: any;

@Component({
  selector: 'my-configuration',
  templateUrl: 'app/sketch.component.html',
  directives: [  NgGrid, NgGridItem ],
})
export class SketchComponent implements OnInit {
        scene = undefined;
        camera = undefined;
        renderer = undefined;

        geometry = undefined;
        material = undefined;
        mesh = undefined;

        ngOnInit() {

                this.init();
                this.anim();
        }

        init() {

                this.scene = new THREE.Scene();

                this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
                this.camera.position.z = 1000;

                this.geometry = new THREE.BoxGeometry( 200, 200, 200 );
                this.material = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true } );

                this.mesh = new THREE.Mesh( this.geometry, this.material );
                this.scene.add( this.mesh );

                this.renderer = new THREE.WebGLRenderer();
                this.renderer.setSize( 800, 600 );

                //document.body.firstChild.insertBefore( this.renderer.domElement );
                document.body.insertBefore(this.renderer.domElement, document.body.childNodes[2]);

        }

        anim() {
                requestAnimationFrame(()=> {
                                this.anim()
                                });

                this.mesh.rotation.x += 0.01;
                this.mesh.rotation.y += 0.02;

                this.renderer.render( this.scene, this.camera );
        }
}
