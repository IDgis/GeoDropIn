import { Geodata } from '/imports/api/collections/geodata.js';
import { CouplingAttData } from '/imports/api/collections/couplingAttData.js';

export const Attachment = new FS.Collection("Attachment", {
	stores: [
	    new FS.Store.FileSystem("Attachment", {
	        path: '/var/lib/geodropinfiles'
        })
    ],
    chunkSize: 20 * 1024 * 1024
});

Attachment.allow({
	insert: function(userId) {
		if(userId) {
			return true;
		}
		
		return false;
	},
	
	update: function(userId) {
		return false;
	},
	
	remove: function(userId, doc) {
		if(userId) {
			var user = Meteor.users.find({_id: userId}, { fields: {username: 1}}).map(function(doc) {return doc.username})[0];
			
			var geodataId = CouplingAttData.find({attachmentIds: { $in: [doc._id] } }, { fields: {dataId: 1}}).map(function(doc) {return doc.dataId})[0];
    		
			if(geodataId) {
				var geodataUser = Geodata.find({_id: geodataId}, {fields: {user: 1}}).map(function(doc) {return doc.user})[0];
				
				if(user === geodataUser) {
					return true;
				} else {
					return false;
				}
			} else {
				return true;
			}
		}
		
		return false;
	}
});