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

    //caretSymbol = "\u237f";
    caretSymbol = "\u2223";
    mathjaxMarker = 'color{red}{ !! }';
    markerIsMacro = false; // if true it will attempt to close {} after marker
    markerLength = this.mathjaxMarker.length;

    rawStructure = [];
    //rawStrings = ['x/22=3sqrt3 xx 2.2^6 - (3 xx y)'];
    rawStrings = [];
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
        var end = this.markEndPos;
        for (var i = start; i < end+1; i++)
        {
            if (this.rawStructure[this.lineIndex][i])
                this.rawStructure[this.lineIndex][i].token = 'untouchable';
        }

        var termStart = this.rawStructure[this.lineIndex][start].term;
        if (! termStart.match(/cancel{/))
        {
            this.rawStructure[this.lineIndex][start].term = 'cancel{' + termStart;
            this.rawStructure[this.lineIndex][start].token = 'cancel';
        }

        var termEnd = this.rawStructure[this.lineIndex][end].term;
        if (! termEnd.match(/}/))
            this.rawStructure[this.lineIndex][end].term += '}';

        this.markMove(1);
        this.addMarker();    
    };

    addSymbol(sym) {
        this.saveUndo();
        var st = '';
        var old = true;
        if (old) {
            if (this.rawStructure[this.lineIndex].length == 0) {
                st = sym;
            }
            else {
                for (var i = 0; i < this.rawStructure[this.lineIndex].length; i++) {
                    var item = this.rawStructure[this.lineIndex][i];
                    if (item.token != 'removed') {
                        if (i == this.markStartPos) {
                            st += sym
                        }
                        st += item.term;
                    }
                }
            }
            //this.rawStrings[this.lineIndex] = st;
            this.markMove(1);
            this.tokenise(st);
            //this.addMarker();    
        } else {
        }
    };

    clear() {
        this.saveUndo();
        var alreadyClear = (this.rawStrings[this.lineIndex] == '');
        this.handwritingDirective.clear();
        this.rawStructure[this.lineIndex] = [];
        this.rawStrings[this.lineIndex] = '';
        this.markedStrings[this.lineIndex] = '';
        if ((this.lineIndex > 0) && alreadyClear) {
            this.rawStrings.pop();
            this.markedStrings.pop();
            this.lineIndex--;
            this.tokenise(this.rawStrings[this.lineIndex]);
            //this.addMarker();    
        }
        this.mainFocus.nativeElement.focus();
    };

    correct(x) { this.handwritingDirective.clear(); this.rawStrings[this.lineIndex] = this.rawStrings[this.lineIndex].slice(0, -1);  };

    cursorToEnd() {
        if (this.rawStructure[this.lineIndex].length > 0)
            this.markStartPos = this.rawStructure[this.lineIndex].length-1;
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

    keyInput(ev) {
        console.log(this.mainFocus.value, ev);
        var start = this.mainFocus.nativeElement.selectionStart;
        var end =  this.mainFocus.nativeElement.selectionStart;
        var value = this.mainFocus.nativeElement.value;
        console.log(start, end, value);
        var ch = String.fromCharCode(ev.keyCode);
        console.log('pushed!', ch);
	if (this.keystrokeTranslate) {
	    switch(ev.keyCode) {
		case 88: 
		    ch = 'x';  
		    break;
		case 89: 
		    ch = 'y';  
		    break;
		case 90: 
		    ch = 'y';  
		    break;
		case 80: 
		    ch = '+';  
		    break;
		case 189:
		case 77:
		    ch = '-';  
		    break;
		case 84:
		    ch = 'xx';  
		    break;
		case 191:
		case 68:
		    ch = '/';  
		    break;
		case 187:
		case 69:
		    ch = '=';  
		    break;
		case 79:
		    ch = '(';  
		    break;
		case 67:
		    ch = ')';  
		    break;
		case 85:
		    ch = '^';  
		    break;
		case 82:
		    ch = 'sqrt';  
		    break;
		case 13:
		    this.enter();
                    return;
                    break;
		case 35:
		    this.markMove(1000);
                    return;
		case 36:
		    this.markMove(-1000);
                    return;
		case 37:
		    this.markMove(-1);
                    return;
                    break;
		case 38:
		    this.vertical(-1);
                    return;
                    break;
		case 39:
		    this.markMove(1);
                    return;
                    break;
		case 40:
		    this.vertical(1);
                    return;
                    break;
		case 8:
		    this.remove();
                    return;
                    break;
                default:    
                    if (event.shiftKey) {
                        switch(ev.keyCode) {
                            case 48:
                                ch = ')';
                                break;
                            case 49:
                                ch = '!';
                                break;
                            case 50:
                                ch = '@';
                                break;
                            case 51:
                                ch = '#';
                                break;
                            case 52:
                                ch = '$';
                                break;
                            case 53:
                                ch = '%';
                                break;
                            case 54:
                                ch = '^';
                                break;
                            case 55:
                                ch = '&';
                                break;
                            case 56:
                                ch = '*';
                                break;
                            case 57:
                                ch = '(';
                                break;
                            case 187:
                                ch = '+';
                                break;
                            case 188:
                                ch = '<';
                                break;
                            case 189:
                                ch = '_';
                                break;
                            case 190:
                                ch = '>';
                                break;
                            default:
		                break;
                        }
                    }
		    break;
	    }
	}
        this.addSymbol(ch);
    }

    newCopy() {
        var newSt = this.unparseStructure();
        this.setMarkerVisibility(false);
        this.rawStrings.push(newSt);
        this.lineIndex++;
        this.markStartPos = 0;
        this.markEndPos = 0;
        this.tokenise(this.rawStrings[this.lineIndex]);
        this.mainFocus.nativeElement.focus();
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

    unparseStructure() {
        var st = '';
        for (var i = 0; i < this.rawStructure[this.lineIndex].length; i++)
        {
            var item = this.rawStructure[this.lineIndex][i];
            if (item.token != 'removed')
                st += item.term;
        }
        return st;        
    }

    addMarker() {
        var st = '';
        for (var i = 0; i < this.rawStructure[this.lineIndex].length; i++) {
            if (this.markerVisibility[this.lineIndex] && i == this.markStartPos) {
                st += this.mathjaxMarker; 
                if (this.markerIsMacro) {
                    st += '{'; 
                }
            }

            var item = this.rawStructure[this.lineIndex][i];
            if (item.token != 'removed') {
                st += item.term;
            }

            if (this.markerIsMacro) {
                if (this.markerVisibility[this.lineIndex] && i == this.markEndPos) {
                    st += '}'; 
                }
            }
        }
        st = st.replace(/\^color{red}/, '^color{green}');

        // avoid breaking sqrt display if it is finished by selection curly
        // brace
        /*st = st.replace(/sqrt}/, 'sqrtrArr}');
        st = st.replace(/\(}/, 'rArr}');
        st = st.replace(/\)\}/, 'lArr}');*/
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

        var p = this.markStartPos;
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
                case 'untouchable':
                case 'removed':
                case 'openCurly':
                case 'closeCurly':
                    this.markMove(dir);
                    break;
            }
        }

        this.addMarker();
        return;
    }

    parseInput(st) {
        var state = 'unknown';

        var rawStructure = [];
        if (st) {
            for (var i = 0; i < st.length; i++)
            {
                var append = false;
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

                if (append) {
                    var p = rawStructure.length - 1;
                    rawStructure.term += term;
                    rawStructure.length += term.length;
                } else {
                    rawStructure.push({
                        'token': state,
                        'term': term,
                        'start': start,
                        'length': term.length
                    });
                }
            }
        }
        return rawStructure;
    }

    saveUndo() {
        var undoRec = {
            'lineIndex' : this.lineIndex,
            'markStartPos' : this.markStartPos,
            'markEndPos' : this.markEndPos,
            //'rawStrings' : this.rawStrings.slice(0),
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
                case 'untouchable':
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
            //this.rawStrings = state.rawStrings;
            this.rawStructure = state.rawStructure;
            this.markStartPos = state.markStartPos;
            this.markEndPos = state.markEndPos;
            this.markedStrings = state.markedStrings;
            this.reparse();
            //this.addMarker();    
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
