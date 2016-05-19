import { Component, OnInit } from '@angular/core';
import { MathJaxDirective } from './mathjax.directive';
@Component({
  selector: 'my-paper',
  templateUrl: 'app/paper.component.html',
  styleUrls: ['app/paper.component.css'],
  directives: [  MathJaxDirective ],
})
export class PaperComponent {
    rawString = '';
    addSymbol(sym) { this.rawString += sym; };
    crossout() { console.log("cross out not implemented"); };
    cursorMove(delta) { console.log("move cursor not implemented"); };
}
