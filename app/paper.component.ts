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

    //rawString = '(sqrt(2))';
    //rawString = '(3x+sqrt(23))+4';
    rawString = 'y^x=(3x+sqrt(22))xx(203^x-381 xx (5+6))+2';
    carouselPick = 0;
    tokens = [];

    addSymbol(sym) { this.rawString += sym; this.tokenise(this.rawString); };

    crossout() {
            var term = this.tokens[this.carouselPick];
            this.rawString = this.rawString.replace(/;/g, '');
            this.rawString = this.rawString.replace(term, 'cancel{' + term + '}');
    }

    clear(x) { this.handwritingDirective.clear(); this.rawString = ''; };

    correct(x) { this.handwritingDirective.clear(); this.rawString = this.rawString.slice(0, -1);  };

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

    setMarker() {
            var term = this.tokens[this.carouselPick].term;
            var pos = this.tokens[this.carouselPick].position;
            this.rawString = this.rawString.replace(/;/g, '');
            var markedSt = this.rawString.substring(0, pos) + ';' + term + ';' + this.rawString.substring(pos+term.length) 
            this.rawString = markedSt;
    }

    ngOnInit() {
            MathJax.Hub.Queue(["Typeset",MathJax.Hub,"myMathJax"]);
            this.tokenise(this.rawString);
    }

    ngAfterViewInit() {}

    tokenise(st) {   
        var tokens = [];
        this.splitter2(st, 0, tokens);
        console.log('all=', tokens);
        this.tokens = tokens;
        MathJax.Hub.Queue(["Typeset",MathJax.Hub,"ul"]);
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
                    tokens.push({
                        'term': '(' + exp + ')',
                        'position': startPos 
                    });
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

    findEndTerm(st, cursorPos) {
        var bDepth = 0;
        for (var i = cursorPos; i < st.length; i++)
        {
            var ch = st[i];
            if (ch == '(')
            {
                bDepth++;
            }
            else if (ch == ')')
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

    processFunction(st, cursorPos, tokens) {
        /* eg:
         ** st = sqrt((a + (b+c))
         ** we need to add the whole function as a term.
         ** then we process the bracketted arguments
         */
        var functionSymbolLength = 4; // currently assume there is only one function: sqrt
        // first extract function as a whole and add that as a term
        var endPos = this.findEndTerm(st, cursorPos);
        var term = st.substring(cursorPos, endPos);
        tokens.push({
            'term': term,
            'position': cursorPos
        });
        return endPos;
    }

    processNumberTimesVariable(st, cursorPos, tokens) {
        var i = cursorPos;
        while (i < st.length && st[i].match(/\s/))
            i++;

        var componentTerms = [];
        var nextPos = this.processNumber(st, i, componentTerms);
        nextPos = this.processVariable(st, nextPos, componentTerms);
        tokens.push({
            'term': st.substring(i, nextPos),
            'position': i
        });
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
        tokens.push({
            'term': num,
            'position': cursorPos
        });
        return i;
    }

    processVariable(st, cursorPos, tokens) {
        var i = cursorPos;
        while (st[i].match(/\s/))
            i++;

        var ch = st[i];
        tokens.push({
            'term': ch,
            'position': i
        });
        return i+1;
    }

    processOperator(st, cursorPos, tokens) {
        var i = cursorPos;
        while (st[i].match(/\s/))
            i++;
        if (st[i] == 'x' && st[i+1] == 'x')
            i++
                
        return i + 1;
    }

    splitter(st) {
        console.log('s=',st);
        var terms = [];
        this.pushExpressions(st, terms);
        this.pushBrackets(st, terms);
        this.pushNumbers(st, terms);
        this.pushVariables(st, terms);
        var unique = [];
        for (var i = 0; i < terms.length; i++)
        {
            unique[terms[i]] = terms[i].length;
        }
        var tokens = Object.keys(unique);
        tokens = tokens.sort(function(a, b) {
            return (b.length - a.length);
        });
        console.log('u', tokens);
        return tokens;
    }

    pushBrackets(st, terms) {
        var brackets = [];
        var bDepth = 0;
        for (var i = 0; i < st.length; i++)
        {
            var ch = st[i];
            if (ch == '(')
            {
                if (bDepth > 0)
                    brackets.push(ch);

                bDepth++;
            }
            else if (ch == ')')
            {
                bDepth--;
                if (bDepth == 0)
                {
                    var exp = brackets.join('');
                    terms.push(exp);
                    this.pushBrackets(exp, terms);
                    brackets = [];
                }
                else
                    brackets.push(ch);
            }
            else if (bDepth > 0)
            {
                brackets.push(ch);
            }
        }
        return terms;
    }

    pushExpressions(st, terms) {
        var exps = st.split(/\s*=\s*/g);
        if (exps)
        {
            console.log(st, '->', exps);
            for (var i = 0; i < exps.length; i++)
            {
                terms.push(exps[i]);
            }
        }
        return terms;
    }

    pushNumbers(st, terms) {
        var nums = st.match(/\d+/g);
        if (nums)
        {
            console.log(st, '->', nums);
            for (var i = 0; i < nums.length; i++)
            {
                terms.push(nums[i]);
            }
        }
        return terms;
    }

    pushVariables(st, terms) {
        st = st.replace(/sqrt/g, '~');
        st = st.replace(/xx/g, '~');
        var alphs = st.match(/[a-zA-Z]+/g);
        if (alphs)
        {
            console.log(st, '->', alphs);
            for (var i = 0; i < alphs.length; i++)
            {
                terms.push(alphs[i]);
            }
        }
        return terms;
    }

}
