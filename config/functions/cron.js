'use strict';

/**
 * Cron config that gives you an opportunity
 * to run scheduled jobs.
 *
 * The cron format consists of:
 * [SECOND (optional)] [MINUTE] [HOUR] [DAY OF MONTH] [MONTH OF YEAR] [DAY OF WEEK]
 *
 * See more details here: https://strapi.io/documentation/v3.x/concepts/configurations.html#cron-tasks
 */
const { sanitizeEntity } = require('strapi-utils');
const { searchYA } = require('../../parsers/search/yandex');
const { getHtml } = require('../../parsers/get_html/get');


module.exports = {

  '35 * * * * *': async () => {
    try {
      console.log("test")
      let entities = await strapi.services.task.find();
      let urls = await searchYA(entities[0].articles[0].keyword);
      let parsedContent = await getHtml(urls);
      console.log(parsedContent);
    } catch (err) {
      console.log(err)
    }

    // .then(entities => {
      
    //   // 
    // }).catch(err => );
  }
};

