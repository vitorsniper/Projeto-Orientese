package orientese.co.demo.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import orientese.co.demo.dto.BlocoRequestDTO;
import orientese.co.demo.dto.BlocoResponseDTO;
import orientese.co.demo.dto.RoteiroRequestDTO;
import orientese.co.demo.dto.RoteiroResponseDTO;
import orientese.co.demo.service.RoteiroService;

import java.util.Optional;
import java.util.logging.Logger;

import java.util.List;

@RestController
@RequestMapping("/api/roteiros/")
public class RoteiroController {

    private final RoteiroService roteiroService;
    private static final Logger LOGGER = Logger.getLogger(RoteiroController.class.getName());

    public RoteiroController(RoteiroService roteiroService) {
        this.roteiroService = roteiroService;
    }

    @PostMapping
    public ResponseEntity<RoteiroResponseDTO> criarRoteiro(@Valid @RequestBody RoteiroRequestDTO dto) {
        RoteiroResponseDTO response = roteiroService.salvar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{id}")
    public ResponseEntity<BlocoResponseDTO> criarBloco(
            @PathVariable Long id,
            @Valid @RequestBody BlocoRequestDTO dto){

        return roteiroService.incluiBloco(id, dto)
            .map(blocoResponseDTO -> ResponseEntity.status(HttpStatus.CREATED).body(blocoResponseDTO))
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{idRoteiro}/blocos/{idBloco}")
    public ResponseEntity<Void> excluirBloco(
            @PathVariable Long idRoteiro,
            @PathVariable Long idBloco) {
        if (roteiroService.excluirBloco(idRoteiro, idBloco)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping
    public List<RoteiroResponseDTO> consultarPorTitulo(@RequestParam(required = false) String titulo) {
        if (titulo != null && !titulo.isBlank()) {
            return roteiroService.consultarPorTitulo(titulo);
        }
        return roteiroService.consultarTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoteiroResponseDTO> consultarPorId(@PathVariable Long id) {
        return roteiroService.consultarPorId(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<RoteiroResponseDTO> atualizarRoteiro(
            @PathVariable Long id,
            @Valid @RequestBody RoteiroRequestDTO dto) {
        return roteiroService.atualizarRoteiro(id, dto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{idRoteiro}/blocos/reordenar")
    public ResponseEntity<Void> reordenarBlocos(
            @PathVariable Long idRoteiro,
            @RequestBody List<Long> novaOrdemIds) {

        if (roteiroService.reordenarBlocos(idRoteiro, novaOrdemIds)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{idRoteiro}/blocos/{idBloco}")
    public ResponseEntity<BlocoResponseDTO> atualizaBloco(
            @PathVariable Long idRoteiro,
            @PathVariable Long idBloco,
            @Valid @RequestBody BlocoRequestDTO dto) {
        return roteiroService.atualizarBloco(idRoteiro, idBloco, dto)
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