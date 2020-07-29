const natural = require('natural');
natural.PorterStemmerRu.attach();
const wuzzy = require('wuzzy');

let commonlyUsedTokens = {};
let groupsCount = 0;

const extractHeaders = (parsedContent) => {
    let headersArray = [];

    for (let key in parsedContent) {
        if (parsedContent.hasOwnProperty(key)) {
            let article = parsedContent[key];
            if (article.contentBlocks.hasH2) {
                article.contentBlocks.blocks.forEach((block, index) => {

                    let h2Text = block.match(/<h2[^>]*>(.+?)<\/h2>/iu)[1].trim();
                    headersArray.push({
                        url: key,
                        h2: h2Text,
                        tokens: h2Text.tokenizeAndStem(),
                        priority: index
                    })

                    if (index + 1 > groupsCount) {
                        groupsCount = index + 1;
                    }
                })
            }
        }
    }

    return headersArray;
}

// removes short tokens (<=2 chars) and counts commonly used words
const cleanTokens = (headersArray) => {
    headersArray.forEach(header => {
        header.tokens.filter(token => {
            if (token.length > 2) {
                commonlyUsedTokens[token] = commonlyUsedTokens.hasOwnProperty(token) ? commonlyUsedTokens[token] + 1 : 1;
                return true;
            } else {
                return false;
            }
        })
    })
    return headersArray;
}

// creates array from object, returns only 3 overused tokens
const sortCommonTokens = () => {
    let keysSorted = Object.keys(commonlyUsedTokens).sort(function (a, b) { return commonlyUsedTokens[b] - commonlyUsedTokens[a] })
    commonlyUsedTokens = keysSorted.slice(0, 3);
}


const createGroupsComplicated = (headersArray) => {

    let pairedIndices = [];
    headersArray.forEach( ( hx, ix ) => {
        let similarIndex = false;
        let maxScore = 0;
        headersArray.forEach ( ( hy, iy ) => {
            if (hx.h2 !== hy.h2 && hx.url !== hy.url) {
                let score = getSimilarityScore(hx.tokens, hy.tokens);
                if (score > 0.50 && score > maxScore) {
                    maxScore = score;
                    similarIndex = iy;
                }
            }
        })

        if (similarIndex !== false) {
            pairedIndices.push([ix, similarIndex]);
        } else {
            pairedIndices.push([ix])
        }
    })
    // console.log(pairedIndices)
    let groupedIndices = createGroupsIndices(pairedIndices);

    return groupedIndices;
}

// unite paired indices to groups using intersection and union
const createGroupsIndices = (pairedIndices) => {
    let unitedIndices = [];
    for (let xi = 0; xi < pairedIndices.length; xi++) {
        const xe = pairedIndices[xi];
        if (unitedIndices.includes(xi))
            continue;
        for (let yi = 0; yi < pairedIndices.length; yi++) {
            const ye = pairedIndices[yi];

            if (xi !== yi) {
                let intersec = xe.filter(x => ye.includes(x));
                if (intersec.length > 0) {
                    pairedIndices[xi] = arrayUnion(pairedIndices[xi], pairedIndices[yi]);
                    unitedIndices.push(yi)
                }
            }
        }
    }
    let groupedIndices = pairedIndices.filter((el, i) => {
        return !unitedIndices.includes(i);
    })
    return groupedIndices;

}

// array union 
const arrayUnion = (arrA, arrB) => {
    let union = [...new Set([...arrA, ...arrB])];
    return union;
}

const getSimilarityScore = (a, b) => {

    // remove overused tokens - todo: move to settings
    // a = a.filter(el => {
    //     return !commonlyUsedTokens.includes(el);
    // })
    // b = b.filter(el => {
    //     return !commonlyUsedTokens.includes(el);
    // })
    return wuzzy.jarowinkler(a, b);
}

const DEVshowGroupedHeaders = (headersArray, groupedIndices) => {
    console.log(groupedIndices.map(pair => {
        return pair.map(index => {
            return headersArray[index].h2;
        })
    }))
}

/* 
    Building the article

*/



const optimizeGroups = (parsedContent, headersArray, groupedIndices) => {

    groupedIndices.forEach((group, gr_ind) => {
        if (group.length > 1) {
            let goodHeaderIndex; // which we choose from the group
            let maxCoefficient = 0;
            group.forEach( index => {
                let url = headersArray[index].url;
                let blockIndex = headersArray[index].priority;
                let blockContent = parsedContent[url].contentBlocks.blocks[blockIndex];

                // TODO: check parametres and calc coeff
                let random = Math.random();
                if (random > maxCoefficient) {
                    goodHeaderIndex = index;
                }
                // END of checking
            })

            // remove block which we don't need
            groupedIndices[gr_ind] = group.filter(index => (index === goodHeaderIndex))
        }
    })





    // // this part is for the coef, checking if article has ungrouped blocks, unfinished
    // let urlsToOptimize = [];
    // groupedIndices.forEach(arr => {
    //     if (arr.length === 1) {
    //         let url = headersArray[arr[0]];
    //         if (!urlsToOptimize.includes(url))
    //             urlsToOptimize.push()
    //     }
    // })

    return [].concat(...groupedIndices);
}

const buildContentBody = (parsedContent, headersArray, optimizedIndices) => {
    let sortedBlocks = [];
    optimizedIndices.forEach((h_index, i) => {
        let url = headersArray[h_index].url;
        let blockIndex = headersArray[h_index].priority;
        let blockContent = parsedContent[url].contentBlocks.blocks[blockIndex];

        sortedBlocks.splice(blockIndex, 0, blockContent);
    });

    return sortedBlocks;
}

module.exports = {
    processBlocks: (parsedContent) => {
        let headersArray = extractHeaders(parsedContent);
        headersArray = cleanTokens(headersArray);
        sortCommonTokens();
        // createGroups(headersArray);
        let groupedIndices = createGroupsComplicated(headersArray);
        // DEVshowGroupedHeaders(headersArray, groupedIndices);
        let optimizedIndices = optimizeGroups(parsedContent, headersArray, groupedIndices);
        let sortedContentBlocks = buildContentBody(parsedContent, headersArray, optimizedIndices);
        console.log(sortedContentBlocks.join());
        console.log("Initial blocks count: " + headersArray.length);
        console.log("Final blocks count: " + sortedContentBlocks.length);
        // DEVshowGroupedHeaders(headersArray, optimizedGroups);

        // 
        // console.log(headersArray);
        // console.log(commonlyUsedTokens);
    },

}