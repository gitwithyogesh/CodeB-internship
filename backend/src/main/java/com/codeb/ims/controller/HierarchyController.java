package com.codeb.ims.controller;

import com.codeb.ims.model.*;
import com.codeb.ims.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    // --- CHAINS ---
    @GetMapping("/chains")
    public List<Chain> getAllChains() {
        return chainRepository.findAll();
    }

    @GetMapping("/chains/by-group/{groupId}")
    public List<Chain> getChainsByGroup(@PathVariable Integer groupId) {
        return chainRepository.findByGroup_GroupId(groupId);
    }

    @PostMapping("/chains")
    public Chain createChain(@RequestBody Chain chain) {
        return chainRepository.save(chain);
    }

    @PutMapping("/chains/{id}")
    public ResponseEntity<Chain> updateChain(@PathVariable Integer id, @RequestBody Chain chainDetails) {
        Chain chain = chainRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Chain not found with id: " + id));
        chain.setChainName(chainDetails.getChainName());
        chain.setGroup(chainDetails.getGroup());
        return ResponseEntity.ok(chainRepository.save(chain));
    }

    @DeleteMapping("/chains/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteChain(@PathVariable Integer id) {
        chainRepository.deleteById(id);
        return ResponseEntity.ok().build();
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
