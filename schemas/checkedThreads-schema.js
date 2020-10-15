const mongoose = require('mongoose')

const reqString = {
	type: String,
	required: true
}

const checkedthreadsSchema = mongoose.Schema({
	_id: reqString,
	claimthread: reqString,
	lastPostId: reqString
})

module.exports = mongoose.model('checked-threads', checkedthreadsSchema)