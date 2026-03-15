package orientese.co.demo.service;

import org.springframework.stereotype.Service;
import orientese.co.demo.dto.RoteiroRequestDTO;
import orientese.co.demo.dto.RoteiroResponseDTO;
import orientese.co.demo.model.Roteiro;
import orientese.co.demo.repository.RoteiroRepository;

import java.util.List;
import java.util.Optional;

@Service
public class RoteiroService {
    private final RoteiroRepository roteiroRepository;

    public RoteiroService(RoteiroRepository roteiroRepository) {
        this.roteiroRepository = roteiroRepository;
    }

    public RoteiroResponseDTO salvar(RoteiroRequestDTO dto) {
        // 1. Converte DTO para Entity
        Roteiro roteiro = new Roteiro();
        roteiro.setTitulo(dto.titulo());
        roteiro.setDuracaoEstimada(dto.duracaoEstimada());

        // 2. Salva a Entity no banco
        Roteiro salvo = roteiroRepository.save(roteiro);

        // 3. Retorna o ResponseDTO
        return new RoteiroResponseDTO(salvo.getId(), salvo.getTitulo(), salvo.getDuracaoEstimada());
    }

    public List<RoteiroResponseDTO> consultarTodos() {
        return roteiroRepository.findAll()
                .stream()
                .map(roteiro -> new RoteiroResponseDTO(
                        roteiro.getId(),
                        roteiro.getTitulo(),
                        roteiro.getDuracaoEstimada()
                )).toList();
    }

    public Optional<RoteiroResponseDTO> consultar(Long id) {
        return roteiroRepository.findById(id)
                .map(roteiro -> new RoteiroResponseDTO(
                        roteiro.getId(),
                        roteiro.getTitulo(),
                        roteiro.getDuracaoEstimada()
                ));
    }

    public Optional<Roteiro> atualizar(Long id, Roteiro roteiroAtualizado) {
        if (roteiroRepository.existsById(id)) {
            roteiroAtualizado.setId(id);

            // Mantém a integridade com os blocos
            if (roteiroAtualizado.getBlocos() != null) {
                roteiroAtualizado.getBlocos().forEach(bloco -> bloco.setRoteiro(roteiroAtualizado));
            }

            return Optional.of(roteiroRepository.save(roteiroAtualizado));
        }
        return Optional.empty();
    }

    public boolean excluir(Long idRoteiro) {
        if (roteiroRepository.existsById(idRoteiro)) {
            roteiroRepository.deleteById(idRoteiro);
            return true;
        }
        return false;
    }
}
