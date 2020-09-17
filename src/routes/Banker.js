const express = require('express');
const util = require('util');
const jwt = require('jsonwebtoken');

const { ensureBankerAuthenticated } = require('../utils/auth');

const route = express.Router();

// Banker Login
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
			.select('id', 'name', 'email', 'type')
			.where({
				email,
				password,
				type: 'BANKER',
			});

		if (data && data.length == 1) {
			// JWT Method which is callback based is converted into a Promise based method
			const jwtToken = await util.promisify(jwt.sign)(
				{
					userID: data[0].id,
					type: 'BANKER',
				},
				process.env.JWT_SECRET,
				{
					expiresIn: '1d',
				}
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

// Banker Sign up
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
			type: 'BANKER',
		});

		// Password is saved as is without hashing for the sake of simplicity
		// I am aware the password must be hashed and saved during production.
		if (data.length === 0) {
			const response = await knex('users').insert({
				email,
				name,
				password,
				type: 'BANKER',
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

// To get the transaction of a particular user given the user ID
route.get('/transactions/:id', ensureBankerAuthenticated, async (req, res) => {
	const userID = req.params.id;
	const knex = req.app.locals.knex;
	try {
		const user = await knex('users').select('id').where({
			id: userID,
		});

		if (user.length === 0) {
			return res.status(404).json({
				message: 'user not found',
			});
		}

		const transactions = await knex('accounts')
			.select()
			.where({
				user_id: userID,
			})
			.orderBy('created_at', 'desc');

		return res.status(200).json(transactions);
	} catch (err) {
		res.status(500).json({
			message: err.message,
		});
	}
});

// To retrieve the total balance in all customers' accounts
route.get('/balance/all', ensureBankerAuthenticated, async (req, res) => {
	const knex = req.app.locals.knex;

	try {
		const total = (await knex('users').sum('balance as total'))[0].total;
		return res.status(200).json({
			total,
		});
	} catch (err) {
		return res.status(500).json({
			message: err.message,
		});
	}
});

// To retrieve all the customers from the users table
route.get('/customers', ensureBankerAuthenticated, async (req, res) => {
	const knex = req.app.locals.knex;

	try {
		const users = await knex('users')
			.select('id', 'name', 'email', 'balance', 'created_at')
			.where({
				type: 'CUSTOMER',
			});
		return res.status(200).json(users);
	} catch (err) {
		return res.status(500).json({
			message: err.message,
		});
	}
});

// To get the user details of the currently logged in banker
route.get('/user', ensureBankerAuthenticated, async (req, res) => {
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
