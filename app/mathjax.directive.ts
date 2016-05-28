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

    position() {
        var el = this.el.nativeElement;
    }

    ngOnChanges(changes: { [propName: string]: SimpleChange }) {  
        var el = this.el.nativeElement;
        el.style.backgroundColor = 'white';
        el.innerHTML = '`' + this.mathString + '`';
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, el]);
        var obj = this;
        MathJax.Hub.Queue([function() { obj.position(); }, MathJax.Hub]);
    }
}
