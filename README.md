### geodropin

Build the docker image:

`docker build -t idgis/geodropin:[geodropin-version] .`

### oracle-metadata

After building the oracle-metadata image (with `./gradlew clean build buildImage` in the `oracle-metadata` folder) it is build with the `latest` tag.

Re-tag it with the tag of the geodropin version of that release:

`docker tag [docker-image-id] idgis/ogr2ogr-oracle-metadata:[geodropin-version]`
