import { Meteor } from 'meteor/meteor';
import { Router } from 'meteor/iron:router';

import { Attachment } from '../../api/collections/attachment';
import { Geodata, GeodataSchema } from '../../api/collections/geodata';
import { CouplingAttData, CouplingAttDataSchema } from '../../api/collections/couplingAttData';
import { Buffer } from 'buffer';

Router.route('/api/form/v1', {
    where: 'server',
    onBeforeAction: function(req, res, next) {
        const { headers, method } = req;

        let validRequest = validateAcceptHeader(res, headers.accept);
        validRequest &= validateContentType(res, headers['content-type']);
        validRequest &= validatePostRequest(res, method);
        validRequest &= validateUser(res, headers.authorization);

        if (validRequest) {
            next();
        }
    }
}).post(function(req, res) {
    const authHeader = req.headers.authorization.split(' ');
    const [authType, authEncoded] = authHeader;
    const credentials = new Buffer(authEncoded, 'base64').toString('ascii').split(':');
    const [username, password] = credentials;

    const Busboy = require('busboy');
    const busboy = new Busboy({ headers: req.headers });

    let buf;
    let fileName;
    const postBody = {};
    const newFile = new FS.File();

    // Get the uploaded file
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        const bufs = [];
        file.on('data', data => {
            bufs.push(data);
        });
        file.on('end', () => {
            buf = Buffer.concat(bufs);
            newFile.attachData(buf, { type: mimetype }, err => {
                if (err) {
                    console.log(err);
                }
            });
            fileName = filename;
        });
    });

    // Get the request body
    busboy.on('field', (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) => {
        postBody[fieldname] = val;
    });

    // Handle POST request
    busboy.on('finish', () => {
        if (validateUploadFile(res, fileName)) {
            const JSZip = require('jszip');
            JSZip.loadAsync(buf).then(zip => {
                let validRequest = validateZipContents(res, zip, username, req.method);
                validRequest &= validatePostBody(res, postBody, username, req.method);

                if (validRequest) {
                    const attachment = Attachment.insert(newFile, (err, fileObj) => {
                        fileObj.name(fileName);
                    });
                    const { files } = zip;
                    const objectKey = Object.keys(files)[0];
                    const shapename = objectKey.split('.')[0];
                    const pattern = /(\d{2})-(\d{2})-(\d{4})/;
                    const dataId = Geodata.insert({
                        name: postBody.name,
                        title: postBody.title,
                        description: postBody.description,
                        date: new Date(postBody.date.replace(pattern, '$3-$2-$1')),
                        user: username,
                        tableName: shapename,
                        validationStatus: 'VALIDATING',
                        validationMessage: 'Bezig met valideren',
                        uploadStatus: 'PROCESSING',
                        uploadMessage: 'Verwerken start nadat validaties geslaagd zijn'
                    });
                    CouplingAttData.insert({ dataId: dataId, attachmentIds: [attachment._id] });

                    const zipFile = `Attachment-${attachment._id}-${fileName}`;
                    const zipName = zipFile.substr(0, zipFile.indexOf('.zip'));

                    validateUpload(username, dataId, null, zipName, 'insert');
                    writeResponse(res, '', 201);
                }
            });
        }
    });

    req.pipe(busboy);
});

