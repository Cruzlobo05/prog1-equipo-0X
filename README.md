# SodaStock - Sistema de Login con FastAPI

## Instalación

1. Crear un entorno virtual:
En terminar poner:
python -m venv venv

Una vez instalado, activar el entorno virtual con el siguiente comando:
# Mac: source venv/bin/activate  # En Windows: venv\Scripts\activate
\`\`\`

2. Instalar dependencias:
En terminar poner:
pip install -r requirements.txt
\`\`\`

## Ejecutar la aplicación

\`\`\`En terminar poner cualquiera de los 3 comandos de abajo:
uvicorn main:app 
uvicorn main:app --reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000
\`\`\`

## Acceder a la aplicación

Al ejecutarlo uvicorn le va a dar un link que al apretar CTRL + CLICK los dirige a la pagina

## Credenciales de prueba

- Email: admin@soderia.com o admin
- Contraseña: admin123

#Hay mas credenciales en users.json o si agregan usuarios desde empleados

## Estructura del proyecto

\`\`\`
.
├── main.py              # Backend FastAPI
├── requirements.txt     # Dependencias Python
├── README.md           # Este archivo
├── users.json          # Usuarios para logearse con permison
├── data/    
├   ├── clientes.json   # Base de datos de clientes 
├   ├── entregas.json   # Base de datos de entregas
├   ├── inventario.json # Base de datos de inventario
├   ├── ventas.json     # Base de datos de ventas
└── static/
    ├── index.html # Pagina de login
    ├── base.html  # Pagina dinamica 
    ├── recuperar.html #Pagina de recuperar contraseña
    ├── styles.css      # Estilos
    ├──base.js # Lógica del frontend
    ├── script.js       # Lógica del frontend
    ├── css/
    ├    ├── clientes.css   # Estilos
    ├    ├── dashboard.css  # Estilos
    ├    ├── empleados.css  # Estilos
    ├    ├── inventario.css # Estilos
    ├    ├── reportes.css   # Estilos
    ├    └── ventas.css     # Estilos
    ├── js/
    ├    ├── base.js    # Lógica del frontend
    ├    ├── clientes.js    # Lógica del frontend
    ├    ├── dashboard.js   # Lógica del frontend
    ├    ├── empleados.js   # Lógica del frontend
    ├    ├── inventario.js  # Lógica del frontend
    ├    ├── recuperar.js   # Lógica del frontend
    ├    ├── reportes.js    # Lógica del frontend
    ├    └── ventas.js  # Lógica del frontend
    └── sections/
         ├── clientes.html  #Modulo por categoria
         ├── dashboard.html #Modulo por categoria
         ├── empleados.html #Modulo por categoria
         ├── inventario.html    #Modulo por categoria
         ├── reportes.html  #Modulo por categoria
         └── ventas.html    #Modulo por categoria
\`\`\`


