import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const GeodataSchema = new SimpleSchema({
  name: {
    type: String,
    label: 'Naam',
    regEx: /^\S*$/,
    custom: function() {
      var id = this.userId;
      if(id != null) {
        var username = Meteor.user().username;

        if(this.isInsert) {
          var data = Geodata.findOne({user: username, name: this.value});
          if(data === undefined) {
            return undefined;
          } else {
            return 'notUnique';
          }
        } else if(this.isUpdate) {
          var data = Geodata.find({user: username, name: this.value}).fetch();
          if(data.length > 0 && data[0]._id !== this.docId) {
            return 'notUnique';
          } else {
            return undefined;
          }
        }
      }
    }
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
    autoValue: function() {
      var id = this.userId;
      if(id != null) {
        return Meteor.user().username;
      }
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