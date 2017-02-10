import { Client } from '/imports/api/collections/client.js';
import { Geodata } from '/imports/api/collections/geodata.js';
import { Attachment } from '/imports/api/collections/attachment.js';
import { CouplingAttData } from '/imports/api/collections/couplingAttData.js';

Meteor.startup(function () {
	Meteor.publish('client', function() {
		return Client.find();
	});
	
	Meteor.publish('geodata', function() {
		return Geodata.find();
	});

	Meteor.publish('attachment', function() {
		return Attachment.find();
	});

	Meteor.publish('couplingAttData', function() {
		return CouplingAttData.find();
	});
});