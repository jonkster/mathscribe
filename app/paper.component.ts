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
            var term = this.tokens[this.carouselPick];
            this.rawString = this.rawString.replace(/;/g, '');
            this.rawString = this.rawString.replace(term, ';' + term + ';');
    }

    ngOnInit() {
            MathJax.Hub.Queue(["Typeset",MathJax.Hub,"myMathJax"]);
            this.tokenise(this.rawString);
    }

    ngAfterViewInit() {}

    tokenise(st) {  
        var t = this.splitter(st);
        console.log('all=', t);
        this.tokens = t;
        MathJax.Hub.Queue(["Typeset",MathJax.Hub,"ul"]);
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
