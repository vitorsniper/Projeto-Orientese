package orientese.co.api.dto;

import orientese.co.api.model.StatusTrecho;
import java.util.List;

public record TrechoRequestDTO(String texto, StatusTrecho status, List<AssetRequestDTO> assets) {}

