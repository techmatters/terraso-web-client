build-docker:
	docker build --tag=techmatters/terraso_web_client --file=Dockerfile .

clean-docker:
	docker ps --filter name=terraso_web_client* -aq | xargs docker stop
	docker ps --filter name=terraso_web_client* -aq | xargs docker rm

run:
	./scripts/docker/run.sh \
		"--name terraso_web_client -p 3000:3000" \
		"npm start"

run-build:
	./scripts/docker/run.sh \
		"--name terraso_web_client_build -p 3000:3000" \
		"npm run build && npm run build-serve"

build:
	./scripts/docker/run.sh \
		"--name terraso_web_client_build" \
		"npm run build"

format:
		npm run format-js && npm run format-css

lint:
		npm run lint-js && npm run lint-css && npm run check-ts

format-css:
		npm run format-css

format-js:
		npm run format-js

lint-js:
		npm run lint-js

lint-css:
		npm run lint-css

check-ts:
		npm run check-ts

test:
	./scripts/docker/run.sh \
		"--name terraso_web_client_test" \
		"npm run test"

test-a11y:
	./scripts/docker/run.sh \
		"--name terraso_web_client_test" \
		"TEST_A11Y=true npm run test"

test-coverage:
	./scripts/docker/run.sh \
		"--name terraso_web_client_test_coverage" \
		"npm run test-coverage"


localization-to-po:
	./scripts/docker/run.sh \
		"--name terraso_web_client_localization" \
		"npm run localization-to-po"

localization-to-json:
	./scripts/docker/run.sh \
		"--name terraso_web_client_localization" \
		"npm run localization-to-json"

npm:
	./scripts/docker/run.sh \
		"--name terraso_web_client_npm" \
		"npm $(command)"
