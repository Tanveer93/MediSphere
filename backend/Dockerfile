# Build stage using Maven and OpenJDK 17
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom.xml and source files
COPY pom.xml .
COPY src ./src

# Package the application skipping tests for faster build
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Copy the built JAR from the build stage
COPY --from=build /app/target/medisphere-backend-1.0.0.jar app.jar

# Expose the default Spring Boot port
EXPOSE 5000

# Run Spring Boot app
ENTRYPOINT ["java", "-Dserver.port=5000", "-jar", "app.jar"]
