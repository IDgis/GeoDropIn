import './list.html';
import './list.css';

import { Meteor } from 'meteor/meteor';

import { Geodata, GeodataSchema } from '/imports/api/collections/geodata.js';
import { Attachment } from '/imports/api/collections/attachment.js';
import { CouplingAttData, CouplingAttDataSchema } from '/imports/api/collections/couplingAttData.js';

Template.list.onRendered(function() {
	if(Meteor.user()) {
		Meteor.subscribe('couplingAttData-' + Meteor.user().username);
	}
});

Template.list.helpers({
	showGeodata: function(){
		if(Meteor.user()) {
			return Geodata.find({user: Meteor.user().username}, {sort: {date: -1}});
		}
	},
	showAttachments: function(id){
		return CouplingAttData.find({dataId: id});
	}
});

Template.list.events({
	'click #add-data-btn': function() {
		Router.go('formadd');
	},
	'click .js-remove-data': function(e) {
		var geodataId = e.target.id;
		Geodata.remove({_id: geodataId});
		var couplingObject = CouplingAttData.findOne({dataId: geodataId});
		
		Meteor.call('sendMail', geodataId, 'deleted');
		
		if(couplingObject) {
			var couplingId = couplingObject._id;
			var attIds = couplingObject.attachmentIds;
			Meteor.call('runDockerImage', geodataId, attIds[0], 'delete');
			
			CouplingAttData.remove({_id: couplingId});
			attIds.forEach(function(item) {
				Attachment.remove({_id: item});
			});
		}
	}
});