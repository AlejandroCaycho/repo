---
description: Generador automático de colección Postman v2.1 para Spring WebFlux. Analiza controllers reales y crea endpoints organizados por módulos, con JWT, ejemplos JSON y variables dinámicas BASE_URL por puerto.
---

A[Analizar Controllers] --> B[Detectar Endpoints]

B --> C[Leer Métodos HTTP]

C --> D[Detectar DTOs y Request Bodies]

D --> E[Generar JSON de Ejemplo]

E --> F[Organizar por Módulos]

F --> G[Generar Variables BASE_URL]

G --> H[Agregar JWT Authorization]

H --> I[Construir Colección Postman v2.1]

I --> J[Exportar JSON Final]
