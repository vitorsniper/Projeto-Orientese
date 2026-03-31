package orientese.co.api.service;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import orientese.co.api.dto.*;
import orientese.co.api.model.Asset;
import orientese.co.api.model.Bloco;
import orientese.co.api.model.Roteiro;
import orientese.co.api.model.Trecho;
import orientese.co.api.repository.RoteiroRepository;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
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
        roteiro.setRoteirista(dto.roteirista());
        roteiro.setLocutor(dto.locutor());
        roteiro.setEditorVideo(dto.editorVideo());
        roteiro.setDiretorArte(dto.diretorArte());

        roteiro.setDuracaoEstimada("00:00");

        if (dto.blocos() != null) {
            List<Bloco> entidadesBlocos = dto.blocos().stream().map(blocoDto -> {
                Bloco bloco = new Bloco();
                bloco.setRoteiro(roteiro);
                bloco.setTituloBloco(blocoDto.tituloBloco());
                bloco.setDuracaoEmSegundos(blocoDto.duracaoEmSegundos());
                bloco.setDirecaoVisual(blocoDto.direcaoVisual());
                bloco.setConteudo(blocoDto.conteudo());
                bloco.setOrdem(blocoDto.ordem());
                return bloco;
            }).collect(Collectors.toList());

            roteiro.setBlocos(entidadesBlocos);
        }

        Roteiro salvo = roteiroRepository.save(roteiro);

        return converterParaDTO(salvo);
    }

    private RoteiroResponseDTO converterParaDTO(Roteiro roteiro) {
        List<BlocoResponseDTO> blocosDTO = null;

        if (roteiro.getBlocos() != null) {
            blocosDTO = roteiro.getBlocos().stream()
                    .map(this::mapToBlocoResponseDTO)
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
        return roteiroRepository.findByAtivoTrue().stream()
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
                .filter(Roteiro::getAtivo)
                .map(this::converterParaDTO).toList();
    }

    public Optional<RoteiroResponseDTO> atualizarRoteiro(Long id, RoteiroRequestDTO dto) {
        return roteiroRepository.findById(id).map(roteiroExistente -> {

            roteiroExistente.setTitulo(dto.titulo());
            roteiroExistente.setSubtitulo(dto.subtitulo());
            roteiroExistente.setRoteirista(dto.roteirista());
            roteiroExistente.setLocutor(dto.locutor());
            roteiroExistente.setEditorVideo(dto.editorVideo());
            roteiroExistente.setDiretorArte(dto.diretorArte());

            Roteiro atualizado = roteiroRepository.save(roteiroExistente);

            return converterParaDTO(atualizado);
        });
    }

    public boolean desativarRoteiro(Long idRoteiro) {
        return roteiroRepository.findById(idRoteiro).map(roteiro -> {
            roteiro.setAtivo(false);
            roteiroRepository.save(roteiro);
            return true;
        }).orElse(false);
    }

    public Optional<BlocoResponseDTO> incluiBloco(Long idRoteiro, BlocoRequestDTO blocoNovo) {
        return roteiroRepository.findById(idRoteiro).map(roteiroExistente -> {
            int proximaOrdem = roteiroExistente.getBlocos().size() + 1;
            Bloco bloco = new Bloco();
            bloco.setOrdem(proximaOrdem);
            bloco.setTituloBloco(blocoNovo.tituloBloco());
            bloco.setDuracaoEmSegundos(blocoNovo.duracaoEmSegundos());
            bloco.setDirecaoVisual(blocoNovo.direcaoVisual());
            bloco.setConteudo(blocoNovo.conteudo());

            bloco.setRoteiro(roteiroExistente);

            roteiroExistente.getBlocos().add(bloco);

            roteiroRepository.save(roteiroExistente);

            return mapToBlocoResponseDTO(bloco);
        });
    }

    @Transactional
    public boolean excluirBloco(Long idRoteiro, Long idBloco){
        return roteiroRepository.findById(idRoteiro).map(roteiro -> {
            boolean removed = roteiro.getBlocos().removeIf(bloco -> bloco.getId().equals(idBloco));
            if (removed) {
                var blocos = roteiro.getBlocos();
                java.util.stream.IntStream.range(0, blocos.size())
                    .forEach(i -> blocos.get(i).setOrdem(i + 1));
                roteiroRepository.save(roteiro);
            }
            return removed;
        }).orElse(false);
    }

    @Transactional
    public boolean reordenarBlocos(Long idRoteiro, List<Long> idsNaNovaOrdem) {
        return roteiroRepository.findById(idRoteiro).map(roteiro -> {
            Map<Long, Bloco> blocosPorId = roteiro.getBlocos().stream()
                    .collect(Collectors.toMap(Bloco::getId, Function.identity()));

            java.util.stream.IntStream.range(0, idsNaNovaOrdem.size())
                    .forEach(i -> {
                        Bloco bloco = blocosPorId.get(idsNaNovaOrdem.get(i));
                        if (bloco != null) {
                            bloco.setOrdem(i + 1);
                        }
                    });

            roteiroRepository.save(roteiro);
            return true;
        }).orElse(false);
    }

    @Transactional
    public Optional<BlocoResponseDTO> atualizarBloco(Long idRoteiro, Long idBloco, BlocoRequestDTO blocoAtualizado) {
        return roteiroRepository.findById(idRoteiro).flatMap(roteiro -> roteiro.getBlocos().stream()
            .filter(bloco -> bloco.getId().equals(idBloco))
            .findFirst()
            .map(bloco -> {
                bloco.setTituloBloco(blocoAtualizado.tituloBloco());
                bloco.setDuracaoEmSegundos(blocoAtualizado.duracaoEmSegundos());
                bloco.setDirecaoVisual(blocoAtualizado.direcaoVisual());
                bloco.setConteudo(blocoAtualizado.conteudo());

                roteiroRepository.save(roteiro);

                return mapToBlocoResponseDTO(bloco);
            }));
    }

    @Transactional
    public Optional<BlocoResponseDTO> carregarDecupagem(Long idRoteiro, Long idBloco) {
        return roteiroRepository.findById(idRoteiro).flatMap(roteiro -> roteiro.getBlocos().stream()
                .filter(b -> b.getId().equals(idBloco))
                .findFirst()
                .map(this::mapToBlocoResponseDTO));
    }

    @Transactional
    public Optional<BlocoResponseDTO> salvarDecupagem(Long idRoteiro, Long idBloco, List<TrechoRequestDTO> trechosDTO) {
        return roteiroRepository.findById(idRoteiro).flatMap(roteiro -> roteiro.getBlocos().stream()
                .filter(b -> b.getId().equals(idBloco))
                .findFirst()
                .map(bloco -> {
                    // Limpa os trechos antigos (o Hibernate apaga do banco automaticamente por causa do orphanRemoval)
                    bloco.getTrechos().clear();

                    // Converte os DTOs que vieram do Frontend para Entidades reais
                    List<Trecho> novosTrechos = trechosDTO.stream().map(dto -> {
                        Trecho trecho = new Trecho();
                        trecho.setTexto(dto.texto());
                        trecho.setStatus(dto.status());
                        trecho.setBloco(bloco);

                        if (dto.assets() != null) {
                            List<Asset> assets = dto.assets().stream().map(assetDto -> {
                                Asset asset = new Asset();
                                asset.setUrl(assetDto.url());
                                asset.setObservacao(assetDto.observacao());
                                asset.setTrecho(trecho);
                                return asset;
                            }).toList();
                            trecho.setAssets(assets);
                        }
                        return trecho;
                    }).toList();

                    // Salva os novos trechos
                    bloco.getTrechos().addAll(novosTrechos);
                    roteiroRepository.save(roteiro);

                    // Devolve o bloco atualizado
                    return mapToBlocoResponseDTO(bloco);
                }));
    }

    // Método auxiliar para evitar repetição de código
    private BlocoResponseDTO mapToBlocoResponseDTO(Bloco bloco) {
        List<TrechoResponseDTO> trechosResponse = (bloco.getTrechos() != null) ? 
                bloco.getTrechos().stream().map(t -> new TrechoResponseDTO(
                        t.getId(), t.getTexto(), t.getStatus(),
                        (t.getAssets() != null) ? 
                            t.getAssets().stream().map(a -> new AssetResponseDTO(a.getId(), a.getUrl(), a.getObservacao())).collect(Collectors.toList())
                            : null
                )).collect(Collectors.toList())
                : null;

        return new BlocoResponseDTO(
                bloco.getId(), bloco.getTituloBloco(), bloco.getDirecaoVisual(),
                bloco.getDuracaoEmSegundos(), bloco.getConteudo(), bloco.getOrdem(), trechosResponse
        );
    }
}
