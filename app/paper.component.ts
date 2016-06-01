import { Component, OnInit, SimpleChange, ViewChild, ViewChildren, Input } from '@angular/core';
import { MathJaxDirective } from './mathjax.directive';
import {NgGrid, NgGridItem} from 'angular2-grid';
import { JkOperatorButtonComponent } from './jkoperator.component';
import { JkControlButtonComponent } from './jkcontrol.component';

declare var MathJax: any;

@Component({
  selector: 'my-paper',
  templateUrl: 'app/paper.component.html',
  styleUrls: ['app/paper.component.css', 'node_modules/angular2-grid/dist/NgGrid.css'],
  directives: [  MathJaxDirective, JkOperatorButtonComponent , JkControlButtonComponent, NgGrid, NgGridItem ],
  styles: [`
  `]
})
export class PaperComponent {
    @ViewChildren(JkOperatorButtonComponent) operatorButtons;
    @ViewChildren(JkControlButtonComponent) controlButtons;

    linesPerCol = 5;

    caretSymbol = "\u2336";
    mathjaxMarker = 'color{red}{ !! }';
    markerLength = this.mathjaxMarker.length;

    rawStructure = [];
    markerVisibility = [];
    undoBuffer = [];

    keystrokeTranslate = true;
    markStartPos = 0;
    markEndPos = 0;
    mathjaxInputStrings = [];
    lineIndex = 0;
    chosen = '';
    knownTokens = [];
    tokens = [];

