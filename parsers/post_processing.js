// img download / rename / resize

const sharp = require('sharp');
const axios = require('axios')
const JSDOM = require('jsdom').JSDOM;
const cyrillicToTranslit = require('cyrillic-to-translit-js');
const natural = require('natural');
const fs = require('fs');

module.exports = {
    imgProcessing: async (domain, keyword, content) => {
        let dom = new JSDOM(content);
        let document = dom.window.document;

        const tokenizer = new natural.WordTokenizer();
        const img_name = tokenizer.tokenize(cyrillicToTranslit().transform(keyword)).join('-').toLowerCase();

        let images = [...document.querySelectorAll('img')];
        for (let i = 0; i < images.length; i++) {
            const img = images[i];

            // if (!src) {
            //     img.remove();
            //     continue;
            // }
            try {
                let src = img.getAttribute('src');

                const fileName = img_name + '_' + i + '.jpg';


                const dir = './tmp_images/' + domain + '/' + img_name;

                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }

                let buffer = await axios({ url: src, responseType: "arraybuffer" });
                buffer = Buffer.from(buffer.data, 'binary');
                const file = await sharp(buffer).resize(700).jpeg({
                    quality: 70,
                    chromaSubsampling: '4:4:4'
                }).toFile(dir + '/' + fileName);

                if (file) {
                    img.setAttribute('src', '../uploads/post_id/' + fileName);
                    img.removeAttribute('data-src');
                    img.removeAttribute('data-lazy-src');
                    img.removeAttribute('data-lazy-srcset');
                    img.removeAttribute('sizes');
                    img.removeAttribute('srcset');

                    if (!img.getAttribute('alt')) {
                        img.setAttribute('alt', keyword);
                    }

                    console.log(fileName);
                    console.log(file);
                } else {
                    throw new Error ("Can't download/resize image, no info received from sharp")
                }
            } catch ( err ) {
                console.log(err)
                img.remove();
            }

        }

        return document.querySelector('body').innerHTML;
    }
}
