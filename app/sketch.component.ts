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
})
export class SketchComponent {
    @ViewChildren(ThreeDirective) threeDirective;

    constructor(private keyService: KeyService) { }

    keyInput(ev) {
        var key = this.keyService.keyInput(ev);
        this.threeDirective.first.keyInput(key);
    }

    changeColour(v) {
        var drawer = this.threeDirective.first;
        drawer.pencilColour = drawer.palete[v];
    }
}
