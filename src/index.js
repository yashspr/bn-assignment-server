require('dotenv').config();
const express = require('express');
const morgan = require('morgan'); // Logger
const cors = require('cors'); // To allow cross origin requests

const knex = require('knex')({
	client: 'mysql',
	connection: {
		host: '127.0.0.1',
		user: process.env.DB_USER,
		password: process.env.DB_PWD,
		database: process.env.DB,
	},
});

// Import Routes
const bankRoute = require('./routes/Banker');
const customerRoute = require('./routes/Customer');

const app = express();
app.locals.knex = knex;

app.use(morgan('dev'));
app.use(express.json());
app.use(cors());

app.use('/banker', bankRoute);
app.use('/customer', customerRoute);

app.listen(process.env.PORT, () => {
	console.log(`server started on port ${process.env.PORT}`);
});
