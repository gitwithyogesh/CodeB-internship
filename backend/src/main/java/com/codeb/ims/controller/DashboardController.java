package com.codeb.ims.controller;

import com.codeb.ims.model.*;
import com.codeb.ims.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EstimateRepository estimateRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @GetMapping("/stats")
    public ResponseEntity<?> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        // 1. Data Counts
        long totalClients = clientRepository.count();
        long totalEstimates = estimateRepository.count();
        long totalInvoices = invoiceRepository.count();
        long totalUsers = userRepository.count();

        stats.put("totalClients", totalClients);
        stats.put("totalEstimates", totalEstimates);
        stats.put("totalInvoices", totalInvoices);
        stats.put("totalUsers", totalUsers);

        // 2. Financial Metrics
        BigDecimal totalSales = BigDecimal.ZERO;
        BigDecimal collectedRevenue = BigDecimal.ZERO;
        BigDecimal pendingRevenue = BigDecimal.ZERO;

        List<Invoice> invoices = invoiceRepository.findAll();
        for (Invoice inv : invoices) {
            if (!"CANCELLED".equalsIgnoreCase(inv.getStatus())) {
                totalSales = totalSales.add(inv.getTotalAmount());
                if ("PAID".equalsIgnoreCase(inv.getStatus())) {
                    collectedRevenue = collectedRevenue.add(inv.getTotalAmount());
                } else {
                    pendingRevenue = pendingRevenue.add(inv.getTotalAmount());
                }
            }
        }

        stats.put("totalSales", totalSales);
        stats.put("collectedRevenue", collectedRevenue);
        stats.put("pendingRevenue", pendingRevenue);

        // 3. Dynamic Recent Activities (Simulated based on database records)
        List<Map<String, String>> activities = new ArrayList<>();
        
        // Add User signup
        List<User> users = userRepository.findAll();
        for (User u : users) {
            Map<String, String> act = new HashMap<>();
            act.put("type", "user");
            act.put("title", "New User Registered");
            act.put("desc", u.getFullName() + " (" + u.getRole() + ") joined the system.");
            act.put("time", u.getCreatedAt().toString());
            activities.add(act);
        }

        // Add Estimate creations
        List<Estimate> estimates = estimateRepository.findAll();
        for (Estimate est : estimates) {
            Map<String, String> act = new HashMap<>();
            act.put("type", "estimate");
            act.put("title", "Estimate Created");
            act.put("desc", "Estimate " + est.getEstimateNumber() + " created for " + est.getClient().getName() + ".");
            act.put("time", est.getEstimateDate().toString() + "T10:00:00");
            activities.add(act);
        }

        // Add Invoice creations
        for (Invoice inv : invoices) {
            Map<String, String> act = new HashMap<>();
            act.put("type", "invoice");
            act.put("title", "Invoice Generated");
            act.put("desc", "Invoice " + inv.getInvoiceNumber() + " created for " + inv.getClient().getName() + ".");
            act.put("time", inv.getInvoiceDate().toString() + "T12:00:00");
            activities.add(act);
        }

        // Add Payment records
        List<Payment> payments = paymentRepository.findAll();
        for (Payment p : payments) {
            Map<String, String> act = new HashMap<>();
            act.put("type", "payment");
            act.put("title", "Payment Received");
            act.put("desc", "Payment " + p.getPaymentNumber() + " of ₹" + p.getAmount() + " recorded via " + p.getPaymentMode() + ".");
            act.put("time", p.getPaymentDate().toString());
            activities.add(act);
        }

        // Sort activities by timestamp descending
        activities.sort((a, b) -> b.get("time").compareTo(a.get("time")));
        if (activities.size() > 8) {
            activities = activities.subList(0, 8);
        }
        stats.put("recentActivities", activities);

        // 4. Mock HR Statistics (To meet frontend requirements guidelines)
        stats.put("employeeAttendanceRate", "96.4%");
        stats.put("staffCheckedIn", "14 of 16");
        
        List<Map<String, String>> leaveRequests = new ArrayList<>();
        
        Map<String, String> r1 = new HashMap<>();
        r1.put("id", "LR-102");
        r1.put("employee", "Alice Carter");
        r1.put("type", "Sick Leave");
        r1.put("dates", "09 Jun - 11 Jun");
        r1.put("status", "PENDING");
        leaveRequests.add(r1);

        Map<String, String> r2 = new HashMap<>();
        r2.put("id", "LR-101");
        r2.put("employee", "Bob Jenkins");
        r2.put("type", "Annual Leave");
        r2.put("dates", "15 Jun - 20 Jun");
        r2.put("status", "APPROVED");
        leaveRequests.add(r2);

        stats.put("leaveRequests", leaveRequests);

        return ResponseEntity.ok(stats);
    }
}
