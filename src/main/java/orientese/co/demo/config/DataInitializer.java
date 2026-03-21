package orientese.co.demo.config;

import orientese.co.demo.security.Usuario;
import orientese.co.demo.security.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (usuarioRepository.findByLogin("admin") == null) {
            Usuario usuario = new Usuario("admin", passwordEncoder.encode("admin123"));
            usuarioRepository.save(usuario);
            System.out.println("✅ Usuário de teste criado: login=admin, senha=admin123");
        }
    }
}

