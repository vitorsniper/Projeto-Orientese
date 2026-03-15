package orientese.co.demo.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

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
    private String tempoInicio;
    private String tempoFim;
    @Lob
    private String direcaoVisual;
    @Lob
    private String conteudo;
    private Integer ordem;
}
