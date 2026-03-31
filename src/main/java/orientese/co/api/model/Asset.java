package orientese.co.api.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Asset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String url;
    private String observacao;

    // Relação: Muitos Assets pertencem a um Trecho
    @ManyToOne
    @JoinColumn(name = "trecho_id")
    @JsonBackReference 
    private Trecho trecho;
}