Router.route('/api/form/v1/:_name', {
    where: 'server',
    onBeforeAction: function(req, res, next) {
        const { headers, method } = req;

        let validRequest = validateDatasetExistence(res, this.params._name);
        validRequest &= validateAcceptHeader(res, headers.accept);
        validRequest &= validatePutOrDeleteRequest(res, method);
        validRequest &= validateUser(res, headers.authorization);

        if (method === 'PUT') {
            validRequest &= validateContentType(res, headers['content-type']);
        }
        
        if (validRequest) {
            next();
        }
    }
}).put(function(req, res) {
    const authHeader = req.headers.authorization.split(' ');
    const [authType, authEncoded] = authHeader;
    const credentials = new Buffer(authEncoded, 'base64').toString('ascii').split(':');
    const [username, password] = credentials;
    const datasetName = this.params._name;

    const Busboy = require('busboy');
    const busboy = new Busboy({ headers: req.headers });

    let buf;
    let fileName;
    const postBody = {};
    const newFile = new FS.File();

    // Get the uploaded file
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        const bufs = [];
        file.on('data', data => {
            bufs.push(data);
        });
        file.on('end', () => {
            buf = Buffer.concat(bufs);
            newFile.attachData(buf, { type: mimetype }, err => {
                if (err) {
                    console.log(err);
                }
                fileName = filename;
            });
        });
    });

    busboy.on('field', (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) => {
        postBody[fieldname] = val;
    });

    busboy.on('finish', () => {
        if (validateUploadFile(res, fileName)) {
            const JSZip = require('jszip');
            JSZip.loadAsync(buf).then(zip => {
                let validRequest = validateZipContents(res, zip, username, req.method);
                validRequest &= validatePostBody(res, postBody, username, req.method);

                if (validRequest) {
                    const geodata = Geodata.findOne({ name: datasetName });
                    const geodataId = geodata._id;
                    const couplingObject = CouplingAttData.findOne({ dataId: geodataId });
                    const couplingId = couplingObject._id;
                    const attIds = couplingObject.attachmentIds;

                    Attachment.remove({ _id: attIds[0] });
                    const attachment = Attachment.insert(newFile, (err, fileObj) => {
                        if (err) {
                            console.log(err);
                        }
                        fileObj.name(fileName);
                    });

                    const { files } = zip;
                    const objectKey = Object.keys(files)[0];
                    const shapename = objectKey.split('.')[0];
                    const pattern = /(\d{2})-(\d{2})-(\d{4})/;
                    Geodata.update({ _id: geodataId }, { $set : {
                        name: postBody.name,
                        title: postBody.title,
                        description: postBody.description,
                        date: new Date(postBody.date.replace(pattern, '$3-$2-$1')),
                        user: username,
                        tableName: shapename,
                        validationStatus: 'VALIDATING',
                        validationMessage: 'Bezig met valideren',
                        uploadStatus: 'PROCESSING',
                        uploadMessage: 'Verwerken start nadat validaties geslaagd zijn'
                    }});
                    CouplingAttData.update({ _id: couplingId }, { $set: {
                        dataId: geodataId,
                        attachmentIds: [attachment._id]
                    }});

                    const zipFile = `Attachment-${attachment._id}-${fileName}`;
                    const zipName = zipFile.substr(0, zipFile.indexOf('.zip'));

                    validateUpload(username, geodataId, null, zipName, 'update');
                    writeResponse(res, '', 200);
                }
            });
        }
    });

    req.pipe(busboy);
}).delete(function(req, res) {
    const authHeader = req.headers.authorization.split(' ');
    const [authType, authEncoded] = authHeader;
    const credentials = new Buffer(authEncoded, 'base64').toString('ascii').split(':');
    const [username, password] = credentials;

    const geodata = Geodata.findOne({ name: this.params._name });
    const geodataId = geodata._id;
    const couplingObject = CouplingAttData.findOne({ dataId: geodataId });
    const couplingId = couplingObject._id;
    const attIds = couplingObject.attachmentIds;

    const attRecord = Attachment.findOne({ _id: couplingObject.attachmentIds[0] });
    const zipFile = attRecord.copies.Attachment.key;
    const zipName = zipFile.substr(0, zipFile.indexOf('.zip'));

    processUpload(username, geodataId, zipName, 'delete');

    Geodata.remove({ _id: geodataId });
    CouplingAttData.remove({ _id: couplingId });
    attIds.forEach(item => {
        Attachment.remove({ _id: item });
    });

    writeResponse(res, '', 200);
});

function validateAcceptHeader(res, accept) {
    if (accept.indexOf('application/json') === -1) {
        writeResponse(res, 'Invalid response format. Can only return application/json', 406);
        return false;
    } else {
        return true;
    }
}

function validateContentType(res, contentType) {
    if (contentType.indexOf('multipart/form-data') === -1) {
        writeResponse(res, 'Invalid upload format. Should be multipart/form-data', 415);
        return false;
    } else {
        return true;
    }
}

function validatePostRequest(res, reqMethod) {
    if (reqMethod === 'POST') {
        return true;
    } else {
        writeResponse(res, `Method ${reqMethod} not allowed!`, 405);
        return false;
    }
}

function validatePutOrDeleteRequest(res, reqMethod) {
    if (reqMethod === 'PUT' || reqMethod === 'DELETE') {
        return true;
    } else {
        writeResponse(res, `Method ${reqMethod} not allowed!`, 405);
        return false;
    }
}

