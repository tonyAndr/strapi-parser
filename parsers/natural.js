const natural = require('natural');
const wuzzy = require('wuzzy');
const NGrams = natural.NGrams;

natural.PorterStemmerRu.attach();

let x = "вылечить ветрянку";
let y = "профилактика ветрянки";

let tokens_x = x.tokenizeAndStem();
let tokens_y = y.tokenizeAndStem();

// tokens_x.sort();
// tokens_y.sort();

// tokens_x.sort().sort(function (a, b) {
//     // ASC  -> a.length - b.length
//     // DESC -> b.length - a.length
//     return b.length - a.length;
// });

// tokens_y.sort().sort(function (a, b) {
//     // ASC  -> a.length - b.length
//     // DESC -> b.length - a.length
//     return b.length - a.length;
// });

console.log(tokens_x)
console.log(tokens_y)

console.log(wuzzy.jarowinkler(x, y))
console.log(wuzzy.levenshtein(x, y))
console.log(wuzzy.ngram(x, y))