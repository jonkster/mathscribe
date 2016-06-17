import { Directive, ElementRef, EventEmitter, Input, Output, SimpleChange } from '@angular/core';

declare var THREE: any;
declare var THREE_Text: any;

@Directive({
    selector: '[myThreeD]'
})
export class ThreeDirective {
    @Output() messenger: EventEmitter<string> = new EventEmitter<string>();

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


    stepSize = 50;
    dragging = false;
    sliding = false;
    bending = false;
    filling = false;
    circle = false;
    rubbing = false;
    writing = false;
    tracing = false;
    writingX = 0;
    depth = 0;
    maxDisplacement = 2000;
    sizeX = 600;
    sizeY = 500;
    startPosX = -180;
    startPosY = 0;
    maxOutPos = 3000;
    minInPos = 100;

    startMarker = undefined;
    midMarker = undefined;
    curvedGhost = undefined;
    cursor = undefined;
    lastPos = undefined;
    lines = [];
    draggedLineSpline = [];
    ghostLine = undefined;
    blobCount = 0;

    palete = [
        0xf7f7f7,
        0x101010,
        0x303030,
        0x606060,
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
    zoomStep = 40;
    blurFactor = 0 // 0 = none, 10 = very blurred

        constructor(private el: ElementRef) {
            el.nativeElement.style.backgroundColor = '#ffffff';
            this.init(el);
            this.anim();
        }

        addBlob(x, y, draft, colour, big) {
            var material = new THREE.MeshBasicMaterial( { color: colour, wireframe: false } );
            var geometry = new THREE.CircleGeometry((this.blobCount+3) * this.currentLineWidth, 20);
            var circle = new THREE.Mesh(geometry, material);
            circle.position.x = x;
            circle.position.y = y;
            circle.position.z = this.depth;
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
                if (this.rubber == undefined) {
                        var material = new THREE.MeshBasicMaterial( { color: this.clearColour, wireframe: false } );
                        var geometry = new THREE.CircleGeometry(8 * this.currentLineWidth, 10);
                        this.rubber = new THREE.Mesh(geometry, material);

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
                        var bmaterial = new THREE.LineBasicMaterial( { color: this.draftColour } );
                        var border = new THREE.Line(bgeometry, bmaterial);
                        this.rubber.add(border);
                        this.scene.add(this.rubber);
                }
                this.rubber.position.x = this.cursor.position.x;
                this.rubber.position.y = this.cursor.position.y;
                this.rubber.position.z = this.depth+15;
                this.rubber.visible = true;
        }

        anim() {
            requestAnimationFrame(()=> {
                this.anim()
            });

            this.cursor.rotation.x += 0.08 * this.stepSize/15;
            this.cursor.rotation.y += 0.017 * this.stepSize/15;

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
            this.ghostLine.position.z = this.depth;
            this.scene.add(this.ghostLine);
        }

        dropRubber() {
                this.rubber.visible = false;
                this.depth += 5;
                this.rubbing = false;
        }

        findMidPoint(p0, p1) {
            var x = p0.x + (p1.x - p0.x) / 2;
            var y = p0.y + (p1.y - p0.y) / 2;
            return new THREE.Vector3(x, y, 0);
        }

        getScreenCoords(x, y, z) {
            var p = new THREE.Vector3(x, y, z);
            var vector = p.project(this.camera);
            vector.x = (vector.x + 1) / 2 * this.sizeX;
            vector.y = -(vector.y - 1) / 2 * this.sizeY;
            return vector;
        }

        hideTools() {
                this.cursor.visible = false;
                this.startMarker.visible = false;
                this.midMarker.visible = false;
                this.grid.visible = false;
        }

        home() {
            this.cursor.position.x = this.startPosX;
            this.cursor.position.y = this.startPosY;
            this.startMarker.position.x = this.startPosX;
            this.startMarker.position.y = this.startPosY;
            this.midMarker.position.x = this.startPosX;
            this.midMarker.position.y = this.startPosY;
            this.circle = false;
            this.bending = false;
            this.slideObject(this.startPosX, this.startPosY, this.camera);
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
            var cursorDot = this.makeMarker(10, this.cursorColour);
            this.cursor.add(cursorDot);
            this.scene.add( this.cursor );

            // add 'helper' cursors
            this.startMarker = this.makeMarker(10, this.startColour);
            this.scene.add( this.startMarker );
            this.midMarker = this.makeMarker(10, this.midColour);
            this.scene.add( this.midMarker );

            // add grid
            this.grid = new THREE.GridHelper(2000, 50, 0xa0ffa0, 0xd0ffd0);
            this.grid.material.linewidth = 2;
            this.grid.material.depthTest = false;
            this.grid.frustumCulled = false;
            this.grid.rotation.x = Math.PI/2;
            this.grid.position.set(0,0,-5);
            this.grid.visible = true;
            this.scene.add(this.grid);

            this.renderer = new THREE.WebGLRenderer();
            this.renderer.preserveDrawingBuffer = true ;
            this.renderer.setClearColor(this.clearColour, 1);
            this.renderer.setSize( this.sizeX, this.sizeY );
            el.nativeElement.appendChild( this.renderer.domElement );

            this.composer = this.addBlurEffect();
            this.home();

        }

        keepCursorInView() {
            if (this.sliding) {
                return;
            }
            var fov = this.camera.fov * (Math.PI/180);
            var visWidth = 1.2 * this.camera.position.z * Math.sin(fov/2);
            var rightMost = visWidth + this.camera.position.x;
            var leftMost = this.camera.position.x - visWidth;
            var topMost = visWidth + this.camera.position.y;
            var botMost = this.camera.position.y - visWidth;
            var wasOff = false;
            if (this.cursor.position.x > rightMost) {
                this.slideObject(rightMost + 20, this.cursor.position.y, this.camera);
                wasOff = true;
            } else if (this.cursor.position.x < leftMost) {
                this.slideObject(leftMost - 20, this.cursor.position.y, this.camera);
                wasOff = true;
            } else if (this.cursor.position.y + 20 > topMost) {
                this.slideObject(this.cursor.position.x, topMost, this.camera);
                wasOff = true;
            } else if (this.cursor.position.y - 20 < botMost) {
                this.slideObject(this.cursor.position.x, botMost, this.camera);
                wasOff = true;
            }
            if (false && wasOff) {
                if (this.camera.position.z < 2000) {
                    this.camera.position.z += 20;
                }
            }
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
                                if (this.cursor.position.y < this.maxDisplacement) {
                                    this.cursor.position.y += this.stepSize;
                                }
                            } else if (key.lower == 'down arrow') {
                                if (this.cursor.position.y > -this.maxDisplacement) {
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
                        text.position.z = this.depth;
                        this.scene.add(text)
                        this.lines.push(text);
                        return;
                    }
                } else {
                    this.writing = false;
                    this.messenger.emit('enter pushed');
                }
            }

