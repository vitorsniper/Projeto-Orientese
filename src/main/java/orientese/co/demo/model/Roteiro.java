package orientese.co.demo.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Entity
@Getter
@Setter
public class Roteiro {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    @NotBlank(message = "O título é obrigatório")
    private String titulo;
    private String subtitulo;

    // @Pattern(regexp = "^[0-9]+$", message = "Use apenas números para a duração")
    @NotBlank(message = "A duração deve ser informada")
    private String duracaoEstimada;

    private String roteirista;
    private String locutor;
    private String editorVideo;
    private String diretorArte;

    @JsonManagedReference
    @OneToMany(mappedBy = "roteiro", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Bloco> blocos;

}