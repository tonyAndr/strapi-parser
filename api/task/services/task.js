'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/services.html#core-services)
 * to customize this service
 */

const { searchYA } = require('../../../parsers/search/yandex');
const { getHtml } = require('../../../parsers/get_html/get');
const { processBlocks } = require('../../../parsers/process_blocks');
const { imgProcessing } = require('../../../parsers/post_processing');
const { getMeta } = require('../../../parsers/meta');
const cyrillicToTranslit = require('cyrillic-to-translit-js');
const natural = require('natural');
const { uploadArticle, articleExists } = require('../../../parsers/wp_upload');

const parser = async (task) => {
    try {
        for (let i = 0; i < task.articles.length; i++) {

            const article = task.articles[i];

            if (article.is_skipped || article.tries >= 2) {
                await strapi.services.article.update({ id: article.id }, { is_skipped: true });
                continue;
            }

            let keyword = article.keyword;
            let domain = task.domain;
            // create slug
            const tokenizer = new natural.WordTokenizer();
            const slug = tokenizer.tokenize(cyrillicToTranslit().transform(keyword)).join('-').toLowerCase();

            if (!article.is_done && article.tries < 2) {
                let timer = process.hrtime();
                // check if already exists on the website
                let exists = await articleExists(task, slug); //returns id or false
                if (exists) {
                    await strapi.services.article.update({ id: article.id }, { slug, wp_id: exists, is_done: true, is_uploaded: true });
                    continue;
                }

                await strapi.services.article.update({ id: article.id }, { slug });

                console.log("[" + new Date().toISOString() + "] PARSING STARTED, KW: [" + keyword + "] ...")
                let urls = await searchYA(keyword);
                console.log(urls)

                if (!urls) {
                    throw new Error('Yandex XML returned error');
                }

                console.log("[" + new Date().toISOString() + "] GETTING HTML ...")
                let parsedContent = await getHtml(urls);
                if (parsedContent == undefined) {
                    await strapi.services.article.update({ id: article.id }, { tries: article.tries + 1 });
                    throw new Error('Couldn\'t get HTML, no donors to work with');
                }

                console.log("[" + new Date().toISOString() + "] PROCESSING TEXTS ...")
                let processedContent = processBlocks(parsedContent);
                if (processedContent === false) {
                    await strapi.services.article.update({ id: article.id }, { tries: article.tries + 1 });
                    throw new Error('Probably failed to get Intro text or no headers found, skipping');
                }

                let [finalContent, finalText, usedDonors] = processedContent;
                if (usedDonors.length < 3) {
                    await strapi.services.article.update({ id: article.id }, { tries: article.tries + 1 });
                    throw new Error('Not enough donors were used, skipped');
                }

                if (finalText.length < 3000) {
                    await strapi.services.article.update({ id: article.id }, { tries: article.tries + 1 });
                    throw new Error('Not enough text length, skipped');
                }

                let meta = getMeta(keyword, parsedContent, finalText);
                console.log("[" + new Date().toISOString() + "] PROCESSING IMGS ...")
                let processedImages = await imgProcessing(domain, keyword, slug, finalContent); // returns [content, imgCount]
                
                finalContent = processedImages[0];
                console.log("[" + new Date().toISOString() + "] PARSING DONE ...")
                
                let updatedArt = await strapi.services.article.update({ id: article.id }, { is_done: true, title_h1: meta.h1, title_seo: meta.title, description_seo: meta.description, content_body: finalContent, text_body: finalText, text_length: finalContent.length, imgsCount: processedImages[1] });
                console.log("[" + new Date().toISOString() + "] TRYING TO UPLOAD ...");
                
                //console.log(finalContent);
                let uploaded = await uploadArticle(task, updatedArt);
                
                if (!uploaded) {
                    throw new Error('Upload error')
                } else {
                    console.log("[" + new Date().toISOString() + "] ARTICLE UPLOADED");
                }
                let elapsed = process.hrtime(timer)[0];
                console.log('TIME: ' + elapsed + ' seconds.');
            }
            
            if (article.is_done && !article.is_uploaded) {
                let exists = await articleExists(task, slug); //returns id or false
                let uploaded = await uploadArticle(task, article, exists);
                if (!uploaded)  {
                    throw new Error('Upload error')
                } else {
                    console.log("[" + new Date().toISOString() + "] ARTICLE UPLOADED ...");
                }
            }

            if (article.is_done && article.is_uploaded) {
                // await strapi.services.article.update({ id: article.id }, { content_body: '', text_body: '' });
                continue;
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
        } catch (err) {
            console.log(err);
            await strapi.services.task.update({ id: task.id }, { is_processing: false });
        }

    }, 
    startParsing2: async () => {
        const MAX_TASKS_RUNNING = 2;
        // check what is running
        let tasksInProgress = await strapi.services.task.find({ is_processing: true });
        if (tasksInProgress.length > MAX_TASKS_RUNNING - 1) {
            console.log('### TASKS IN PROGRESS: ' + tasksInProgress.length);
            return false;
        }
        // find tasks to run
        let tasksToProcess = await strapi.services.task.find({ is_enabled: true, is_finished: false, is_processing: false });
        if (tasksToProcess.length === 0) {
            console.log('### NOT FOUND TASKS TO RUN');
            return false;
        }
        console.log('### FOUND TASKS READY TO RUN: ' + tasksToProcess.length);
        let forLimit = MAX_TASKS_RUNNING > tasksToProcess.length ? tasksToProcess.length : MAX_TASKS_RUNNING;
        for (let i = 0; i < forLimit; i++) {
            const task = tasksToProcess[i];
            console.log('TASK #' + task.id + ' STARTED, DOMAIN: ' + task.domain);
            await strapi.services.task.update({ id: task.id }, { is_started: true, is_processing: true });

            parser(task).then(finished => {
                if (finished) {
                    console.log('TASK #' + task.id + ' FINISHED, DOMAIN: ' + task.domain);
                    strapi.services.task.update({ id: task.id }, { is_processing: false, is_finished: true });
                } else {
                    console.log('TASK #' + task.id + ' ABORTED, DOMAIN: ' + task.domain);
                    strapi.services.task.update({ id: task.id }, { is_processing: false, is_finished: false });
                }
            }).catch(err => {
                console.log('TASK #' + task.id + ' FAILED, DOMAIN: ' + task.domain);
                console.log(err);
                strapi.services.task.update({ id: task.id }, { is_processing: false });
            })

        }

    }
};
