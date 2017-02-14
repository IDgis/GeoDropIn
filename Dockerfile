FROM abernix/meteord:base
MAINTAINER IDgis bv

ARG NODE_VERSION
ENV NODE_VERSION ${NODE_VERSION:-4.6.2}
ENV NODE_VERSION ${NODE_VERSION:-4.6.2}

COPY ./ /app
RUN bash $METEORD_DIR/lib/install_meteor.sh
RUN bash $METEORD_DIR/lib/build_app.sh