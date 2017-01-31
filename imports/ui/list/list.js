import './list.html';
import './list.css';

import { Geodata, GeodataSchema } from '/imports/api/collections/geodata.js';
import { Attachment } from '/imports/api/collections/attachment.js';
import { CouplingAttData, CouplingAttDataSchema } from '/imports/api/collections/couplingAttData.js';

Template.list.helpers({
	showAttachment: function(){
		return Attachment.find();
	}
});

Template.list.events({
	'click #add-data-btn': function() {
		Router.go('form');
	}
});