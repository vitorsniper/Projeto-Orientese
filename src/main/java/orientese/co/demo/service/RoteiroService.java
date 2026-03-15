package orientese.co.demo.service;

import org.springframework.stereotype.Service;
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

    public Roteiro salvar(Roteiro roteiro) {
        if (roteiro.getBlocos() != null) {
            roteiro.getBlocos().forEach(bloco -> bloco.setRoteiro(roteiro));
        }

        return roteiroRepository.save(roteiro);
    }

    public List<Roteiro> consultarTodos() {
        return roteiroRepository.findAll();
    }

    public Optional<Roteiro> consultar(Long idRoteiro) {
        return roteiroRepository.findById(idRoteiro);
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
