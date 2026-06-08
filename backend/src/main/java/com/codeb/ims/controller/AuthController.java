package com.codeb.ims.controller;

import com.codeb.ims.config.JwtUtils;
import com.codeb.ims.config.UserDetailsImpl;
import com.codeb.ims.dto.*;
import com.codeb.ims.model.User;
import com.codeb.ims.repository.UserRepository;
import com.codeb.ims.service.EmailSimulatorService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private EmailSimulatorService emailSimulator;

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok("OK");
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Optional<User> userOpt = userRepository.findByEmail(loginRequest.getEmail());
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Invalid email or password."));
        }

        User user = userOpt.get();
        if (!user.getIsVerified()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Please verify your email before logging in. Check the simulated inbox below!"));
        }

        if (!"active".equalsIgnoreCase(user.getStatus())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Your account is currently inactive. Please contact the administrator."));
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication.getName());
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        return ResponseEntity.ok(new JwtResponse(
                jwt,
                userDetails.getUserId(),
                userDetails.getFullName(),
                userDetails.getEmail(),
                userDetails.getRole(),
                userDetails.isVerified(),
                userDetails.getStatus()
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest signUpRequest) {
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is already in use!"));
        }

        // Create new user account
        User user = new User();
        user.setFullName(signUpRequest.getFullName());
        user.setEmail(signUpRequest.getEmail());
        user.setPasswordHash(encoder.encode(signUpRequest.getPassword()));
        
        // Match roles safely
        String roleInput = signUpRequest.getRole().toUpperCase();
        if ("ADMIN".equals(roleInput) || "SALES_PERSON".equals(roleInput)) {
            user.setRole(roleInput);
        } else {
            user.setRole("SALES_PERSON"); // default to sales person
        }
        
        user.setStatus("active");
        user.setIsVerified(false);
        
        // Generate UUID verification token
        String token = UUID.randomUUID().toString();
        user.setVerificationToken(token);
        
        userRepository.save(user);

        // Send simulated email
        emailSimulator.sendVerificationEmail(user.getEmail(), token);

        return ResponseEntity.ok(new MessageResponse("Registration successful! A verification token has been sent to your email. Check the simulated inbox below to verify."));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        Optional<User> userOpt = userRepository.findByVerificationToken(token);
        
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Invalid or expired verification token."));
        }

        User user = userOpt.get();
        user.setIsVerified(true);
        user.setVerificationToken(null);
        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("Email verified successfully! You can now log in."));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String token = UUID.randomUUID().toString();
            user.setResetToken(token);
            user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(15));
            userRepository.save(user);
            
            // Send simulated email
            emailSimulator.sendPasswordResetEmail(user.getEmail(), token);
        }

        // Return generic success to prevent email scanning/harvesting
        return ResponseEntity.ok(new MessageResponse("If your email is registered in our system, you will receive a password reset token shortly. Check the simulated inbox below!"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        Optional<User> userOpt = userRepository.findByResetToken(request.getToken());
        
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Invalid password reset token."));
        }

        User user = userOpt.get();
        if (user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Password reset token has expired. Please request a new one."));
        }

        user.setPasswordHash(encoder.encode(request.getNewPassword()));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("Password reset successfully! You can now log in with your new password."));
    }

    @GetMapping("/emails")
    public ResponseEntity<?> getSimulatedEmails() {
        return ResponseEntity.ok(emailSimulator.getSentEmails());
    }
    
    @PostMapping("/emails/clear")
    public ResponseEntity<?> clearSimulatedEmails() {
        emailSimulator.clearEmails();
        return ResponseEntity.ok(new MessageResponse("Simulated inbox cleared."));
    }
}
