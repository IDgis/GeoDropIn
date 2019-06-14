import { Meteor } from 'meteor/meteor';
import { Router } from 'meteor/iron:router';

import '/imports/ui/main.js';
import '/imports/ui/list/list.js';
import '/imports/ui/form/form.js';
import '/imports/ui/popup/popup.js';
import '/imports/ui/unauthorized/unauthorized.js';
import '/imports/ui/notfound/notfound.js';

import { Geodata } from '/imports/api/collections/geodata.js';

Router.configure({
	layoutTemplate: 'main'
});

Router.route('/', function() {
	this.redirect('/index');
})

Router.route('/index', function() {
	this.render('list');
	}, {
		name: 'list'
});

Router.route('/form/add', function() {
	Session.set('selectedGeodataId', null);
	
	this.render('form');
	}, {
		name: 'formadd'
});

Router.route('/form/edit/:_id', function() {
	Session.set('selectedGeodataId', this.params._id);
	
	var geodata = Geodata.findOne({_id: Session.get('selectedGeodataId')});
	var user = Meteor.user();
	
	if(typeof geodata === 'undefined') {
		this.render('notfound');
	} else if(user !== null) {
		if(geodata.user === user.username) {
			var data = Geodata.findOne({_id: this.params._id});
			this.render('form', {data: data});
		} else {
			this.render('unauthorized');
		}
	}
	
	}, {
		name: 'formedit'
});