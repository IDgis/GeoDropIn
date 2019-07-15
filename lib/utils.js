import { Meteor } from 'meteor/meteor';
import { Geodata } from '../imports/api/collections/geodata';

export const utils = {

    asyncMeteorCall: function(methodName, ...args) {
        return new Promise((resolve, reject) => {
            Meteor.call(methodName, ...args, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
        });
    },

    validateUpload: async function(geodropinId, attachmentId, typeAction) {
        try {
            if (!attachmentId) {
                throw new Meteor.Error('Er is iets mis gegaan met het uploaden van het ZIP bestand. ' +
                    'Probeer het formulier nogmaals op te slaan of om het ZIP bestand opnieuw te uploaden. Mochten de problemen zich voor blijven doen, ' + 
                    'neem dan contact op met de beheerder.');
            }
            
            const validation = await this.asyncMeteorCall('runValidation', geodropinId, attachmentId, null, typeAction);
            Geodata.update({ _id: geodropinId }, {
                $set: {
                    validationStatus: 'SUCCESS',
                    validationMessage: 'Validatie geslaagd',
                    uploadStatus: 'PROCESSING',
                    uploadMessage: 'Bezig met verwerken',
                }
            });

            this.processUpload(geodropinId, attachmentId, typeAction);
        } catch (e) {
            Geodata.update({ _id: geodropinId }, {
                $set: {
                    validationStatus: 'ERROR',
                    validationMessage: e.error || e,
                    uploadStatus: 'ERROR',
                    uploadMessage: 'Fout bij valideren. Controleer de ZIP file en probeer het nogmaals.',
                }
            });
        }
    },

    processUpload: async function(geodropinId, attachmentId, typeAction) {
        try {
            const upload = await this.asyncMeteorCall('runDockerImage', geodropinId, attachmentId, null, typeAction);
            Geodata.update({ _id: geodropinId }, {
                $set: {
                    uploadStatus: 'SUCCESS',
                    uploadMessage: 'Verwerken geslaagd',
                }
            });

            if (process.env.GEODROPIN_HOST && process.env.GEODROPIN_HOST.indexOf('local') === -1) {
                Meteor.call('sendMail', geodropinId, typeAction);
            }
        } catch (e) {
            Geodata.update({ _id: geodropinId }, {
                $set: {
                    uploadStatus: 'ERROR',
                    uploadMessage: e.error || e,
                }
            });
        }
    }
};
