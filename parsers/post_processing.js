// img download / rename / resize

const sharp = require('sharp');
const axios = require('axios')
const JSDOM = require('jsdom').JSDOM;
const fs = require('fs');

module.exports = {
    imgProcessing: async (domain, keyword, slug, content) => {
        let dom = new JSDOM(content);
        let document = dom.window.document;

        let images = [...document.querySelectorAll('img')];
        for (let i = 0; i < images.length; i++) {
            const img = images[i];

            // if (!src) {
            //     img.remove();
            //     continue;
            // }
            try {
                let src = img.getAttribute('src');

                const fileName = slug + '_' + i + '.jpg';


                const dir = './tmp_images/' + domain + '/' + slug;

                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }

                let buffer = await axios({ url: src, responseType: "arraybuffer" });
                buffer = Buffer.from(buffer.data, 'binary');
                const file = await sharp(buffer).resize(644).jpeg({
                    quality: 60,
                    chromaSubsampling: '4:4:4'
                }).toFile(dir + '/' + fileName);

                if (file) {
                    img.setAttribute('src', '/wp-content/uploads/posts/' + slug + '/' + fileName);
                    img.removeAttribute('data-src');
                    img.removeAttribute('data-lazy-src');
                    img.removeAttribute('data-lazy-srcset');
                    img.removeAttribute('sizes');
                    img.removeAttribute('srcset');
                    img.removeAttribute('width');
                    img.removeAttribute('height');

                    if (!img.getAttribute('alt')) {
                        img.setAttribute('alt', keyword);
                    }

                    // set lazy loading
                    img.setAttribute('loading', 'lazy');

                    console.log(fileName);
                    // console.log(file);
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
