const mongoose = require('mongoose')

const reqString = {
	type: String,
	required: true
}

const claimthreadSchema = mongoose.Schema({
	_id: reqString,
	title: reqString,
	lastpost: String
})

module.exports = mongoose.model('claim-threads', claimthreadSchema)