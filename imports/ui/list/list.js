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
		Router.go('form');
	}
});