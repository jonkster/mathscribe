import { Component, OnInit, ViewChild } from '@angular/core';
import { MathJaxDirective } from './mathjax.directive';
import { MyWritingDirective } from './writing.directive';

declare var MathJax: any;

@Component({
  selector: 'my-paper',
  templateUrl: 'app/paper.component.html',
  styleUrls: ['app/paper.component.css'],
  directives: [  MathJaxDirective, MyWritingDirective ],
  styles: [`
    #raw-input {
        color: #a0a0a0;
        height: 1.5em;
        font-size: 1.5em;
    }
  `]
})
export class PaperComponent {
    @ViewChild(MyWritingDirective) handwritingDirective: MyWritingDirective;

    rawString = 'y^x';


    addSymbol(sym) { this.rawString += sym; };
    crossout() { console.log("cross out not implemented"); };
    clear(x) { this.handwritingDirective.clear(); this.rawString = '';  };
    correct(x) { this.handwritingDirective.clear(); this.rawString = this.rawString.slice(0, -1);  };
    cursorMove(delta) { console.log("move cursor not implemented"); };

    ngOnInit() {
            MathJax.Hub.Queue(["Typeset",MathJax.Hub,"myMathJax"]);
    }

    ngAfterViewInit() {
        this.handwritingDirective.onDigested.subscribe((data) => { this.addSymbol(data); });
    }

}
