package com.codeb.ims.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class JwtResponse {
    private String token;
    private final String type = "Bearer";
    private Integer userId;
    private String fullName;
    private String email;
    private String role;
    private Boolean isVerified;
    private String status;
}
