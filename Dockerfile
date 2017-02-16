FROM abernix/meteord:base
MAINTAINER IDgis bv

ARG NODE_VERSION
ENV NODE_VERSION ${NODE_VERSION:-4.7.2}

COPY ./ /app
COPY geodropin.sh $METEORD_DIR/lib

RUN bash $METEORD_DIR/lib/install_meteor.sh
RUN bash $METEORD_DIR/lib/geodropin.sh