Accounts.onLogin(function() {
	if(Meteor.user()) {
		Meteor.subscribe('geodata-' + Meteor.user().username);
		Meteor.subscribe('couplingAttData-' + Meteor.user().username);
	}
});