'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/services.html#core-services)
 * to customize this service
 */

const { searchYA } = require('../../../parsers/search/yandex');
const { getHtml } = require('../../../parsers/get_html/get');
const { processBlocks } = require('../../../parsers/process_blocks');
const { imgProcessing } = require('../../../parsers/post_processing');
const cyrillicToTranslit = require('cyrillic-to-translit-js');
const natural = require('natural');

const parser = async (task) => {
    try {
        for (let i = 0; i < task.articles.length; i++) {

            const article = task.articles[i];
            if (!article.is_done) {
                let keyword = article.keyword;
                let domain = task.domain;

                // create slug
                const tokenizer = new natural.WordTokenizer();
                const slug = tokenizer.tokenize(cyrillicToTranslit().transform(keyword)).join('-').toLowerCase();
                await strapi.services.article.update({ id: article.id }, { slug });

                console.log("[" + new Date.toISOString() + "] PARSING STARTED, KW: [" + keyword + "] ...")
                let urls = await searchYA(keyword);
                console.log(urls)

                console.log("[" + new Date.toISOString() + "] GETTING HTML ...")
                let parsedContent = await getHtml(urls);
                console.log("[" + new Date.toISOString() + "] PROCESSING TEXTS ...")
                let [finalContent, finalText] = processBlocks(parsedContent);
                // console.log("[" + new Date.toISOString() + "] PROCESSING IMGS ...")
                //finalContent = await imgProcessing(domain, keyword, slug, finalContent);
                console.log("[" + new Date.toISOString() + "] FINISHED ...")
                //console.log(finalContent);

                await strapi.services.article.update({ id: article.id }, { is_done: true, content_body: finalContent, text_body: finalText, text_length: finalContent.length });
            }
        }
        return true;
    } catch (err) {
        console.log(err)
        return false;
    }
}

module.exports = {
    startParsing: async () => {
        // check what is running
        let tasksInProgress = await strapi.services.task.find({ is_processing: true });
        if (tasksInProgress.length > 0) {
            return false;
        }
        // find tasks to run
        let tasksToProcess = await strapi.services.task.find({ is_enabled: true, is_finished: false });
        if (tasksToProcess.length === 0) {
            return false;
        }
        let task = tasksToProcess[0];

        // run
        try {
            await strapi.services.task.update({ id: task.id }, { is_started: true, is_processing: true });

            // parse
            let finished = await parser(task);
            if (finished) {
                await strapi.services.task.update({ id: task.id }, { is_processing: false, is_finished: true });
            } else {
                await strapi.services.task.update({ id: task.id }, { is_processing: false, is_finished: false });
            }
        } catch ( err)  {
            console.log(err);
            await strapi.services.task.update({ id: task.id }, { is_processing: false });
        }
        
    }
};