    keyCodeTrans = {
        8: { 'lower': 'backspace' , 'upper': '' },
        9: { 'lower': 'tab' , 'upper': '' },
        13: { 'lower': 'enter' , 'upper': '' },
        16: { 'lower': 'shift' , 'upper': '' },
        17: { 'lower': 'ctrl' , 'upper': '' },
        18: { 'lower': 'alt' , 'upper': '' },
        19: { 'lower': 'pause/break' , 'upper': '' },
        20: { 'lower': 'caps lock' , 'upper': '' },
        27: { 'lower': 'escape' , 'upper': '' },
        32: { 'lower': ' ' , 'upper': ' ' },
        33: { 'lower': 'page up' , 'upper': '' },
        34: { 'lower': 'page down' , 'upper': '' },
        35: { 'lower': 'end' , 'upper': '' },
        36: { 'lower': 'home' , 'upper': '' },
        37: { 'lower': 'left arrow' , 'upper': '' },
        38: { 'lower': 'up arrow' , 'upper': '' },
        39: { 'lower': 'right arrow' , 'upper': '' },
        40: { 'lower': 'down arrow' , 'upper': '' },
        45: { 'lower': 'insert' , 'upper': '' },
        46: { 'lower': 'delete' , 'upper': '' },
        48: { 'lower': '0' , 'upper': ')' },
        49: { 'lower': '1' , 'upper': '!' },
        50: { 'lower': '2' , 'upper': '@' },
        51: { 'lower': '3' , 'upper': '#' },
        52: { 'lower': '4' , 'upper': '$' },
        53: { 'lower': '5' , 'upper': '%' },
        54: { 'lower': '6' , 'upper': '^' },
        55: { 'lower': '7' , 'upper': '&' },
        56: { 'lower': '8' , 'upper': '*' },
        57: { 'lower': '9' , 'upper': '(' },
        65: { 'lower': 'a' , 'upper': 'A' },
        66: { 'lower': 'b' , 'upper': 'B' },
        67: { 'lower': 'c' , 'upper': 'C' },
        68: { 'lower': 'd' , 'upper': 'D' },
        69: { 'lower': 'e' , 'upper': 'E' },
        70: { 'lower': 'f' , 'upper': 'F' },
        71: { 'lower': 'g' , 'upper': 'G' },
        72: { 'lower': 'h' , 'upper': 'H' },
        73: { 'lower': 'i' , 'upper': 'I' },
        74: { 'lower': 'j' , 'upper': 'J' },
        75: { 'lower': 'k' , 'upper': 'K' },
        76: { 'lower': 'l' , 'upper': 'L' },
        77: { 'lower': 'm' , 'upper': 'M' },
        78: { 'lower': 'n' , 'upper': 'N' },
        79: { 'lower': 'o' , 'upper': 'O' },
        80: { 'lower': 'p' , 'upper': 'P' },
        81: { 'lower': 'q' , 'upper': 'Q' },
        82: { 'lower': 'r' , 'upper': 'R' },
        83: { 'lower': 's' , 'upper': 'S' },
        84: { 'lower': 't' , 'upper': 'T' },
        85: { 'lower': 'u' , 'upper': 'U' },
        86: { 'lower': 'v' , 'upper': 'V' },
        87: { 'lower': 'w' , 'upper': 'W' },
        88: { 'lower': 'x' , 'upper': 'X' },
        89: { 'lower': 'y' , 'upper': 'Y' },
        90: { 'lower': 'z' , 'upper': 'Z' },
        91: { 'lower': 'left window key' , 'upper': '' },
        92: { 'lower': 'right window key' , 'upper': '' },
        93: { 'lower': 'select key' , 'upper': '' },
        96: { 'lower': 'numpad 0' , 'upper': '' },
        97: { 'lower': 'numpad 1' , 'upper': '' },
        98: { 'lower': 'numpad 2' , 'upper': '' },
        99: { 'lower': 'numpad 3' , 'upper': '' },
        100: { 'lower': 'numpad 4' , 'upper': '' },
        101: { 'lower': 'numpad 5' , 'upper': '' },
        102: { 'lower': 'numpad 6' , 'upper': '' },
        103: { 'lower': 'numpad 7' , 'upper': '' },
        104: { 'lower': 'numpad 8' , 'upper': '' },
        105: { 'lower': 'numpad 9' , 'upper': '' },
        106: { 'lower': 'multiply' , 'upper': '' },
        107: { 'lower': 'add' , 'upper': '' },
        109: { 'lower': 'subtract' , 'upper': '' },
        110: { 'lower': 'decimal point' , 'upper': '' },
        111: { 'lower': 'divide' , 'upper': '' },
        112: { 'lower': 'f1' , 'upper': '' },
        113: { 'lower': 'f2' , 'upper': '' },
        114: { 'lower': 'f3' , 'upper': '' },
        115: { 'lower': 'f4' , 'upper': '' },
        116: { 'lower': 'f5' , 'upper': '' },
        117: { 'lower': 'f6' , 'upper': '' },
        118: { 'lower': 'f7' , 'upper': '' },
        119: { 'lower': 'f8' , 'upper': '' },
        120: { 'lower': 'f9' , 'upper': '' },
        121: { 'lower': 'f10' , 'upper': '' },
        122: { 'lower': 'f11' , 'upper': '' },
        123: { 'lower': 'f12' , 'upper': '' },
        144: { 'lower': 'num lock' , 'upper': '' },
        145: { 'lower': 'scroll lock' , 'upper': '' },
        186: { 'lower': ';' , 'upper': ':' },
        187: { 'lower': '=' , 'upper': '+' },
        188: { 'lower': ',' , 'upper': '<' },
        189: { 'lower': '-' , 'upper': '_' },
        190: { 'lower': '.' , 'upper': '>' },
        191: { 'lower': '/' , 'upper': '?' },
        192: { 'lower': '`' , 'upper': '~' },
        219: { 'lower': '[' , 'upper': '{' },
        220: { 'lower': '\\' , 'upper': '|' },
        221: { 'lower': ']' , 'upper': '}' },
        222: { 'lower': "'" , 'upper': '"' },
    }

