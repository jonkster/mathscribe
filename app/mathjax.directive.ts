import { Directive, ElementRef, Input } from '@angular/core';

@Directive({
    selector: '[myMathJax]'
})
export class MathJaxDirective {
    @Input('MathJax') myProp: any;

    constructor(private el: ElementRef) {
        el.nativeElement.style.backgroundColor = '#a0a0a0';
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, this.el.nativeElement]);
    }

    ngOnChanges() {  
        alert('x');
        console.log(this.el.nativeElement);
        console.log('>> onChange');
        console.log(MathJax);
        this.el.nativeElement.style.backgroundColor = 'yellow';
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, this.el.nativeElement]);
    }
}
