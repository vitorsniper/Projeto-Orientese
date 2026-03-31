package orientese.co.api.dto;

import orientese.co.api.model.StatusTrecho;
import java.util.List;

public record TrechoResponseDTO(Long id, String texto, StatusTrecho status, List<AssetResponseDTO> assets) {}

