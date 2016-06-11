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
    imgData = '';
    drawer;

    constructor(private keyService: KeyService) { }

    changeColour(v) {
        var pc = this.drawer.palete[v];
        this.drawer.pencilColour =  pc;
        this.pencilColour = '#' + pc.toString(16);
    }

    sendDrawerKey(ch) {
        var key = this.keyService.makeKey(ch);
        this.drawer.keyInput(key);
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

}
