package orientese.co.demo.dto;

public record BlocoRequestDTO(
        String tituloBloco,
        String direcaoVisual,
        String tempoInicio,
        String tempoFim,
        String conteudo,
        Integer ordem
) {}