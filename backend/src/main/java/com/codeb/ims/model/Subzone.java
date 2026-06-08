package com.codeb.ims.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "subzones")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Subzone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "subzone_id")
    private Integer subzoneId;

    @Column(name = "subzone_name", nullable = false, unique = true, length = 100)
    private String subzoneName;

    @Column(name = "region", length = 100)
    private String region;
}
