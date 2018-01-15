import { Meteor } from 'meteor/meteor';
import { Router } from 'meteor/iron:router';

import { Attachment } from '../../api/collections/attachment';
import { Geodata, GeodataSchema } from '../../api/collections/geodata';
import { CouplingAttData, CouplingAttDataSchema } from '../../api/collections/couplingAttData';
import { Buffer } from 'buffer';

Router.route('/rest', {
	where: 'server',
	onBeforeAction: function(req, res, next) {
        if(req.headers.accept !== 'application/json') {
            var json = {
                title: 'Invalid response format. Can only return application/json',
                status: 406
            };
        
            res.writeHead(406, {
                'Content-Type': 'application/json; charset=UTF-8'
            });
        
            res.end(EJSON.stringify(json, {indent: true}));
        } else if((req.headers['content-type']).indexOf('multipart/form-data') === -1) {
            var json = {
                title: 'Invalid upload format. Should be multipart/form-data',
                status: 415
            };
        
            res.writeHead(415, {
                'Content-Type': 'application/json; charset=UTF-8'
            });
        
            res.end(EJSON.stringify(json, {indent: true}));
        } else if(req.method === 'POST') {
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
                        var json = {
                            title: 'Invalid password.',
                            status: 401
                        };
                    
                        res.writeHead(401, {
                            'Content-Type': 'application/json; charset=UTF-8'
                        });
                    
                        res.end(EJSON.stringify(json, {indent: true}));
                    } else {
                        // Authentication success. Proceed request method in next call.
                        next();
                    }
                } else {
                    var json = {
                        title: 'Invalid username. User ' + username + ' does not exist.',
                        status: 401
                    };
                
                    res.writeHead(401, {
                        'Content-Type': 'application/json; charset=UTF-8'
                    });
                
                    res.end(EJSON.stringify(json, {indent: true}));
                }
            } else {
                var json = {
					title: 'Invalid login method. Please use Basic Authorization',
					status: 401
				};
			
				res.writeHead(401, {
					'Content-Type': 'application/json; charset=UTF-8'
				});
			
                res.end(EJSON.stringify(json, {indent: true}));
            }
		} else {
			var json = {
                title: 'Method ' + req.method + ' not allowed!',
                status: 405
            };
        
            res.writeHead(405, {
                'Content-Type': 'application/json; charset=UTF-8'
            });
        
            res.end(EJSON.stringify(json, {indent: true}));
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

    var fileName;
    var newFile = new FS.File();
    
    busboy.on('file', Meteor.bindEnvironment(function(fieldname, file, filename, encoding, mimetype) {
        var bufs = [];
        file.on('data', function(data) {
            bufs.push(data);
        });
        file.on('end', Meteor.bindEnvironment(function() {
            var buf = Buffer.concat(bufs);
            newFile.attachData(buf, {type: mimetype}, function(err) {
                if(err) {
                    console.log(err);
                }
            });
            fileName = filename;
        }));
    }));

    var postBody = {};
    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
        postBody[fieldname] = val;
    });

    busboy.on('finish', Meteor.bindEnvironment(function() {
        var nameAlreadyExists = false;
        Geodata.find({user: username}).forEach(data => {
            if(data.name === postBody.name) {
                nameAlreadyExists = true;
            }
        });

        if(nameAlreadyExists) {
            var json = {
                title: 'Dataset with name ' + postBody.name + ' already exists!',
                status: 409
            };
        
            res.writeHead(409, {
                'Content-Type': 'application/json; charset=UTF-8'
            });
        
            res.end(EJSON.stringify(json, {indent: true}));
        } else if(postBody.name === undefined || postBody.name === undefined || postBody.description === undefined || postBody.date === undefined) {
            var json = {
                title: 'Not all required parameters are entered. Please specify name, title, description and date',
                status: 400
            };
        
            res.writeHead(400, {
                'Content-Type': 'application/json; charset=UTF-8'
            });
        
            res.end(EJSON.stringify(json, {indent: true}));
            return;
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
                user: username
            });
            CouplingAttData.insert({dataId: dataId, attachmentIds: [attachment._id]});

            var zipFile = 'Attachment-' + attachment._id + '-' + fileName;
            var zipName = zipFile.substr(0, zipFile.indexOf('.zip')); 
            
            Meteor.call('runDockerImageFromServer', username, dataId, zipName, 'insert');
            Meteor.call('sendMailFromServer', username, dataId, 'inserted');

            res.writeHead(201, {});
            res.end();
        }
    }));

    req.pipe(busboy);
});

