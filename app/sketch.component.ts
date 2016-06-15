import { Component, ViewChildren } from '@angular/core';
import {NgGrid, NgGridItem} from 'angular2-grid';

import {FILE_UPLOAD_DIRECTIVES, FileUploader} from 'ng2-file-upload/ng2-file-upload';
import {ThreeDirective} from './three.directive';
import {KeyService} from './key.service';

import { JkOperatorButtonComponent } from './jkoperator.component';

@Component({
  selector: '[mySketch]',
  templateUrl: 'app/sketch.component.html',
  directives: [  NgGrid, NgGridItem, ThreeDirective, JkOperatorButtonComponent, FILE_UPLOAD_DIRECTIVES ],
  providers: [ KeyService ],
  styles: [`
      .status-indicator {
        padding: 0.5em;
        border: 1px solid black;
      }
      .status-image {
        width: 200px;
        height: 200px
        border: 1px solid black;
      }
      .button-table {
        table-layout: fixed;
        width: 500px;
        font-size: smaller;
      }
      `]
})
export class SketchComponent {
    @ViewChildren(ThreeDirective) threeDirective;

    pencilColour = '#ff0000';
    mousedownTimer = undefined;
    imgData = '';
    drawer;
    overflow = 0;

    constructor(private keyService: KeyService) { }

    changeColour(v) {
        var pc = this.drawer.palete[v];
        this.drawer.pencilColour =  pc;
        this.pencilColour = '#' + pc.toString(16);
    }

    drawingClick(ev) {


        if (ev.type === 'mousedown') {
            var x0 = this.drawer.cursor.position.x;
            var y0 = this.drawer.cursor.position.y;
            var v = this.drawer.getScreenCoords(x0, y0, 0);
            var x1 = ev.offsetX;
            var y1 = ev.offsetY;
            var theta = (Math.atan2(y1-v.y, x1-v.x)) * 180/Math.PI;
            var dist = Math.sqrt(Math.pow(x1-v.x, 2) + Math.pow(y1-v.y, 2));

            var key = undefined;
            if (dist < 30) {
                key = this.keyService.makeKey('j');
            } else if (theta > 0) {
                if (theta < 45) {
                    key = this.keyService.makeKey('right arrow');
                } else if (theta < 135) {
                    key = this.keyService.makeKey('down arrow');
                } else {
                    key = this.keyService.makeKey('left arrow');
                }
            } else {
                if (theta > -45) {
                    key = this.keyService.makeKey('right arrow');
                } else if (theta > -135) {
                    key = this.keyService.makeKey('up arrow');
                } else {
                    key = this.keyService.makeKey('left arrow');
                }
            }
            if (key !== undefined) {
                var obj = this;
                if (this.mousedownTimer === undefined) {
                    this.overflow = 0;
                    this.mousedownTimer = setInterval(function() { obj.drawingClick(ev); }, 400);
                }
                if (this.overflow++ > 100) {
                    clearInterval(this.mousedownTimer);
                    this.mousedownTimer = undefined;
                    return;
                }
                this.drawer.keyInput(key);
            }
        } else {
            if (this.mousedownTimer !== undefined) {
                clearInterval(this.mousedownTimer);
                this.mousedownTimer = undefined;
            }
        }
    }

    handleFileUpload(ev) {
        var reader = new FileReader();
        var obj = this;
        reader.onload = function(readEv) {
            var data = this.result;
            obj.drawer.tracing = true;
            obj.drawer.loadImageUrl(data);
        };
        var file = ev.target.files[0];
        reader.readAsDataURL(file);   
    }


    keyInput(ev) {
        var key = this.keyService.keyInput(ev);
        this.drawer.keyInput(key);
    }

    ngAfterViewInit() {
        this.drawer = this.threeDirective.first;
        this.changeColour(4);
    }


    printSketch(ev) {
        this.imgData = this.drawer.printSketch();
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent("click", true, false);

        var aLink = document.createElement('a');
        aLink.setAttribute('download', 'image.png');
        aLink.href = this.imgData;
        aLink.dispatchEvent(evt);
    }
    sendDrawerKey(ch) {
        var key = this.keyService.makeKey(ch);
        this.drawer.keyInput(key);
    }


}