    addCursorToString() {
        var st = '';
        var crossed = [];
        var prevCancel = false;
        var markerAdded = false;
        for (var i = 0; i < this.rawStructure[this.lineIndex].length; i++) {
            if (this.markerVisibility[this.lineIndex] && i == this.markStartPos) {
                markerAdded = true;
                st += this.mathjaxMarker; 
            }

            var item = this.rawStructure[this.lineIndex][i];
            if (item.token != 'cancel') {
                if (prevCancel) {
                    st += '}';
                    prevCancel = false;
                }
                st += item.term;
            } else {
                if (! prevCancel) {
                    st += 'cancel{';
                    prevCancel = true;
                    crossed = [];
                }
                st += item.term;
                crossed.push(item.term);
            }

        }
        if (! markerAdded && this.markerVisibility[this.lineIndex]) {
                st += this.mathjaxMarker; 
        }
        // distinguish if cursor is just before the '^' of a power expression
        // as the '^' will be invisible
        st = st.replace(/\^color{red}/, '^color{green}');

        /*st = st.replace(/#+([\/\+\*-\^])/, "$1");
        st = st.replace(/([\/\+\*-\^])#+/, "$1");*/

        // merge consecutive crossouts into one crossout
        if (crossed.length > 0) {
                this.chosen = crossed.join('');
                this.chosen = this.chosen.replace(/cancel{(.*)}/, "$1");
        }

        this.mathjaxInputStrings[this.lineIndex] = st;
    }


    addSymbol(sym) {
        this.saveUndo();
        var st = '';
        var symbolAdded = false;
        if (this.rawStructure[this.lineIndex].length == 0) {
            st = sym;
        }
        else {
            var prevCancel = false;
            for (var i = 0; i < this.rawStructure[this.lineIndex].length; i++) {
                var item = this.rawStructure[this.lineIndex][i];
                if (i == this.markStartPos) {
                    st += sym;
                    symbolAdded = true;
                }

                if (item.token != 'cancel') {
                    if (prevCancel) {
                        st += '}';
                        prevCancel = false;
                    }
                    st += item.term;
                } else {
                    if (! prevCancel) {
                        st += 'cancel{';
                        prevCancel = true;
                    }
                    st += item.term;
                }
            }
            if (! symbolAdded) {
                st = st.replace(/\s$/g, '');
                st += sym + ' ';
            }
        }
        this.markMove(1);
        this.tokenise(st);
        };

    clear() {
        this.saveUndo();
        var isClear = this.lineIsEmpty();
        
        this.rawStructure[this.lineIndex] = [];
        this.mathjaxInputStrings[this.lineIndex] = '';
        if ((this.lineIndex > 0) && isClear) {
            this.mathjaxInputStrings.pop();
            this.lineIndex--;
        }
        this.reparse();
        this.cursorToEnd();
    };

    crossout() {
        this.saveUndo();
        var start = this.markStartPos;
        if (start < this.rawStructure[this.lineIndex].length) {
            var tokenToCross =  this.rawStructure[this.lineIndex][start];
            if (tokenToCross.token != 'whitespace') {

                if (this.rawStructure[this.lineIndex][start].token != 'cancel') {
                    this.rawStructure[this.lineIndex][start].token = 'cancel';
                } else {
                    var term = this.rawStructure[this.lineIndex][start].term;
                    var uncrossed = this.parseInput(term);
                    this.rawStructure[this.lineIndex][start].token = uncrossed[0].token;
                }

                this.markMove(1);
                this.addCursorToString();    
            }
        }
    };


    crossoutCount() {
        var c = 0;
        for (var i = 0; i < this.rawStructure[this.lineIndex].length; i++)
        {
            var item = this.rawStructure[this.lineIndex][i];
            if (item.token == 'cancel') {
                c++;
            }
        }
        return c;
    }

    cursorToEnd() {
        this.markMove(1000);
    }

    cursorToStart() {
        this.markMove(-1000);
    }

    enter() {
        this.setMarkerVisibility(false);
        var st = this.unparseStructure();
        this.lineIndex += 1;
        if (this.lineIndex >= this.rawStructure.length) {
            this.mathjaxInputStrings.push('');
            this.rawStructure.push([]);
        }
        this.tokenise(st);
        this.cursorToEnd();
    }

    keyInput(ev) {
        var key = this.keyCodeTrans[ev.which];
        if (key.lower.match(/shift|alt|ctrl/)) {
            return false;
        }
        var ch = key.lower;
        if (ev.shiftKey && key.upper != '') {
            ch = key.upper;
        }
        console.log(ev, ch);
        var buttons = this.operatorButtons.toArray();
        for (var i = 0; i < buttons.length; i++) {
            if (buttons[i].hotkey(ch)) {
                ev.stopPropagation();
                return;
            }
        }
        var controls = this.controlButtons.toArray();
        for (var i = 0; i < controls.length; i++) {
            if (controls[i].hotkey(ch)) {
                ev.stopPropagation();
                return;
            }
        }
        if (key.upper != '') {
            this.addSymbol(ch);
        }
    }

