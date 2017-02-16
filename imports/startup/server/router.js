import { Meteor } from 'meteor/meteor';
import { Router } from 'meteor/iron:router';

import { Geodata } from '/imports/api/collections/geodata.js';
import { Attachment } from '/imports/api/collections/attachment.js';
import { CouplingAttData } from '/imports/api/collections/couplingAttData.js';

Router.route('/files/:id', function() {
	var fs = require('fs');
	var path = require('path');
	
	var att = Attachment.findOne({_id: this.params.id});
	var filename = att.copies.Attachment.key;
	var contentType = att.copies.Attachment.type;
	
	var pathDir = '/var/lib/geodropinfiles/';
	var filePath = path.resolve(pathDir + filename);
	var data = fs.readFileSync(filePath);
    
	this.response.writeHead(200, {
	    'Content-Type': contentType,
	    'Content-Disposition': 'attachment; filename=' + filename,
	    'Content-Length': data.length
	});
	
	this.response.write(data);
	this.response.end();
}, {where: 'server'});

Router.route('/logos/:filename', function() {
	var fs = require('fs');
	var path = require('path');
	
	var pathDir = '/var/lib/geodropinlogos/';
	var filename = this.params.filename;
	
	var filePath = path.resolve(pathDir + filename);
	var data = fs.readFileSync(filePath);
    
	this.response.writeHead(200, {
	    'Content-Type': 'image/png',
	    'Content-Disposition': 'attachment; filename=' + filename,
	    'Content-Length': data.length
	});
	
	this.response.write(data);
	this.response.end();
}, {where: 'server'});

Router.route('/json/all/:user', function() {
	var user = this.params.user;
	var json = [];
	
	var geodata = Geodata.find({user: user});
	geodata.forEach(function(item) {
		var attUrls = [];
		var cad = CouplingAttData.findOne({dataId: item._id});
		
		cad.attachmentIds.forEach(function(item) {
			var attUrl = Meteor.absoluteUrl() + 'files/' + item;
			attUrls.push(attUrl);
		});
		
		var object = {_id: item._id, title: item.title, description: item.description, 
						date: item.date, user: item.user, lastRevisionDate: item.lastRevisionDate,
						attachmentIds: attUrls};
		
		json.push(object);
	});
	
	this.response.writeHead(200, {
	    'Content-Type': 'application/json; charset=UTF-8'
	});
	
	this.response.end(EJSON.stringify(json, {indent: true}));
}, {where: 'server'});

Router.route('/json/twoweeks/:user', function() {
	var user = this.params.user;
	var json = [];
	
	var dateTwoWeeksAgo = new Date();
	dateTwoWeeksAgo.setDate(dateTwoWeeksAgo.getDate() - 14);
	
	var geodata = Geodata.find({user: user, lastRevisionDate: {$gte : dateTwoWeeksAgo, $lt: new Date()}});
	geodata.forEach(function(item) {
		var attUrls = [];
		var cad = CouplingAttData.findOne({dataId: item._id});
		
		cad.attachmentIds.forEach(function(item) {
			var attUrl = Meteor.absoluteUrl() + 'files/' + item;
			attUrls.push(attUrl);
		});
		
		var object = {_id: item._id, title: item.title, description: item.description, 
						date: item.date, user: item.user, lastRevisionDate: item.lastRevisionDate,
						attachmentIds: attUrls};
		
		json.push(object);
	});
	
	this.response.writeHead(200, {
	    'Content-Type': 'application/json; charset=UTF-8'
	});
	
	this.response.end(EJSON.stringify(json, {indent: true}));
}, {where: 'server'});