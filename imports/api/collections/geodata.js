import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const GeodataSchema = new SimpleSchema({
  name: {
    type: String,
    label: 'Naam',
  },
  title: {
    type: String,
    label: 'Titel'
  },
  description: {
    type: String,
    label: 'Beschrijving',
    autoform: {
    	rows: 8
    }
  },
  date: {
  	type: Date,
    label: 'Laatste wijzigingsdatum dataset'
  },
  user: {
    type: String,
    defaultValue: function() {
      return Meteor.user().username;
    }
  },
  lastRevisionDate: {
    type: Date,
    autoValue: function() {
        return new Date();
    }
  }
});

export const Geodata = new Mongo.Collection('geodata');
Geodata.attachSchema(GeodataSchema);

Geodata.allow({
	insert: function() {return true;},
	update: function() {return true;},
	remove: function() {return true;}
});