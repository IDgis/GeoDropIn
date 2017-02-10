import './list.html';
import './list.css';

import { Geodata, GeodataSchema } from '/imports/api/collections/geodata.js';
import { Attachment } from '/imports/api/collections/attachment.js';
import { CouplingAttData, CouplingAttDataSchema } from '/imports/api/collections/couplingAttData.js';

Template.list.helpers({
	showGeodata: function(){
		return Geodata.find();
	},
	showAttachments: function(id){
		return CouplingAttData.find({dataId: id});
	},
	getAttachmentUrl: function(id) {
		return Attachment.findOne({_id: id}).copies.Attachment.key;	
	}
});

Template.list.events({
	'click #add-data-btn': function() {
		Router.go('formadd');
	},
	'click .js-remove-data': function(e) {
		var geodataId = e.target.id;
		var couplingObject = CouplingAttData.findOne({dataId: geodataId});
		var couplingId = couplingObject._id;
		var attIds = couplingObject.attachmentIds;
		
		Geodata.remove({_id: geodataId});
		CouplingAttData.remove({_id: couplingId});
		attIds.forEach(function(item) {
			Attachment.remove({_id: item});
		});
	}
});