const util = require('util');
const jwt = require('jsonwebtoken');

// Decode a JWT if it is valid or else throw the error
async function decodeJWT(token) {
	try {
		if (token) {
			const decoded = await util.promisify(jwt.verify)(
				token,
				process.env.JWT_SECRET
			);
			return decoded;
		} else {
			throw new Error('no access token');
		}
	} catch (err) {
		throw err;
	}
}

// To ensure that the requesting user is authenticated and he is a Customer
module.exports.ensureCustomerAuthenticated = async function (req, res, next) {
	const token =
		req.get('Authorization') && req.get('Authorization').split(' ')[1];

	try {
		const decodedJWT = await decodeJWT(token);
		if (decodedJWT.type === 'CUSTOMER') {
			req.decoded = decodedJWT;
			next();
		} else {
			throw new Error('banker cannot access this resource');
		}
	} catch (err) {
		return res.status(401).json({
			message: err.message,
		});
	}
};

// To ensure that the requesting user is authenticated and he is a Banker
module.exports.ensureBankerAuthenticated = async function (req, res, next) {
	const token =
		req.get('Authorization') && req.get('Authorization').split(' ')[1];

	try {
		const decodedJWT = await decodeJWT(token);
		if (decodedJWT.type === 'BANKER') {
			req.decoded = decodedJWT;
			next();
		} else {
			throw new Error('customer cannot access this resource');
		}
	} catch (err) {
		return res.status(401).json({
			message: err.message,
		});
	}
};