Router.route('/rest/:_name', {
	where: 'server',
	onBeforeAction: function(req, res, next) {
        var geodata = Geodata.findOne({name: this.params._name});
        if(geodata === undefined) {
            var json = {
                title: 'No dataset with name ' + this.params._name + ' found.',
                status: 404
            };
        
            res.writeHead(404, {
                'Content-Type': 'application/json; charset=UTF-8'
            });
        
            res.end(EJSON.stringify(json, {indent: true}));
        } else if(req.headers.accept !== 'application/json') {
            var json = {
                title: 'Invalid response format. Can only return application/json',
                status: 406
            };
        
            res.writeHead(406, {
                'Content-Type': 'application/json; charset=UTF-8'
            });
        
            res.end(EJSON.stringify(json, {indent: true}));
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
                        var json = {
                            title: 'Invalid password.',
                            status: 401
                        };
                    
                        res.writeHead(401, {
                            'Content-Type': 'application/json; charset=UTF-8'
                        });
                    
                        res.end(EJSON.stringify(json, {indent: true}));
                    } else {
                        // Authentication success. Proceed request method in next call.
                        next();
                    }
                } else {
                    var json = {
                        title: 'Invalid username. User ' + username + ' does not exist.',
                        status: 401
                    };
                
                    res.writeHead(401, {
                        'Content-Type': 'application/json; charset=UTF-8'
                    });
                
                    res.end(EJSON.stringify(json, {indent: true}));
                }
            } else {
                var json = {
					title: 'Invalid login method. Please use Basic Authorization',
					status: 401
				};
			
				res.writeHead(401, {
					'Content-Type': 'application/json; charset=UTF-8'
				});
			
                res.end(EJSON.stringify(json, {indent: true}));
            }
		} else if((req.headers['content-type']).indexOf('multipart/form-data') === -1 && req.method === 'PUT') {
            var json = {
                title: 'Invalid upload format. Should be multipart/form-data',
                status: 415
            };
        
            res.writeHead(415, {
                'Content-Type': 'application/json; charset=UTF-8'
            });
        
            res.end(EJSON.stringify(json, {indent: true}))
        } else {
			var json = {
                title: 'Method ' + req.method + ' not allowed!',
                status: 405
            };
        
            res.writeHead(405, {
                'Content-Type': 'application/json; charset=UTF-8'
            });
        
            res.end(EJSON.stringify(json, {indent: true}));
		}
	}
}).put(function(req, res) {
    var authHeader = req.headers.authorization.split(' ');
    var authType = authHeader[0];
    var authEncoded = authHeader[1];
    var credentials = new Buffer(authEncoded, 'base64').toString('ascii').split(':');
    var username = credentials[0];

    var Busboy = require('busboy');
    var busboy = new Busboy({ headers: req.headers });
    var inspect = require('util').inspect;

    var geodata = Geodata.findOne({name: this.params._name});
    var geodataId = geodata._id;
    var couplingObject = CouplingAttData.findOne({dataId: geodataId});
    var couplingId = couplingObject._id;
    var attIds = couplingObject.attachmentIds;

    var newFile = new FS.File();
    var fileName;
    
    busboy.on('file', Meteor.bindEnvironment(function(fieldname, file, filename, encoding, mimetype) {
        var bufs = [];
        file.on('data', function(data) {
            bufs.push(data);
        });
        file.on('end', Meteor.bindEnvironment(function() {
            var buf = Buffer.concat(bufs);
            newFile.attachData(buf, {type: mimetype}, function(err) {
                if(err) {
                    console.log(err);
                }
            });
            fileName = filename;
        }));
    }));

    var postBody = {};
    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
        postBody[fieldname] = val;
    });

    busboy.on('finish', Meteor.bindEnvironment(function() {
        var nameAlreadyExists = false;
        Geodata.find({user: username}).forEach(data => {
            if(data.name === postBody.name) {
                nameAlreadyExists = true;
            }
        });

        if(nameAlreadyExists) {
            var json = {
                title: 'Dataset with name ' + postBody.name + ' already exists!',
                status: 409
            };
        
            res.writeHead(409, {
                'Content-Type': 'application/json; charset=UTF-8'
            });
        
            res.end(EJSON.stringify(json, {indent: true}));
        } else if(postBody.name === undefined || postBody.name === undefined || postBody.description === undefined || postBody.date === undefined) {
            var json = {
                title: 'Not all required parameters are entered. Please specify name, title, description and date',
                status: 400
            };
        
            res.writeHead(400, {
                'Content-Type': 'application/json; charset=UTF-8'
            });
        
            res.end(EJSON.stringify(json, {indent: true}));
        } else {
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
                user: username
            }});
            CouplingAttData.update({_id: couplingId}, {$set: {
                dataId: geodataId,
                attachmentIds: [attachment._id]
            }});

            var zipFile = 'Attachment-' + attachment._id + '-' + fileName;
            var zipName = zipFile.substr(0, zipFile.indexOf('.zip')); 
            
            Meteor.call('runDockerImageFromServer', username, dataId, zipName, 'update');
            Meteor.call('sendMailFromServer', username, dataId, 'updated');

            res.writeHead(200, {});
            res.end();
        }
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

    res.writeHead(200, {});
    res.end();
});