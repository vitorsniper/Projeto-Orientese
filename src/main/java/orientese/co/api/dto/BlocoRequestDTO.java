package orientese.co.api.dto;

public record BlocoRequestDTO(
        String tituloBloco,
        String direcaoVisual,
        Integer duracaoEmSegundos,
        String conteudo,
        Integer ordem
) {}