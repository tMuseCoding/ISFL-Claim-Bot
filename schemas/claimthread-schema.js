const mongoose = require('mongoose')

const reqString = {
	type: String,
	required: true
}

const claimthreadSchema = mongoose.Schema({
	_id: reqString,
	claimthread: reqString,
	title: reqString
})

module.exports = mongoose.model('claim-threads', claimthreadSchema)