package com.codeb.ims.service;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class EmailSimulatorService {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SimulatedEmail {
        private String recipient;
        private String subject;
        private String content;
        private String link;
        private String token;
        private LocalDateTime timestamp;
    }

    private final List<SimulatedEmail> sentEmails = Collections.synchronizedList(new ArrayList<>());

    public void sendVerificationEmail(String email, String token) {
        String link = "http://localhost:3000/verify?token=" + token;
        String content = "Hello! Please verify your email for Code-B IMS using token: " + token 
                + " or click the link below.";
        
        sentEmails.add(new SimulatedEmail(
                email,
                "Email Verification - Code-B IMS",
                content,
                link,
                token,
                LocalDateTime.now()
        ));
    }

    public void sendPasswordResetEmail(String email, String token) {
        String link = "http://localhost:3000/reset-password?token=" + token;
        String content = "Hello! You requested a password reset. Use token: " + token 
                + " or click the link below to reset your password. The link is valid for 15 minutes.";
        
        sentEmails.add(new SimulatedEmail(
                email,
                "Password Reset - Code-B IMS",
                content,
                link,
                token,
                LocalDateTime.now()
        ));
    }

    public List<SimulatedEmail> getSentEmails() {
        // Return reverse order to show latest first
        List<SimulatedEmail> copy = new ArrayList<>(sentEmails);
        Collections.reverse(copy);
        return copy;
    }

    public void clearEmails() {
        sentEmails.clear();
    }
}
