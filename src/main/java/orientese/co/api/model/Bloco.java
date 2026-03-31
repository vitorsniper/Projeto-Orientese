package orientese.co.api.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Entity
public class Bloco {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long id;

    @ManyToOne
    @JoinColumn(name = "roteiro_id")
    @JsonBackReference
    private Roteiro roteiro;
    private String tituloBloco;
    private Integer duracaoEmSegundos;
    @Lob
    private String direcaoVisual;
    @Lob
    private String conteudo;
    private Integer ordem;

    @JsonManagedReference
    @OneToMany(mappedBy = "bloco", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Trecho> trechos;
}
