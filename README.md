# SodaStock - Sistema de Login con FastAPI

## Instalación

1. Crear un entorno virtual:
\`\`\`bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
\`\`\`

2. Instalar dependencias:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

3. Crear la carpeta static:
\`\`\`bash
mkdir static
\`\`\`

4. Mover los archivos HTML, CSS y JS a la carpeta static/

## Ejecutar la aplicación

\`\`\`bash
python main.py
\`\`\`

O con uvicorn directamente:
\`\`\`bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
\`\`\`

## Acceder a la aplicación

- Frontend: http://localhost:8000
- API Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Credenciales de prueba

- Email: admin@soderia.com
- Contraseña: admin123

## Estructura del proyecto

\`\`\`
.
├── main.py              # Backend FastAPI
├── requirements.txt     # Dependencias Python
├── README.md           # Este archivo
└── static/
    ├── index.html      # Página de login
    ├── styles.css      # Estilos
    └── script.js       # Lógica del frontend
\`\`\`

## Próximos pasos

1. Conectar a una base de datos real (PostgreSQL, MySQL, etc.)
2. Implementar recuperación de contraseña por email
3. Agregar más validaciones de seguridad
4. Crear las pantallas adicionales del sistema
5. Implementar refresh tokens
6. Agregar rate limiting para prevenir ataques de fuerza bruta
