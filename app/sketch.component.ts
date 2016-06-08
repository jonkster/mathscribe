import { Component, ViewChildren } from '@angular/core';
import {NgGrid, NgGridItem} from 'angular2-grid';

import {ThreeDirective} from './three.directive';
import {KeyService} from './key.service';

import { JkOperatorButtonComponent } from './jkoperator.component';

@Component({
  selector: '[mySketch]',
  templateUrl: 'app/sketch.component.html',
  directives: [  NgGrid, NgGridItem, ThreeDirective, JkOperatorButtonComponent ],
  providers: [ KeyService ],
  styles: [`
      .status-indicator {
        padding: 0.5em;
        border: 1px solid black;
      }
      `]
})
export class SketchComponent {
    @ViewChildren(ThreeDirective) threeDirective;

    pencilColour = '#ff0000';
    drawer;

    constructor(private keyService: KeyService) { }

    ngAfterViewInit() {
        this.drawer = this.threeDirective.first;
        this.changeColour(4);
        console.log(this);
    }

    keyInput(ev) {
        var key = this.keyService.keyInput(ev);
        this.drawer.keyInput(key);
    }

    changeColour(v) {
        var pc = this.drawer.palete[v];
        this.drawer.pencilColour =  pc;
        this.pencilColour = '#' + pc.toString(16);
    }

    printSketch() {
        var imgData = this.drawer.printSketch();
        /*var aLink = document.createElement('a');
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent("click");
        aLink.download = 'image.png';
        aLink.href = imgData;
        aLink.dispatchEvent(evt);*/
    }

}
