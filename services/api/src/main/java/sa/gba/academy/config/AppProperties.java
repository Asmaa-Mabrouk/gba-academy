package sa.gba.academy.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "academy")
public record AppProperties(String jwtSecret, long jwtTtlMinutes, String corsOrigins) {}
