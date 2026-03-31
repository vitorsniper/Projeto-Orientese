package orientese.co.api.dto;

import java.util.List;

public record BlocoResponseDTO(
        Long id,
        String tituloBloco,
        String direcaoVisual,
        Integer duracaoEmSegundos,
        String conteudo,
        Integer ordem,
        List<TrechoResponseDTO> trechos
) {}