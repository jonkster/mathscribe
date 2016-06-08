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
    lastPos = undefined;
    dots = [];
    lines = [];
    draggedLineSpline = [];
    ghostLine = undefined;

    palete = [
        0xf7f7f7,
        0x101010,
        0x202020,
        0x303030,
        0x404040,
        0x505050,
        0x606060,
        0x707070,
        0x808080,
        0x909090
    ]

    pencilColour = this.palete[3];
    draftColour =  this.palete[6];
    clearColour = this.palete[0];
    cursorColour = 0xff0000;
    midColour = 0x00ff00;
    startColour = 0x00ffff;

    currentLineWidth = 5;
    blurFactor = 0 // 0 = none, 10 = very blurred

    constructor(private el: ElementRef) {
        el.nativeElement.style.backgroundColor = '#ffffff';
        this.init(el);
        this.anim();
    }

    addBlob(x, y, draft, colour, big) {
        var material = new THREE.MeshBasicMaterial( { color: colour, wireframe: false } );
        var geometry = new THREE.CircleGeometry(4 * this.currentLineWidth, 10);
        var circle = new THREE.Mesh(geometry, material);
        circle.position.x = x;
        circle.position.y = y;
        this.dots.push(circle);
        this.scene.add(circle);
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


    anim() {
        requestAnimationFrame(()=> {
            this.anim()
        });

        this.cursor.rotation.x += 0.1;
        this.cursor.rotation.y += 0.13;

        this.composer.render( this.scene, this.camera );
    }


    clearAll() {
        this.scene.remove(this.ghostLine);
        for (var i = 0; i < this.lines.length; i++) {
            this.scene.remove(this.lines[i]);
        }
        this.lines = [];
    }

    createCurvedGeometry(p0, p1, p2, fullCircle) {
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

        var points = (rad/5) + 5;
        var path = new THREE.Path( curve.getPoints( points ) );
        var geometry = path.createPointsGeometry( points );
        geometry.computeLineDistances();
        return geometry;
    }

    createStraightGeometry(p0, p1, p2) {
        var geometry = new THREE.Geometry();
        geometry.vertices.push(
            new THREE.Vector3(p0.x, p0.y, 0),
            new THREE.Vector3(p1.x, p1.y, 0),
            new THREE.Vector3(p2.x, p2.y, 0)
        );
        return geometry;
    }

    drawGhostLines() {
        if (this.ghostLine !== undefined) {
            this.scene.remove(this.ghostLine);
        }
        var p0 = this.startMarker.position.clone();
        var p1 = this.midMarker.position.clone();
        var p2 = this.cursor.position.clone();
        var g = undefined;
        if (this.bending) {
            g = this.createCurvedGeometry(p0, p1, p2, this.circle);
        } else {
            g = this.createStraightGeometry(p0, p1, p2);
        }
        g.computeLineDistances();

        var lineScale = 1;
        if (this.pencilColour == this.clearColour) {
            lineScale = 2;
        }
        var m = new THREE.LineDashedMaterial({
            color: this.draftColour,
            linewidth: lineScale,
            scale: 5,
            dashSize: 2,
            gapSize: 3
        });
        this.ghostLine = new THREE.Line(g, m);
        this.scene.add(this.ghostLine);
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
        this.renderer.preserveDrawingBuffer = true ;
        this.renderer.setClearColor(this.clearColour, 1);
        this.renderer.setSize( 800, 800 );
        el.nativeElement.appendChild( this.renderer.domElement );

        this.composer = this.addBlurEffect();
    }

    keyInput(key) {
        var p = [
            new THREE.Vector3,
            new THREE.Vector3,
        ];

        if (this.lastPos === undefined) {
            this.lastPos = this.startMarker.position.clone();
        }

        this.drawGhostLines();


        var activeMark = this.cursor;
        if (this.bending) {
            activeMark = this.midMarker;
        }

        if (this.curvedGhost != undefined) {
            this.scene.remove(this.curvedGhost);
        }

        p[0] = activeMark.position.clone();

        if (key.lower == '0') {
            this.pencilColour = this.palete[0];
            this.dragging = true;
            this.startDragging();
            this.moveStartToCursor();
        } else if (key.lower.match(/^[1-9]$/)) {
            this.pencilColour = this.palete[key.lower];
        }
        else if (key.lower == 'p') {
            this.printSketch();
        } else if (key.lower == 'e') {
            this.clearAll();
        }
        else if (key.lower == 'f') {
            this.stepSize = 40;
        }
        else if (key.lower == 's') {
            this.stepSize = 10;
        }
        else if (key.lower == 'l') {
            this.cursor.position.copy(this.lastPos);
            this.midMarker.position.copy(this.lastPos);
            this.startMarker.position.copy(this.lastPos);
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
            this.bending = false;
            this.circle = false;
            this.dragging = ! this.dragging;
            if (this.dragging) {
                this.startDragging();
            } else {
                this.moveStartToCursor();
            }
        }
        else if (key.lower == ' ') {
            this.bending = false;
            this.circle = false;
            this.dragging = false;
            this.moveStartToCursor();
        }
        else if (key.lower == 'j') {
            this.lastPos = this.startMarker.position.clone();
            this.bending = false;
            this.circle = false;
            this.dragging = false;
            this.makeGhostReal();
            this.moveStartToCursor();
            this.scene.remove(this.curvedGhost);
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
            this.lastPos = this.startMarker.position.clone();
            this.home();
        }

        p[1] = activeMark.position.clone();

        if (! this.bending) {
            var mid = this.findMidPoint(this.startMarker.position, this.cursor.position);
            this.midMarker.position.copy(mid);
        }

        if (this.dragging) {
            var l = this.lines[this.lines.length-1];
            this.scene.remove(l);
            var dPos = this.cursor.position.clone();
            var g = l.geometry.clone();
            g.vertices.push(dPos);
            l.geometry.dispose();
            l.geometry = g;
            l.geometry.verticesNeedUpdate = true;
            this.scene.add(l);
        }

        if (this.dragging) {
            this.cursor.material.color.setHex( this.pencilColour );
        } else {
            this.cursor.material.color.setHex( this.cursorColour );
        }

    }

    makeGhostReal() {
        var g = this.ghostLine.geometry.clone();
        var m = new THREE.LineBasicMaterial({
            color: this.pencilColour,
            linewidth: this.currentLineWidth
        });
        var newLine = new THREE.Line(g, m);
        this.scene.add(newLine);
        this.lines.push(newLine);

    }

    makeMarker(p0, size, colour) {
        var geometry = new THREE.SphereGeometry( size, size, 10 );
        var material = new THREE.MeshBasicMaterial( { color: colour, wireframe: true } );
        return new THREE.Mesh( geometry, material );
    }


    moveStartToCursor() {
        this.scene.remove(this.curvedGhost);
        this.startMarker.position.copy(this.cursor.position);
    }

    printSketch() {
        var imgData = this.renderer.domElement.toDataURL();      
        console.log(imgData);
        return imgData;
    }

    startDragging() {
        this.draggedLineSpline = [];
        var m = new THREE.LineBasicMaterial({
            color: this.pencilColour,
            linewidth: this.currentLineWidth
        });
        var g = new THREE.Geometry();
        var newLine = new THREE.Line(g, m);
        this.lines.push(newLine);
        this.scene.add(newLine);
    }

}


