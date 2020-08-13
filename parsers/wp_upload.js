// wp api upload article + imgs

const WPAPI = require('wpapi');
const fs = require('fs')
// const path = require('path')
const NodeSSH = require('node-ssh').NodeSSH
const ssh = new NodeSSH()
const rimraf = require("rimraf");

const createPost = async (task, article) => {
    try {
        var wp = new WPAPI({
            endpoint: 'https://' + task.domain + '/wp-json',
            // This assumes you are using basic auth, as described further below
            username: task.wp_user,
            password: task.wp_password
        });

        let response = await wp.posts().create({
            // "title" and "content" are the only required properties
            title: article.title_h1,
            content: article.content_body,
            // Post will be created as a draft by default if a specific "status"
            // is not specified
            status: 'publish',
            meta: {
                '_aioseop_title': article.title_seo,
                '_aioseop_description': article.description_seo
            }
        });
        console.log(response);
        return response;
    } catch (err) {
        console.log(err);
        return false;
    }

}

const uploadMedia = async (task, article) => {
    try {
        let connection = await ssh.connect({
            host: task.server_domain,
            port: 7248,
            username: task.ssh_user,
            password: task.ssh_password
        })
        
        const failed = []
        const successful = []
        let status = await connection.putDirectory('./tmp_images/' + task.domain + '/' + article.slug, 
            '/home/' + task.ssh_user + '/domains/' + task.domain + '/public_html/wp-content/uploads/posts/' + article.slug, 
            {
            recursive: true,
            concurrency: 5,
            // ^ WARNING: Not all servers support high concurrency
            // try a bunch of values and see what works on your server
            tick: function (localPath, remotePath, error) {
                if (error) {
                    failed.push(localPath)
                } else {
                    successful.push(localPath)
                }
            }
        })
        console.log('the directory transfer was', status ? 'successful' : 'unsuccessful')
        if (!status) {
            console.log('failed transfers', failed.join(', '))
            console.log('successful transfers', successful.join(', '))
            throw new Error('files upload fail')
        }

        // let files = await ssh.putFiles([{ local: './tmp_images/'+task.domain + '/' +article.slug, remote:  }]);
        rimraf.sync('./tmp_images/' + task.domain + '/' + article.slug);
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }

}

// ИСТОЧНИКИ
// сохранить источники блоков отдельно в массив, загнать их через апи.
// на сайте под каждым блоком сделать кнопку ИСТОЧНИК - по нажатию фетчить из мета нужную ссыль
// еще черный список незабыть для доменов и прочей шелухи для доноров

module.exports = {
    uploadArticle: async (task, article) => {
        try {
            let post = await createPost(task, article);
            let mediaUploaded = await uploadMedia(task, article);

            if (post.id) {
                await strapi.services.article.update({ id: article.id }, { wp_id: post.id });
            } else {
                throw new Error("Rest API returned error")
            }

            if (mediaUploaded) {
                await strapi.services.article.update({ id: article.id }, { is_uploaded: true });
            }
            return true;
        } catch (err) {
            console.log(err)
            return false;
        }
    }
}