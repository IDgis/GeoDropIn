FROM nginx

COPY conf /etc/nginx/conf.d

COPY start.sh /opt/start.sh
RUN chmod a=rwx /opt/start.sh

COPY stylesheets/ /var/www/stylesheets/
COPY stylesheet-tabs/*.png /var/www/tabs/

ENTRYPOINT ["/opt/start.sh"]