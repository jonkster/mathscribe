import { Component, OnInit } from '@angular/core';
import { MathJaxDirective } from './mathjax.directive';

declare var MathJax: any;

@Component({
  selector: 'my-paper',
  templateUrl: 'app/paper.component.html',
  styleUrls: ['app/paper.component.css'],
  directives: [  MathJaxDirective ],
})
export class PaperComponent {
    rawString = 'y^x';
    addSymbol(sym) { this.rawString += sym; };
    crossout() { console.log("cross out not implemented"); };
    cursorMove(delta) { console.log("move cursor not implemented"); };

    ngOnInit() {
            MathJax.Hub.Queue(["Typeset",MathJax.Hub,"myMathJax"]);
    }
}
