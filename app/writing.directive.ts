import { Directive, ElementRef, Renderer, SimpleChange } from '@angular/core';


@Directive({
    selector: '[myWriting]',
    host: {
        '(mousemove)': 'movePen("move", $event)',
        '(mousedown)': 'movePen("down", $event)',
        '(mouseup)': 'movePen("up", $event)',
        '(mouseout)': 'movePen("out", $event)'
    }
})
export class MyWritingDirective implements OnInit {

    private canvas = undefined;
    private ctx = undefined;
    private prevX = 0;
    private currX = 0;
    private prevY = 0;
    private currY = 0;
    private w = 0;
    private h = 0;
    private flag = false;
    private dot_flag = false;
    private fillStyle = 'white';
    private lineWidth = 10;

    constructor(public element: ElementRef, public renderer: Renderer) {
        this.canvas = element.nativeElement;
        this.ctx = this.canvas.getContext("2d");
        // need to make this configurable
        this.canvas.width = 400;
        this.canvas.height = 400;
        this.w = this.canvas.width;
        this.h = this.canvas.height;
        this.clear();
    }

    ngOnInit() { }

    clear() {
        this.ctx.fillStyle = '#000000';
        this.ctx.clearRect(0, 0, this.w, this.h);
        this.ctx.rect(0, 0, this.w, this.h);
        this.ctx.fill();
    }

    private draw() {
        this.ctx.beginPath();
        this.ctx.moveTo(this.prevX, this.prevY);
        this.ctx.lineTo(this.currX, this.currY);
        this.ctx.closePath();
        this.ctx.strokeStyle = this.fillStyle;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.stroke();
    }

    private movePen(action, ev) {
        if (action == 'down')
        {
            this.prevX = this.currX;
            this.prevY = this.currY;
            this.currX = ev.clientX - this.canvas.offsetLeft;
            this.currY = ev.clientY - this.canvas.offsetTop;

            this.flag = true;
            this.dot_flag = true;
            if (this.dot_flag) 
            {
                this.ctx.beginPath();
                this.ctx.fillStyle = this.fillStyle;
                this.ctx.fillRect(this.currX, this.currY, 2, 2);
                this.ctx.closePath();
                this.dot_flag = false;
            }
        }
        else if (action == 'up' || action == "out")
        {
            this.flag = false;
        }
        else if (action == 'move')
        {
            if (this.flag)
            {
                this.prevX = this.currX;
                this.prevY = this.currY;
                this.currX = ev.clientX - this.canvas.offsetLeft;
                this.currY = ev.clientY - this.canvas.offsetTop;
                this.draw();
            }
        }
    }

}
