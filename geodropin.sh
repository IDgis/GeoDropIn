set -e
set -x

COPIED_APP_PATH=/copied-app
BUNDLE_DIR=/tmp/bundle-dir

# sometimes, directly copied folder cause some wierd issues
# this fixes that
echo "=> Copying the app"
cp -R /app $COPIED_APP_PATH
cd $COPIED_APP_PATH

echo "=> Executing NPM install --production"
meteor npm install --production
meteor npm install --save babel-runtime
meteor npm install --save bcrypt
meteor npm install --save file-system
meteor npm install --save meteor-node-stubs
meteor npm install --save path

echo "=> Executing Meteor Build..."
export
meteor build \
  --allow-superuser \
  --directory $BUNDLE_DIR \
  --server=http://localhost:3000

echo "=> Printing Meteor Node information..."
echo "  => platform"
meteor node -p process.platform
echo "  => arch"
meteor node -p process.arch
echo "  => versions"
meteor node -p process.versions

echo "=> Printing System Node information..."
echo "  => platform"
node -p process.platform
echo "  => arch"
node -p process.arch
echo "  => versions"
node -p process.versions

echo "=> Executing NPM install within Bundle"
cd $BUNDLE_DIR/bundle/programs/server/
npm i

echo "=> Moving bundle"
mv $BUNDLE_DIR/bundle /built_app

echo "=> Cleaning up"
# cleanup
echo " => COPIED_APP_PATH"
rm -rf $COPIED_APP_PATH
echo " => BUNDLE_DIR"
rm -rf $BUNDLE_DIR