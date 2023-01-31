.PHONY: run
run: compile
	@./gradlew bootRun

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
	@docker run -p 8080:80  --name sample-app  --rm book-sample:latest