'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
    lifecycles: {
        async afterCreate(data) {
            console.log(data);
            
            let parentId = data.id;
            let kws = data.keywords.split(", ");

            for (let i = 0; i < kws.length; i++) {
                let article = {
                    keyword: kws[i],
                    task: parentId
                }
                await strapi.services.article.create(article);
            }
        },
    },
};