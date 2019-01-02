import { Meteor } from 'meteor/meteor';

import { Attachment } from '/imports/api/collections/attachment.js';

Meteor.methods({
	
	runDockerImage: function (geodropinId, attachmentId, typeAction) {
		var Future = Npm.require("fibers/future");
		var exec = Npm.require("child_process").exec;
		
		var attRecord = Attachment.findOne({ _id: attachmentId });
		if(attRecord) {
			var zipFile = attRecord.copies.Attachment.key;
			var zipName = zipFile.substr(0, zipFile.indexOf('.zip'));
			
			if(Meteor.user()) {
				if(Meteor.user().username === 'rijssenholten') {
					var oracleUser = process.env.RIJSSENHOLTEN_ORACLE_DB_USER;
					var oraclePassword = process.env.RIJSSENHOLTEN_ORACLE_DB_PASSWORD;
				} else if(Meteor.user().username === 'berkelland') {
					var oracleUser = process.env.BERKELLAND_ORACLE_DB_USER;
					var oraclePassword = process.env.BERKELLAND_ORACLE_DB_PASSWORD;
				} else if(Meteor.user().username === 'demo') {
				    var oracleUser = process.env.DEMO_ORACLE_DB_USER;
				    var oraclePassword = process.env.DEMO_ORACLE_DB_PASSWORD;
				} else if(Meteor.user().username === 'ihm') {
				    var oracleUser = process.env.IHM_ORACLE_DB_USER;
				    var oraclePassword = process.env.IHM_ORACLE_DB_PASSWORD;
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
	    	        		"-e \"DB_IP=gdi_oracle_1\" " +
	    	        		"-e \"DB_PORT=1521\" " +
	    	        		"-e \"DB_SID=XE\" " +
	    	        		"-e \"DB_USER=" + oracleUser + "\" " +
	    	        		"-e \"DB_PASSWORD=" + oraclePassword + "\" " +
	    	        		"-e \"GEODATA_ZIP_NAME=" + zipName + "\" " +
	    	        		"-e \"GEODROPIN_ID=" + geodropinId + "\" " +
	    	        		"-e \"TYPEACTION=" + typeAction + "\" " +
	    	        		"--volumes-from \"gdi_gdi.web_1\" " +
	    	        		"-v \"ogr2ogr_tnsadmin:/opt/instantclient_12_1\" " +
	    	        		"--network gdi-base " +
	    	        		"--link gdi_proxy_1:" + process.env.GEODROPIN_HOST + " " +
	    	        		"gdi_ogr2ogr.oracle.metadata " +
	    	        		"/opt/start.sh";
	    	        
					exec(command, function(error, stdout, stderr){
	    	        	if(error) {
							console.log(error);
							future.return(stderr.toString());
	    	        		//throw new Meteor.Error(500, command + " failed");
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
	},
	
	runDockerImageFromServer: function (username, geodropinId, zipName, typeAction) {
		var Future = Npm.require("fibers/future");
		var exec = Npm.require("child_process").exec;
		
		if(username !== undefined && username !== null) {
			if(username === 'rijssenholten') {
				var oracleUser = process.env.RIJSSENHOLTEN_ORACLE_DB_USER;
				var oraclePassword = process.env.RIJSSENHOLTEN_ORACLE_DB_PASSWORD;
			} else if(username === 'berkelland') {
				var oracleUser = process.env.BERKELLAND_ORACLE_DB_USER;
				var oraclePassword = process.env.BERKELLAND_ORACLE_DB_PASSWORD;
			} else if(username === 'demo') {
			    var oracleUser = process.env.DEMO_ORACLE_DB_USER;
			    var oraclePassword = process.env.DEMO_ORACLE_DB_PASSWORD;
			} else if(username === 'ihm') {
			    var oracleUser = process.env.IHM_ORACLE_DB_USER;
			    var oraclePassword = process.env.IHM_ORACLE_DB_PASSWORD;
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
    	        		"-e \"DB_IP=gdi_oracle_1\" " +
    	        		"-e \"DB_PORT=1521\" " +
    	        		"-e \"DB_SID=XE\" " +
    	        		"-e \"DB_USER=" + oracleUser + "\" " +
    	        		"-e \"DB_PASSWORD=" + oraclePassword + "\" " +
    	        		"-e \"GEODATA_ZIP_NAME=" + zipName + "\" " +
    	        		"-e \"GEODROPIN_ID=" + geodropinId + "\" " +
    	        		"-e \"TYPEACTION=" + typeAction + "\" " +
    	        		"--volumes-from \"gdi_gdi.web_1\" " +
    	        		"-v \"ogr2ogr_tnsadmin:/opt/instantclient_12_1\" " +
    	        		"--network gdi-base " +
    	        		"--link gdi_proxy_1:" + process.env.GEODROPIN_HOST + " " +
    	        		"gdi_ogr2ogr.oracle.metadata " +
    	        		"/opt/start.sh";
    	        
				exec(command, function(error, stdout, stderr){
    	        	if(error) {
						console.log(error);
						future.return(stderr.toString());
    	        		//throw new Meteor.Error(500, command + " failed");
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