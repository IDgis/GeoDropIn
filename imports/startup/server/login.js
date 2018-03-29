import { Meteor } from 'meteor/meteor';

var myMsg = 'Incorrect Login';
Accounts.validateLoginAttempt(function(attempt) {
    if(attempt.error){
        var reason = attempt.error.reason;
        if(reason === "User not found" || reason === "Incorrect password")
            throw new Meteor.Error(403, myMsg);
    }
    
    if(attempt.user) {
    	Meteor.call('publishCollections', attempt.user.username);
    }
     
    return attempt.allowed;
});