import { Directive, ElementRef, EventEmitter, Input, Output, SimpleChange } from '@angular/core';

declare var THREE: any;
declare var THREE_Text: any;

@Directive({
    selector: '[myThreeD]'
})
export class ThreeDirective {
    @Output() printPushed: EventEmitter<string> = new EventEmitter<string>();

    Text2D = THREE_Text.Text2D;
    SpriteText2D = THREE_Text.SpriteText2D;
    textAlign = THREE_Text.textAlign;

    scene = undefined;
    camera = undefined;
    renderer = undefined;
    composer = undefined;
    rubber = undefined;
    grid = undefined;
    imgData = undefined;
    background = undefined;


    stepSize = 10;
    dragging = false;
    bending = false;
    filling = false;
    circle = false;
    rubbing = false;
    writing = false;
    grabbing = false;
    writingX = 0;

    startMarker = undefined;
    midMarker = undefined;
    curvedGhost = undefined;
    cursor = undefined;
    lastPos = undefined;
    lines = [];
    draggedLineSpline = [];
    ghostLine = undefined;

    palete = [
        0xf7f7f7,
        0x101010,
        0x303030,
        0x505050,
        0x707070,
        0x909090,
        0xb0b0b0,
        0xd0d0d0,
        0xe0e0e0,
        0xf0f0f0
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
            this.lines.push(circle);
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

        addRubber() {
            var material = new THREE.MeshBasicMaterial( { color: this.clearColour, wireframe: false } );
            var geometry = new THREE.CircleGeometry(8 * this.currentLineWidth, 10);
            var rubber = new THREE.Mesh(geometry, material);

            var borderCurve = new THREE.EllipseCurve( 
                0,0,
                8 * this.currentLineWidth,             
                8 * this.currentLineWidth,             
                0, Math.PI * 2,
                false,
                0 
            ) ;
            var path = new THREE.Path(borderCurve.getPoints(20));
            var bgeometry = path.createPointsGeometry(20);
            bgeometry.computeLineDistances();
            var bmaterial = new THREE.MeshBasicMaterial( { color: this.pencilColour, wireframe: true } );
            var border = new THREE.Mesh(bgeometry, bmaterial);
            rubber.add(border);
            rubber.position.x = this.cursor.position.x;
            rubber.position.y = this.cursor.position.y;
            this.scene.add(rubber);
            return rubber;
        }

        anim() {
            requestAnimationFrame(()=> {
                this.anim()
            });

            this.cursor.rotation.x += 0.1 * this.stepSize/15;
            this.cursor.rotation.y += 0.13 * this.stepSize/15;

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

        hideTools() {
                this.cursor.visible = false;
                this.startMarker.visible = false;
                this.midMarker.visible = false;
                this.grid.visible = false;
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

            // add grid
            this.grid = new THREE.GridHelper(800, 40, 0xa0ffa0, 0xa0ffa0);
            this.grid.rotation.x = Math.PI/2;
            this.grid.position.set(0,0,0);
            this.scene.add(this.grid);

            this.renderer = new THREE.WebGLRenderer();
            this.renderer.preserveDrawingBuffer = true ;
            this.renderer.setClearColor(this.clearColour, 1);
            this.renderer.setSize( 800, 800 );
            el.nativeElement.appendChild( this.renderer.domElement );

            this.composer = this.addBlurEffect();

        }

        keyInput(key) {

            if (this.writing) {
                if (key.lower != 'enter') {
                    if (key.lower == 'backspace') {
                        this.undo();
                        this.writingX--;
                        return;
                    } else {
                        if (key.lower == 'shift') {
                            return;
                        } else if (key.altKey) {
                            return;
                        } else if (key.ctrlKey) {
                            return;
                        } else if (key.metaKey) {
                            return;
                        } else if (key.lower.length > 1) {
                            if (key.lower == 'up arrow') {
                                if (this.cursor.position.y < 700) {
                                    this.cursor.position.y += this.stepSize;
                                }
                            } else if (key.lower == 'down arrow') {
                                if (this.cursor.position.y > -700) {
                                    this.cursor.position.y -= this.stepSize;
                                }
                            }
                            return;
                        } else if (key.shiftKey) {
                            key.lower = key.upper;
                        }
                        var text = new this.SpriteText2D(key.lower, { 
                            align: this.textAlign.left,
                            font: '30px Lucida Console',
                            fillStyle: '#101010',
                            antialias: true
                        });
                        text.position.copy(this.cursor.position);
                        text.position.x += 10 + this.writingX++ * 20;
                        this.scene.add(text)
                        this.lines.push(text);
                        return;
                    }
                } else {
                    this.writing = false;
                }
            }

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


            if (key.lower.match(/^[0-9]$/)) {
                this.pencilColour = this.palete[key.lower];
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
                this.writing = false;
                if (activeMark.position.x < 700) {
                    activeMark.position.x += this.stepSize;
                }
            }
            else if (key.lower == 'left arrow') {
                this.writing = false;
                if (activeMark.position.x > -700) {
                    activeMark.position.x -= this.stepSize;
                }
            }
            else if (key.lower == 'up arrow') {
                this.writing = false;
                if (activeMark.position.y < 700) {
                    activeMark.position.y += this.stepSize;
                }
            }
            else if (key.lower == 'down arrow') {
                this.writing = false;
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
                if (this.rubbing) {
                    var clearSpot = this.rubber.clone();
                    this.scene.add(clearSpot);
                    this.lines.push(clearSpot);
                }
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
            else if (key.lower == 't') {
                if (this.background == undefined) {
                    this.trace('background.png');
                } else {
                    this.scene.remove(this.background);
                    this.background = undefined;
                }
            }
            else if ((key.lower == 'u') || (key.lower == 'backspace')) {
                this.bending = false;
                this.circle = false;
                this.dragging = false;
                this.undo();
            }
            else if (key.lower == 'h') {
                this.lastPos = this.startMarker.position.clone();
                this.home();
            }
            else if (key.lower == 'r') {
                this.rubbing = ! this.rubbing;
                this.moveStartToCursor();
                if (this.rubbing) {
                    this.bending = false;
                    this.circle = false;
                    this.dragging = false;
                    this.writing = false;
                    this.rubber = this.addRubber();
                } else {
                    this.scene.remove(this.rubber);
                }
            }
            else if (key.lower == 'w') {
                this.bending = false;
                this.circle = false;
                this.dragging = false;
                this.writing = true;
                this.writingX = 0;
                this.moveStartToCursor();
            }
            else if (key.lower == 'p') {
                this.printPushed.emit('print requested');
            }

            if (! this.bending) {
                var mid = this.findMidPoint(this.startMarker.position, this.cursor.position);
                this.midMarker.position.copy(mid);
            }

            if (this.dragging) {
                var l = this.lines.pop();
                this.scene.remove(l);
                var dPos = this.cursor.position.clone();
                var g = l.geometry.clone();
                g.vertices.push(dPos);
                l.geometry.dispose();
                l.geometry = g;
                l.geometry.verticesNeedUpdate = true;
                this.lines.push(l);
                this.scene.add(l);
            }

            if (this.dragging) {
                this.cursor.material.color.setHex( this.pencilColour );
            } else if (this.writing) {
                this.cursor.material.color.setHex( this.clearColour );
            } else if (this.rubbing) {
                this.cursor.material.color.setHex( this.draftColour );
                this.rubber.position.copy(this.cursor.position);
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
            this.hideTools();
            this.composer.render( this.scene, this.camera );
            this.imgData = this.renderer.domElement.toDataURL();
            this.showTools();
            return this.imgData;
        }
        
        showTools() {
                this.cursor.visible = true;
                this.startMarker.visible = true;
                this.midMarker.visible = true;
                this.grid.visible = true;
        }

        trace(imgName) {
            var obj = this;
            var loader = new THREE.TextureLoader();
            loader.load(imgName, function ( texture ) {
                var geometry = new THREE.PlaneGeometry(1024, 1024);
                var material = new THREE.MeshBasicMaterial({map: texture});
                obj.background = new THREE.Mesh(geometry, material);
                obj.background.position.z = -2;
                obj.scene.add(obj.background);
            });
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

        undo() {
            if (this.lines.length > 0) {
                var obj = this.lines.pop();
                this.scene.remove(obj);
            }
        }

}


