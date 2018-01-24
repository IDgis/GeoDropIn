import { Meteor } from 'meteor/meteor';

Meteor.methods({

    /**
     * Enter the files object from the read zip. This function returns
     * true if .shp, .shx and .dbf files are present, false otherwise.
     * 
     * @param {Object} files 
     */
    areExtensionsPresent(files) {
        var fileNames = Object.keys(files);
        var shpPresent = false;
        var shxPresent = false;
        var dbfPresent = false;
        
        fileNames.forEach(name => {
            if(name.indexOf('.shp') !== -1) {
                shpPresent = true;
            }
            if(name.indexOf('.shx') !== -1) {
                shxPresent = true;
            }
            if(name.indexOf('dbf') !== -1) {
                dbfPresent = true;
            }
        });
    
        return shpPresent && shxPresent && dbfPresent;
    },

    /**
     * Enter the files object from the read zip. This function returns
     * true if extensions are double in the zip, false otherwise.
     * 
     * @param {Object} files 
     */
    areExtensionsDouble(files) {
        var fileNames = Object.keys(files);
        var extensions = [];
        var doubleExtensions = false;
    
        fileNames.forEach(name => {
            var extension = name.substring(name.indexOf('.'), name.length);
            if(extensions.indexOf(extension) === -1) {
                extensions.push(extension);
            } else {
                doubleExtensions = true;
            }
        });
    
        return doubleExtensions;
    }
});