/* 
Users table:

id
name
email
password
type [customer, banker]
balance
created_at
updated_at

Accounts table:

id
transaction type [deposited, withdrawed]
amount
user_id
created_at
updated_at

*/

exports.up = function (knex) {
	knex.schema.hasTable('users').then(function (exists) {
		if (!exists) {
			return knex.schema.createTable('users', function (t) {
				t.increments('id').primary();
				t.string('name', 100).notNullable();
				t.string('email', 100).notNullable();
				t.string('password', 100).notNullable();
				t.enum('type', ['BANKER', 'CUSTOMER']).notNullable();
				t.float('balance').defaultTo(0);
				t.timestamps(true, true);
			});
		}
	});

	knex.schema.hasTable('accounts').then(function (exists) {
		if (!exists) {
			return knex.schema.createTable('accounts', function (t) {
				t.increments('id').primary();
				t.integer('user_id').unsigned().notNullable();
				t.enum('type', ['DEPOSIT', 'WITHDRAW']).notNullable();
				t.float('amount').defaultTo(0);
				t.foreign('user_id').references('users.id');
				t.timestamps(true, true);
			});
		}
	});
};

exports.down = function (knex) {
	return knex.schema
		.dropTable('accounts')
		.dropTable('users')
		.then(() => {
			console.log('success');
		})
		.catch((err) => {
			console.log(err);
		});
};
