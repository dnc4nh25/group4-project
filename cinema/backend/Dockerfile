# Sử dụng image Maven có sẵn JDK 17 để build project
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy file cấu hình Maven và tải dependency trước (tối ưu cache)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy toàn bộ mã nguồn và build ra file JAR
COPY src ./src
RUN mvn clean package -DskipTests

# Chuyển sang image JRE 17 siêu nhẹ để chạy ứng dụng (tiết kiệm RAM trên Render)
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy file JAR đã build từ bước trên sang
COPY --from=build /app/target/*.jar app.jar

# Mở cổng 8080
EXPOSE 8080

# Chạy Spring Boot với profile prod (đọc biến môi trường)
ENTRYPOINT ["java", "-Dspring.profiles.active=prod", "-jar", "app.jar"]
