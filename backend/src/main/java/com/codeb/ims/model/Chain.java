package com.codeb.ims.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "chains")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Chain {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "chain_id")
    private Integer chainId;

    @Column(name = "chain_name", nullable = false, length = 100)
    private String chainName;

    // Company name entered by the user (e.g., "Delta Tech pvt ltd")
    @Column(name = "company_name", length = 255)
    private String companyName;

    // GST Number — must be unique per company
    @Column(name = "gstn_no", length = 15, unique = true)
    private String gstnNo;

    // Soft-delete flag: true = active, false = deleted
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "group_id", referencedColumnName = "group_id")
    private Group group;
}
