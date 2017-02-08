import './form.html';
import './form.css';

import { Geodata, GeodataSchema } from '/imports/api/collections/geodata.js';
import { Attachment } from '/imports/api/collections/attachment.js';
import { CouplingAttData, CouplingAttDataSchema } from '/imports/api/collections/couplingAttData.js';

Template.form.onRendered(function() {
	var attachmentIds = [];
	Session.set('attachmentIds', attachmentIds);
});

Template.form.helpers({
	geodataDoc: function() {
		/*if(Session.get("selectedTextId")) {
			return this;
		} else {
			return null ;
		}*/
		
		return null;
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
	'click #js-add-attachment': function() {
		var divAttTemp = $('#div-attachment-first');
		var newAttIndex = $('.div-attachment').length;
		
		var newAtt = divAttTemp.clone()[0];
		$(newAtt).removeAttr('id');
		
		var span = document.createElement('span');
		$(span).attr('class', 'glyphicon glyphicon-remove js-remove-attachment');
		
		$('label', newAtt)[0].append(span);
		$('input', newAtt).attr('data-index', newAttIndex);
		$('input', newAtt).removeAttr('data-id');
		$('input', newAtt).val('');
		
		$('#div-attachments').append(newAtt);
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
	}
});

function findIndex(obj) {
	return obj.index === Session.get('activeIndex');
}

AutoForm.addHooks('geodataform', {
	after: {
		insert: function(error, result) {
			var dataId = result;
			var attachmentItems = Session.get('attachmentIds');
			var attachmentIds = [];
			
			attachmentItems.forEach(function(item) {
				attachmentIds.push(item.fileId);
			});
			
			CouplingAttData.insert({dataId: dataId, attachmentIds: attachmentIds});
		}
	},
	onSuccess: function() {
		Router.go('list');
	}
});