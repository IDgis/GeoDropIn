import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const CouplingAttDataSchema = new SimpleSchema({
  dataId: {
    type: String
  },
  attachmentIds: {
    type: [String]
  }
});

export const CouplingAttData = new Mongo.Collection('couplingAttData');
CouplingAttData.attachSchema(CouplingAttDataSchema);

CouplingAttData.allow({
	insert: function() {return true;},
	update: function() {return true;},
	remove: function() {return true;}
});