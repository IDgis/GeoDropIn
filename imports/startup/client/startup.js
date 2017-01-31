Meteor.startup(function () {
	Meteor.subscribe('client');
	Meteor.subscribe('geodata');
	Meteor.subscribe('attachment');
	Meteor.subscribe('couplingAttData');
});