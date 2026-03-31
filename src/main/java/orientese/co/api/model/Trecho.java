package orientese.co.api.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Entity
@Getter
@Setter
public class Trecho {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Lob 
    private String texto;

    @Enumerated(EnumType.STRING)
    private StatusTrecho status = StatusTrecho.A_INICIAR;

    // Relação: Muitos Trechos pertencem a um Bloco Principal
    @ManyToOne
    @JoinColumn(name = "bloco_id")
    @JsonBackReference
    private Bloco bloco;

    // Relação: Um Trecho tem muitos Assets (Links)
    @JsonManagedReference
    @OneToMany(mappedBy = "trecho", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Asset> assets;
}

