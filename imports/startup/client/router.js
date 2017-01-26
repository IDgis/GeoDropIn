import { Meteor } from 'meteor/meteor';
import { Router } from 'meteor/iron:router';

import '/imports/ui/main.js';
import '/imports/ui/list/list.js';
import '/imports/ui/form/form.js';

Router.configure({
	layoutTemplate: 'main'
});

Router.route('/index', function () {
	this.render('list');
	}, {
		name: 'list'
});

Router.route('/form', function () {
	this.render('form');
	}, {
		name: 'form'
});