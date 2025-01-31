FROM ubuntu:24.04 AS builder
LABEL maintainer="IDgis bv"

RUN apt-get update && \
    apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get --purge autoremove -y && \
    apt-get clean

# Install Meteor
RUN (curl https://install.meteor.com/?release=1.4.2.3 | sh)

# Install Node
RUN bash -c 'curl "https://nodejs.org/dist/v4.6.2/node-v4.6.2-linux-x64.tar.gz" > /tmp/required-node-linux-x64.tar.gz' \
  && cd /usr/local \
  && tar --strip-components 1 -xzf /tmp/required-node-linux-x64.tar.gz \
  && rm /tmp/required-node-linux-x64.tar.gz

RUN mkdir /home/meteorapp
WORKDIR /home/meteorapp

ADD . ./app

ENV NODE_TLS_REJECT_UNAUTHORIZED=0

RUN cd /home/meteorapp/app \
  && meteor npm install --production \
  && meteor build ../build --directory --allow-superuser \
  && cd /home/meteorapp/build/bundle/programs/server \
  && npm install

# Expose default port 3000
EXPOSE 3000
ENV PORT=3000

CMD ["node", "/home/meteorapp/build/bundle/main.js"]
