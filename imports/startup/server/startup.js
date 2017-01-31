import { Geodata } from '/imports/api/collections/geodata.js';
import { Attachment } from '/imports/api/collections/attachment.js';
import { Client } from '/imports/api/collections/client.js';

Meteor.startup(function () {
	Meteor.publish('geodata', function() {
		return Geodata.find();
	});

	Meteor.publish('attachment', function() {
		return Attachment.find();
	});

	Meteor.publish('client', function() {
		return Client.find();
	});
});