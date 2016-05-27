import { Component, OnInit, SimpleChange, ViewChild } from '@angular/core';
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

    mathjaxMarker = 'color{red}';
    markerLength = this.mathjaxMarker.length;

    rawStructure = [];
    rawStrings = ['x/22=3sqrt3 xx 2.2^6 - (3 xx y)'];
    markerVisibility = [];
    undoBuffer = [];

    markStartPos = 0;
    markEndPos = 0;
    markedStrings = [];
    lineIndex = 0;
    carouselPick = 0;
    chosen = '';
    knownTokens = [];
    tokens = [];

    crossout() {
        this.saveUndo();
        var start = this.markStartPos;
        var end = this.markEndPos;
        for (var i = start; i < end+1; i++)
        {
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
        this.handwritingDirective.clear();
        this.rawStructure = [];
        this.rawStrings[this.lineIndex] = '';
        this.markedStrings[this.lineIndex] = '';
        if (this.lineIndex > 0) {
            this.rawStrings.pop();
            this.markedStrings.pop();
            this.lineIndex--;
            this.tokenise(this.rawStrings[this.lineIndex]);
            this.addMarker();    
        }
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
        this.carouselPick = 0;
    }

    newCopy() {
        var newSt = this.unparseStructure();
        this.setMarkerVisibility(false);
        this.rawStrings.push(newSt);
        this.lineIndex++;
        this.markStartPos = 0;
        this.markEndPos = 0;
        this.tokenise(this.rawStrings[this.lineIndex]);
        this.carouselPick = 0;
    }

    remove() {
        this.saveUndo();
        var start = this.markStartPos;
        var end = this.markEndPos;
        for (var i = start; i < end+1; i++)
        {
            this.rawStructure[i].token = 'removed';
        }
        this.markMove(1);
        this.addMarker();    
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
        st = st.replace(/sqrt}/, 'sqrthArr}');
        this.markedStrings[this.lineIndex] = st;
    }

    setMarkerVisibility(flag) {
        this.markerVisibility[this.lineIndex] = flag;
        this.addMarker();
    }


    ngOnInit() {
            MathJax.Hub.Queue(["Typeset",MathJax.Hub,"myMathJax"]);
            this.tokenise(this.rawStrings[this.lineIndex]);
    }

    paste() {
        this.saveUndo();
        this.addSymbol(this.chosen);
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
        console.log(state);
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
