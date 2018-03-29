import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { Geodata } from '/imports/api/collections/geodata.js';

export const CouplingAttDataSchema = new SimpleSchema({
  dataId: {
    type: String
  },
  attachmentIds: {
    type: [String]
  }
});

export const CouplingAttData = new Mongo.Collection('couplingAttData');
CouplingAttData.attachSchema(CouplingAttDataSchema);

CouplingAttData.allow({
	insert: function() {
		if(Meteor.user()) {
			return true;
		}
		
		return false;
	},
	
	update: function(userId, doc) {
		if(Meteor.user()) {
			var geodata = Geodata.findOne({_id: doc.dataId});
			if(geodata) {
				if(geodata.user === Meteor.user().username) {
					return true;
				}
			}
		}
		
		return false;
	},
	
	remove: function(userId, doc) {
		if(Meteor.user()) {
			var geodata = Geodata.findOne({_id: doc.dataId});
			if(geodata) {
				if(geodata.user === Meteor.user().username) {
					return true;
				}
			} else {
				return true;
			}
		}
		
		return false;
	}
});