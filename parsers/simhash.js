const  similarity = require('string-similarity-algorithm').default;
const natural = require('natural');
let x = [
    'Следите за симптомами',
    'Симптоматика болезни',
    'Профилактика ветрянки',
    'Лечение',
    'Что делать если заболел',
    'Температура',
    'Как проявляется болезнь',
]
let y = [
    'Первые симптомы',
    'Симптоматика',
    'Болезнь и ее симптомы',
    'Профилактические действия',
    'Профилактика',
    'Лечение ветрянки',
    'Как вылечить',
    'Может ли быть температура?',
]

x.forEach(x1 => {
    y.forEach(y1 => {
        let lcs = similarity(x1, y1, 'lcs');
        // let levenstein = similarity(x, y, 'levenstein');
        // let simhash = similarity(x1, y1, 'simhash');

        let jaro = natural.JaroWinklerDistance(x1, y1, undefined, true);

        console.log("===============")
        console.log(x1 + " ||| "+  y1)
        console.log(lcs, jaro)
    })
})

