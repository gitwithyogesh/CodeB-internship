package com.codeb.ims.repository;

import com.codeb.ims.model.Subzone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubzoneRepository extends JpaRepository<Subzone, Integer> {
}
