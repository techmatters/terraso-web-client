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
		"--name terraso_web_client_build -p 3000:3000" \
		"npm run build"

lint:
	./scripts/docker/run.sh \
		"--name terraso_web_client_lint" \
		"npm run lint"

test:
	./scripts/docker/run.sh \
		"--name terraso_web_client_test" \
		"npm run test"

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
