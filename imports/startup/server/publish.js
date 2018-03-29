import { Meteor } from 'meteor/meteor';

import { Geodata } from '/imports/api/collections/geodata.js';
import { CouplingAttData } from '/imports/api/collections/couplingAttData.js';

Meteor.methods({
	publishCollections: function(user) {
		Meteor.publish('geodata-' + user, function() {
    		return Geodata.find({ user: user });
    	});
    	
    	Meteor.publish('couplingAttData-' + user, function() {
    		var dataIds = Geodata.find({ user: user }, { fields: { _id: 1}}).map(function(doc) {return doc._id});
    		
    		return CouplingAttData.find({ 
    			dataId: { $in: dataIds } 
    		});
    	});
	}
});