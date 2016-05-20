import { Directive, Output, EventEmitter, ElementRef, Renderer, SimpleChange } from '@angular/core';
import { Http, Headers, Response, HTTP_PROVIDERS } from '@angular/http';


@Directive({
    selector: '[myWriting]',
    host: {
        '(mousemove)': 'movePen("move", $event)',
        '(mousedown)': 'movePen("down", $event)',
        '(mouseup)': 'movePen("up", $event)',
        '(mouseout)': 'movePen("out", $event)'
    },
})
export class MyWritingDirective {

    @Output() onDigested = new EventEmitter();

    private canvas = undefined;
    private ctx = undefined;
    private prevX = 0;
    private currX = 0;
    private prevY = 0;
    private currY = 0;
    private w = 0;
    private h = 0;
    private drawing = false;
    private hasDrawing = false;
    private fillStyle = 'white';
    private lineWidth = 10;
    private drawingTimeout;

    constructor(public element: ElementRef, public renderer: Renderer, private http: Http) {
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
	this.hasDrawing = false;
    }

    private draw() {
	this.hasDrawing = true;
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
	    clearTimeout(this.drawingTimeout);
            this.prevX = this.currX;
            this.prevY = this.currY;
            this.currX = ev.clientX - this.canvas.offsetLeft;
            this.currY = ev.clientY - this.canvas.offsetTop;

            this.drawing = true;
            this.ctx.beginPath();
            this.ctx.fillStyle = this.fillStyle;
            this.ctx.fillRect(this.currX, this.currY, 2, 2);
            this.ctx.closePath();
        }
        else if (action == 'up' || action == "out")
        {
	    clearTimeout(this.drawingTimeout);
            var obj = this;
		this.drawingTimeout = setTimeout(function() {
		    if (obj.hasDrawing)
			obj.recogniseCharacter();
		    obj.clear();
		}, 1300);
            this.drawing = false;
        }
        else if (action == 'move')
        {
            if (this.drawing)
            {
                this.prevX = this.currX;
                this.prevY = this.currY;
                this.currX = ev.clientX - this.canvas.offsetLeft;
                this.currY = ev.clientY - this.canvas.offsetTop;
                this.draw();
            }
        }
    }

    private recogniseCharacter() {
        var data = this.canvas.toDataURL('image/png');
        var headers = new Headers({'Content-Type': 'image/jpg'})
        var endpoint = 'http://127.0.0.1:8080/upload';
	var obj = this.onDigested;
        this.http.post(endpoint, data, { headers: headers })
            .toPromise()
            .then(function(data) {
		obj.emit(data.text());
	     })
            .catch(this.indigestion);
    }

    private indigestion(error) {
        console.log(error)
    }

}
