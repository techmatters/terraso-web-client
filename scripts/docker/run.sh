 #!/bin/bash

PARAMS="$1"
COMMAND="$2"

# Define specific folders and files to mount from local dev
# to improve start performance
toMount="locales public scripts src .eslintrc .prettierrc jsconfig.json"
volumes=""
for entry in $toMount
do
  volumes="${volumes} -v ${PWD}/${entry}:/app/${entry}"
done

docker run \
    -it \
    --rm \
    --env-file ${PWD}/local.env \
    $volumes \
    $PARAMS \
    techmatters/terraso_web_client \
    bash -c "$COMMAND"
