// module.exports = ({ env }) => ({
//   defaultConnection: 'default',
//   connections: {
//     default: {
//       connector: 'bookshelf',
//       settings: {
//         client: 'sqlite',
//         filename: env('DATABASE_FILENAME', '.tmp/data.db'),
//       },
//       options: {
//         useNullAsDefault: true,
//       },
//     },
//   },
// });
// module.exports = ({ env }) => ({
// 	defaultConnection: 'default',
// 	connections: {
// 		default: {
// 			connector: 'mongoose',
// 			settings: {
// 				host: env('DATABASE_HOST', '127.0.0.1'),
// 				srv: env.bool('DATABASE_SRV', false),
// 				port: env.int('DATABASE_PORT', 27017),
// 				database: env('DATABASE_NAME', 'strapi'),
// 				username: env('DATABASE_USERNAME', 'dev_acc'),
// 				password: env('DATABASE_PASSWORD', 'fr33dom!ssl@very'),
// 			},
// 			options: {
// 				authenticationDatabase: env('AUTHENTICATION_DATABASE', 'admin'),
// 				ssl: env.bool('DATABASE_SSL', false),
// 			},
// 		},
// 	},
// });
module.exports = ({ env }) => ({
	defaultConnection: 'default',
	connections: {
		default: {
			connector: 'bookshelf',
			settings: {
				client: 'mysql',
				host: env('DATABASE_HOST', '127.0.0.1'),
				port: env.int('DATABASE_PORT', 3306),
				database: env('DATABASE_NAME', 'strapi'),
				username: env('DATABASE_USERNAME', 'cherryvps'),
				password: env('DATABASE_PASSWORD', 'XyvY^n@p50]M'),
				ssl: env.bool('DATABASE_SSL', false),
			},
			options: {}
		},
	},
});