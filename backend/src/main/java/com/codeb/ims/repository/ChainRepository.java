package com.codeb.ims.repository;

import com.codeb.ims.model.Chain;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChainRepository extends JpaRepository<Chain, Integer> {

    // Get all active (non-soft-deleted) chains
    List<Chain> findByIsActiveTrue();

    // Filter active chains by group
    List<Chain> findByGroup_GroupIdAndIsActiveTrue(Integer groupId);

    // Check for duplicate GSTN (for add)
    boolean existsByGstnNo(String gstnNo);

    // Check for duplicate GSTN excluding self (for update)
    boolean existsByGstnNoAndChainIdNot(String gstnNo, Integer chainId);

    // Legacy: filter by group (kept for backward compat)
    List<Chain> findByGroup_GroupId(Integer groupId);
}
