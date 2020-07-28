const fetch = require("node-fetch");
const xml2js = require('xml2js');
const API_URI = "https://yandex.ru/search/xml?user=marafon101kurs&key=03.442230827:3d63f2a53f26cf6587f12dd31469e01f&l10n=ru";

module.exports = {
    searchYA: async (keyword) => {

        let query = new URL(API_URI + "&query=" + keyword);

        try {
            let request = await fetch(query);
            request = await request.text();
            let parsedJSON = await xml2js.parseStringPromise(request, { trim: true })
            let urls = [];
            urls = iterate(parsedJSON, urls)

            if (urls.length === 0) {
                throw new Error("Urls not found")
            }

            return urls;
        } catch (err) {
            console.log(err)
        }
    }
}

// Iterate through json object/array to find all keys === "url" and return their values as an array
const iterate = (obj, urls) => {
    Object.keys(obj).forEach(key => {

        if (key === "url") {
            urls.push(obj[key][0])
        }

        if (typeof obj[key] === 'object') {
            iterate(obj[key], urls)
        }
    })
    return urls;
}