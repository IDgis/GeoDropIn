import './list.html';
import './list.css';

Template.list.events({
	'click #add-data-btn': function() {
		Router.go('form');
	}
});