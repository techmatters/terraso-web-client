 #!/bin/bash

PARAMS="$1"
COMMAND="$2"

# Define specific folders and files to mount from local dev
# to improve start performance
toMount="locales public scripts src .gitignore .eslintrc .prettierrc .prettierignore .stylelintrc tsconfig.json package.json package-lock.json"
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
