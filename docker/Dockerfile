FROM abernix/meteord:base
MAINTAINER IDgis bv

ENV NODE_VERSION ${NODE_VERSION:-6.10.0}
ARG NODE_VERSION

COPY ./ /app
COPY geodropin.sh $METEORD_DIR/lib

RUN bash $METEORD_DIR/lib/install_meteor.sh
RUN bash $METEORD_DIR/lib/geodropin.sh