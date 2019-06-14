import './remove-validation.html';

import { Template } from 'meteor/templating';
import { Attachment } from '../../api/collections/attachment';
import { CouplingAttData } from '../../api/collections/couplingAttData';
import { Geodata } from '../../api/collections/geodata';
import { utils } from '../../../lib/utils';

Template.removeValidation.events({
    'click .js-remove-data-popup': function(e) {

        const geodataId = this.id;
        Geodata.remove({ _id: geodataId });
        const couplingObject = CouplingAttData.findOne({ dataId: geodataId });

        if (couplingObject) {
            const couplingId = couplingObject._id;
            const attIds = couplingObject.attachmentIds;

            utils.processUpload(geodataId, attIds[0], 'delete');

            CouplingAttData.remove({ _id: couplingId });
            attIds.forEach(item => {
                Attachment.remove({ _id: item });
            });
        }
    },

    'click .removal-info': function(e) {
        const moreInfo = 'Meer informatie';
        const lessInfo = 'Minder informatie';

        if (e.target.textContent === moreInfo) {
            e.target.textContent = lessInfo;
        } else {
            e.target.textContent = moreInfo;
        }
    }
});
