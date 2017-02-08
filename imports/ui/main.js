import './main.html';
import './main.css';

Template.registerHelper('formatDate', function(date) {
	return moment(date).format('DD-MM-YYYY');
});