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

    rawStrings = ['x/2=3'];
    lineIndex = 0;
    carouselPick = 0;
    chosen = '';
    knownTokens = [];
    tokens = [];

    addSymbol(sym) {
            var st = this.rawStrings[this.lineIndex];
            var newSt = st + sym;
            if (st.match(/bbb{.*}/))
            {
                // add sym after current marked term
                var startPos = st.indexOf('bbb{')+3;
                newSt = st.substring(0, startPos);
                var openBraces = 0;
                var looking = true;
                for (var i = startPos; i < st.length; i++)
                {
                    var ch = st[i];
                    if (looking)
                    {
                        if (ch == '{')
                        {
                            openBraces++;
                        }
                        else if (ch == '}')
                        {
                            openBraces--;
                        }
                        newSt += ch;

                        if (openBraces == 0)
                        {
                            looking = false;
                            newSt += sym;
                        }
                    }
                    else
                    {
                        newSt += ch;
                    }
                }
            }
            this.rawStrings[this.lineIndex] = newSt;
            this.tokenise(this.rawStrings[this.lineIndex]);
            this.carouselMove(1);
    };

    crossout() {
            var term = this.tokens[this.carouselPick];
            this.chosen = term.term;
            this.rawStrings[this.lineIndex] = this.cancelMarked(this.rawStrings[this.lineIndex]);
            this.tokenise(this.rawStrings[this.lineIndex]);
    }

    clear(x) { this.handwritingDirective.clear(); this.rawStrings[this.lineIndex] = ''; };

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

    cancelMarked(st) {
        return st.replace(/bbb{/g, 'cancel{');
    }


    enter() {
        this.lineIndex += 1;
        if (this.lineIndex >= this.rawStrings.length)
        {
            this.rawStrings.push('');
        }
        this.tokenise(this.rawStrings[this.lineIndex]);
        this.carouselPick = 0;
    }

    /*
    ** tag is the 'tag' name of a tag{...} macro
    ** eg removeMarker('1+2bbb{3+cancel{4}}', 'bbb')
    */
    removeMarker(st, tag) {
        var markerRE = new RegExp(tag + '{.*}');
        if (st.match(markerRE))
        {
            var startPos = st.indexOf(tag + '{');
            var newSt = st.substring(0, startPos);
            var openBraces = 1;
            var looking = true;
            for (var i = startPos+tag.length+1; i < st.length; i++)
            {
                var ch = st[i];
                if (looking)
                {
                    if (ch == '{')
                    {
                        openBraces++;
                    }
                    else if (ch == '}')
                    {
                        openBraces--;
                    }

                    if (openBraces == 0)
                    {
                        looking = false;
                    }
                    else
                    {
                            newSt += ch;
                    }
                }
                else
                {
                    newSt += ch;
                }
            }
            return newSt;
        }
        return st;
    }

    setMarker() {
            var term = this.tokens[this.carouselPick].term;
            var pos = this.tokens[this.carouselPick].position;
            this.rawStrings[this.lineIndex] = this.removeMarker(this.rawStrings[this.lineIndex], 'bbb');
            var markedSt = this.rawStrings[this.lineIndex].substring(0, pos) + 'bbb{' + term + '}' + this.rawStrings[this.lineIndex].substring(pos+term.length) 
            this.rawStrings[this.lineIndex] = markedSt;
    }

    ngOnInit() {
            MathJax.Hub.Queue(["Typeset",MathJax.Hub,"myMathJax"]);
            this.tokenise(this.rawStrings[this.lineIndex]);
            this.setMarker();
    }

    paste() {
        this.addSymbol(this.chosen);
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
        st = this.removeMarker(st, 'bbb');
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
        }
        this.splitter2(st, 0, tokens);
        console.log('all=', tokens);
        this.tokens = tokens;
        MathJax.Hub.Queue(["Typeset",MathJax.Hub,"ul"]);
        console.log('I know of', Object.keys(this.knownTokens));
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
