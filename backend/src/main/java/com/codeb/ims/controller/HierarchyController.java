package com.codeb.ims.controller;

import com.codeb.ims.model.*;
import com.codeb.ims.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api")
public class HierarchyController {

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private ChainRepository chainRepository;

    @Autowired
    private BrandRepository brandRepository;

    @Autowired
    private SubzoneRepository subzoneRepository;

    // --- GROUPS ---
    @GetMapping("/groups")
    public List<Group> getAllGroups() {
        return groupRepository.findAll();
    }

    @PostMapping("/groups")
    public Group createGroup(@RequestBody Group group) {
        return groupRepository.save(group);
    }

    @PutMapping("/groups/{id}")
    public ResponseEntity<Group> updateGroup(@PathVariable Integer id, @RequestBody Group groupDetails) {
        Group group = groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Group not found with id: " + id));
        group.setGroupName(groupDetails.getGroupName());
        group.setDescription(groupDetails.getDescription());
        return ResponseEntity.ok(groupRepository.save(group));
    }

    @DeleteMapping("/groups/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteGroup(@PathVariable Integer id) {
        groupRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // --- SUBZONES ---
    @GetMapping("/subzones")
    public List<Subzone> getAllSubzones() {
        return subzoneRepository.findAll();
    }

    @PostMapping("/subzones")
    public Subzone createSubzone(@RequestBody Subzone subzone) {
        return subzoneRepository.save(subzone);
    }

    @PutMapping("/subzones/{id}")
    public ResponseEntity<Subzone> updateSubzone(@PathVariable Integer id, @RequestBody Subzone subzoneDetails) {
        Subzone subzone = subzoneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Subzone not found with id: " + id));
        subzone.setSubzoneName(subzoneDetails.getSubzoneName());
        subzone.setRegion(subzoneDetails.getRegion());
        return ResponseEntity.ok(subzoneRepository.save(subzone));
    }

    @DeleteMapping("/subzones/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteSubzone(@PathVariable Integer id) {
        subzoneRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // ================================================================
    // --- CHAINS (Company Management) ---
    // Supports: Filter by Group, Add, Update, Soft Delete
    // ================================================================

    /**
     * GET all active chains (soft-delete aware).
     * Optionally filter by groupId via query param.
     */
    @GetMapping("/chains")
    public ResponseEntity<?> getAllChains(@RequestParam(required = false) Integer groupId) {
        if (groupId != null) {
            return ResponseEntity.ok(chainRepository.findByGroup_GroupIdAndIsActiveTrue(groupId));
        }
        return ResponseEntity.ok(chainRepository.findByIsActiveTrue());
    }

    /**
     * GET active chains filtered by group (path variable version — backward compat).
     */
    @GetMapping("/chains/by-group/{groupId}")
    public List<Chain> getChainsByGroup(@PathVariable Integer groupId) {
        return chainRepository.findByGroup_GroupIdAndIsActiveTrue(groupId);
    }

    /**
     * POST — Create a new chain/company.
     * Validates: companyName not blank, gstnNo not blank, gstnNo not duplicate.
     */
    @PostMapping("/chains")
    public ResponseEntity<?> createChain(@RequestBody Chain chainRequest) {
        // Validate required fields
        if (chainRequest.getCompanyName() == null || chainRequest.getCompanyName().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Company name is required."));
        }
        if (chainRequest.getGstnNo() == null || chainRequest.getGstnNo().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "GSTN number is required."));
        }
        if (chainRequest.getGroup() == null || chainRequest.getGroup().getGroupId() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Please select a group."));
        }

        // Validate GSTN format (15-character alphanumeric)
        String gstn = chainRequest.getGstnNo().toUpperCase().trim();
        if (!gstn.matches("^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Invalid GSTN format. Must be a valid 15-character GST number."));
        }

        // Validate GSTN uniqueness
        if (chainRepository.existsByGstnNo(gstn)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "A company with this GSTN already exists."));
        }

        // Build and save
        Chain chain = new Chain();
        chain.setChainName(chainRequest.getCompanyName()); // chainName mirrors companyName
        chain.setCompanyName(chainRequest.getCompanyName());
        chain.setGstnNo(gstn);
        chain.setIsActive(true);
        chain.setGroup(chainRequest.getGroup());

        return ResponseEntity.ok(chainRepository.save(chain));
    }

    /**
     * PUT — Update an existing chain/company.
     * Validates: fields not blank, GSTN not duplicate (excluding self).
     */
    @PutMapping("/chains/{id}")
    public ResponseEntity<?> updateChain(@PathVariable Integer id, @RequestBody Chain chainDetails) {
        Chain chain = chainRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Chain not found with id: " + id));

        // Validate required fields
        if (chainDetails.getCompanyName() == null || chainDetails.getCompanyName().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Company name is required."));
        }
        if (chainDetails.getGstnNo() == null || chainDetails.getGstnNo().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "GSTN number is required."));
        }
        if (chainDetails.getGroup() == null || chainDetails.getGroup().getGroupId() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Please select a group."));
        }

        // Validate GSTN format
        String gstn = chainDetails.getGstnNo().toUpperCase().trim();
        if (!gstn.matches("^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Invalid GSTN format. Must be a valid 15-character GST number."));
        }

        // Validate GSTN uniqueness (excluding this record)
        if (chainRepository.existsByGstnNoAndChainIdNot(gstn, id)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Another company with this GSTN already exists."));
        }

        // Apply updates
        chain.setChainName(chainDetails.getCompanyName());
        chain.setCompanyName(chainDetails.getCompanyName());
        chain.setGstnNo(gstn);
        chain.setGroup(chainDetails.getGroup());

        return ResponseEntity.ok(chainRepository.save(chain));
    }

    /**
     * DELETE — Soft-delete a chain/company.
     * Blocked if the chain is linked to any brand (has associated brands).
     */
    @DeleteMapping("/chains/{id}")
    public ResponseEntity<?> deleteChain(@PathVariable Integer id) {
        Chain chain = chainRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Chain not found with id: " + id));

        // Check if any brands are linked to this chain
        List<Brand> linkedBrands = brandRepository.findByChain_ChainId(id);
        if (!linkedBrands.isEmpty()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message",
                            "Cannot delete this company. It is linked to " + linkedBrands.size() +
                            " brand(s). Please remove all associated brands first."));
        }

        // Soft delete: set is_active = false
        chain.setIsActive(false);
        chainRepository.save(chain);

        return ResponseEntity.ok(Map.of("message", "Company deleted successfully."));
    }

    // --- BRANDS ---
    @GetMapping("/brands")
    public List<Brand> getAllBrands() {
        return brandRepository.findAll();
    }

    @GetMapping("/brands/by-chain/{chainId}")
    public List<Brand> getBrandsByChain(@PathVariable Integer chainId) {
        return brandRepository.findByChain_ChainId(chainId);
    }

    @PostMapping("/brands")
    public Brand createBrand(@RequestBody Brand brand) {
        return brandRepository.save(brand);
    }

    @PutMapping("/brands/{id}")
    public ResponseEntity<Brand> updateBrand(@PathVariable Integer id, @RequestBody Brand brandDetails) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Brand not found with id: " + id));
        brand.setBrandName(brandDetails.getBrandName());
        brand.setChain(brandDetails.getChain());
        return ResponseEntity.ok(brandRepository.save(brand));
    }

    @DeleteMapping("/brands/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteBrand(@PathVariable Integer id) {
        brandRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
