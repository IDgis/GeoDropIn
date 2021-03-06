import { Meteor } from 'meteor/meteor';
import { Email } from 'meteor/email';

Meteor.methods({
	sendMail: function(id, type) {
		var typeBeginUpperCase = type.charAt(0).toUpperCase() + type.slice(1);
		var emailMessage = 'GeoDropIn dataset with user ' + Meteor.user().username + ' and id ' + id + ' has been ' + type + '.'
		console.log(emailMessage);
		
		Email.send({from: process.env.GDI_MAIL_FROM, 
			to: process.env.GDI_MAIL_TO, 
			subject: typeBeginUpperCase + ': GeoDropIn dataset', 
			text: emailMessage});
	},

	sendMailFromServer: function(user, id, type) {
		var typeBeginUpperCase = type.charAt(0).toUpperCase() + type.slice(1);
		var emailMessage = 'GeoDropIn dataset with user ' + user + ' and id ' + id + ' has been ' + type + ' by REST-API.'
		console.log(emailMessage);
		
		Email.send({from: process.env.GDI_MAIL_FROM, 
			to: process.env.GDI_MAIL_TO, 
			subject: typeBeginUpperCase + ': GeoDropIn dataset', 
			text: emailMessage});
	}
});