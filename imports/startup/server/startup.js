import { Client } from '/imports/api/collections/client.js';
import { Geodata } from '/imports/api/collections/geodata.js';
import { Attachment } from '/imports/api/collections/attachment.js';
import { CouplingAttData } from '/imports/api/collections/couplingAttData.js';

import { Accounts } from 'meteor/accounts-base';

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
	
	var myMsg = 'Incorrect Login';
    Accounts.validateLoginAttempt(function(attempt) {
        if(attempt.error){
            var reason = attempt.error.reason;
            if(reason === "User not found" || reason === "Incorrect password")
                throw new Meteor.Error(403, myMsg);
        }
         
        return attempt.allowed;
    });
});