import { Meteor } from 'meteor/meteor';
import { Router } from 'meteor/iron:router';

import { Attachment } from '../../api/collections/attachment';
import { Geodata, GeodataSchema } from '../../api/collections/geodata';
import { CouplingAttData, CouplingAttDataSchema } from '../../api/collections/couplingAttData';
import { Buffer } from 'buffer';

Router.route('/api/form/v1', {
	where: 'server',
	onBeforeAction: function(req, res, next) {
        if(req.headers.accept !== 'application/json') {
            var title = 'Invalid response format. Can only return application/json';
            var status = 406;

            writeResponse(res, title, status);
        } else if((req.headers['content-type']).indexOf('multipart/form-data') === -1) {
            var title = 'Invalid upload format. Should be multipart/form-data';
            var status = 415;
            
            writeResponse(res, title, status);
        } else if(req.method === 'POST') {
			var authHeader = req.headers.authorization.split(' ');
			var authType = authHeader[0];
            var authEncoded = authHeader[1];
            var responseJson = {};
            
            // Check if basic authorization
            if(authType === 'Basic') {
                var credentials = new Buffer(authEncoded, 'base64').toString('ascii').split(':');
                var username = credentials[0];
                var password = credentials[1];
                var user = Meteor.users.findOne({username: username});

                // Check if user exists
                if(user) {
                    var result = Accounts._checkPassword(user, password);

                    // Check if password is valid
                    if(result.error) {
                        var title = 'Invalid password.';
                        var status = 401;
                        
                        writeResponse(res, title, status);
                    } else {
                        // Authentication success. Proceed request method in next call.
                        next();
                    }
                } else {
                    var title = 'Invalid username. User ' + username + ' does not exist.';
                    var status = 401;
                    
                    writeResponse(res, title, status);
                }
            } else {
                var title = 'Invalid login method. Please use Basic Authorization';
                var status = 401;
				
                writeResponse(res, title, status);
            }
		} else {
            var title = 'Method ' + req.method + ' not allowed!';
            var status = 405;
            
            writeResponse(res, title, status);
		}
	}
}).post(function(req, res) {
    var authHeader = req.headers.authorization.split(' ');
    var authType = authHeader[0];
    var authEncoded = authHeader[1];
    var credentials = new Buffer(authEncoded, 'base64').toString('ascii').split(':');
    var username = credentials[0];

    var Busboy = require('busboy');
    var busboy = new Busboy({ headers: req.headers });
    var inspect = require('util').inspect;

    var buf;
    var fileName;
    var postBody = {};
    var newFile = new FS.File();
    
    // Get the uploaded file
    busboy.on('file', Meteor.bindEnvironment(function(fieldname, file, filename, encoding, mimetype) {
        var bufs = [];
        file.on('data', function(data) {
            bufs.push(data);
        });
        file.on('end', Meteor.bindEnvironment(function() {
            buf = Buffer.concat(bufs);
            newFile.attachData(buf, {type: mimetype}, function(err) {
                if(err) {
                    console.log(err);
                }
            });
            fileName = filename;
        }));
    }));

    // Get the request body
    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
        postBody[fieldname] = val;
    });

    // Handle POST request
    busboy.on('finish', Meteor.bindEnvironment(function() {
        // https://stuk.github.io/jszip/documentation/howto/read_zip.html
        var JSZip = require('jszip');
        JSZip.loadAsync(buf).then(function(zip) {
            var objectKey = Object.keys(zip.files)[0];
            var shapename = objectKey.split('.')[0];
            var tables = Geodata.find({user: username, tableName: shapename}).fetch();
            var nameExists = Geodata.find({user: username, name: postBody.name}).fetch();
        
            if(tables.length > 0) {
                var title = 'Shapefile with name ' + shapename + ' already exists!';
                var status = 409;

                writeResponse(res, title, status);
            } else if(nameExists.length > 0) {
                var title = 'Dataset with name ' + postBody.name + ' already exists!';
                var status = 409;
                
                writeResponse(res, title, status);
            } else if(postBody.name === undefined || postBody.name === undefined || postBody.description === undefined || postBody.date === undefined) {
                var title = 'Not all required parameters are entered. Please specify name, title, description and date';
                var status = 400;
                
                writeResponse(res, title, status);
            } else {
                var attachment = Attachment.insert(newFile, Meteor.bindEnvironment(function(err, fileObj) {
                    if(err) {
                        console.log(err);
                    }
                    fileObj.name(fileName);
                }));
                var pattern = /(\d{2})-(\d{2})-(\d{4})/;
                var dataId = Geodata.insert({
                    name: postBody.name,
                    title: postBody.title,
                    description: postBody.description,
                    date: new Date(postBody.date.replace(pattern, '$3-$2-$1')),
                    user: username,
                    tableName: shapename
                });
                CouplingAttData.insert({dataId: dataId, attachmentIds: [attachment._id]});

                var zipFile = 'Attachment-' + attachment._id + '-' + fileName;
                var zipName = zipFile.substr(0, zipFile.indexOf('.zip')); 
                
                Meteor.call('runDockerImageFromServer', username, dataId, zipName, 'insert');
                Meteor.call('sendMailFromServer', username, dataId, 'inserted');

                writeResponse(res, '', 201);
            }
        });
    }));

    req.pipe(busboy);
});

