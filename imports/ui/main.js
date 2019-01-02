import './main.html';
import './main.css';

Template.registerHelper('formatDate', function(date) {
	return moment(date).format('DD-MM-YYYY');
});

Template.main.helpers({
	userLogo: function() {
		if(Meteor.user()) {
			if(typeof process.env.GEODROPIN_HOST !== 'undefined') {
				return process.env.GEODROPIN_HOST + '/resources/logos/' + Meteor.user().username + '.png';
			} else {
				return '/logos/' + Meteor.user().username + '.png';
			}
		}
	}
});

Template.main.events({
	'click #app-logout': function() {
		AccountsTemplates.logout();
	}
});