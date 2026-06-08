package com.codeb.ims.controller;

import com.codeb.ims.model.*;
import com.codeb.ims.repository.EstimateRepository;
import com.codeb.ims.repository.InvoiceRepository;
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
@RequestMapping("/api/invoices")
public class InvoiceController {

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private EstimateRepository estimateRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Invoice> getInvoiceById(@PathVariable Integer id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found with id: " + id));
        return ResponseEntity.ok(invoice);
    }

    @PostMapping
    public ResponseEntity<?> createInvoice(@RequestBody Invoice invoice) {
        if (invoice.getSubTotal() == null) {
            return ResponseEntity.badRequest().body("Subtotal is required.");
        }

        BigDecimal sub = invoice.getSubTotal();
        BigDecimal gstRateVal = invoice.getGstRate() != null ? invoice.getGstRate() : new BigDecimal("18.00");
        BigDecimal gst = sub.multiply(gstRateVal.divide(new BigDecimal("100"))).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = sub.add(gst).setScale(2, RoundingMode.HALF_UP);

        invoice.setSubTotal(sub);
        invoice.setGstRate(gstRateVal);
        invoice.setGstAmount(gst);
        invoice.setTotalAmount(total);

        if (invoice.getInvoiceDate() == null) {
            invoice.setInvoiceDate(LocalDate.now());
        }
        if (invoice.getDueDate() == null) {
            invoice.setDueDate(LocalDate.now().plusDays(30)); // 30 days payment term
        }

        // Generate unique Invoice Number
        String randomSuffix = String.format("%04d", new Random().nextInt(10000));
        invoice.setInvoiceNumber("INV-" + LocalDate.now().getYear() + "-" + randomSuffix);

        // Associate with logged-in user
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> creator = userRepository.findByEmail(email);
        creator.ifPresent(invoice::setCreatedBy);

        // If this invoice is created from an approved estimate, update the estimate's status to 'INVOICED'
        if (invoice.getEstimate() != null && invoice.getEstimate().getEstimateId() != null) {
            Optional<Estimate> estimateOpt = estimateRepository.findById(invoice.getEstimate().getEstimateId());
            if (estimateOpt.isPresent()) {
                Estimate est = estimateOpt.get();
                est.setStatus("INVOICED");
                estimateRepository.save(est);
            }
        }

        return ResponseEntity.ok(invoiceRepository.save(invoice));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Invoice> updateInvoice(@PathVariable Integer id, @RequestBody Invoice invoiceDetails) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found with id: " + id));

        invoice.setClient(invoiceDetails.getClient());
        invoice.setChain(invoiceDetails.getChain());
        invoice.setInvoiceDate(invoiceDetails.getInvoiceDate());
        invoice.setDueDate(invoiceDetails.getDueDate());
        invoice.setStatus(invoiceDetails.getStatus());

        // Recalculate totals
        BigDecimal sub = invoiceDetails.getSubTotal();
        BigDecimal gstRateVal = invoiceDetails.getGstRate() != null ? invoiceDetails.getGstRate() : new BigDecimal("18.00");
        BigDecimal gst = sub.multiply(gstRateVal.divide(new BigDecimal("100"))).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = sub.add(gst).setScale(2, RoundingMode.HALF_UP);

        invoice.setSubTotal(sub);
        invoice.setGstRate(gstRateVal);
        invoice.setGstAmount(gst);
        invoice.setTotalAmount(total);

        return ResponseEntity.ok(invoiceRepository.save(invoice));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteInvoice(@PathVariable Integer id) {
        invoiceRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
