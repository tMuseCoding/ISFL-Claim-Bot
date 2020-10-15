const mongoose = require('mongoose')

const reqString = {
	type: String,
	required: true
}

const claimchannelSchema = mongoose.Schema({
	_id: reqString,
	channelId: reqString
})

module.exports = mongoose.model('claim-channels', claimchannelSchema)