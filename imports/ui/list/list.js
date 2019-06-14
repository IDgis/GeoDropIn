import './list.html';
import './list.css';

import { Meteor } from 'meteor/meteor';
import { Blaze } from 'meteor/blaze';

import { Geodata, GeodataSchema } from '../../api/collections/geodata.js';
import { Attachment } from '../../api/collections/attachment.js';
import { CouplingAttData, CouplingAttDataSchema } from '../../api/collections/couplingAttData.js';
import { utils } from '../../../lib/utils';

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
	},
	equals: function(value1, value2) {
		return value1 === value2;
	}
});

Template.list.events({
	'click #add-data-btn': function() {
		Router.go('formadd');
	},
	'click .js-remove-data': function(e) {
		const geodataId = e.target.id;
		const geodata = Geodata.findOne({ _id: geodataId });

		Blaze.renderWithData(
			Template.removeValidation,
			{ id: geodata._id, name: geodata.name },
			document.getElementById('popup-location')
		)
	},
	'click .js-validation-status': function(e) {
		var geodataId = e.target.parentElement.dataset.id;
		var geodata = Geodata.findOne({ _id: geodataId });

		var id = `${geodata._id}-validation`;
		var status = geodata.validationStatus || 'ONBEKEND';
		var message = geodata.validationMessage || 'Onbekende status, sla opnieuw op om de status te bepalen'

		Blaze.renderWithData(
			Template.popup,
			{ id, message, status },
			document.getElementById('popup-location')
		);
	},
	'click .js-process-status': function(e) {
		var geodataId = e.target.parentElement.dataset.id;
		var geodata = Geodata.findOne({ _id: geodataId });

		var id = `${geodata._id}-status`;
		var status = geodata.uploadStatus || 'ONBEKEND';
		var message = geodata.uploadMessage || 'Onbekende status, sla opnieuw op om de status te bepalen';

		Blaze.renderWithData(
			Template.popup,
			{ id, message, status },
			document.getElementById('popup-location')
		);
	}
});
