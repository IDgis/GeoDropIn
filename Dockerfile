FROM abernix/meteord:base
MAINTAINER IDgis bv

COPY ./ /app
COPY geodropin.sh $METEORD_DIR/lib
COPY install_meteor.sh $METEORD_DIR/lib

RUN bash $METEORD_DIR/lib/install_meteor.sh
RUN bash $METEORD_DIR/lib/geodropin.sh