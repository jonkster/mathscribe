import { Component, Input, Output, EventEmitter } from '@angular/core';
@Component({
  selector: 'jk-operator-button',
  template: `
    <button class="jk-operator-button"
        [disabled]="disabled"
        (click)="addSymbol(operator)"
        >
        <span class="jk-display-symbol" [innerHTML]="operators[operator].screenDisplay">
        </span>
        <span *ngIf="allowHotkeys && hotkeyEnabled" class="jk-hotkey">
            {{myOperator.hotkeys[0]}}
        </span>
    </button>
  `,
  styles: [`
    .jk-operator-button {
        margin: 1.2em;
        font-size: 1.2em;
        padding: 1.5em;
        border: 3px solid blue;
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
    button:disabled {
        border: none;
    }
  `]
})
export class JkOperatorButtonComponent {
    @Input() operator : string;
    @Input() allowHotkeys : boolean = false;
    @Input() hotkeyEnabled : boolean = false;
    @Output() notify:EventEmitter<string> = new EventEmitter<string>();

    myOperator = undefined;



    ngAfterViewInit() {
    }
    ngOnInit() {
        if (this.allowHotkeys) {
            this.hotkeyEnabled = true;
        }
        this.myOperator = this.operators[this.operator];
    }

    addSymbol(op) {
        this.notify.emit(this.myOperator.mathjaxString);
    }

    setEnableHotkey(flag) {
        this.hotkeyEnabled = flag;
    }

    hotkey(ch) {
        if (this.hotkeyEnabled) {
            for (var i = 0; i < this.myOperator.hotkeys.length; i++) {
                if (ch == this.myOperator.hotkeys[i]) {
                    this.addSymbol(ch);
                    return true;
                }
            }
        }
        if (ch == this.myOperator.unhotkey) {
            this.addSymbol(ch);
            return true;
        }
        return false;
    }

    operators = {
        'addition' : {
            'screenDisplay': '+',
            'mathjaxString': '+',
            'allowHotkey': true,
            'unhotkey': '+',
            'hotkeys': [ 'p' ]
        },
        'subtraction' : {
            'screenDisplay': '-',
            'mathjaxString': '-',
            'allowHotkey': true,
            'unhotkey': '-',
            'hotkeys': [ 'm' ]
        },
        'multiplication' : {
            'screenDisplay': 'X',
            'mathjaxString': 'xx',
            'allowHotkey': true,
            'unhotkey': '*',
            'hotkeys': [ 't' ]
        },
        'division' : {
            'screenDisplay': '/',
            'mathjaxString': '/',
            'allowHotkey': true,
            'unhotkey': '/',
            'hotkeys': [ 'd' ]
        },
        'equals' : {
            'screenDisplay': '=',
            'mathjaxString': '=',
            'allowHotkey': true,
            'unhotkey': '=',
            'hotkeys': [ 'e' ]
        },
        'openBracket' : {
            'screenDisplay': '(',
            'mathjaxString': '(',
            'allowHotkey': true,
            'unhotkey': '(',
            'hotkeys': [ 'o' ]
        },
        'closeBracket' : {
            'screenDisplay': ')',
            'mathjaxString': ')',
            'allowHotkey': true,
            'unhotkey': ')',
            'hotkeys': [ 'c' ]
        },
        'power' : {
            'screenDisplay': 'y&#x02e3',
            'mathjaxString': '^',
            'allowHotkey': true,
            'unhotkey': '^',
            'hotkeys': [ 'u' ]
        },
        'root' : {
            'screenDisplay': '&#x221a',
            'mathjaxString': 'sqrt',
            'allowHotkey': true,
            'unhotkey': '',
            'hotkeys': [ 'r' ]
        },
        'space' : {
            'screenDisplay': '&lt;space&gt;',
            'mathjaxString': '#',
            'unhotkey': ' ',
            'hotkeys': [ ' ' ]
        },
        'x' : {
            'screenDisplay': '𝑥',
            'mathjaxString': 'x',
            'allowHotkey': true,
            'unhotkey': 'x',
            'hotkeys': [ 'x' ]
        },
        'y' : {
            'screenDisplay': '𝑦',
            'mathjaxString': 'y',
            'allowHotkey': true,
            'unhotkey': 'y',
            'hotkeys': [ 'y' ]
        },
        'point' : {
            'screenDisplay': '.',
            'mathjaxString': '.',
            'allowHotkey': false,
            'unhotkey': '.',
            'hotkeys': [ '.' ]
        },
        '0' : {
            'screenDisplay': '0',
            'mathjaxString': '0',
            'allowHotkey': false,
            'unhotkey': '0',
            'hotkeys': [ '0' ]
        },
        '1' : {
            'screenDisplay': '1',
            'mathjaxString': '1',
            'allowHotkey': false,
            'unhotkey': '1',
            'hotkeys': [ '1' ]
        },
        '2' : {
            'screenDisplay': '2',
            'mathjaxString': '2',
            'allowHotkey': false,
            'unhotkey': '2',
            'hotkeys': [ '2' ]
        },
        '3' : {
            'screenDisplay': '3',
            'mathjaxString': '3',
            'allowHotkey': false,
            'unhotkey': '3',
            'hotkeys': [ '3' ]
        },
        '4' : {
            'screenDisplay': '4',
            'mathjaxString': '4',
            'allowHotkey': false,
            'unhotkey': '4',
            'hotkeys': [ '4' ]
        },
        '5' : {
            'screenDisplay': '5',
            'mathjaxString': '5',
            'allowHotkey': false,
            'unhotkey': '5',
            'hotkeys': [ '5' ]
        },
        '6' : {
            'screenDisplay': '6',
            'mathjaxString': '6',
            'allowHotkey': false,
            'unhotkey': '6',
            'hotkeys': [ '6' ]
        },
        '7' : {
            'screenDisplay': '7',
            'mathjaxString': '7',
            'allowHotkey': false,
            'unhotkey': '7',
            'hotkeys': [ '7' ]
        },
        '8' : {
            'screenDisplay': '8',
            'mathjaxString': '8',
            'allowHotkey': false,
            'unhotkey': '8',
            'hotkeys': [ '8' ]
        },
        '9' : {
            'screenDisplay': '9',
            'mathjaxString': '9',
            'allowHotkey': false,
            'unhotkey': '9',
            'hotkeys': [ '9' ]
        },
    };
}
