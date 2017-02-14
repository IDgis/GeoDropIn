export const Attachment = new FS.Collection("Attachment", {
	stores: [new FS.Store.FileSystem("Attachment", {path: Meteor.settings.public.directoryFiles})]
});

Attachment.allow({
  'insert': function() {return true;},
  'update': function() {return true;},
  'remove': function() {return true;}
});