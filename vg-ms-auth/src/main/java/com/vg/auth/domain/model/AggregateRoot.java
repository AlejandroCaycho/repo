package com.vg.auth.domain.model;

// DDD: Marker interface para Aggregate Root.
// Un Aggregate Root es la entidad raíz que garantiza la consistencia
// de todo el agregado. Solo se permite acceso a los objetos internos
// del agregado a través del Aggregate Root.
//
// Ejemplos en este dominio:
// - Institucion es Aggregate Root del agregado "Institucion"
//   que contiene a ConfiguracionInstitucion
// - Usuario es Aggregate Root del agregado "Usuario"
// - Rol es Aggregate Root del agregado "Rol"
public interface AggregateRoot {
}
