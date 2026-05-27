package com.vg.auth.domain.model;

import com.vg.auth.domain.model.Entity;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.OffsetDateTime;

// DDD: Entity del agregado Usuario — lista negra de JWT invalidados.
//
// Almacena los identificadores (jti) de tokens JWT que han sido
// invalidados mediante logout para prevenir su reutilización.
@Table("jwt_blocklist")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JwtBlocklist {

    @Id
    private Integer id;

    private String jti;

    @Column("expira_en")
    private OffsetDateTime expiraEn;

    @Column("creado_en")
    private OffsetDateTime creadoEn;
}
