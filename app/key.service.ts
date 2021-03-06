import { Injectable } from '@angular/core';

@Injectable()
export class KeyService {
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

    keyInput(ev) {
        var key = { };
        var keyCode = ev.which;
        if (keyCode == 0 || keyCode == 229) {
            // android catch
            if (ev.data != undefined) {
                key['lower'] = ev.data.toLowerCase();
                key['upper'] = ev.data.toUpperCase();
            } else {
                return;
            }
        } else {
            key = this.keyCodeTrans[ev.which];
         }
        return {
            'lower': key['lower'],
            'upper': key['upper'],
            'shiftKey': ev.shiftKey,
            'altKey': ev.altKey,
            'ctrlKey': ev.ctrlKey,
            'metaKey': ev.metaKey,
        }
    }

    makeKey(ch) {
        return {
            'lower': ch,
            'upper': ch.toUpperCase(),
            'shiftKey': false,
            'altKey': false,
            'ctrlKey': false,
            'metaKey': false,
        }
    }

}