Router.route('/api/form/v1/:_name', {
	where: 'server',
	onBeforeAction: function(req, res, next) {
        var geodata = Geodata.findOne({name: this.params._name});
        if(geodata === undefined) {
            var title = 'No dataset with name ' + this.params._name + ' found.';
            var status = 404;
            
            writeResponse(res, title, status);
        } else if(req.headers.accept !== 'application/json') {
            var title = 'Invalid response format. Can only return application/json';
            var status = 406;
            
            writeResponse(res, title, status);
        } else if(req.method === 'DELETE' || req.method === 'PUT') {
			var authHeader = req.headers.authorization.split(' ');
			var authType = authHeader[0];
            var authEncoded = authHeader[1];
            
            // Check if basic authorization
            if(authType === 'Basic') {
                var credentials = new Buffer(authEncoded, 'base64').toString('ascii').split(':');
                var username = credentials[0];
                var password = credentials[1];
                var user = Meteor.users.findOne({username: username});

                // Check if user exists
                if(user) {
                    var result = Accounts._checkPassword(user, password);

                    // Check if password is valid
                    if(result.error) {
                        var title = 'Invalid password.';
                        var status = 401;
                        
                        writeResponse(res, title, status);
                    } else {
                        // Authentication success. Proceed request method in next call.
                        next();
                    }
                } else {
                    var title = 'Invalid username. User ' + username + ' does not exist.';
                    var status = 401;
                    
                    writeResponse(res, title, status);
                }
            } else {
                var title = 'Invalid login method. Please use Basic Authorization';
                var status = 401;
				
                writeResponse(res, title, status);
            }
		} else if((req.headers['content-type']).indexOf('multipart/form-data') === -1 && req.method === 'PUT') {
            var title = 'Invalid upload format. Should be multipart/form-data';
            var status = 415;
            
            writeResponse(res, title, status);
        } else {
            var title = 'Method ' + req.method + ' not allowed!';
            var status = 405;
            
            writeResponse(res, title, status);
		}
	}
}).put(function(req, res) {
    var authHeader = req.headers.authorization.split(' ');
    var authType = authHeader[0];
    var authEncoded = authHeader[1];
    var credentials = new Buffer(authEncoded, 'base64').toString('ascii').split(':');
    var username = credentials[0];
    var datasetName = this.params._name;

    var Busboy = require('busboy');
    var busboy = new Busboy({ headers: req.headers });
    var inspect = require('util').inspect;

    var newFile = new FS.File();
    var postBody = {};
    var fileName;
    var buf;
    
    // Get the uploaded file
    busboy.on('file', Meteor.bindEnvironment(function(fieldname, file, filename, encoding, mimetype) {
        var bufs = [];
        file.on('data', function(data) {
            bufs.push(data);
        });
        file.on('end', Meteor.bindEnvironment(function() {
            buf = Buffer.concat(bufs);
            newFile.attachData(buf, {type: mimetype}, function(err) {
                if(err) {
                    console.log(err);
                }
            });
            fileName = filename;
        }));
    }));

    // Get the request body
    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
        postBody[fieldname] = val;
    });

    // handle PUT request
    busboy.on('finish', Meteor.bindEnvironment(function() {
        var JSZip = require('jszip');
        JSZip.loadAsync(buf).then(function(zip) {
            var objectKey = Object.keys(zip.files)[0];
            var shapename = objectKey.split('.')[0];
            var dataToUpdate = Geodata.findOne({name: datasetName, user: username});
            var tableExists = Geodata.find({user: username, tableName: shapename, name: {$ne: datasetName}}).fetch();
            var nameExists = Geodata.find({user: username, name: postBody.name}).fetch();

            if(postBody.name === undefined || postBody.name === undefined || postBody.description === undefined || postBody.date === undefined) {
                var title = 'Not all required parameters are entered. Please specify name, title, description and date';
                var status = 400;
                
                writeResponse(res, title, status);
            } else if(nameExists.length > 0 && postBody.name !== datasetName) {
                var title = 'Dataset with name ' + postBody.name + ' already exists!';
                var status = 409;

                writeResponse(res, title, status);
            } else if(tableExists.length > 0) {
                var title = 'Shapefile with name ' + shapename + ' already exists!';
                var status = 409;

                writeResponse(res, title, status);
            } else {
                var geodata = Geodata.findOne({name: datasetName});
                var geodataId = geodata._id;
                var couplingObject = CouplingAttData.findOne({dataId: geodataId});
                var couplingId = couplingObject._id;
                var attIds = couplingObject.attachmentIds;

                Attachment.remove({_id: attIds[0]});
                var attachment = Attachment.insert(newFile, Meteor.bindEnvironment(function(err, fileObj) {
                    if(err) {
                        console.log(err);
                    }
                    fileObj.name(fileName);
                }));
    
                var pattern = /(\d{2})-(\d{2})-(\d{4})/;
                Geodata.update({_id: geodataId}, {$set: {
                    name: postBody.name,
                    title: postBody.title,
                    description: postBody.description,
                    date: new Date(postBody.date.replace(pattern, '$3-$2-$1')),
                    user: username,
                    tableName: shapename
                }});
                CouplingAttData.update({_id: couplingId}, {$set: {
                    dataId: geodataId,
                    attachmentIds: [attachment._id]
                }});
    
                var zipFile = 'Attachment-' + attachment._id + '-' + fileName;
                var zipName = zipFile.substr(0, zipFile.indexOf('.zip')); 
                
                Meteor.call('runDockerImageFromServer', username, geodataId, zipName, 'update');
                Meteor.call('sendMailFromServer', username, geodataId, 'updated');
    
                writeResponse(res, '', 200);
            }
        });
    }));

    req.pipe(busboy);
}).delete(function(req, res) {
    var authHeader = req.headers.authorization.split(' ');
    var authType = authHeader[0];
    var authEncoded = authHeader[1];
    var credentials = new Buffer(authEncoded, 'base64').toString('ascii').split(':');
    var username = credentials[0];

    var geodata = Geodata.findOne({name: this.params._name});
    var geodataId = geodata._id;
    var couplingObject = CouplingAttData.findOne({dataId: geodataId});
    var couplingId = couplingObject._id;
    var attIds = couplingObject.attachmentIds;

    var attRecord = Attachment.findOne({_id: couplingObject.attachmentIds[0]});
    var zipFile = attRecord.copies.Attachment.key;
    var zipName = zipFile.substr(0, zipFile.indexOf('.zip')); 
    Meteor.call('runDockerImageFromServer', username, geodataId, zipName, 'delete');
    
    Geodata.remove({_id: geodataId});
    CouplingAttData.remove({_id: couplingId});
    attIds.forEach(function(item) {
        Attachment.remove({_id: item});
    });
    
    Meteor.call('sendMailFromServer', username, geodataId, 'deleted');

    writeResponse(res, '', 200);
});

/**
 * Writes a response to the client
 * 
 * @param {Object} res The response object
 * @param {string} title The error message
 * @param {number} status The http status code
 */
function writeResponse(res, title, status) {
    var responseJson = {};
    responseJson.title = title;
    responseJson.status = status;

    res.writeHead(status, {
        'Content-Type': 'application/json; charset=UTF-8'
    });

    res.end(EJSON.stringify(responseJson, {indent: true}));
}