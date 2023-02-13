.PHONY: run
run: compile
	@./gradlew bootRun

.PHONY: build
build:
	@./gradlew build

clean:
	@./gradlew clean

.PHONY: test
test:
	@./gradlew test

.PHONY: docker-run
docker-run:
	@echo "Docker Build"
	@./gradlew clean build -x test
	@docker build -t book-sample:latest .
	@docker run -p 8080:8080  --name sample-app  --rm book-sample:latest