            var blobbed = false;

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
                this.stepSize = 50;
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
                if (activeMark.position.x < this.maxDisplacement) {
                    activeMark.position.x += this.stepSize;
                }
            }
            else if (key.lower == 'left arrow') {
                this.writing = false;
                if (activeMark.position.x > -this.maxDisplacement) {
                    activeMark.position.x -= this.stepSize;
                }
            }
            else if (key.lower == 'up arrow') {
                this.writing = false;
                if (activeMark.position.y < this.maxDisplacement) {
                    activeMark.position.y += this.stepSize;
                }
            }
            else if (key.lower == 'down arrow') {
                this.writing = false;
                if (activeMark.position.y > -this.maxDisplacement) {
                    activeMark.position.y -= this.stepSize;
                }
            }
            else if (key.lower == 'x') {
                activeMark.material.color.setHex( this.cursorColour );
                this.bending = false;
                this.circle = false;
                this.dragging = false;
                this.moveStartToCursor();
                this.blobCount++;
                this.addBlob(this.cursor.position.x, this.cursor.position.y, false, this.pencilColour, true);
                blobbed = true;
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
                    clearSpot.children[0].visible = false;
                    this.scene.add(clearSpot);
                    this.lines.push(clearSpot);
                }
            }
            else if (key.lower == 'j') {
                this.lastPos = this.startMarker.position.clone();
                this.bending = false;
                this.circle = false;
                this.dragging = false;
                if (this.rubbing) {
                    this.moveStartToCursor();
                    var clearSpot = this.rubber.clone();
                    clearSpot.children[0].visible = false;
                    this.scene.add(clearSpot);
                    this.lines.push(clearSpot);
                } else {
                    this.makeGhostReal();
                    this.moveStartToCursor();
                    this.scene.remove(this.curvedGhost);
                }

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
                this.tracing = ! this.tracing;
                // if no background, load the default one
                if (this.background === undefined) {
                    this.trace('background.png');
                } else {
                    this.background.visible = this.tracing;
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
            else if (key.lower == 'o') {
                if (this.camera.position.z < this.maxOutPos) {
                    this.camera.position.z += this.zoomStep;
                }
            }
            else if (key.lower == 'i') {
                if (this.camera.position.z > this.minInPos) {
                    this.camera.position.z -= this.zoomStep;
                }
            }
            else if (key.lower == 'r') {
                this.rubbing = ! this.rubbing;
                this.moveStartToCursor();
                if (this.rubbing) {
                    this.bending = false;
                    this.circle = false;
                    this.dragging = false;
                    this.writing = false;
                    this.addRubber();
                } else {
                    this.dropRubber();
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
                this.messenger.emit('print requested');
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

            if (this.bending) {
                this.midMarker.children[0].visible = true;
                this.midMarker.children[0].material.color.setHex( 0xff0000 );
            } else {
                this.midMarker.children[0].visible = false;
            }

            if (this.dragging) {
                this.cursor.material.color.setHex( this.pencilColour );
            } else if (this.writing) {
                this.cursor.material.color.setHex( this.clearColour );
            } else if (this.rubbing) {
                this.cursor.material.color.setHex( this.draftColour );
                this.rubber.position.x = this.cursor.position.x;
                this.rubber.position.y = this.cursor.position.y;
                this.rubber.position.z = this.depth + 5;
            } else {
                this.cursor.material.color.setHex( this.cursorColour );
            }

            this.drawGhostLines();
            this.keepCursorInView();

            if (! blobbed) {
                this.blobCount = 0;
            }

        }

        loadImageUrl(url) {
            this.trace(url);
        }

        makeGhostReal() {
            var g = this.ghostLine.geometry.clone();
            var m = new THREE.LineBasicMaterial({
                color: this.pencilColour,
                linewidth: this.currentLineWidth
            });
            var newLine = new THREE.Line(g, m);
            newLine.position.z = this.depth;
            this.scene.add(newLine);
            this.lines.push(newLine);

        }

        makeMarker(size, colour) {
            var geometry = new THREE.SphereGeometry( size, size, 10 );
            var material = new THREE.MeshBasicMaterial( { color: colour, wireframe: true } );
            var marker =  new THREE.Mesh( geometry, material );

            // make ring to use when highlighting marker
            var circleCurve = new THREE.EllipseCurve(0, 0, size*4, size*4, 0, Math.PI*2, false, 0) ;
            var path = new THREE.Path(circleCurve.getPoints(10));
            var hGeometry = path.createPointsGeometry(10);
            var hMaterial = new THREE.LineBasicMaterial( { color: colour } );
            var hMarker =  new THREE.Line( hGeometry, hMaterial );
            hMarker.visible = false;
            marker.add(hMarker);

            return marker;
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

        slideObject(x, y, object) {
            this.sliding = true;
            var dx = object.position.x - x;
            var dy = object.position.y - y;
            
            object.position.x -= dx/10;
            object.position.y -= dy/10;
            var directive = this;
            if ((Math.abs(dx) > 20) ||  (Math.abs(dy) > 20)) {
                requestAnimationFrame(function() {
                    directive.slideObject(x, y, object);
                });
            }
            else
            {
                this.sliding = false;
                object.position.x = x;
                object.position.y = y;
                this.keepCursorInView();
            }
        }

        trace(imgName) {
            var obj = this;
            var loader = new THREE.TextureLoader();
            loader.load(imgName, function ( texture ) {
                var geometry = new THREE.PlaneGeometry(1024, 1024);
                var material = new THREE.MeshBasicMaterial({map: texture});
                if (obj.background !== undefined) {
                    obj.scene.remove(obj.background);
                }
                obj.background = new THREE.Mesh(geometry, material);
                obj.background.position.z = -2;
                obj.scene.add(obj.background);
                obj.background.visible = obj.tracing;
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


