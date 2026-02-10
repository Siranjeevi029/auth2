package com.telusko.part29springsecex.controller;

import com.telusko.part29springsecex.dto.BodyDTO;
import com.telusko.part29springsecex.model.Users;
import com.telusko.part29springsecex.repo.UserRepo;
import com.telusko.part29springsecex.service.EmailService;
import com.telusko.part29springsecex.service.OtpService;
import com.telusko.part29springsecex.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserController {

    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserService service;

    @Autowired
    private UserRepo repo;

    @Autowired
    private OtpService otpService;

    @Autowired
    private EmailService emailService;

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody Users user) throws Exception {
        String email = user.getEmail();

        if (repo.findByEmail(user.getEmail()) != null) {
            throw new RuntimeException("Username already exists");
        }

        String otp = otpService.generateOtp();
        String result = otpService.saveOtp(user, otp);

        if (result.startsWith("WAIT:")) {
            String waitTime = result.substring(5);
            return ResponseEntity.badRequest().body("Please wait " + waitTime + " seconds before requesting a new OTP");
        }

        log.info("OTP generated for email: {}", email);

        try {
            emailService.sendEmail(email, "Your OTP Code", "Your OTP is: " + otp);
            log.info("OTP email sent successfully to: {}", email);
            return ResponseEntity.ok("otp sent");
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}", email, e);
            return ResponseEntity.status(502).body("Failed to send OTP email");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody BodyDTO body) {
        Users user = new Users(body.email, body.password, "local");
        String token = service.verify(user);
        if (token == null) {
            return ResponseEntity.badRequest().body("Invalid credentials");
        }
        return ResponseEntity.ok(token);
    }
}