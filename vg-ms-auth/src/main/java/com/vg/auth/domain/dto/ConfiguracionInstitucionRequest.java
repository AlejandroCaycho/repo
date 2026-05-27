package com.vg.auth.domain.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfiguracionInstitucionRequest {

    @NotNull(message = "El institucionId es obligatorio")
    private Integer institucionId;

    @Min(value = 1, message = "La escala de calificacion debe ser valida")
    private Integer escalaCalificacionId;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "El color primario debe estar en formato hexadecimal")
    private String temaColorPrimario;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "El color secundario debe estar en formato hexadecimal")
    private String temaColorSecundario;

    @Size(max = 500, message = "El logoUrl no debe superar 500 caracteres")
    private String logoUrl;

    @Min(value = 1, message = "Debe conservar registros al menos 1 anio")
    @Max(value = 50, message = "No se puede conservar registros por mas de 50 anios")
    private Short mantenerRegistrosAnos;

    private Boolean permitirRegistroPadres;
    private Boolean padresVenCalificaciones;
    private Boolean padresVenAsistencia;
    private Boolean padresVenTareas;
    private Boolean notificacionInasistencia;
    private Boolean notificacionCalificacionBaja;

    @DecimalMin(value = "0.00", message = "El umbral de calificacion baja no puede ser negativo")
    @DecimalMax(value = "20.00", message = "El umbral de calificacion baja no puede superar 20")
    private BigDecimal umbralCalificacionBaja;

    private LocalTime horarioInicioClases;
    private LocalTime horarioFinClases;

    @Size(max = 120, message = "Los dias laborables no deben superar 120 caracteres")
    private String diasLaborables;

    @Pattern(regexp = "^[a-z]{2}(-[A-Z]{2})?$", message = "El idioma principal debe usar formato es o es-PE")
    private String idiomaPrincipal;

    @Size(max = 80, message = "La zona horaria no debe superar 80 caracteres")
    @Pattern(regexp = "^[A-Za-z_]+/[A-Za-z_]+(?:/[A-Za-z_]+)?$", message = "La zona horaria debe usar formato Area/Ciudad")
    private String zonaHoraria;

    @Pattern(regexp = "^[A-Z]{3}$", message = "La moneda debe usar codigo ISO de 3 letras")
    private String moneda;

    @AssertTrue(message = "El horario de fin debe ser posterior al horario de inicio")
    public boolean isHorarioValido() {
        if (horarioInicioClases == null || horarioFinClases == null) {
            return true;
        }
        return horarioFinClases.isAfter(horarioInicioClases);
    }
}
