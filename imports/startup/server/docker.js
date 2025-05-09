import { Meteor } from 'meteor/meteor';

import { Attachment } from '/imports/api/collections/attachment.js';

Meteor.methods({

	runValidation: function(geodropinId, attachmentId, zipFileName, typeAction) {
		var Future = Npm.require("fibers/future");
		var exec = Npm.require("child_process").exec;

		var zipName;
		if (zipFileName) {
			zipName = zipFileName;
		} else {
			var attRecord = Attachment.findOne({_id: attachmentId});
			var zipFile = attRecord.copies.Attachment.key;
			zipName = zipFile.substr(0, zipFile.indexOf('.zip'));
		}

		if (typeof zipName !== 'undefined' && zipName !== null &&
				typeof geodropinId !== 'undefined' && geodropinId !== null) {
			if (typeAction === 'insert' || typeAction === 'update' || typeAction === 'delete') {
				this.unblock();
				var future = new Future();
				var command = "/usr/host/bin/docker run --rm " +
				        "-e \"LD_LIBRARY_PATH=/opt/instantclient_12_1\" " +
						"-e \"GEODATA_ZIP_NAME=" + zipName + "\" " +
						"-e \"TYPEACTION=" + typeAction + "\" " +
						"--volumes-from \"gdi-gdi.web-1\" " +
						"-v \"ogr2ogr_tnsadmin:/opt/instantclient_12_1\" " +
						"--network gdi-base " +
						"gdi-ogr2ogr.oracle.metadata " +
						"/opt/validate.sh";

				exec(command, function(error, stdout, stderr) {
					if (error) {
						future.throw(new Meteor.Error(stderr.toString()));
					} else {
						future.return(stdout.toString());
					}
				});

				return future.wait();
			} else {
				// TODO: invalid typeAction
				console.log('INVALID TYPEACTION');
			}
		} else {
			// TODO: unset variables
			console.log('UNSET VARIABLES');
		}
	},
	
	runDockerImage: function (geodropinId, attachmentId, zipFileName, typeAction) {
		var Future = Npm.require("fibers/future");
		var exec = Npm.require("child_process").exec;

		var zipName;
		if (zipFileName) {
			zipName = zipFileName;
		} else {
			var attRecord = Attachment.findOne({ _id: attachmentId });
			var zipFile = attRecord.copies.Attachment.key;
			zipName = zipFile.substr(0, zipFile.indexOf('.zip'));
		}
		
		if(Meteor.user()) {
			var username = Meteor.user().username;
			var env = Meteor.settings.private.env;
			var matchedUsers = env.filter(obj => username === obj.meteorUsername);
			
			if (matchedUsers.length === 1) {
				var oracleUser = matchedUsers[0].oracleUsername;
				var oraclePassword = matchedUsers[0].oraclePassword;
			}
		}
		
		if(typeof process.env.GEODROPIN_HOST_PROTOCOL !== 'undefined' &&
				typeof process.env.GEODROPIN_HOST !== 'undefined' &&
				typeof oracleUser !== 'undefined' &&
				typeof oraclePassword !== 'undefined' &&
				typeof zipName !== 'undefined' && zipName !== null &&
				typeof geodropinId !== 'undefined' && geodropinId !== null) {
			if(typeAction === 'insert' || typeAction === 'update' || typeAction === 'delete') {
				this.unblock();
				var future = new Future();
				var command = "/usr/host/bin/docker run --rm " +
						"-e \"LD_LIBRARY_PATH=/opt/instantclient_12_1\" " +
						"-e \"TNS_ADMIN=/opt/instantclient_12_1\" " + 
						"-e \"PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/opt/instantclient_12_1\" " + 
						"-e \"JAVA_OPTS=-Xmx128M -Duser.timezone=Europe/Amsterdam\" " +
						"-e \"GEODROPIN_HOST=" + process.env.GEODROPIN_HOST_PROTOCOL + 
							"://" + process.env.GEODROPIN_HOST + "\" " +
						"-e \"DB_IP=gdi-oracle-1\" " +
						"-e \"DB_PORT=1521\" " +
						"-e \"DB_SID=XE\" " +
						"-e \"DB_USER=" + oracleUser + "\" " +
						"-e \"DB_PASSWORD=" + oraclePassword + "\" " +
						"-e \"GEODATA_ZIP_NAME=" + zipName + "\" " +
						"-e \"GEODROPIN_ID=" + geodropinId + "\" " +
						"-e \"TYPEACTION=" + typeAction + "\" " +
						"--volumes-from \"gdi-gdi.web-1\" " +
						"-v \"gdi_ogr2ogr_logs:/var/log/ogr2ogr\" " +
						"--network gdi-base ";
                if (process.env.GEODROPIN_HOST.indexOf(".local") != -1) {
                    command += "--link gdi-proxy-1:" + process.env.GEODROPIN_HOST + " ";
                }
                command += "gdi-ogr2ogr.oracle.metadata /opt/start.sh";
				
				exec(command, function(error, stdout, stderr){
					if (error) {
						future.throw(new Meteor.Error(stderr.toString()));
					} else {
						future.return(stdout.toString());
					}
				});
				
				return future.wait();
			} else {
				console.log('docker run will not be executed');
			}
		} else {
			console.log('docker run will not be executed');
		}
	},
	
	runDockerImageFromServer: function (username, geodropinId, zipName, typeAction) {
		var Future = Npm.require("fibers/future");
		var exec = Npm.require("child_process").exec;
		
		if(username !== undefined && username !== null) {
			var env = Meteor.settings.private.env;
			var matchedUsers = env.filter(obj => username === obj.meteorUsername);
			
			if (matchedUsers.length === 1) {
				var oracleUser = matchedUsers[0].oracleUsername;
				var oraclePassword = matchedUsers[0].oraclePassword;
			}
		}
		
		if(typeof process.env.GEODROPIN_HOST_PROTOCOL !== 'undefined' &&
				typeof process.env.GEODROPIN_HOST !== 'undefined' &&
				typeof oracleUser !== 'undefined' &&
				typeof oraclePassword !== 'undefined' &&
				typeof zipName !== 'undefined' && zipName !== null &&
				typeof geodropinId !== 'undefined' && geodropinId !== null) {
			if(typeAction === 'insert' || typeAction === 'update' || typeAction === 'delete') {
				this.unblock();
    	        var future = new Future();
    	        var command = "/usr/host/bin/docker run --rm " +
    	        		"-e \"LD_LIBRARY_PATH=/opt/instantclient_12_1\" " +
    	        		"-e \"TNS_ADMIN=/opt/instantclient_12_1\" " + 
    	        		"-e \"PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/opt/instantclient_12_1\" " + 
    	        		"-e \"JAVA_OPTS=-Xmx128M -Duser.timezone=Europe/Amsterdam\" " +
    	        		"-e \"GEODROPIN_HOST=" + process.env.GEODROPIN_HOST_PROTOCOL + 
    	        			"://" + process.env.GEODROPIN_HOST + "\" " +
						"-e \"DB_IP=gdi-oracle-1\" " +
    	        		"-e \"DB_PORT=1521\" " +
    	        		"-e \"DB_SID=XE\" " +
    	        		"-e \"DB_USER=" + oracleUser + "\" " +
    	        		"-e \"DB_PASSWORD=" + oraclePassword + "\" " +
    	        		"-e \"GEODATA_ZIP_NAME=" + zipName + "\" " +
    	        		"-e \"GEODROPIN_ID=" + geodropinId + "\" " +
    	        		"-e \"TYPEACTION=" + typeAction + "\" " +
						"--volumes-from \"gdi-gdi.web-1\" " +
    	        		"-v \"gdi_ogr2ogr_logs:/var/log/ogr2ogr\" " +
    	        		"-v \"ogr2ogr_tnsadmin:/opt/instantclient_12_1\" " +
    	        		"--network gdi-base ";
                if (process.env.GEODROPIN_HOST.indexOf(".local") != -1) {
                    command += "--link gdi-proxy-1:" + process.env.GEODROPIN_HOST + " ";
                }
                command += "gdi-ogr2ogr.oracle.metadata /opt/start.sh";
    	        
				exec(command, function(error, stdout, stderr){
    	        	if (error) {
						future.throw(new Meteor.Error(stderr.toString()));
					} else {
						future.return(stdout.toString());
					}
    	        });
    	        
    	        return future.wait();
    		} else {
    			console.log('docker run will not be executed');
    		}
		} else {
			console.log('docker run will not be executed');
		}
	}
});