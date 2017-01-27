import './form.html';
import './form.css';

Template.form.events({
	'click #js-form-cancel': function() {
		Router.go('list');
	}
});