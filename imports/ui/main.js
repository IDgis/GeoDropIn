import './main.html';
import './main.css';

Template.registerHelper('formatDate', function(date) {
	return moment(date).format('DD-MM-YYYY');
});

Template.main.helpers({
	userLogo: function() {
		if(Meteor.user()) {
		    return '/resources/logos/' + Meteor.user().username + '.png';
		}
	}
});

Template.main.events({
	'click #app-logout': function() {
		AccountsTemplates.logout();
	}
});