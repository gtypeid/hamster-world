FROM eclipse-temurin:21-jre

WORKDIR /app

ARG JAR_FILE
COPY ${JAR_FILE} app.jar

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
