const mongoose = require('mongoose')

const reqString = {
	type: String,
	required: true
}

const subscribedrolesSchema = mongoose.Schema({
	_id: reqString,
	role: reqString
})

module.exports = mongoose.model('subscribed-roles', subscribedrolesSchema)