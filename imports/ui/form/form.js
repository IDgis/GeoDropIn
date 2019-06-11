import './form.html';
import './form.css';

import { Geodata, GeodataSchema } from '/imports/api/collections/geodata.js';
import { Attachment } from '/imports/api/collections/attachment.js';
import { CouplingAttData, CouplingAttDataSchema } from '/imports/api/collections/couplingAttData.js';
import { meteorUtils } from '/lib/meteor-utils.js';

Template.form.onRendered(function() {
	Session.set('attachmentIds', []);
	Session.set('attachmentRemoveIds', []);
	
	if(Session.get('selectedGeodataId') !== null) {
		var atts = CouplingAttData.findOne({dataId: Session.get('selectedGeodataId')});
		if(typeof atts !== 'undefined') {
			Meteor.call('getAttachment', atts.attachmentIds, function(err, result) {
				if(result) {
					result.forEach(function(item) {
						var element = '<p class="negate-margin">' + 
							item.name + 
							' <span id="' + 
							item.id + 
							'"class="glyphicon glyphicon-remove js-remove-previous-attachment"></span>' +
							'</p>';
						
						$('#saved-atts').append(element);
					});
				}
			});
		}
	}
});

Template.form.helpers({
	geodataDoc: function() {
		if(Session.get('selectedGeodataId') !== null) {
			return this;
		} else {
			return null ;
		}
	},
	geodataType: function() {
		if(Session.get('selectedGeodataId') !== null) {
			return 'update';
		} else {
			return 'insert';
		}
	},
	geodata: function() {
		return Geodata;
	},
	geodataSchema: function() {
		return GeodataSchema;
	}
});

Template.form.events({
	'click #js-form-cancel': function() {
		Router.go('list');
	},
	'change .js-attachment': function(e) {
		var file = e.target.files[0];
		if(file) {
			// https://stuk.github.io/jszip/documentation/howto/read_zip.html
			// Read the shapefile names in the uploaded zip
			var JSZip = require('jszip');
        	JSZip.loadAsync(file).then(function(zip) {
            	var objectKey = Object.keys(zip.files)[0];
				var shapename = objectKey.split('.')[0];
			});
		}

		var index = $(e.target).attr('data-index');
		var attachmentIds = Session.get('attachmentIds');
		
		Session.set('activeIndex', index);
		var prevAtt = attachmentIds.find(findIndex);
		
		if(typeof prevAtt !== 'undefined') {
			var prevAttIndex = attachmentIds.indexOf(prevAtt);
			if(prevAttIndex > -1) {
				attachmentIds.splice(prevAttIndex, 1);
				Attachment.remove({_id: prevAtt.fileId});
			}
		}
		
		Attachment.insert(e.target.files[0], function (err, fileObj) {
			var att = {'index': index, 'fileId': fileObj._id};
			attachmentIds.push(att);
			
			Session.set('attachmentIds', attachmentIds);
			$(e.target).attr('data-id', fileObj._id);
		});
	},
	'click .js-remove-attachment': function(e) {
		var context = $(e.target).parents('.div-attachment')[0];
		var item = $('input', context)[0];
		var index = $(item).attr('data-index');
		
		var attachmentIds = Session.get('attachmentIds');
		
		Session.set('activeIndex', index);
		var prevAtt = attachmentIds.find(findIndex);
		
		if(typeof prevAtt !== 'undefined') {
			var prevAttIndex = attachmentIds.indexOf(prevAtt);
			if(prevAttIndex > -1) {
				attachmentIds.splice(prevAttIndex, 1);
				Attachment.remove({_id: prevAtt.fileId});
			}
		}
		
		Session.set('attachmentIds', attachmentIds);
		
		$(context).remove();
	},
	'click .js-remove-previous-attachment': function(e) {
		var attRemove = Session.get('attachmentRemoveIds');
		attRemove.push(e.target.id);
		Session.set('attachmentRemoveIds', attRemove);
		
		var p = $(e.target).parents('p')[0];
		$(p).remove();
	}
});

function findIndex(obj) {
	return obj.index === Session.get('activeIndex');
}

AutoForm.addHooks('geodataform', {
	before: {
		insert: function(doc) {
			return doc;
		},
		update: function(doc) {
			return doc;
		}
	},
	after: {
		insert: function(error, result) {
			if (result) {
				var dataId = result;
				Geodata.update({_id: dataId}, {
					$set: {
						validationStatus: 'VALIDATING',
						validationMessage: 'Bezig met valideren',
						uploadStatus: 'PROCESSING',
						uploadMessage: 'Verwerken start nadat validaties geslaagd zijn'
					}
				});

				var attachmentItems = Session.get('attachmentIds');
				var attachmentIds = [];

				attachmentItems.forEach(function(item) {
					attachmentIds.push(item.fileId);
				});

				CouplingAttData.insert({dataId: dataId, attachmentIds: attachmentIds});

				validateUpload(dataId, attachmentIds[0], 'insert');
			}
		},
		update: function(error, result) {
			if (result) {
				Geodata.update({_id: this.docId}, {
					$set: {
						validationStatus: 'VALIDATING',
						validationMessage: 'Bezig met valideren',
						uploadStatus: 'PROCESSING',
						uploadMessage: 'Verwerken start nadat de validaties geslaagd zijn'
					}
				});

				var attRemove = Session.get('attachmentRemoveIds');
				var attCoupling = CouplingAttData.findOne({dataId: this.docId});
				var attIds = attCoupling.attachmentIds;

				attRemove.forEach(function(item) {
					var attIndex = attIds.indexOf(item);
					if (attIndex > -1) {
						attIds.splice(attIndex, 1);
						Attachment.remove({_id: item});
					}
				});

				var attachmentItems = Session.get('attachmentIds');
				attachmentItems.forEach(function(item) {
					attIds.push(item.fileId);
				});

				CouplingAttData.update({_id: attCoupling._id}, {$set: {attachmentIds: attIds}});

				validateUpload(this.docId, attIds[0], 'update');
			}
		}
	},
	onSubmit: function(submitType, result) {
	},
	onSuccess: function(submitType, result) {
		Router.go('list');
	},
	onError: function(submitTType, error) {
		console.log(error);
	},

});

async function validateUpload(geodropinId, attachmentId, typeAction) {
	try {
		const validation = await meteorUtils.asyncMeteorCall('runValidation', geodropinId, attachmentId, typeAction);
		Geodata.update({_id: geodropinId}, {
			$set: {
				validationStatus: 'SUCCESS',
				validationMessage: 'Validatie geslaagd',
				uploadStatus: 'PROCESSING',
				uploadMessage: 'Bezig met verwerken',
			}
		});

		processUpload(geodropinId, attachmentId, typeAction);
	} catch (err) {
		Geodata.update({_id: geodropinId}, {
			$set: {
				validationStatus: 'ERROR',
				validationMessage: err.error,
				uploadStatus: 'ERROR',
				uploadMessage: 'Fout bij valideren. Controleer de ZIP file en probeer het nogmaals.',
			}
		});
	}
}

async function processUpload(geodropinId, attachmentId, typeAction) {
	try {
		const upload = await meteorUtils.asyncMeteorCall('runDockerImage', geodropinId, attachmentId, typeAction);
		Geodata.update({_id: geodropinId}, {
			$set: {
				uploadStatus: 'SUCCESS',
				uploadMessage: 'Verwerken geslaagd',
			}
		});

		Meteor.call('sendMail', geodropinId, typeAction);
	} catch (err) {
		Geodata.update({_id: geodropinId}, {
			$set: {
				uploadStatus: 'ERROR',
				uploadMessage: err.error,
			}
		});
	}
}
