#!/bin/bash
# Fix Nginx duplicate location error

echo "Checking existing proxy configuration..."
echo ""
echo "=== Contents of proxy.conf ==="
cat /www/server/panel/vhost/nginx/proxy/thanvish.com/proxy.conf
echo ""
echo "=== Files in proxy directory ==="
ls -la /www/server/panel/vhost/nginx/proxy/thanvish.com/
echo ""

echo "Removing duplicate nodejs.conf file..."
rm -f /www/server/panel/vhost/nginx/proxy/thanvish.com/nodejs.conf

echo ""
echo "Now we need to update the existing proxy.conf file."
echo "Please check the contents above and update proxy.conf accordingly."

