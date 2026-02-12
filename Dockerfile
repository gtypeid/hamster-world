# ---- Build Stage ----
FROM eclipse-temurin:21-jdk AS builder

WORKDIR /app
COPY gradlew settings.gradle build.gradle gradle.properties ./
COPY gradle/ gradle/
COPY common/ common/

ARG SERVICE_NAME
COPY ${SERVICE_NAME}/ ${SERVICE_NAME}/

RUN chmod +x gradlew
RUN ./gradlew :${SERVICE_NAME}:bootJar -x test --no-daemon

# ---- Runtime Stage ----
FROM eclipse-temurin:21-jre

WORKDIR /app

ARG SERVICE_NAME
COPY --from=builder /app/${SERVICE_NAME}/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
