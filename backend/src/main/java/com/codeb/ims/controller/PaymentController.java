package com.codeb.ims.controller;

import com.codeb.ims.model.Invoice;
import com.codeb.ims.model.Payment;
import com.codeb.ims.repository.InvoiceRepository;
import com.codeb.ims.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @GetMapping
    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    @GetMapping("/by-invoice/{invoiceId}")
    public List<Payment> getPaymentsByInvoice(@PathVariable Integer invoiceId) {
        return paymentRepository.findByInvoice_InvoiceId(invoiceId);
    }

    @PostMapping
    public ResponseEntity<?> createPayment(@RequestBody Payment payment) {
        if (payment.getInvoice() == null || payment.getInvoice().getInvoiceId() == null) {
            return ResponseEntity.badRequest().body("Invoice reference is required.");
        }

        Optional<Invoice> invoiceOpt = invoiceRepository.findById(payment.getInvoice().getInvoiceId());
        if (invoiceOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Error: Invoice not found.");
        }

        Invoice invoice = invoiceOpt.get();

        if (payment.getPaymentDate() == null) {
            payment.setPaymentDate(LocalDateTime.now());
        }

        // Generate unique payment number
        String randomSuffix = String.format("%04d", new Random().nextInt(10000));
        payment.setPaymentNumber("PMT-" + LocalDate.now().getYear() + "-" + randomSuffix);

        // Save payment
        Payment savedPayment = paymentRepository.save(payment);

        // Update the invoice status based on total payments
        updateInvoicePaymentStatus(invoice);

        return ResponseEntity.ok(savedPayment);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deletePayment(@PathVariable Integer id) {
        Optional<Payment> paymentOpt = paymentRepository.findById(id);
        if (paymentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Payment payment = paymentOpt.get();
        Invoice invoice = payment.getInvoice();

        // Delete payment
        paymentRepository.deleteById(id);

        // Recalculate invoice status
        updateInvoicePaymentStatus(invoice);

        return ResponseEntity.ok().build();
    }

    private void updateInvoicePaymentStatus(Invoice invoice) {
        List<Payment> payments = paymentRepository.findByInvoice_InvoiceId(invoice.getInvoiceId());

        BigDecimal totalPaid = BigDecimal.ZERO;
        for (Payment p : payments) {
            if ("COMPLETED".equalsIgnoreCase(p.getStatus())) {
                totalPaid = totalPaid.add(p.getAmount());
            }
        }

        BigDecimal totalAmount = invoice.getTotalAmount();

        if (totalPaid.compareTo(BigDecimal.ZERO) == 0) {
            invoice.setStatus("UNPAID");
        } else if (totalPaid.compareTo(totalAmount) >= 0) {
            invoice.setStatus("PAID");
        } else {
            invoice.setStatus("PARTIALLY_PAID");
        }

        invoiceRepository.save(invoice);
    }
}
