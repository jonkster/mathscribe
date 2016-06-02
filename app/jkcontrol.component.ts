import { Component, Input, Output, EventEmitter } from '@angular/core';
@Component({
  selector: 'jk-control-button',
  template: `
    <button class="jk-control-button"
        [disabled]="disabled"
        (click)="actOnOperator(operator)"
        >
        <span class="jk-display-symbol" [innerHTML]="myControl.screenDisplay">
        </span>
        <span *ngIf="allowHotkeys && hotkeyEnabled" class="jk-hotkey">
            {{myOperator.hotkeys[0]}}
        </span>
    </button>
  `,
  styles: [`
    .jk-control-button {
        margin: 0.5em;
        font-size: 1.2em;
        padding: 0.2em 1em;
        border: 3px solid blue;
        float: left;
    }
    button:disabled {
        border: none;
    }
    .jk-display-symbol {
        font-weight: 900;
        text-align: center;
        float: left;
    }
    .jk-hotkey{
        color: gray;
        text-align: center;
        float: left;
        clear: left;
    }
  `]
})
export class JkControlButtonComponent {
    @Input() disabled : boolean;
    @Input() control : string;
    @Input() action : string;
    @Input() allowHotkeys : boolean = false;
    @Input() hotkeyEnabled : boolean = false;
    @Output() notify:EventEmitter<string> = new EventEmitter<string>();

    myControl = undefined;

    ngAfterViewInit() {
    }
    ngOnInit() {
        if (this.allowHotkeys) {
            this.hotkeyEnabled = true;
        }
        this.myControl = this.controls[this.control];
    }

    actOnOperator(ch) {
        this.notify.emit(ch);
    }

    setEnableHotkey(flag) {
        this.hotkeyEnabled = flag;
    }

    hotkey(ch) {
        if (ch == this.myControl.hotkey) {
            this.actOnOperator(ch);
            return true;
        }
        return false;
    }

    controls = {
        'clear' : {
            'screenDisplay': 'clear',
            'hotkey': 'insert',
        },
        'toggleHotkeys' : {
            'screenDisplay': 'hotkeys',
        },
        'left' : {
            'screenDisplay': '&#x2190;',
            'hotkey': 'left arrow',
        },
        'right' : {
            'screenDisplay': '&#x2192;',
            'hotkey': 'right arrow',
        },
        'home' : {
            'screenDisplay': '&#x21e4;',
            'hotkey': 'home',
        },
        'end' : {
            'screenDisplay': '&#x21e5;',
            'hotkey': 'end',
        },
        'deleteLeft' : {
            'screenDisplay': '&#x232b;',
            'hotkey': 'backspace',
        },
        'deleteRight' : {
            'screenDisplay': '&#x2326;',
            'hotkey': 'delete',
        },
        'crossOut' : {
            'screenDisplay': '&#x2192;&nbsp;<del>XXX</del></button>',
            'hotkey': '\\',
        },
        'deleteCrossed' : {
            'screenDisplay': '&#x2326&nbsp;<del>XXX</del></button>',
            'hotkey': '|',
        },
        'paste' : {
            'screenDisplay': 'paste',
        },
        'undo' : {
            'screenDisplay': 'undo',
        },
        'skipBack' : {
            'screenDisplay': '&#x1f854;',
            'hotkey': 'up arrow',
        },
        'skipForward' : {
            'screenDisplay': '&#x1f856;',
            'hotkey': 'down arrow',
        },
        'upline' : {
            'screenDisplay': '&#x2b06;',
            'hotkey': 'page up',
        },
        'downline' : {
            'screenDisplay': '&#x2b07;',
            'hotkey': 'page down',
        },
        'enter' : {
            'screenDisplay': '&lt;enter&gt;',
            'hotkey': 'enter',
        },
    };
}

