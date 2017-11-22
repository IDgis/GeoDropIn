import './form.html';
import './form.css';

import { Geodata, GeodataSchema } from '/imports/api/collections/geodata.js';
import { Attachment } from '/imports/api/collections/attachment.js';
import { CouplingAttData, CouplingAttDataSchema } from '/imports/api/collections/couplingAttData.js';

Template.form.onRendered(function() {
	Session.set('attachmentIds', []);
	Session.set('attachmentRemoveIds', []);
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
	},
	showAttachmentNames: function() {
		var attObjects = [];
		
		if(Session.get('selectedGeodataId') !== null) {
			var atts = CouplingAttData.findOne({dataId: Session.get('selectedGeodataId')});
			if(typeof atts !== 'undefined') {
				atts.attachmentIds.forEach(function(item) {
					var att = Attachment.findOne({_id: item});
					var obj = {'id': att._id, 'name': att.copies.Attachment.key};
					attObjects.push(obj);
				});
			}
		}
		
		return attObjects;
	}
});

Template.form.events({
	'click #js-form-cancel': function() {
		Router.go('list');
	},
	'change .js-attachment': function(e) {
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
		update: function(doc) {
			Meteor.call('sendMail', this.docId, 'updated');
			
			return doc;
		}
	},
	after: {
		insert: function(error, result) {
			var dataId = result;
			var attachmentItems = Session.get('attachmentIds');
			var attachmentIds = [];
			
			attachmentItems.forEach(function(item) {
				attachmentIds.push(item.fileId);
			});
			
			CouplingAttData.insert({dataId: dataId, attachmentIds: attachmentIds});
			
			var coupAttRecord = CouplingAttData.findOne({dataId: dataId});
			var attRecord = Attachment.findOne({_id: coupAttRecord.attachmentIds[0]});
			var zipFile = attRecord.copies.Attachment.key;
			var zipName = zipFile.substr(0, zipFile.indexOf('.zip')); 
			
			Meteor.call('runDockerImage', dataId, zipName, 'insert');
			Meteor.call('sendMail', dataId, 'inserted');
		},
		update: function(error, result) {
			var attRemove = Session.get('attachmentRemoveIds');
			var attCoupling = CouplingAttData.findOne({dataId: this.docId});
			var attIds = attCoupling.attachmentIds;
			
			attRemove.forEach(function(item) {
				var attIndex = attIds.indexOf(item);
				if(attIndex > -1) {
					attIds.splice(attIndex, 1);
					Attachment.remove({_id: item});
				}
			});
			
			var attachmentItems = Session.get('attachmentIds');
			attachmentItems.forEach(function(item) {
				attIds.push(item.fileId);
			});
			
			var couplingId = CouplingAttData.findOne({dataId: this.docId})._id;
			CouplingAttData.update({_id: couplingId}, {$set: {attachmentIds: attIds}});
			
			var coupAttRecord = CouplingAttData.findOne({dataId: this.docId});
			var attRecord = Attachment.findOne({_id: coupAttRecord.attachmentIds[0]});
			var zipFile = attRecord.copies.Attachment.key;
			var zipName = zipFile.substr(0, zipFile.indexOf('.zip')); 
			Meteor.call('runDockerImage', this.docId, zipName, 'update');
		}
	},
	onSuccess: function() {
		Router.go('list');
	}
});