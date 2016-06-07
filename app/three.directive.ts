import { Directive, ElementRef, Input, SimpleChange } from '@angular/core';

declare var THREE: any;

@Directive({
    selector: '[myThreeD]',
})
export class ThreeDirective {

    scene = undefined;
    camera = undefined;
    renderer = undefined;
    composer = undefined;


    stepSize = 10;
    dragging = false;
    bending = false;
    filling = false;
    circle = false;

    startMarker = undefined;
    midMarker = undefined;
    curvedGhost = undefined;
    cursor = undefined;
    lineNo = 0;
    lines = [];

    palete = [
        0xf7f7f7,
        0x101010,
        0x303030,
        0x505050,
        0x707070,
        0x909090,
        0xb0b0b0,
        0xd0d0d0
    ]

    pencilColour = this.palete[3];
    draftColour =  this.palete[6];
    clearColour = this.palete[0];
    cursorColour = 0xff0000;
    midColour = 0x00ff00;
    startColour = 0x00ffff;

    currentLineWidth = 5;
    blurFactor = 2 // 0 = none, 10 = very blurred
    jitter = this.currentLineWidth/2;

    constructor(private el: ElementRef) {
        el.nativeElement.style.backgroundColor = '#ffffff';
        this.init(el);
        this.anim();
    }

    addBlob(x, y, draft, colour, big) {
            var geometry = undefined;
            var material = undefined;
            var c = colour;
            if (! draft && colour != this.clearColour) {
                var j = this.jitter * (0.5 - Math.random());
                var ran = 16-Math.round(32*Math.random());
                var r = (ran + (c >> 16)) & 255;
                var g = (ran + (c >> 8)) & 255;
                var b = (ran + c) & 255;
                c = (r<<16) + (g<<8) + b;
            }

            if (draft) {
                material = new THREE.MeshBasicMaterial( { color: this.draftColour, wireframe: true } );
                geometry = new THREE.CircleGeometry(this.currentLineWidth, 5);
            } else {
                var scale = 2;
                if (big) {
                    scale = 4;
                }
                material = new THREE.MeshBasicMaterial( { color: c, wireframe: false } );
                geometry = new THREE.CircleGeometry(scale * this.currentLineWidth + j, 10);
            }
            var circle = new THREE.Mesh(geometry, material);
            circle.position.x = x;
            circle.position.y = y;
            circle.name = 'blob-' + this.lineNo++;
            this.lines.push(circle);

            if (draft) {
                this.curvedGhost.add(circle);
            } else {
                this.scene.add(circle);
            }
    }

    addBlurEffect() {
        var composer = new THREE.EffectComposer( this.renderer );
        composer.addPass( new THREE.RenderPass( this.scene, this.camera ) );

        var hblur = new THREE.ShaderPass( THREE.HorizontalBlurShader );
        var vblur = new THREE.ShaderPass( THREE.VerticalBlurShader );
        hblur.uniforms[ 'h' ].value = this.blurFactor / 2000;
        vblur.uniforms[ 'v' ].value = this.blurFactor / 2000;
        composer.addPass( hblur );
        composer.addPass( vblur );
        vblur.renderToScreen = true;
        return composer;
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
            ext,
            0, end,
            flip,
            ang 
        ) ;

        var path = new THREE.Path( curve.getPoints( 100 ) );
        var geometry = path.createPointsGeometry( 100 );
        geometry.computeLineDistances();
        var v = geometry.vertices;
        if (this.curvedGhost != undefined) {
                this.scene.remove(this.curvedGhost);
        }
        this.curvedGhost = new THREE.Object3D();
        this.scene.add(this.curvedGhost);
        for (var i = 0; i < v.length; i++) {
            this.addBlob(v[i].x, v[i].y, true, colour, false);
        }
    }

    addLine(p0, p1, colour) {
        var lineGeometry = new THREE.Geometry();
        var vertArray = lineGeometry.vertices;
        vertArray.push( new THREE.Vector3(p0.x, p0.y, 0), new THREE.Vector3(p1.x, p1.y, 0) );
        lineGeometry.computeLineDistances();
        var lineMaterial = new THREE.LineBasicMaterial( { color: colour, linewidth: this.currentLineWidth  } );
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

        this.composer.render( this.scene, this.camera );
    }


    clearAll() {
        this.scene.remove(this.curvedGhost);
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

        // make main cursor
        var geometry = new THREE.BoxGeometry( 60, 60, 60 );
        var material = new THREE.MeshBasicMaterial( { color: this.cursorColour, wireframe: true } );
        this.cursor = new THREE.Mesh( geometry, material );
        this.cursor.position.setZ(5);
        var cursorDot = this.makeMarker(new THREE.Vector3(0, 0, 0), 10, this.cursorColour);
        this.cursor.add(cursorDot);
        this.scene.add( this.cursor );

        // add 'helper' cursors
        this.startMarker = this.makeMarker(new THREE.Vector3(0, 0, 0), 10, this.startColour);
        this.scene.add( this.startMarker );
        this.midMarker = this.makeMarker(new THREE.Vector3(0, 0, 0), 10, this.midColour);
        this.scene.add( this.midMarker );

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor( this.clearColour, 1 );
        this.renderer.setSize( 800, 800 );
        el.nativeElement.appendChild( this.renderer.domElement );

        this.composer = this.addBlurEffect();
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

        if (this.curvedGhost != undefined) {
            this.scene.remove(this.curvedGhost);
        }
        this.addCurvedGhost(this.startMarker.position, this.midMarker.position,  this.cursor.position, this.circle, this.draftColour);


        p[0] = activeMark.position.clone();

        if (key.lower.match(/^[0-7]$/)) {
            this.pencilColour = this.palete[key.lower];
        }
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
        else if (key.lower == 'x') {
            activeMark.material.color.setHex( this.cursorColour );
            this.bending = false;
            this.circle = false;
            this.dragging = false;
            this.moveStartToCursor();
            this.addBlob(this.cursor.position.x, this.cursor.position.y, false, this.pencilColour, true);
        }
        else if (key.lower == 'd') {
            this.dragging = ! this.dragging;
        }
        else if (key.lower == ' ') {
            this.moveStartToCursor();
        }
        else if (key.lower == 'j') {
            this.bending = false;
            this.circle = false;
            this.dragging = false;
            this.makeGhostReal();
            //this.addCurvedGhost(this.startMarker.position, this.midMarker.position,  this.cursor.position, this.circle, false, this.pencilColour);
            this.moveStartToCursor();
        }
        else if (key.lower == 'c') {
            this.bending = true;
            this.circle = true;
        }
        else if (key.lower == 'b') {
            this.bending = true;
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

        if (this.dragging) {
            this.addBlob(this.cursor.position.x, this.cursor.position.y, false, this.pencilColour, false);
        }
        if (this.dragging) {
            this.cursor.material.color.setHex( this.pencilColour );
        } else {
            this.cursor.material.color.setHex( this.cursorColour );
        }

    }

    makeGhostReal() {
        var obj = this;
        this.curvedGhost.traverse(function(child) {
            obj.addBlob(child.position.x, child.position.y, false, obj.pencilColour, false);
        });
        if (this.curvedGhost != undefined) {
                this.scene.remove(this.curvedGhost);
        }
        this.curvedGhost = new THREE.Object3D();
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


