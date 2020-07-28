const fetch = require("node-fetch");
const JSDOM = require('jsdom').JSDOM;
const createDOMPurify = require('dompurify');
const Readability = require('./Readability');

module.exports = {
    getHtml: async (urls) => {
        let parsedContent = [];
        try {
            for (let i = 0; i < 1; i++) {
                let html = await fetch(new URL(urls[i]));
                html = await html.text();

                const window = new JSDOM('').window;
                const DOMPurify = createDOMPurify(window);

                const clean = DOMPurify.sanitize(html, {
                    WHOLE_DOCUMENT: true,
                    FORBID_TAGS: ['style', 'svg'],
                    FORBID_ATTR: ['style', 'id'],
                    ADD_TAGS: ['meta', 'h1'],
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

                let h1 = document.getElementsByTagName("h1")[0];
                if (h1)
                    h1 = h1.innerText;
                else
                    h1 = '';

                let reader = new Readability(document);
                let article = reader.parse();

                parsedContent.push({
                    title: article.title,
                    description,
                    h1,
                    contentHTML: article.content,
                    textLength: article.length
                });
            }
            return parsedContent;
        } catch (err) {
            console.log(err)
        }

    }
}


/* 

    1. приходит список урлов
    2. загружаю в цикле по очереди с await
    3. проверяю по опциям что подходит
    4. сохраняю подходящие урл, текст, заголовок, тайтл, дескрипшн

*/