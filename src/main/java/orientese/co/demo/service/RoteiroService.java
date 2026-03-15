package orientese.co.demo.service;

import org.springframework.stereotype.Service;
import orientese.co.demo.dto.BlocoResponseDTO;
import orientese.co.demo.dto.RoteiroRequestDTO;
import orientese.co.demo.dto.RoteiroResponseDTO;
import orientese.co.demo.model.Bloco;
import orientese.co.demo.model.Roteiro;
import orientese.co.demo.repository.RoteiroRepository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RoteiroService {
    private final RoteiroRepository roteiroRepository;

    public RoteiroService(RoteiroRepository roteiroRepository) {
        this.roteiroRepository = roteiroRepository;
    }

    public RoteiroResponseDTO salvar(RoteiroRequestDTO dto) {
        if(roteiroRepository.findByTitulo(dto.titulo()).isPresent()) {
            throw new IllegalArgumentException("Título já existe!");
        }

        Roteiro roteiro = new Roteiro();
        roteiro.setTitulo(dto.titulo());
        roteiro.setSubtitulo(dto.subtitulo());
        roteiro.setDuracaoEstimada(dto.duracaoEstimada());
        roteiro.setRoteirista(dto.roteirista());
        roteiro.setLocutor(dto.locutor());
        roteiro.setEditorVideo(dto.editorVideo());
        roteiro.setDiretorArte(dto.diretorArte());

        if (dto.blocos() != null) {
            List<Bloco> entidadesBlocos = dto.blocos().stream().map(blocoDto -> {
                Bloco bloco = new Bloco();
                bloco.setRoteiro(roteiro);
                bloco.setTituloBloco(blocoDto.tituloBloco());
                bloco.setTempoInicio(blocoDto.tempoInicio());
                bloco.setTempoFim(blocoDto.tempoFim());
                bloco.setDirecaoVisual(blocoDto.direcaoVisual());
                bloco.setConteudo(blocoDto.conteudo());
                bloco.setOrdem(blocoDto.ordem());
                return bloco;
            }).collect(Collectors.toList());

            roteiro.setBlocos(entidadesBlocos);
        }

        // 4. Salva (O CascadeType.ALL na Entity garante que os blocos vão junto)
        Roteiro salvo = roteiroRepository.save(roteiro);

        return converterParaDTO(salvo);
    }

    private RoteiroResponseDTO converterParaDTO(Roteiro roteiro) {
        List<BlocoResponseDTO> blocosDTO = null;

        if (roteiro.getBlocos() != null) {
            blocosDTO = roteiro.getBlocos().stream()
                    .map(bloco -> new BlocoResponseDTO(
                            bloco.getId(),
                            bloco.getTituloBloco(),
                            bloco.getDirecaoVisual(),
                            bloco.getTempoInicio(),
                            bloco.getTempoFim(),
                            bloco.getConteudo(),
                            bloco.getOrdem()
                    ))
                    .toList();
        }

        return new RoteiroResponseDTO(
                roteiro.getId(),
                roteiro.getTitulo(),
                roteiro.getDuracaoEstimada(),
                blocosDTO
        );
    }

    public List<RoteiroResponseDTO> consultarTodos() {
        return roteiroRepository.findAll().stream()
                .map(this::converterParaDTO)
                .toList();
    }

    public Optional<RoteiroResponseDTO> consultarPorId(Long id) {
        return roteiroRepository.findById(id)
                .map(this::converterParaDTO);
    }

    public List<RoteiroResponseDTO> consultarPorTitulo(String parteDoTitulo) {
        return roteiroRepository.findByTituloContainingIgnoreCase(parteDoTitulo)
                .stream()
                .map(this::converterParaDTO).toList();
    }

    public Optional<RoteiroResponseDTO> atualizarRoteiro(Long id, RoteiroRequestDTO dto) {
        return roteiroRepository.findById(id).map(roteiroExistente -> {
            roteiroExistente.setTitulo(dto.titulo());
            roteiroExistente.setDuracaoEstimada(dto.duracaoEstimada());

            Roteiro atualizado = roteiroRepository.save(roteiroExistente);

            return converterParaDTO(atualizado);
        });
    }

    public boolean excluir(Long idRoteiro) {
        if (roteiroRepository.existsById(idRoteiro)) {
            roteiroRepository.deleteById(idRoteiro);
            return true;
        }
        return false;
    }
}
