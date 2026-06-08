package com.codeb.ims.config;

import com.codeb.ims.model.User;
import com.codeb.ims.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DatabaseSeeder implements CommandLineRunner {
    private static final Logger logger = LoggerFactory.getLogger(DatabaseSeeder.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            logger.info("No users found in database. Seeding default Admin user...");
            User admin = new User();
            admin.setFullName("System Administrator");
            admin.setEmail("admin@codeb.com");
            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            admin.setRole("ADMIN");
            admin.setStatus("active");
            admin.setIsVerified(true);
            userRepository.save(admin);
            logger.info("Default Admin user created successfully. Username: admin@codeb.com, Password: admin123");
        }
    }
}
