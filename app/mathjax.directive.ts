import { Directive, ElementRef, Input, SimpleChange } from '@angular/core';

declare var MathJax: any;

@Directive({
    selector: '[myMathJax]',
})
export class MathJaxDirective {
    @Input() mathString : string;

    constructor(private el: ElementRef) {
        el.nativeElement.style.backgroundColor = '#e0e0e0';
    }


    ngOnChanges(changes: { [propName: string]: SimpleChange }) {  
        this.el.nativeElement.style.backgroundColor = 'white';
        this.el.nativeElement.innerHTML = '`' + this.mathString + '`';
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, this.el.nativeElement]);
    }
}
