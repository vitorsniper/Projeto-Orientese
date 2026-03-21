package orientese.co.demo.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configurações da aplicação Orientese
 */
@Configuration
@ConfigurationProperties(prefix = "app")
public class ApplicationProperties {
    
    private Database database = new Database();
    private Security security = new Security();
    
    public static class Database {
        private int maxRetries = 3;
        private long retryDelayMs = 2000;
        
        public int getMaxRetries() { return maxRetries; }
        public void setMaxRetries(int maxRetries) { this.maxRetries = maxRetries; }
        public long getRetryDelayMs() { return retryDelayMs; }
        public void setRetryDelayMs(long retryDelayMs) { this.retryDelayMs = retryDelayMs; }
    }
    
    public static class Security {
        private String tokenSecret = "default-secret";
        private long tokenExpiration = 3600000; // 1 hora
        
        public String getTokenSecret() { return tokenSecret; }
        public void setTokenSecret(String tokenSecret) { this.tokenSecret = tokenSecret; }
        public long getTokenExpiration() { return tokenExpiration; }
        public void setTokenExpiration(long tokenExpiration) { this.tokenExpiration = tokenExpiration; }
    }
    
    public Database getDatabase() { return database; }
    public void setDatabase(Database database) { this.database = database; }
    public Security getSecurity() { return security; }
    public void setSecurity(Security security) { this.security = security; }
}

