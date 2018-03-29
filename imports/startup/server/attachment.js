import { Meteor } from 'meteor/meteor';

import { Attachment } from '/imports/api/collections/attachment.js';

Meteor.methods({
	
    getAttachment: function(ids) {
    	var result = Attachment.find({_id: {$in: ids}}).fetch();
    	
    	var attachments = [];
    	result.forEach(function(item) {
    		var object = {id: item._id, name: item.copies.Attachment.key};
    		attachments.push(object);
    	});
    	
    	return attachments;
    }
});