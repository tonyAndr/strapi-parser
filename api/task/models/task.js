'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

const createArticleLogic = async (data) => {
    // console.log(data);

    try {
        let parentId = data.id;
        if (data.keywords) {
            let kws = data.keywords.trim().split('\n');

            for (let i = 0; i < kws.length; i++) {
                let kwPair = kws[i].split('\t');

                let exists = await strapi.services.article.findOne({ task: parentId, keyword: kwPair[0].trim() });
                if (!exists) {
                    let article = {
                        keyword: kwPair[0].trim(),
                        task: parentId,
                        category: kwPair[1].trim()
                    }
                    await strapi.services.article.create(article);
                }
            }
            
        }
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }

}

module.exports = {
    lifecycles: {
        async afterCreate(data) {
            createArticleLogic(data).then(res => {
                if (res) {
                    strapi.services.task.update({ id: data.id }, { keywords: '' });
                }
            });       
        },
        async afterUpdate(result, params, data) {
            createArticleLogic(data).then(res => {
                if (res) {
                    strapi.services.task.update({ id: data.id }, { keywords: '' });
                }
            });
        }
    },
};