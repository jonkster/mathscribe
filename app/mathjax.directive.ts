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

    setMarker() {
    /*var ops = this.el.nativeElement.getElementsByTagName('span')
            var state = 'looking';
            for (var i = 0; i < ops.length; i++)
            {
                var op = ops[i];
                if (op.innerHTML == ';')
                {
                    if (state == 'looking')
                    {
                        op.style.backgroundColor = 'yellow';
                        op.style.display = 'none';
                        state = 'colouring';
                    }
                    else if (state == 'colouring')
                    {
                        op.style.backgroundColor = 'yellow';
                        op.style.display = 'none';
                        state = 'done';
                    }
                }
                else if (state == 'colouring')
                {
                    var cl = op.className;
                    if ((cl != 'msup') && (cl != '') && (cl != 'op'))
                    {
                        console.log('cl', cl);
                        op.style.backgroundColor = 'yellow';
                    }
                }
            }*/
    }


    ngOnChanges(changes: { [propName: string]: SimpleChange }) {  
        this.el.nativeElement.style.backgroundColor = 'white';
        this.el.nativeElement.innerHTML = '`' + this.mathString + '`';
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, this.el.nativeElement]);
        var obj = this;
        MathJax.Hub.Queue(function() {
            console.log(obj);
            obj.setMarker();
        });
    }
}
