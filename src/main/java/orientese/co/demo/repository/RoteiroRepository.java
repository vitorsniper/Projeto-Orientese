package orientese.co.demo.repository;

import org.springframework.beans.factory.annotation.Autowired;
import orientese.co.demo.model.Roteiro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import orientese.co.demo.service.RoteiroService;

@Repository
public interface RoteiroRepository extends JpaRepository<Roteiro, Long> {

}