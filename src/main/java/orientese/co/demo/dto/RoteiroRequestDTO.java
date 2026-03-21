package orientese.co.demo.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record RoteiroRequestDTO(
        @NotBlank(message = "O título é obrigatório")
        String titulo,
        String subtitulo,
        String roteirista,
        String locutor,
        String editorVideo,
        String diretorArte,
        List<BlocoRequestDTO> blocos
) {}
