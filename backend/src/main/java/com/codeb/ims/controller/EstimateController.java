package com.codeb.ims.controller;

import com.codeb.ims.model.Estimate;
import com.codeb.ims.model.User;
import com.codeb.ims.repository.EstimateRepository;
import com.codeb.ims.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/estimates")
public class EstimateController {

    @Autowired
    private EstimateRepository estimateRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<Estimate> getAllEstimates() {
        return estimateRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Estimate> getEstimateById(@PathVariable Integer id) {
        Estimate estimate = estimateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Estimate not found with id: " + id));
        return ResponseEntity.ok(estimate);
    }

    @PostMapping
    public ResponseEntity<?> createEstimate(@RequestBody Estimate estimate) {
        // Compute financial totals on the server side for integrity
        if (estimate.getSubTotal() == null) {
            return ResponseEntity.badRequest().body("Subtotal is required.");
        }

        BigDecimal sub = estimate.getSubTotal();
        BigDecimal gst = sub.multiply(new BigDecimal("0.18")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = sub.add(gst).setScale(2, RoundingMode.HALF_UP);

        estimate.setSubTotal(sub);
        estimate.setGstAmount(gst);
        estimate.setTotalAmount(total);

        if (estimate.getEstimateDate() == null) {
            estimate.setEstimateDate(LocalDate.now());
        }

        // Generate unique Estimate Number
        String randomSuffix = String.format("%04d", new Random().nextInt(10000));
        estimate.setEstimateNumber("EST-" + LocalDate.now().getYear() + "-" + randomSuffix);

        // Associate with logged-in user
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> creator = userRepository.findByEmail(email);
        creator.ifPresent(estimate::setCreatedBy);

        return ResponseEntity.ok(estimateRepository.save(estimate));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Estimate> updateEstimate(@PathVariable Integer id, @RequestBody Estimate estimateDetails) {
        Estimate estimate = estimateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Estimate not found with id: " + id));

        estimate.setClient(estimateDetails.getClient());
        estimate.setChain(estimateDetails.getChain());
        estimate.setEstimateDate(estimateDetails.getEstimateDate());
        estimate.setValidityDate(estimateDetails.getValidityDate());
        estimate.setStatus(estimateDetails.getStatus());
        estimate.setItemsJson(estimateDetails.getItemsJson());

        // Recalculate totals
        BigDecimal sub = estimateDetails.getSubTotal();
        BigDecimal gst = sub.multiply(new BigDecimal("0.18")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = sub.add(gst).setScale(2, RoundingMode.HALF_UP);

        estimate.setSubTotal(sub);
        estimate.setGstAmount(gst);
        estimate.setTotalAmount(total);

        return ResponseEntity.ok(estimateRepository.save(estimate));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteEstimate(@PathVariable Integer id) {
        estimateRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
