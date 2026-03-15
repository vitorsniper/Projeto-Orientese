package orientese.co.demo.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import orientese.co.demo.dto.RoteiroRequestDTO;
import orientese.co.demo.dto.RoteiroResponseDTO;
import orientese.co.demo.model.Roteiro;
import orientese.co.demo.service.RoteiroService;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/roteiros")
public class RoteiroController {

    private final RoteiroService roteiroService;

    public RoteiroController(RoteiroService roteiroService) {
        this.roteiroService = roteiroService;
    }

    @PostMapping
    public ResponseEntity<RoteiroResponseDTO> criar(@Valid @RequestBody RoteiroRequestDTO dto) {
        RoteiroResponseDTO response = roteiroService.salvar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public List<RoteiroResponseDTO> consultarTodos() {
        return roteiroService.consultarTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoteiroResponseDTO> consultar(@PathVariable Long id) {
        return roteiroService.consultar(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Roteiro> atualizarRoteiro(@PathVariable Long id, @Valid @RequestBody Roteiro roteiro){
        return roteiroService.atualizar(id, roteiro)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletaRoteiro(@PathVariable Long id) {
        if (roteiroService.excluir(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}