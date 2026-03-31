package orientese.co.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import orientese.co.api.model.Roteiro;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoteiroRepository extends JpaRepository<Roteiro, Long> {
    Optional<Roteiro> findByTitulo(String titulo);
    List<Roteiro> findByTituloContainingIgnoreCase(String titulo);

    List<Roteiro> findByAtivoTrue();

    Long id(Long id);
}