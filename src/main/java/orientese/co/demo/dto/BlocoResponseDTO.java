package orientese.co.demo.dto;

public record BlocoResponseDTO(
        Long id,
        String tituloBloco,
        String direcaoVisual,
        Integer duracaoEmSegundos,
        String conteudo,
        Integer ordem
) {}