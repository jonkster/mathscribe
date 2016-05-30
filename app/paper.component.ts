import { Component, OnInit, SimpleChange, ViewChild, Input } from '@angular/core';
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
    @ViewChild(MathJaxDirective) mathjDirective: MathJaxDirective;
    @ViewChild('mainFocus') mainFocus;

    keyMapSimple = {
        32: '#',  
        67: ')',
        //68: '/',
        //69: '=',
        //77: '-',
        79: '(',
        80: '+',
        82: 'sqrt',
        84: 'xx',
        85: '^',
        88: 'x',
        89: 'y',
        90: 'z',
        187: '=',
        189: '-',
        191: '/',
    };
    simpleKeyMaps = Object.keys(this.keyMapSimple);

    keyMapShifted = {
        48: ')',
        49: '!',
        50: '@',
        51: '#',
        52: '$',
        53: '%',
        54: '^',
        55: '&',
        56: '*',
        57: '(',
        187: '+',
        188: '<',
        189: '_',
        190: '>',
    };

    keyMapSpecial = {
        8: function(obj) { obj.remove(); },
        13: function(obj) { obj.enter(); },
        35: function(obj) { obj.markMove(1000); },
        36: function(obj) { obj.markMove(-1000); },
        37: function(obj) { obj.markMove(-1); },
        38: function(obj) { obj.vertical(-1); },
        39: function(obj) { obj.markMove(1); },
        40: function(obj) { obj.vertical(1); },
        46: function(obj) { obj.removeNext(); },
        220: function(obj) { obj.crossout(); },
    };

    keyCodeToKey(code) {
        var key = String.fromCharCode(code);
        key = key.replace(/ /, '[space]');
        key = key.replace(/»/, '=');
        key = key.replace(/½/, '-');
        key = key.replace(/¿/, '/');
        return key;
    }

    keyCodeToSymbol(code) {
        var symbol = this.keyMapSimple[code];
        symbol = symbol.replace(/#/, 'space');
        symbol = symbol.replace(/xx/, 'X');
        symbol = symbol.replace(/x/, '𝑥');
        symbol = symbol.replace(/y/, '𝑦');
        symbol = symbol.replace(/sqrt/, '&#x221a;');
        symbol = symbol.replace(/\^/, 'y&#x02e3;');
        return symbol;
    }

    //caretSymbol = "\u237f";
    caretSymbol = "\u2336";
    mathjaxMarker = 'color{red}{ !! }';
    markerLength = this.mathjaxMarker.length;

    rawStructure = [];
    markerVisibility = [];
    undoBuffer = [];

    keystrokeTranslate = true;
    markStartPos = 0;
    markEndPos = 0;
    markedStrings = [];
    lineIndex = 0;
    chosen = '';
    knownTokens = [];
    tokens = [];

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
                this.addMarker();    
            }
        }
    };

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
        var clear = this.isLineClear();
        this.handwritingDirective.clear();
        this.rawStructure[this.lineIndex] = [];
        this.markedStrings[this.lineIndex] = '';
        if ((this.lineIndex > 0) && clear) {
            this.markedStrings.pop();
            this.lineIndex--;
            this.reparse();
        }
        this.mainFocus.nativeElement.focus();
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

    /*correct(x) { this.handwritingDirective.clear(); this.rawStrings[this.lineIndex] = this.rawStrings[this.lineIndex].slice(0, -1);  };*/

    cursorToEnd() {
        this.markMove(1000);
    }

    enter() {
        this.setMarkerVisibility(false);
        var st = this.unparseStructure();
        this.lineIndex += 1;
        if (this.lineIndex >= this.rawStructure.length) {
            this.markedStrings.push('');
            this.rawStructure.push([]);
        }
        this.tokenise(st);
        this.cursorToEnd();
        this.mainFocus.nativeElement.focus();
    }

    isLineClear() {
        var st = this.unparseStructure();
        return st == '';    
    }

    keyInput(ev) {
        var start = this.mainFocus.nativeElement.selectionStart;
        var end =  this.mainFocus.nativeElement.selectionStart;
        var value = this.mainFocus.nativeElement.value;
        var ch = String.fromCharCode(ev.keyCode);
        console.log(this.mainFocus.value, ev, 'pushed!', ch);
	if (this.keystrokeTranslate) {
            if (this.keyMapSpecial[ev.keyCode]) {
                this.keyMapSpecial[ev.keyCode](this);
                ch = '';
            }
            else {
                if (ev.shiftKey && this.keyMapShifted[ev.keyCode]) {
                    ch = this.keyMapShifted[ev.keyCode];
                } else if (this.keyMapSimple[ev.keyCode]) {
                    ch = this.keyMapSimple[ev.keyCode];
                }
            }
        }
        if (ch != '') {
            this.addSymbol(ch);
        }
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

    setLineClass(line) {
            var cl = 'column-' + Math.floor(line / 4);
            cl += ' row-' + (line % 4);
            if (line == this.lineIndex)
                cl += ' line-selected';
            return cl;
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

    addMarker() {
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
        st = st.replace(/\^color{red}/, '^color{green}');
        st = st.replace(/#+([\/\+\*-\^])/, "$1");
        st = st.replace(/([\/\+\*-\^])#+/, "$1");
        if (crossed.length > 0) {
                this.chosen = crossed.join('');
                this.chosen = this.chosen.replace(/cancel{(.*)}/, "$1");
        }

        this.markedStrings[this.lineIndex] = st;
        if (this.mainFocus != undefined)
            this.mainFocus.nativeElement.focus();
    }

    setMarkerVisibility(flag) {
        this.markerVisibility[this.lineIndex] = flag;
        this.addMarker();
    }

    ngAfterViewInit() {
        this.mainFocus.nativeElement.focus();
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
        this.mainFocus.nativeElement.focus();
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

        /*var p = this.markStartPos;
        
        if (p < this.rawStructure[this.lineIndex].length-1)
        {
            // skip any non selectable bits
            var dir = 1;
            if (amount < 0)
                dir = -1;
            var item = this.rawStructure[this.lineIndex][p];
            switch (item.token)
            {
                case 'whitespace':
                //case 'cancel':
                //case 'removed':
                case 'openCurly':
                case 'closeCurly':
                    this.markMove(dir);
                    break;
            }
        }*/

        this.addMarker();
        return;
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
                } else if (ch.match(/[a-z]/)) {
                    state = 'variable';
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
            'markedStrings' : this.markedStrings.slice(0)
        }
        this.undoBuffer.push(undoRec);
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
        this.addMarker();
        return;
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
        this.addMarker();
    }


    undo() {
        var state = this.undoBuffer.pop();
        if (state) {
            this.lineIndex = state.lineIndex;
            this.rawStructure = state.rawStructure;
            this.markStartPos = state.markStartPos;
            this.markEndPos = state.markEndPos;
            this.markedStrings = state.markedStrings;
            this.reparse();
        }
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
