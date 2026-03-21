package orientese.co.demo.controller;

import orientese.co.demo.security.TokenService;
import orientese.co.demo.security.Usuario;
import orientese.co.demo.security.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/login")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class AuthenticationController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private TokenService tokenService;

    @PostMapping
    public ResponseEntity<?> efetuarLogin(@RequestBody LoginRequest request) {
        try {
            Usuario usuario = usuarioRepository.findByLogin(request.getLogin());

            if (usuario == null || !passwordEncoder.matches(request.getSenha(), usuario.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new HashMap<String, String>() {{
                            put("error", "Usuário ou senha incorretos");
                        }});
            }

            String token = tokenService.gerarToken(usuario);

            Map<String, String> response = new HashMap<>();
            response.put("token", token);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new HashMap<String, String>() {{
                        put("error", "Erro ao processar login: " + e.getMessage());
                    }});
        }
    }

    public static class LoginRequest {
        private String login;
        private String senha;

        public LoginRequest() {}

        public LoginRequest(String login, String senha) {
            this.login = login;
            this.senha = senha;
        }

        public String getLogin() {
            return login;
        }

        public void setLogin(String login) {
            this.login = login;
        }

        public String getSenha() {
            return senha;
        }

        public void setSenha(String senha) {
            this.senha = senha;
        }
    }
}