    lineIsEmpty() {
        var st = this.unparseStructure();
        st = st.replace(/\s/g, '');
        return (st.length == 0);
    }

    markMove(amount) {
        this.saveUndo();
        this.markStartPos += amount;
        
        if (this.markStartPos > this.rawStructure[this.lineIndex].length)
        {
            this.markStartPos = this.rawStructure[this.lineIndex].length;
        }
        if (this.markStartPos < 0)
        {
            this.markStartPos = 0;
        }
        this.markEndPos = this.markStartPos;

        this.addCursorToString();
        return;
    }


    ngAfterViewInit() {
    }

    ngOnInit() {
            // define extra chars here??
            var am = MathJax.Hub.inputJax['math/asciimath'].AM;
            am.define("!!",this.caretSymbol);
            am.define("#","\u2007");
            MathJax.Hub.Queue(["Typeset",MathJax.Hub,"myMathJax"]);
            this.rawStructure = [];
            this.tokenise('');

    }

    paste() {
        this.saveUndo();
        this.addSymbol(this.chosen);
    }

    parseInput(st) {
        var state = 'unknown';

        var rawStructure = [];
        if (st) {
            for (var i = 0; i < st.length; i++)
            {
                var start = i;
                var ch = st[i];
                var lookAhead = st.substring(i);

                if (ch == ' ') {
                    state = 'whitespace';
                } else if (ch == '#') {
                    state = 'space';
                } else if (ch == '=') {
                    state = 'equals';
                } else if (ch.match(/[0-9]/)) {
                    state = 'digit';
                } else if (ch == '.') {
                    state = 'point';
                } else if (ch.match(/[-\*\+\/)\^]/)) {
                    state = 'operator';
                } else if (lookAhead.match(/^xx/)) {
                    state = 'operator';
                    i += 1;
                } else if (lookAhead.match(/^\*\*\*/)) {
                    state = 'star';
                    i += 3;
                } else if (ch.match(/\(/)) {
                    state = 'openBracket';
                } else if (ch.match(/\)/)) {
                    state = 'closeBracket';
                } else if (ch.match(/{/)) {
                    state = 'openCurly';
                } else if (ch.match(/}/)) {
                    state = 'closeCurly';
                } else if (lookAhead.match(/^sqrt/)) {
                    state = 'function';
                    i += 3;
                } else if (lookAhead.match(/^square/)) {
                    state = 'square';
                    i += 5;
                } else if (lookAhead.match(/^diamond/)) {
                    state = 'diamond';
                    i += 6;
                } else if (lookAhead.match(/^cancel{/)) {
                    state = 'cancel';
                    while (ch != '}')
                        ch = st[++i];
                } else if (ch == '#') {
                    state = 'whitespace';
                } else if (ch.match(/[a-z]/)) {
                    state = 'variable';
                } else if (lookAhead.match(/^cancel{/)) {
                    state = 'cancel';
                    while (ch != '}')
                        ch = st[++i];
                } else {
                    state = 'unknown';
                }
                var end = i+1;
                var term = st.substring(start, end);
                if (end >= st.length) {
                    term = st.substring(start);
                }
                term = term.replace(/cancel{(.*)}/, "$1", 'g');

                rawStructure.push({
                    'token': state,
                    'term': term,
                    'start': start,
                    'length': term.length
                });
            }
        }
        return rawStructure;
    }

    remove() {
        this.saveUndo();
        var start = this.markStartPos;
        if (start > 0)
        {
            this.rawStructure[this.lineIndex].splice(start-1, 1);
            this.markMove(-1);
            this.reparse();
        }
        if (this.lineIsEmpty())
        {
            this.clear();
        }
    }

    removeNext() {
        this.saveUndo();
        var start = this.markStartPos+1;
        if (start > 0)
        {
            this.rawStructure[this.lineIndex].splice(start-1, 1);
            //this.markMove(-1);
            this.reparse();
        }
    }

    reparse() {
        var st = this.unparseStructure();
        this.tokenise(st);
    }
    removeCrossout() {
        var st = this.unparseStructure();
        st = st.replace(/cancel{.*?}/g, '');
        this.tokenise(st);
    };

    saveUndo() {
        var undoRec = {
            'lineIndex' : this.lineIndex,
            'markStartPos' : this.markStartPos,
            'markEndPos' : this.markEndPos,
            'rawStructure' : this.rawStructure.slice(0),
            'mathjaxInputStrings' : this.mathjaxInputStrings.slice(0)
        }
        this.undoBuffer.push(undoRec);
    }


    setLineClass(line) {
            var cl = 'column-' + Math.floor(line / this.linesPerCol);
            cl += ' row-' + (line % this.linesPerCol);
            if (line == this.lineIndex)
                cl += ' line-selected';
            return cl;
    }

    setMarkerVisibility(flag) {
        this.markerVisibility[this.lineIndex] = flag;
        this.addCursorToString();
    }


    stretchMarked(amount) {
        this.saveUndo();
        this.markEndPos += amount;
        if (this.markEndPos > this.rawStructure[this.lineIndex].length)
        {
            this.markEndPos = this.rawStructure[this.lineIndex].length-1;
        }

        var p = this.markEndPos;
        if (p < this.rawStructure[this.lineIndex].length-1)
        {
            var item = this.rawStructure[this.lineIndex][p];
            switch (item.token)
            {
                case 'whitespace':
                case 'cancel':
                case 'removed':
                case 'cancel':
                case 'openCurly':
                case 'openBracket':
                case 'closeCurly':
                case 'closeBracket':
                case 'function':
                case 'operator':
                    this.stretchMarked(1);
                    break;
                case 'equals':
                    this.stretchMarked(-1);
                    break;
            }
        }
        this.addCursorToString();
        return;
    }

    toggleHotkeys() {
        this.keystrokeTranslate = ! this.keystrokeTranslate;
        var buttons = this.operatorButtons.toArray();
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].setEnableHotkey(this.keystrokeTranslate);
        }
    }

    tokensAdd(term, position, tokens) {
        if (this.knownTokens[position + '::' + term] == undefined)
        {
            tokens.push({
                'term': term,
                'position': position
            });
            this.knownTokens[position + '::' + term] = true;
        }
    }

    tokenise(st) {   
        if (! st) {
            st = ' ';
        }
        if (! st.match(/\s$/)) {
            st += ' ';
        }
        this.rawStructure[this.lineIndex] = this.parseInput(st);
        MathJax.Hub.Queue(["Typeset",MathJax.Hub,"ul"]);
        if (this.markerVisibility[this.lineIndex] == undefined) {
            this.markerVisibility[this.lineIndex] = true;
        }
        this.addCursorToString();
    }


    undo() {
        var state = this.undoBuffer.pop();
        if (state) {
            this.lineIndex = state.lineIndex;
            this.rawStructure = state.rawStructure;
            this.markStartPos = state.markStartPos;
            this.markEndPos = state.markEndPos;
            this.mathjaxInputStrings = state.mathjaxInputStrings;
            this.reparse();
        }
    }

    unparseStructure(): string {
        var st = '';
        for (var i = 0; i < this.rawStructure[this.lineIndex].length; i++)
        {
            var item = this.rawStructure[this.lineIndex][i];
            if (item.token == 'cancel') {
                st += 'cancel{' + item.term + '}';
            } else {
                st += item.term;
            }
        }
        st = st.replace(/^\s+|\s+$/g,'');
        st = st.replace(/}cancel{/g,'');
        return st;        
    }

    vertical(amount) {
        this.setMarkerVisibility(false);
        this.lineIndex += amount;
        if (this.lineIndex < 0)
            this.lineIndex = 0;
        if (this.lineIndex >= this.rawStructure.length -1)
            this.lineIndex = this.rawStructure.length -1;

        this.cursorToEnd();
        this.reparse();
        this.setMarkerVisibility(true);
    }

}
