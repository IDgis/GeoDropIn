import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const ClientSchema = new SimpleSchema({
  name: {
    type: String
  }
});

export const Client = new Mongo.Collection('client');
Client.attachSchema(ClientSchema);

Client.allow({
	insert: function() {return true;},
	update: function() {return true;},
	remove: function() {return true;}
});