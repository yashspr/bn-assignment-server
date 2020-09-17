const express = require('express');
const jwt = require('jsonwebtoken');
const util = require('util');

const {
	ensureCustomerAuthenticated: ensureAuthenticated,
} = require('../utils/auth');

const route = express.Router();

// Customer Login
route.post('/login', async (req, res) => {
	const knex = req.app.locals.knex;

	const email = req.body.email;
	const password = req.body.password;

	if (!email || !password) {
		return res.status(400).json({
			message: 'insufficient data',
		});
	}

	try {
		const data = await knex('users')
			.select('id', 'name', 'email', 'balance', 'type')
			.where({
				email,
				password,
				type: 'CUSTOMER',
			});

		if (data && data.length == 1) {
			const jwtToken = await util.promisify(jwt.sign)(
				{
					userID: data[0].id,
					type: 'CUSTOMER',
				},
				process.env.JWT_SECRET,
				{
					expiresIn: '5m',
				}
				/* 
					The expiry duration for a customer is kept only 5 mins keeping in mind the 
					short sessions that customers must have to maintain security
				*/
			);
			return res.status(200).json({
				message: 'success',
				token: jwtToken,
				user: data[0],
			});
		} else {
			return res.status(401).json({
				message: 'unauthorized',
			});
		}
	} catch (err) {
		res.status(500).json({
			message: err.message,
		});
	}
});

// Customer Sign up
route.post('/signup', async (req, res) => {
	const knex = req.app.locals.knex;

	const email = req.body.email;
	const name = req.body.name;
	const password = req.body.password;

	if (!email || !password || !name) {
		return res.status(400).json({
			message: 'insufficient data',
		});
	}

	try {
		const data = await knex.select('email').from('users').where({
			email,
			type: 'CUSTOMER',
		});

		// Password is saved as is without hashing for the sake of simplicity
		// I am aware the password must be hashed and saved during production.
		if (data.length === 0) {
			const response = await knex('users').insert({
				email,
				name,
				password,
				type: 'CUSTOMER',
			});

			res.status(201).json({
				message: 'user created successfully',
			});
		} else {
			return res.status(409).json({
				message: 'user exists',
			});
		}
	} catch (err) {
		res.status(500).json({
			message: err.message,
		});
	}
});

// Allow a customer to deposit into his/her account
route.post('/deposit', ensureAuthenticated, async (req, res) => {
	const knex = req.app.locals.knex;
	const amount = req.body.amount;
	let newBalance = null;

	if (amount == null || amount == undefined || amount <= 0) {
		return res.status(400).json({
			message: 'insufficient or invalid data',
		});
	}

	try {
		await knex.transaction(async (trx) => {
			// first we retrieve existing balance of the user.
			const user = await trx
				.select('balance')
				.from('users')
				.where({ id: req.decoded.userID });

			if (user.length > 0) {
				newBalance = amount + user[0].balance;

				await trx('users').where({ id: req.decoded.userID }).update({
					balance: newBalance,
				});

				await trx('accounts').insert({
					user_id: req.decoded.userID,
					type: 'DEPOSIT',
					amount,
				});
			} else {
				return res.status(401).json({
					message: 'user not found',
				});
			}
		});
	} catch (err) {
		return res.status(500).json({
			message: err.message,
		});
	}

	return res.status(200).json({ message: 'success', newBalance });
});

// Allows a customer to withdraw from his/her account
route.post('/withdraw', ensureAuthenticated, async (req, res) => {
	const knex = req.app.locals.knex;
	const amount = req.body.amount;
	let newBalance = null;

	if (amount == null || amount == undefined || amount <= 0) {
		return res.status(400).json({
			message: 'insufficient or invalid data',
		});
	}

	try {
		await knex.transaction(async (trx) => {
			// first we retrieve existing balance of the user.
			const user = await trx
				.select('balance')
				.from('users')
				.where({ id: req.decoded.userID });

			if (user.length > 0) {
				const balance = user[0].balance;
				if (amount <= balance) {
					newBalance = balance - amount;

					await trx('users').where({ id: req.decoded.userID }).update({
						balance: newBalance,
					});

					await trx('accounts').insert({
						user_id: req.decoded.userID,
						type: 'WITHDRAW',
						amount,
					});
				} else {
					return res.status(403).json({
						message: 'No sufficient fund',
					});
				}
			} else {
				return res.status(401).json({
					message: 'user not found',
				});
			}
		});
	} catch (err) {
		return res.status(500).json({
			message: err.message,
		});
	}

	return res.status(200).json({ message: 'success', newBalance });
});

// To get all the accounts of the currently logged in customer
route.get('/transactions', ensureAuthenticated, async (req, res) => {
	const knex = req.app.locals.knex;

	try {
		const transactions = await knex('accounts')
			.select('id', 'type', 'amount', 'created_at', 'updated_at')
			.where({ user_id: req.decoded.userID })
			.orderBy('created_at', 'desc');

		return res.status(200).json(transactions);
	} catch (err) {
		return res.status(500).json({
			message: err.message,
		});
	}
});

// To get the details of the currently logged in customer
route.get('/user', ensureAuthenticated, async (req, res) => {
	const knex = req.app.locals.knex;

	try {
		const user = await knex('users')
			.select('name', 'email', 'balance', 'type')
			.where({
				id: req.decoded.userID,
			});

		if (user.length == 0) {
			return res.status(404).json({
				message: 'user not found',
			});
		}

		return res.status(200).json(user[0]);
	} catch (err) {
		res.status(500).json({
			message: err.message,
		});
	}
});

module.exports = route;
