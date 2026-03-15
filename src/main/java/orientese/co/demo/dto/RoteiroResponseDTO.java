package orientese.co.demo.dto;

import java.util.List;

public record RoteiroResponseDTO(
        Long id,
        String titulo,
        String duracaoEstimada,
        List<BlocoResponseDTO> blocos
) {}