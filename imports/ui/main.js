import './main.html';
import './main.css';

Template.registerHelper('formatDate', function(date) {
	return moment(date).format('DD-MM-YYYY');
});

Template.main.events({
	'click #app-logout': function() {
		AccountsTemplates.logout();
	}
});