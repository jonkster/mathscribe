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

    mathjaxMarker = 'color{red}';
    markerLength = this.mathjaxMarker.length;

    rawStructure = [];
    rawStrings = ['x/22=3sqrt3 xx 2.2^6 - (3 xx y)'];
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
            if (this.rawStructure[i])
                this.rawStructure[i].token = 'untouchable';
        }

        var termStart = this.rawStructure[start].term;
        if (! termStart.match(/cancel{/))
        {
            this.rawStructure[start].term = 'cancel{' + termStart;
            this.rawStructure[start].token = 'cancel';
        }

        var termEnd = this.rawStructure[end].term;
        if (! termEnd.match(/}/))
            this.rawStructure[end].term += '}';

        this.markMove(1);
        this.addMarker();    
    };

    addSymbol(sym) {
        this.saveUndo();
        var st = '';
        if (this.rawStructure.length == 0) {
            st = sym;
        }
        else {
            for (var i = 0; i < this.rawStructure.length; i++) {
                var item = this.rawStructure[i];
                if (item.token != 'removed')
                    st += item.term;

                if (i == this.markEndPos) {
                    if (sym == 'xx')
                        st += ' ' + sym; 
                    else
                        st += sym
                }
            }
        }
        this.rawStrings[this.lineIndex] = st;
        this.tokenise(this.rawStrings[this.lineIndex]);
        this.markMove(1);
        this.addMarker();    
    };

    clear() {
        this.saveUndo();
        var alreadyClear = (this.rawStrings[this.lineIndex] == '');
        this.handwritingDirective.clear();
        this.rawStructure = [];
        this.rawStrings[this.lineIndex] = '';
        this.markedStrings[this.lineIndex] = '';
        if ((this.lineIndex > 0) && alreadyClear) {
            this.rawStrings.pop();
            this.markedStrings.pop();
            this.lineIndex--;
            this.tokenise(this.rawStrings[this.lineIndex]);
            this.addMarker();    
        }
        this.mainFocus.nativeElement.focus();
    };

    correct(x) { this.handwritingDirective.clear(); this.rawStrings[this.lineIndex] = this.rawStrings[this.lineIndex].slice(0, -1);  };


    enter() {
        this.setMarkerVisibility(false);
        this.lineIndex += 1;
        if (this.lineIndex >= this.rawStrings.length) {
            this.rawStrings.push('');
            this.markedStrings.push('');
        }
        this.tokenise(this.rawStrings[this.lineIndex]);
        this.mainFocus.nativeElement.focus();
    }

    keyInput(ev) {
        console.log(this.mainFocus.value, ev);
        var start = this.mainFocus.nativeElement.selectionStart;
        var end =  this.mainFocus.nativeElement.selectionStart;
        var value = this.mainFocus.nativeElement.value;
        console.log(start, end, value);
        console.log('pushed!', String.fromCharCode(ev.keyCode));
	if (this.translateKeys) {
	    switch(ev.keyCode) {
		case 80: 
		    value = value.substring(0, start-1) + '+' + value.substring(end);  
		    break;
		case 77:
		    value = value.substring(0, start-1) + '-' + value.substring(end);  
		    break;
		case 84:
		    value = value.substring(0, start-1) + ' xx ' + value.substring(end);  
		    break;
		case 68:
		    value = value.substring(0, start-1) + '/' + value.substring(end);  
		    break;
		case 69:
		    value = value.substring(0, start-1) + '=' + value.substring(end);  
		    break;
		case 79:
		    value = value.substring(0, start-1) + '(' + value.substring(end);  
		    break;
		case 67:
		    value = value.substring(0, start-1) + ')' + value.substring(end);  
		    break;
		case 83:
		    value = value.substring(0, start-1) + '^' + value.substring(end);  
		    break;
		case 82:
		    value = value.substring(0, start-1) + 'sqrt' + value.substring(end);  
		    break;
		case 13:
		    this.enter();
	    }
	}
        this.rawStrings[this.lineIndex] = value;
        this.tokenise(this.rawStrings[this.lineIndex]);
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
        var end = this.markEndPos;
        for (var i = start; i < end+1; i++)
        {
            if (this.rawStructure[i])
                this.rawStructure[i].token = 'removed';
        }
        this.markMove(1);
        this.addMarker();    
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
        for (var i = 0; i < this.rawStructure.length; i++)
        {
            var item = this.rawStructure[i];
            if (item.token != 'removed')
                st += item.term;
        }
        return st;        
    }

    addMarker() {
        var st = '';
        for (var i = 0; i < this.rawStructure.length; i++)
        {
            if (this.markerVisibility[this.lineIndex] && i == this.markStartPos) {
                st += this.mathjaxMarker + '{'; 
            }

            var item = this.rawStructure[i];
            if (item.token != 'removed')
                st += item.term;

            if (this.markerVisibility[this.lineIndex] && i == this.markEndPos) {
                st += '}'; 
            }
        }
        // avoid breaking sqrt display if it is finished by selection curly
        // brace
        st = st.replace(/sqrt}/, 'sqrtrArr}');
        st = st.replace(/\(}/, 'rArr}');
        st = st.replace(/\)\}/, 'lArr}');
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
            MathJax.Hub.Queue(["Typeset",MathJax.Hub,"myMathJax"]);
            this.tokenise(this.rawStrings[this.lineIndex]);

    }

    paste() {
        this.saveUndo();
        this.addSymbol(this.chosen);
        this.mainFocus.nativeElement.focus();
    }

    markMove(amount) {
        this.saveUndo();
        this.markStartPos += amount;
        if (this.markStartPos >= this.rawStructure.length)
        {
            this.markStartPos = 0;
        }
        if (this.markStartPos < 0)
        {
            this.markStartPos = this.rawStructure.length - 1;
        }
        this.markEndPos = this.markStartPos;

        var p = this.markStartPos;
        if (p < this.rawStructure.length-1)
        {
            // skip any non selectable bits
            var dir = 1;
            if (amount < 0)
                dir = -1;
            var item = this.rawStructure[p];
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
                    if (state == 'number') {
                        append = true;
                    }
                    state = 'number';
                } else if (ch == '.') {
                    if (state == 'number') {
                        append = true;
                        state = 'number';
                    } else {
                        state = 'point';
                    }
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
                    rawStructure[p].term += term;
                    rawStructure[p].length += term.length;
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
            'rawStrings' : this.rawStrings.slice(0),
            'rawStructure' : this.rawStructure.slice(0),
            'markedStrings' : this.markedStrings.slice(0)
        }
        this.undoBuffer.push(undoRec);
    }

    stretchMarked(amount) {
        this.saveUndo();
        this.markEndPos += amount;
        if (this.markEndPos > this.rawStructure.length)
        {
            this.markEndPos = this.rawStructure.length-1;
        }

        var p = this.markEndPos;
        if (p < this.rawStructure.length-1)
        {
            var item = this.rawStructure[p];
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
        this.rawStructure = this.parseInput(st);
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
            this.rawStrings = state.rawStrings;
            this.rawStructure = state.rawStructure;
            this.markStartPos = state.markStartPos;
            this.markEndPos = state.markEndPos;
            this.markedStrings = state.markedStrings;
            this.tokenise(this.rawStrings[this.lineIndex]);
            this.addMarker();    
        }
    }

    vertical(amount) {
        this.setMarkerVisibility(false);
        this.lineIndex += amount;
        if (this.lineIndex < 0)
            this.lineIndex = 0;
        if (this.lineIndex >= this.rawStrings.length -1)
            this.lineIndex = this.rawStrings.length -1;
        this.tokenise(this.rawStrings[this.lineIndex]);
        this.setMarkerVisibility(true);
    }



}
