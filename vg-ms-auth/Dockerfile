FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml .
RUN mvn -q -B -ntp dependency:go-offline

COPY src ./src
RUN mvn -q -B -ntp package -DskipTests

FROM eclipse-temurin:21-jdk AS jre-build

RUN $JAVA_HOME/bin/jlink \
    --add-modules java.base,java.logging,java.sql,java.naming \
    --strip-debug \
    --no-man-pages \
    --no-header-files \
    --compress=2 \
    --output /jre

FROM alpine:3.20

WORKDIR /app

COPY --from=jre-build /jre /opt/jre

COPY --from=build /app/target/*.jar app.jar

ENV PATH="/opt/jre/bin:$PATH"

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]