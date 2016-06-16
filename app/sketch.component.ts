import { Component, ViewChild, ViewChildren, ElementRef } from '@angular/core';
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
      .input-file {
          font-size: 1.25em;
          font-weight: 700;
          color: white;
          display: inline-block;
          padding: 1em;
      }
      .status-image {
        width: 64px;
        height: 64px
        border: 1px solid black;
      }
      .button-table {
        table-layout: fixed;
        text-align: center;
        width: 450px;
        font-size: smaller;
        border-collapse: collapse;
      }
      table.button-table, table.button-table td, table.button-table tr {
        border: 1px solid #e7e7e7;
      }
      table.button-table tr:nth-child(even) {
        background-color: #f8f8f8
      }
      .mid-left {
        position: absolute;
        top: 250;
        left: 0;
      }
      .mid-right {
        position: absolute;
        top: 250;
        left: 500;
      }
      .left-top {
        position: absolute;
        top: 0;
        left: 0;
      }
      .mid-top {
        position: absolute;
        top: 0;
        left: 250;
      }
      .right-top {
        position: absolute;
        top: 0;
        left: 500;
      }
      .lower-left {
        position: absolute;
        top: 400;
        left: 0;
      }
      .lower-mid {
        position: absolute;
        top: 400;
        left: 250;
      }
      .lower-right {
        position: absolute;
        top: 400;
        left: 500;
      }
      .left-bottom {
        position: absolute;
        top: 500;
        left: 0;
      }
      .mid-bottom {
        position: absolute;
        top: 500;
        left: 250;
      }
      .right-bottom {
        position: absolute;
        top: 500;
        left: 500;
      }
      `]
})
export class SketchComponent {
    @ViewChildren(ThreeDirective) threeDirective;
    @ViewChild('writeInput') writeInput: ElementRef;

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
            var xc = this.drawer.cursor.position.x;
            var yc = this.drawer.cursor.position.y;
            var vCursor = this.drawer.getScreenCoords(xc, yc, 0);

            var xm = this.drawer.midMarker.position.x;
            var ym = this.drawer.midMarker.position.y;
            var vMid = this.drawer.getScreenCoords(xm, ym, 0);

            var xClick = ev.offsetX;
            var yClick = ev.offsetY;
            var theta = (Math.atan2(yClick-vCursor.y, xClick-vCursor.x)) * 180/Math.PI;
            var dist = Math.sqrt(Math.pow(xClick-vCursor.x, 2) + Math.pow(yClick-vCursor.y, 2));
            var mDist = Math.sqrt(Math.pow(xClick-vMid.x, 2) + Math.pow(yClick-vMid.y, 2));

            if (xClick > 400 || xClick < 50 || yClick < 50 || yClick > 400) {
                this.drawer.slideObject(xc, yc, this.drawer.camera);
            }

            var key = undefined;
            if (dist < 30) {
                key = this.keyService.makeKey('j');
            } else if (this.drawer.bending && mDist < 30) {
                key = this.keyService.makeKey('j');
            }
            /*else if (theta > 0) {
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
            } */
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


    handleMessage(ev) {
        if (ev === 'enter pushed') {
            this.writeInput.nativeElement.blur();
            return;
        }
        else  if (ev === 'print requested') {
            this.imgData = this.drawer.printSketch();
            var evt = document.createEvent("HTMLEvents");
            evt.initEvent("click", true, false);

            var aLink = document.createElement('a');
            aLink.setAttribute('download', 'image.png');
            aLink.href = this.imgData;
            aLink.dispatchEvent(evt);
            return;
        }
    }

    sendDrawerKey(ch) {
        if (ch === 'w') {
            this.writeInput.nativeElement.focus();
        }
        var key = this.keyService.makeKey(ch);
        this.drawer.keyInput(key);
    }


}
