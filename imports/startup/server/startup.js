import { Geodata } from '/imports/api/collections/geodata.js';
import { Attachment } from '/imports/api/collections/attachment.js';
import { CouplingAttData } from '/imports/api/collections/couplingAttData.js';

import { Accounts } from 'meteor/accounts-base';

Meteor.startup(function () {
	Meteor.publish('geodata', function() {
		return Geodata.find();
	});

	Meteor.publish('attachment', function() {
		return Attachment.find();
	});

	Meteor.publish('couplingAttData', function() {
		return CouplingAttData.find();
	});
	
	var myMsg = 'Incorrect Login';
    Accounts.validateLoginAttempt(function(attempt) {
        if(attempt.error){
            var reason = attempt.error.reason;
            if(reason === "User not found" || reason === "Incorrect password")
                throw new Meteor.Error(403, myMsg);
        }
         
        return attempt.allowed;
    });
    
    var Future = Npm.require("fibers/future");
    var exec = Npm.require("child_process").exec;
   
    Meteor.methods({
    	runDockerImage: function (geodropinId, zipName, typeAction) {
    		if(Meteor.user()) {
				console.log('User is: ' + Meteor.user().username);
    			
    			if(Meteor.user().username === 'rijssenholten') {
					var oracleUser = process.env.RIJSSENHOLTEN_ORACLE_DB_USER;
					var oraclePassword = process.env.RIJSSENHOLTEN_ORACLE_DB_PASSWORD;
				} else if(Meteor.user().username === 'kragten') {
					var oracleUser = process.env.KRAGTEN_ORACLE_DB_USER;
					var oraclePassword = process.env.KRAGTEN_ORACLE_DB_PASSWORD;
				}
			}
    		
    		if(typeof process.env.GEODROPIN_HOST !== 'undefined' &&
    				typeof oracleUser !== 'undefined' &&
    				typeof oraclePassword !== 'undefined' &&
    				typeof zipName !== 'undefined' && zipName !== null &&
    				typeof geodropinId !== 'undefined' && geodropinId !== null) {
    			if(typeAction === 'insert') {
        			this.unblock();
        	        var future = new Future();
        	        var command = "/usr/host/bin/docker run --rm " +
        	        		"-e \"LD_LIBRARY_PATH=/opt/instantclient_12_1\" " +
        	        		"-e \"TNS_ADMIN=/opt/instantclient_12_1\" " + 
        	        		"-e \"PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/opt/instantclient_12_1\" " + 
        	        		"-e \"JAVA_OPTS=-Xmx128M -Duser.timezone=Europe/Amsterdam\" " +
        	        		"-e \"GEODROPIN_HOST=http://" + process.env.GEODROPIN_HOST + "\" " +
        	        		"-e \"DB_IP=gdi_oracle_1\" " +
        	        		"-e \"DB_PORT=1521\" " +
        	        		"-e \"DB_SID=XE\" " +
        	        		"-e \"DB_USER=" + oracleUser + "\" " +
        	        		"-e \"DB_PASSWORD=" + oraclePassword + "\" " +
        	        		"-e \"GEODATA_ZIP_NAME=" + zipName + "\" " +
        	        		"-e \"GEODROPIN_ID=" + geodropinId + "\" " +
        	        		"--volumes-from \"gdi_gdi.web_1\" " +
        	        		"-v \"ogr2ogr_tnsadmin:/opt/instantclient_12_1\" " +
        	        		"--network gdi-base " +
        	        		"--link gdi_proxy_1:" + process.env.GEODROPIN_HOST + " " +
        	        		"gdi_ogr2ogr.oracle.metadata " +
        	        		"/opt/start.sh";
        	        
        	        exec(command, function(error, stdout, stderr){
        	        	if(error) {
        	        		console.log(error);
        	        		throw new Meteor.Error(500, command + " failed");
        	        	}
        	        	
        	        	future.return(stdout.toString());
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
});