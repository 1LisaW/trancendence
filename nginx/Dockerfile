FROM nginx

RUN apt-get update && apt-get install -y \
openssl \
curl

COPY nginx.conf /etc/nginx/nginx.conf

RUN mkdir -p /etc/nginx/ssl/ && \
	chmod 755 /etc/nginx/ssl/ && \
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/nginx/ssl/nginx.key -out /etc/nginx/ssl/nginx.crt -sha256 -subj "/CN=${WP_URL}"

EXPOSE 443
EXPOSE 80

# CMD ["tail", "-f", "/dev/null"]
CMD ["nginx", "-g", "daemon off;"]
