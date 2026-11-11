# ---------- Etapa 1: compilar ----------
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

COPY .mvn .mvn
COPY mvnw pom.xml ./
# Evita el error "bad interpreter" si mvnw tiene saltos de línea de Windows
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw
# Descarga dependencias en una capa aparte (acelera los rebuilds)
RUN ./mvnw -q dependency:go-offline

COPY src src
# Sin tests: contextLoads necesita la base Oracle, que no existe al compilar
RUN ./mvnw -q clean package -DskipTests

# ---------- Etapa 2: ejecutar ----------
FROM eclipse-temurin:21-jre
WORKDIR /app

RUN useradd --system --no-create-home appuser
COPY --from=build /app/target/*.jar app.jar
USER appuser

# Cambiar el puerto en cada servicio: 8081 productos, 8082 auth, 8083 ventas
EXPOSE 8083

# Limita la memoria (importante en una EC2 pequeña con tres servicios)
ENV JAVA_OPTS="-Xms128m -XX:MaxRAMPercentage=60"

# Variables que se entregan al ejecutar (NUNCA escritas aquí):
#   DB_SERVICIO, WALLET_DIR, DB_USER, DB_PASSWORD, JWT_SECRET
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]