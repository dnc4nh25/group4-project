package com.example.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.config.annotation.ContentNegotiationConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * WebConfig: Cau hinh Content Negotiation de dam bao response mac dinh la
 * application/json;charset=UTF-8.
 *
 * Luu y: CharacterEncodingFilter KHONG can dinh nghia thu cong o day.
 * Spring Boot 4.x tu dong tao no qua HttpEncodingAutoConfiguration
 * dua tren cac thuoc tinh server.servlet.encoding.* trong application.properties.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    /**
     * Cau hinh Content Negotiation: default media type la application/json.
     * Ket hop voi server.servlet.encoding.force-response=true trong application.properties,
     * tat ca JSON response se co Content-Type: application/json;charset=UTF-8.
     */
    @Override
    public void configureContentNegotiation(ContentNegotiationConfigurer configurer) {
        configurer
                .defaultContentType(MediaType.APPLICATION_JSON)
                .mediaType("json", MediaType.APPLICATION_JSON);
    }
}
