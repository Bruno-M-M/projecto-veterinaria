# Etapa 1: compilar el .jar
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw -q dependency:go-offline
COPY src/ src/
RUN ./mvnw -q package -DskipTests

# Etapa 2: ejecutarlo en una imagen más liviana
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system appuser
COPY --from=build /app/target/*.jar app.jar
USER appuser
EXPOSE 8081
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]