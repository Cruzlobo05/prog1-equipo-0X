from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
import random

app = FastAPI()

# ------------------ CORS ------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------ ARCHIVOS ESTÁTICOS ------------------
app.mount("/static", StaticFiles(directory="static"), name="static")

# ------------------ CARGA DE USUARIOS ------------------
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

# ------------------ RUTAS ------------------

# Página principal (login)
@app.get("/")
def read_root():
    return FileResponse("static/index.html")

# Página principal del panel (antes era dashboard)
@app.get("/base")
def base_panel():
    return FileResponse("static/base.html")

# Cargar secciones dinámicas dentro del panel (Dashboard, Clientes, etc.)
@app.get("/partial/{page}")
async def get_partial(page: str):
    file_path = os.path.join("static", "sections", f"{page}.html")
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return JSONResponse(status_code=404, content={"error": "Sección no encontrada"})

# ------------------ LOGIN ------------------
class LoginRequest(BaseModel):
    email: str
    password: str
    remember: bool

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

# ------------------ RECUPERACIÓN DE CONTRASEÑA ------------------
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

# ------------------ DATOS DE USUARIO ------------------
@app.get("/api/user")
def get_user(email: str):
    usuarios = load_users()
    usuario = next((u for u in usuarios.values() if u["email"] == email), None)
    if not usuario:
        return JSONResponse(status_code=404, content={"detail": "Usuario no encontrado"})
    return usuario

# ------------------ DASHBOARD: DATOS ------------------
@app.get("/api/dashboard/ventas")
def get_ventas():
    return {
        "labels": ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul"],
        "data": [65000, 72000, 68000, 78000, 82000, 95000, 98000]
    }

@app.get("/api/dashboard/entregas")
def get_entregas():
    return {
        "labels": ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
        "data": [45, 52, 48, 62, 55, 68, 42]
    }

# ------------------ FUNCIÓN DE CORREO (SIMULADA) ------------------
def enviar_codigo(destinatario, codigo):
    print(f"📧 Simulación: se enviaría el código {codigo} al correo {destinatario}")
