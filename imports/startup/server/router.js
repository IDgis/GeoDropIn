import { Meteor } from 'meteor/meteor';
import { Router } from 'meteor/iron:router';

import { Attachment } from '/imports/api/collections/attachment.js';

Router.route('/files/:id', function() {
	var fs = require('fs');
	var path = require('path');
	
	var att = Attachment.findOne({_id: this.params.id});
	var filename = att.copies.Attachment.key;
	var contentType = att.copies.Attachment.type;
	
	var filePath = path.resolve('/shapefiles/' + filename);
	var data = fs.readFileSync(filePath);
    
	this.response.writeHead(200, {
	    'Content-Type': contentType,
	    'Content-Disposition': 'attachment; filename=' + filename,
	    'Content-Length': data.length
	  });
	this.response.write(data);
	this.response.end();
}, {where: 'server'});