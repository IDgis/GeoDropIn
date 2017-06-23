import { Meteor } from 'meteor/meteor';
import { Email } from 'meteor/email';

Meteor.methods({
	sendMail: function(id, type) {
		var typeBeginUpperCase = type.charAt(0).toUpperCase() + type.slice(1);
		
		Email.send({from: Meteor.settings.email, 
			to: Meteor.settings.email, 
			subject: typeBeginUpperCase + ': GeoDropIn dataset', 
			text: 'GeoDropIn dataset with user ' + Meteor.user().username + ' and id ' + id + ' has been ' + type + '.'});
	}
});