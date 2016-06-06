import { Directive, ElementRef, Input, SimpleChange } from '@angular/core';

declare var THREE: any;

@Directive({
    selector: '[myThreeD]',
})
export class ThreeDirective {

    scene = undefined;
    camera = undefined;
    renderer = undefined;

    cursor = undefined;

    stepSize = 10;
    marking = false;
    bending = false;
    circle = false;

    startMarker = undefined;
    midMarker = undefined;
    curvedGhost = undefined;
    lineNo = 0;
    lines = [];

    constructor(private el: ElementRef) {
        el.nativeElement.style.backgroundColor = '#e0e0e0';
        this.init(el);
        this.anim();
    }

    addCurvedGhost(p0, p1, p2, fullCircle, colour) {
        var mid = this.findMidPoint(p0, p2);
        var dx = mid.x - p0.x;
        var dy = mid.y - p0.y;
        var ang = Math.atan2(dy, dx);
        var rad = Math.sqrt(dx * dx + dy * dy);
        var extX = (p1.x - mid.x);
        var extY = (p1.y - mid.y);
        var ext = Math.sqrt(extX*extX + extY*extY);

        var flip = false;
        var end = Math.PI;
        if (! fullCircle) {
            if (dx > 0 && extY < 0) {
                flip = ! flip;
            }
            else if (dx < 0 && extY > 0 ) {
                flip = ! flip;
            }
            else if (dy > 0 && extX > 0) {
                flip = ! flip;
            }
            else if (dy < 0 && extX < 0) {
                flip = ! flip;
            }
        } else {
            end *= 2;
        }

        var curve = new THREE.EllipseCurve( 
            mid.x, mid.y,
            rad,             
            ext             
            0, end,
            flip,
            ang 
        ) ;

        var path = new THREE.Path( curve.getPoints( 50 ) );
        var geometry = path.createPointsGeometry( 50 );

        var material = new THREE.LineBasicMaterial( { color : colour } );
        this.curvedGhost = new THREE.Line( geometry, material );
        this.curvedGhost.name = 'line-' + this.lineNo++;
        this.scene.add(this.curvedGhost);
        this.lines.push(this.curvedGhost);
    }

    addLine(p0, p1, colour) {
        var lineGeometry = new THREE.Geometry();
        var vertArray = lineGeometry.vertices;
        vertArray.push( new THREE.Vector3(p0.x, p0.y, 0), new THREE.Vector3(p1.x, p1.y, 0) );
        lineGeometry.computeLineDistances();
        var lineMaterial = new THREE.LineBasicMaterial( { color: colour } );
        var line = new THREE.Line( lineGeometry, lineMaterial );
        line.name = 'line-' + this.lineNo++;
        this.scene.add(line);
        this.lines.push(line);
    }

    anim() {
        requestAnimationFrame(()=> {
            this.anim()
        });

        this.cursor.rotation.x += 0.1;
        this.cursor.rotation.y += 0.13;

        this.renderer.render( this.scene, this.camera );
    }


    clearAll() {
        for (var i = 0; i < this.lines.length; i++) {
            this.scene.remove(this.lines[i]);
        }
        this.lines = [];
    }


    findMidPoint(p0, p1) {
        var x = p0.x + (p1.x - p0.x) / 2;
        var y = p0.y + (p1.y - p0.y) / 2;
        return new THREE.Vector3(x, y, 0);
    }

    home() {
        this.cursor.position.x = 0;
        this.cursor.position.y = 0;
        this.startMarker.position.x = 0;
        this.startMarker.position.y = 0;
        this.midMarker.position.x = 0;
        this.midMarker.position.y = 0;
        this.circle = false;
        this.bending = false;
    }

    init(el) {

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera( 75, 1, 1, 10000 );
        this.camera.position.z = 1000;

        var geometry = new THREE.BoxGeometry( 20, 20, 20 );
        var material = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: false } );
        this.cursor = new THREE.Mesh( geometry, material );
        this.cursor.position.setZ(5);
        this.scene.add( this.cursor );


        this.startMarker = this.makeMarker(new THREE.Vector3(0, 0, 0), 10, 0x007f00);
        this.scene.add( this.startMarker );
        this.midMarker = this.makeMarker(new THREE.Vector3(0, 0, 0), 10, 0x007f7f);
        this.scene.add( this.midMarker );

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize( 800, 800 );

        el.nativeElement.appendChild( this.renderer.domElement );

    }

    keyInput(key) {
        var p = [
            new THREE.Vector3,
            new THREE.Vector3,
        ];

        var activeMark = this.cursor;
        if (this.bending) {
            activeMark = this.midMarker;
        }

        this.scene.remove(this.curvedGhost);
        this.addCurvedGhost(this.startMarker.position, this.midMarker.position,  this.cursor.position, this.circle, 0x3f3f3f);


        p[0] = activeMark.position.clone();

        if (key.lower == 'e') {
            this.clearAll();
        }
        else if (key.lower == 'f') {
            this.stepSize = 40;
        }
        else if (key.lower == 's') {
            this.stepSize = 10;
        }
        else if (key.lower == 'right arrow') {
            if (activeMark.position.x < 700) {
                activeMark.position.x += this.stepSize;
            }
        }
        else if (key.lower == 'left arrow') {
            if (activeMark.position.x > -700) {
                activeMark.position.x -= this.stepSize;
            }
        }
        else if (key.lower == 'up arrow') {
            if (activeMark.position.y < 700) {
                activeMark.position.y += this.stepSize;
            }
        }
        else if (key.lower == 'down arrow') {
            if (activeMark.position.y > -700) {
                activeMark.position.y -= this.stepSize;
            }
        }
        else if (key.lower == 'd') {
            this.marking = ! this.marking;
            if (this.marking) {
                activeMark.material.color.setHex( 0xff7f7f );
            } else {
                activeMark.material.color.setHex( 0x3f7f3f );
            }
        }
        else if (key.lower == ' ') {
            this.moveStartToCursor();
        }
        else if (key.lower == 'j') {
            if (this.bending) {
                this.bending = false;
            }
            this.curvedGhost.material.color.setHex( 0xff0000 );
            this.addCurvedGhost(this.startMarker.position, this.midMarker.position,  this.cursor.position, this.circle, 0xff0000);
            this.moveStartToCursor();
        }
        else if (key.lower == 'c') {
            this.bending = ! this.bending;
            this.circle = true;
        }
        else if (key.lower == 'b') {
            this.bending = ! this.bending;
            this.circle = false;
        }
        else if (key.lower == 'h') {
            this.home();
        }

        p[1] = activeMark.position.clone();

        if (! this.bending) {
            var mid = this.findMidPoint(this.startMarker.position, this.cursor.position);
            this.midMarker.position.copy(mid);
        }

        if (this.marking) {
            if (p[1].x != p[0].x || p[1].y != p[0].y) {
                this.addLine(p[0], p[1], 0xcc0000);
            }
        }

    }

    makeMarker(p0, size, colour) {
        var geometry = new THREE.SphereGeometry( size, size, 10 );
        var material = new THREE.MeshBasicMaterial( { color: colour, wireframe: true } );
        return new THREE.Mesh( geometry, material );
    }


    moveStartToCursor() {
        this.startMarker.position.copy(this.cursor.position);
    }

}


