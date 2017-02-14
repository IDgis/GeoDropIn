Meteor.startup(function () {
	Meteor.subscribe('geodata');
	Meteor.subscribe('attachment');
	Meteor.subscribe('couplingAttData');
});