package orientese.co.demo.config;

import orientese.co.demo.security.Usuario;
import orientese.co.demo.security.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);
    private static final int MAX_RETRIES = 3;
    private static final long RETRY_DELAY_MS = 2000;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        initializeDefaultUser();
    }

    private void initializeDefaultUser() {
        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                if (usuarioRepository.findByLogin("admin") == null) {
                    Usuario usuario = new Usuario("admin", passwordEncoder.encode("admin123"));
                    usuarioRepository.save(usuario);
                    logger.info("✅ Usuário de teste criado: login=admin, senha=admin123");
                }
                return; // Sucesso, sair do retry
            } catch (Exception e) {
                logger.warn("⚠️ Tentativa {} de {} falhada ao inicializar usuário: {}", 
                    attempt, MAX_RETRIES, e.getMessage());
                
                if (attempt < MAX_RETRIES) {
                    try {
                        logger.info("⏳ Aguardando {}ms antes de tentar novamente...", RETRY_DELAY_MS);
                        Thread.sleep(RETRY_DELAY_MS);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        logger.error("❌ Thread interrompida durante retry: {}", ie.getMessage());
                        return;
                    }
                } else {
                    logger.error("❌ Falha final ao inicializar usuário após {} tentativas. " +
                        "A aplicação continuará, mas o usuário admin não foi criado.", MAX_RETRIES);
                    return;
                }
            }
        }
    }
}

