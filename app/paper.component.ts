import { Component, OnInit, SimpleChange, ViewChild } from '@angular/core';
import { MathJaxDirective } from './mathjax.directive';
import { MyWritingDirective } from './writing.directive';
import { MathTokensDirective } from './mathtokens.directive';

declare var MathJax: any;

@Component({
  selector: 'my-paper',
  templateUrl: 'app/paper.component.html',
  styleUrls: ['app/paper.component.css'],
  directives: [  MathJaxDirective, MyWritingDirective, MathTokensDirective ],
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
    rawCursor = 0;
    rawStrings = ['x/22=3sqrt3 xx 2.2^6 - cancel{(3 xx y)}'];
    rawStrings = ['x/22=3sqrt3 xx 2.2^6 - (3 xx y)'];
    crossouts = [];

    markStartPos = 0;
    markEndPos = 0;
    markedStrings = [];
    lineIndex = 0;
    carouselPick = 0;
    chosen = '';
    knownTokens = [];
    tokens = [];

    crossout() {
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
            this.setMarker();    
    }

    addSymbol(sym) {
        
        var st = '';
        if (this.rawStructure.length == 0)
        {
            st = sym;
        }
        else
        {
            for (var i = 0; i < this.rawStructure.length; i++)
            {
                var item = this.rawStructure[i];
                if (item.token != 'removed')
                    st += item.term;

                if (i == this.markEndPos)
                {
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
        this.setMarker();    
    };

    clear() {
        this.handwritingDirective.clear();
        this.rawStructure = [];
        this.rawStrings[this.lineIndex] = '';
        this.markedStrings[this.lineIndex] = '';
    };

    correct(x) { this.handwritingDirective.clear(); this.rawStrings[this.lineIndex] = this.rawStrings[this.lineIndex].slice(0, -1);  };

    carouselMove(amount) {
        if (this.tokens.length > 0)
        {
            this.carouselPick += amount;
            if (this.carouselPick < 0)
            {
                this.carouselPick = this.tokens.length - 1;
            }
            else if (this.carouselPick >= this.tokens.length)
            {
                this.carouselPick = 0;
            }
            this.setMarker();
        }
    };

    vertical(amount) {
        this.lineIndex += amount;
        if (this.lineIndex < 0)
            this.lineIndex = 0;
        if (this.lineIndex >= this.rawStrings.length -1)
            this.lineIndex = this.rawStrings.length -1;
    }


    enter() {
        this.lineIndex += 1;
        if (this.lineIndex >= this.rawStrings.length)
        {
            this.rawStrings.push('');
            this.markedStrings.push('');
        }
        this.tokenise(this.rawStrings[this.lineIndex]);
        this.carouselPick = 0;
    }

    newCopy() {
        var newSt = this.unparseStructure();
        this.rawStrings.push(newSt);
        this.lineIndex++;
        this.tokenise(this.rawStrings[this.lineIndex]);
        this.carouselPick = 0;
    }

    remove() {
            var start = this.markStartPos;
            var end = this.markEndPos;
            for (var i = start; i < end+1; i++)
            {
                this.rawStructure[i].token = 'removed';
            }
            this.markMove(1);
            this.setMarker();    
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

    setMarker() {
        var st = '';
        for (var i = 0; i < this.rawStructure.length; i++)
        {
            if (i == this.markStartPos)
            {
                st += this.mathjaxMarker + '{'; 
            }

            var item = this.rawStructure[i];
            if (item.token != 'removed')
                st += item.term;

            if (i == this.markEndPos)
            {
                st += '}'; 
            }
        }
        // avoid breaking sqrt display if it is finished by selection curly
        // brace
        st = st.replace(/sqrt}/, 'sqrthArr}');
        this.markedStrings[this.lineIndex] = st;
    }

    ngOnInit() {
            MathJax.Hub.Queue(["Typeset",MathJax.Hub,"myMathJax"]);
            this.tokenise(this.rawStrings[this.lineIndex]);
    }

    paste() {
        this.addSymbol(this.chosen);
    }

    markMove(amount) {
        this.markStartPos += amount;
        if (this.markStartPos >= this.rawStructure.length)
        {
            this.markStartPos = 0;
        }
        this.markEndPos = this.markStartPos;

        var p = this.markStartPos;
        if (p < this.rawStructure.length-1)
        {
            // skip any non selectable bits
            var item = this.rawStructure[p];
            switch (item.token)
            {
                case 'whitespace':
                case 'untouchable':
                case 'removed':
                case 'openCurly':
                case 'closeCurly':
                    this.markMove(1);
                    break;
            }
        }

        this.setMarker();
        return;
    }

    stretchMarked(amount) {
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
        this.setMarker();
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

    parseInput(st) {
        var state = 'unknown';

        var rawStructure = [];
        for (var i = 0; i < st.length; i++)
        {
            var append = false;
            var start = i;
            var ch = st[i];
            var lookAhead = st.substring(i);

            if (ch == ' ')
            {
                state = 'whitespace';
            }
            else if (ch == '=')
            {
                state = 'equals';
            }
            else if (ch.match(/[0-9]/))
            {
                if (state == 'number')
                {
                    append = true;
                }
                state = 'number';
            }
            else if (ch == '.')
            {
                if (state == 'number')
                {
                    append = true;
                    state = 'number';
                }
                else
                {
                    state = 'point';
                }
            }
            else if (ch.match(/[-\*\+\/)\^]/))
            {
                state = 'operator';
            }
            else if (lookAhead.match(/^xx/))
            {
                state = 'operator';
                i += 1;
            }
            else if (ch.match(/\(/))
            {
                state = 'openBracket';
            }
            else if (ch.match(/\)/))
            {
                state = 'closeBracket';
            }
            else if (ch.match(/{/))
            {
                state = 'openCurly';
            }
            else if (ch.match(/}/))
            {
                state = 'closeCurly';
            }
            else if (lookAhead.match(/^sqrt/))
            {
                state = 'function';
                i += 3;
            }
            else if (lookAhead.match(/^cancel{/))
            {
                state = 'cancel';
                while (ch != '}')
                    ch = st[++i];
            }
            else if (ch.match(/[a-z]/))
            {
                state = 'variable';
            }
            else
            {
                state = 'unknown';
            }
            var end = i+1;
            var term = st.substring(start, end);
            if (end >= st.length)
            {
                term = st.substring(start);
            }

            if (append)
            {
                var p = rawStructure.length - 1;
                rawStructure[p].term += term;
                rawStructure[p].length += term.length;
            }
            else
            {
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

    tokenise(st) {   
        this.rawStructure = this.parseInput(st);
        //st = this.removeMarker(st, this.mathjaxMarker);
        if (false)
        {
            var tokens = [];
            this.knownTokens = [];
            var terms = st.split(/=/);
            var termStart = 0;
            for (var i = 0; i < terms.length; i++)
            {
                var term = terms[i];
                if (term.length > 0)
                {
                    this.tokensAdd(term, termStart, tokens);
                    termStart += term.length + 1;
                }
                if (i < terms.length-1)
                {
                    this.tokensAdd('=', termStart-1, tokens);
                }
            }
            this.splitter2(st, 0, tokens);
            console.log('all=', tokens);
            this.tokens = tokens;
        }
        MathJax.Hub.Queue(["Typeset",MathJax.Hub,"ul"]);
        console.log('I know of', Object.keys(this.knownTokens));
        this.setMarker();
    }

    splitter2(st, cursorPos, tokens) {

        while (cursorPos < st.length)
        {
            while (cursorPos < st.length && st[cursorPos].match(/\s/))
                    cursorPos++;
            var nextBit = st.substring(cursorPos);

            if (nextBit.match(/^\s*\(/))
            {
                var nextPos = this.processBrackettedTerm(st, cursorPos, tokens);
                if (cursorPos >= nextPos)
                    return cursorPos;
            }
            else if (nextBit.match(/^\s*cancel{/))
            {
                var nextPos = this.processMacro(st, cursorPos, tokens);
                if (cursorPos >= nextPos)
                    return cursorPos;
            }
            else if (nextBit.match(/^\s*sqrt/))
            {
                var nextPos = this.processFunction(st, cursorPos, tokens);
                if (cursorPos >= nextPos)
                    return cursorPos;
            }
            else if (nextBit.match(/^\s*[0-9]+[a-z][^a-z]/))
            {
                var nextPos = this.processNumberTimesVariable(st, cursorPos, tokens);
                if (cursorPos >= nextPos)
                    return cursorPos;
            }
            else if (nextBit.match(/^\s*[\.0-9]/))
            {
                var nextPos = this.processNumber(st, cursorPos, tokens);
                if (cursorPos >= nextPos)
                    return cursorPos;
            }
            else if (nextBit.match(/^\s*xx/))
            {
                var nextPos = this.processOperator(st, cursorPos, tokens);
                if (cursorPos >= nextPos)
                    return cursorPos;
            }
            else if (nextBit.match(/^\s*[a-z]/))
            {
                var nextPos = this.processVariable(st, cursorPos, tokens);
                if (cursorPos >= nextPos)
                    return cursorPos;
            }
            else // assume single character operator
            {
                var nextPos = this.processOperator(st, cursorPos, tokens);
                if (cursorPos >= nextPos)
                    return cursorPos;
            }
            cursorPos = nextPos;
        }
        return cursorPos;
    }

    processEqualTerms(st, cursorPos, tokens) {
        var term = '';
        var termStart = cursorPos;
        var trailingEquals = false;
        for (var i = cursorPos; i < st.length; i++)
        {
            var ch = st[i];
            if (ch == '=')
            {
                this.tokensAdd(term, termStart, tokens);
                term = '';
                termStart = i;
                trailingEquals = true;
            }
            else
            {
                term += ch;
                trailingEquals = false;
            }
        }
        if (! trailingEquals)
        {
            this.tokensAdd(term, termStart, tokens);
        }
        return cursorPos;
    }

    processBrackettedTerm(st, cursorPos, tokens) {
        var brackets = [];
        var bDepth = 0;
        var startPos = cursorPos;
        for (var i = cursorPos; i < st.length; i++)
        {
            var ch = st[i];
            if (ch == '(')
            {
                if (bDepth > 0)
                    brackets.push(ch);
                else
                    startPos = i;

                bDepth++;
            }
            else if (ch == ')')
            {
                bDepth--;
                if (bDepth == 0)
                {
                    var exp = brackets.join('');
                    this.tokensAdd('(' + exp + ')', startPos, tokens);
                    // now process interior of brackets
                    var bracketTerms = [];
                    var endPos = this.splitter2(st, cursorPos+1, bracketTerms);
                    tokens = this.concatInPlace(tokens, bracketTerms);
                    return endPos;
                }
                else
                    brackets.push(ch);
            }
            else if (bDepth > 0)
            {
                brackets.push(ch);
            }
        }
        return i;
    }

    findEndTerm(st, cursorPos, startCh, endCh) {
        var bDepth = 0;
        for (var i = cursorPos; i < st.length; i++)
        {
            var ch = st[i];
            if (ch == startCh)
            {
                bDepth++;
            }
            else if (ch == endCh)
            {
                bDepth--;
                if (bDepth == 0)
                {
                    return i+1;
                }
            }
        }
        return i;
    }

    concatInPlace(collA, collB) {
        for (var i = 0; i < collB.length; i++)
        {
            collA.push(collB[i]);
        }
        return collA;
    }

    processMacro(st, cursorPos, tokens) {
        var endPos = this.findEndTerm(st, cursorPos, '{', '}');
        var term = st.substring(cursorPos, endPos);
        this.tokensAdd(term, cursorPos, tokens);
        return endPos;
    }

    processFunction(st, cursorPos, tokens) {
        /* eg:
         ** st = sqrt((a + (b+c))
         ** we need to add the whole function as a term.
         ** then we process the bracketted arguments
         */
        // first extract function as a whole and add that as a term
        var endPos = this.findEndTerm(st, cursorPos, '(', ')');
        var term = st.substring(cursorPos, endPos);
        this.tokensAdd(term, cursorPos, tokens);
        return endPos;
    }

    processNumberTimesVariable(st, cursorPos, tokens) {
        var i = cursorPos;
        while (i < st.length && st[i].match(/\s/))
            i++;

        var componentTerms = [];
        var nextPos = this.processNumber(st, i, componentTerms);
        nextPos = this.processVariable(st, nextPos, componentTerms);
        this.tokensAdd(st.substring(i, nextPos), i, tokens);
        tokens = this.concatInPlace(tokens, componentTerms);
        return nextPos;
    }

    processNumber(st, cursorPos, tokens) {
        var i = cursorPos;
        while (i < st.length && st[i].match(/\s/))
            i++;

        cursorPos = i;
        var num = '';
        while (i < st.length && st[i].match(/\d/))
        {
                num += st[i];
                i++;
        }
        this.tokensAdd(num, cursorPos, tokens);
        return i;
    }

    processVariable(st, cursorPos, tokens) {
        var i = cursorPos;
        while (st[i].match(/\s/))
            i++;

        var ch = st[i];
        this.tokensAdd(ch, i, tokens);
        return i+1;
    }

    processOperator(st, cursorPos, tokens) {
        var i = cursorPos;
        while (i < st.length && st[i].match(/\s/))
            i++;

        if (st[i] == 'x' && st[i+1] == 'x')
        {
            this.tokensAdd('xx', i, tokens);
            i++
        }
        else
        {
            this.tokensAdd(st[i], i, tokens);
        }
                
        return i + 1;
    }

}