function validateUser(res, authorization) {
    const authHeader = authorization.split(' ');
    const [authType, authEncoded] = authHeader;

    if (authType === 'Basic') {
        const credentials = new Buffer(authEncoded, 'base64').toString('ascii').split(':');
        const [username, password] = credentials;
        const user = Meteor.users.findOne({ username: username });

        // Check if user exists
        if (user) {
            const result = Accounts._checkPassword(user, password);

            // Check if password is valid
            if (result.error) {
                writeResponse(res, 'Invalid credentials!', 401);
                return false;
            } else {
                // Authentication success
                return true;
            }
        } else {
            writeResponse(res, 'Invalid credentials!', 401);
            return false;
        }
    } else {
        writeResponse(res, 'Invalid login method. Use Basic Authentication', 401);
        return false;
    }
}

function validateUploadFile(res, fileName) {
    if (fileName && fileName.indexOf('.zip') !== -1) {
        return true;
    } else {
        writeResponse(res, 'Uploaded file must be a .zip!', 409);
        return false;
    }
}

function validateZipContents(res, zip, username, reqMethod) {
    const { files } = zip;
    const extensionsPresent = Meteor.call('areExtensionsPresent', files);
    const doubleExtension = Meteor.call('areExtensionsDouble', files);
    const objectKey = Object.keys(files)[0];
    const shapename = objectKey.split('.')[0];
    const tables = Geodata.find({ user: username, tableName: shapename }).fetch().length > 0

    if (tables && reqMethod !== 'PUT') {
        writeResponse(res, `Shapefile with name ${shapename} already exists!`, 409);
        return false;
    } else if (!extensionsPresent) {
        writeResponse(res, 'Uploaded zip should at least contain a .shp, .shx and .dbf file!', 409);
        return false;
    } else if (doubleExtension) {
        writeResponse(res, 'Extensions .shp, .shx and .dbf can occur only once per zip file!', 409);
        return false;
    } else {
        return true;
    }
}

function validatePostBody(res, postBody, username, reqMethod) {
    const nameExists = Geodata.find({ user: username, name: postBody.name }).fetch().length > 0;

    if (nameExists && reqMethod !== 'PUT') {
        writeResponse(res, `Dataset with name ${postBody.name} already exists!`, 409);
        return false;
    } else if (!postBody.name || !postBody.title || !postBody.description || !postBody.date) {
        writeResponse(res, 'Not all required parameters are entered. Please specify name, title, description and date in the POST body', 400);
        return false;
    } else {
        return true;
    }
}

function validateDatasetExistence(res, datasetName) {
    const geodata = Geodata.findOne({ name: datasetName });
    if (geodata) {
        return true;
    } else {
        writeResponse(res, `No dataset with name ${datasetName} found.`, 404);
        return false;
    }
}

function validateUpload(username, geodropinId, attachmentId, zipName, typeAction) {
    try {
        const validation = Meteor.call('runValidation', geodropinId, attachmentId, zipName, typeAction);
		Geodata.update({_id: geodropinId}, {
			$set: {
				validationStatus: 'SUCCESS',
				validationMessage: 'Validatie geslaagd',
				uploadStatus: 'PROCESSING',
				uploadMessage: 'Bezig met verwerken',
			}
		});

        processUpload(username, geodropinId, zipName, typeAction);
	} catch (err) {
		Geodata.update({_id: geodropinId}, {
			$set: {
				validationStatus: 'ERROR',
				validationMessage: err.error || err,
				uploadStatus: 'ERROR',
				uploadMessage: 'Fout bij valideren. Controleer de ZIP file en probeer het nogmaals.',
			}
        });
    }
}

function processUpload(username, geodropinId, zipName, typeAction) {
	try {
		const upload = Meteor.call('runDockerImageFromServer', username, geodropinId, zipName, typeAction);
		Geodata.update({_id: geodropinId}, {
			$set: {
				uploadStatus: 'SUCCESS',
				uploadMessage: 'Verwerken geslaagd',
			}
		});

        if (process.env.GEODROPIN_HOST && process.env.GEODROPIN_HOST.indexOf('local') !== -1) {
            Meteor.call('sendMailFromServer', username, geodropinId, typeAction);
        }
	} catch (err) {
		Geodata.update({_id: geodropinId}, {
			$set: {
				uploadStatus: 'ERROR',
				uploadMessage: err.error || err,
			}
        });
	}
}

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
