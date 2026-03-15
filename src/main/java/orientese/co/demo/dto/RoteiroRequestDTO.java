package orientese.co.demo.dto;

import jakarta.validation.constraints.NotBlank;

public record RoteiroRequestDTO(
        @NotBlank(message = "O título é obrigatório")
        String titulo,

        @NotBlank(message = "A duração deve ser informada")
        String duracaoEstimada
) {}
