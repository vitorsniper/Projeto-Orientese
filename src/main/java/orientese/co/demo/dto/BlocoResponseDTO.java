package orientese.co.demo.dto;

public record BlocoResponseDTO(
        Long id,
        String tituloBloco,
        String direcaoVisual,
        String tempoInicio,
        String tempoFim,
        String conteudo,
        Integer ordem
) {}