// Update with your config settings.
require('dotenv').config();

module.exports = {
	development: {
		client: 'mysql',
		connection: {
			user: process.env.DB_USER,
			password: process.env.DB_PWD,
			database: process.env.DB,
		},
		pool: {
			min: 2,
			max: 10,
		},
		migrations: {
			tableName: 'knex_migrations',
			directory: './src/migrations',
		},
	},

	production: {
		client: 'mysql',
		connection: {
			user: process.env.DB_USER,
			password: process.env.DB_PWD,
			database: process.env.DB,
		},
		pool: {
			min: 2,
			max: 10,
		},
		migrations: {
			tableName: 'knex_migrations',
		},
	},
};
