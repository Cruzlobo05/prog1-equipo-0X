from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
import random
import smtplib
from email.message import EmailMessage

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Archivos estáticos
app.mount("/static", StaticFiles(directory="static"), name="static")

# Cargar usuarios desde JSON
fake_users_db = {}
json_path = os.path.join(os.path.dirname(__file__), "users.json")

def load_users():
    if os.path.exists(json_path):
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print("⚠️ Error al cargar users.json:", e)
            return {}
    else:
        print("⚠️ Archivo users.json no encontrado.")
        return {}

def save_users(data):
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

fake_users_db = load_users()

# Servir index.html
@app.get("/")
def read_root():
    return FileResponse("static/index.html")

# Modelo de login
class LoginRequest(BaseModel):
    email: str  # puede ser email o username
    password: str
    remember: bool

# Ruta de login
@app.post("/api/auth/login")
async def login_api(data: LoginRequest):
    user = next(
        (u for u in fake_users_db.values()
         if u["email"] == data.email or u["username"] == data.email),
        None
    )

    if not user or user["password"] != data.password:
        return JSONResponse(status_code=401, content={"detail": "Credenciales inválidas"})

    return {
        "access_token": "fake-token-123",
        "user": {
            "email": user["email"],
            "username": user["username"],
            "name": user["name"],
            "role": user["role"]
        }
    }

# Ruta de recuperación de contraseña
@app.post("/api/auth/forgot-password")
async def forgot_password(request: Request):
    datos = await request.json()
    email = datos.get("email")
    usuarios = load_users()

    usuario = next((u for u in usuarios.values() if u["email"] == email), None)
    if not usuario:
        return {"message": "Correo no registrado"}

    codigo = str(random.randint(100000, 999999))
    usuario["codigo_recuperacion"] = codigo
    save_users(usuarios)

    enviar_codigo(email, codigo)
    return {"message": "Código enviado al correo"}

# Función para enviar el código por correo
def enviar_codigo(destinatario, codigo):
    print(f"📧 Simulación: se enviaría el código {codigo} al correo {destinatario}")
    # Podés guardar un log si querés:
    # with open("logs_envio.txt", "a", encoding="utf-8") as f:
    #     f.write(f"{destinatario} recibió el código {codigo}\n")
@app.get("/dashboard")
def dashboard():
    return FileResponse("static/dashboard.html")

# Ruta del reporte
@app.get("/reporte")
def reporte():
    return FileResponse("static/reporte.html")