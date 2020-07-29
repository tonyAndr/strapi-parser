const fetch = require("node-fetch");
const JSDOM = require('jsdom').JSDOM;
const createDOMPurify = require('dompurify');
const Readability = require('./Readability');

module.exports = {
    getHtml: async (urls) => {
        let parsedContent = {};
        try {
            for (let i = 0; i < urls.length; i++) {
                let html = await fetch(new URL(urls[i]));
                html = await html.text();

                const window = new JSDOM('').window;
                const DOMPurify = createDOMPurify(window);

                const clean = DOMPurify.sanitize(html, {
                    WHOLE_DOCUMENT: true,
                    FORBID_TAGS: ['style', 'svg'],
                    FORBID_ATTR: ['style', 'id', 'srcset', 'sizes', 'data-flat-attr'],
                    ADD_TAGS: ['meta', 'h1', 'noscript'],
                    ADD_ATTR: [ 'content']
                });

                // console.log(clean)

                let dom = new JSDOM(clean, {
                    url: urls[i],
                });
                let document = dom.window.document;

                let description = document.querySelector("meta[name='description']");
                if (description)
                    description = description.content;
                else 
                    description = '';

                // img processing 
                let images = document.querySelectorAll("img");
                images.forEach(img => {
                    if (img.hasAttribute('data-src'))
                        img.setAttribute('src', img.getAttribute('data-src'))
                    if (img.hasAttribute('data-lazy-src'))
                        img.setAttribute('src', img.getAttribute('data-lazy-src'))
                })

                let h1 = document.getElementsByTagName("h1")[0];
                // console.log(h1.outerHTML)
                if (h1)
                    h1 = h1.textContent;
                else
                    h1 = '';

                let reader = new Readability(document);
                let article = reader.parse();

                if (article.length < 3000) {
                    continue;
                }

                // remove spec symbols
                let cleanedBody = article.content.replace(/[\r\n\t]/g, '');
                cleanedBody = DOMPurify.sanitize(cleanedBody, {
                    FORBID_TAGS: ['div', 'article', 'section', 'header', 'figcaption', 'figure', 'span'],
                    FORBID_ATTR: ['data-src', 'data-lazy-src', 'loading', 'data-lazy-srcset', 'aria-describedby', 'width', 'height']
                });

                // remove noscript tags with content
                cleanedBody = DOMPurify.sanitize(cleanedBody, {
                    FORBID_TAGS: ['noscript'],
                    KEEP_CONTENT: false
                });

                // replace html encoded spaces
                cleanedBody = cleanedBody.replace(/&nbsp;/g, ' ');

                // check headers
                let hasH2 = cleanedBody.indexOf("<h2") > -1;
                let hasIntro = cleanedBody.indexOf("<h2") > 0;

                // split into blocks
                cleanedBody = cleanedBody.replace(/<h2/g, '[BLOCK_BRAKER]<h2').split("[BLOCK_BRAKER]");

                let contentBlocks = {
                    intro: hasIntro ? cleanedBody[0] : '',
                    blocks: hasH2 ? cleanedBody.slice(1) : cleanedBody, // slice to remove intro
                    hasH2
                }

                parsedContent[urls[i]] = {
                    title: article.title,
                    description,
                    h1,
                    contentBlocks,
                    textLength: article.length
                };
            }
            return parsedContent;
        } catch (err) {
            console.log(err)
        }

    }
}


/* 

    clean:
        img w/o src
        a w/o href
        the rest - according to the provided options


    1. приходит список урлов
    2. загружаю в цикле по очереди с await
    3. проверяю по опциям что подходит
    4. сохраняю подходящие урл, текст, заголовок, тайтл, дескрипшн

*/