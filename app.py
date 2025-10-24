from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import re # Módulo para expresiones regulares para validación de email y password
import uvicorn

# --- INICIALIZACIÓN Y SIMULACIÓN DE BD ---
app = FastAPI(title="Sodastock Auth API")
# NOTA: Para un proyecto real, usarías bases de datos reales y hashing (bcrypt)
USUARIOS_DB = {"admin@sodersa.com": "Sodastock2025!"} 
MAX_INTENTOS = 4 # Política de intentos fallidos

# --- DEFINICIÓN DE MODELOS (Pydantic) ---
class Usuario(BaseModel):
    email: str
    contrasena: str

# --- LÓGICA DE VALIDACIÓN DE CONTRASENA ---

def validar_politicas_contrasena(contrasena: str) -> tuple[bool, str]:
    """Verifica que la contraseña cumpla con las políticas definidas."""
    if not 8 <= len(contrasena) <= 20:
        return False, "Longitud mínima 8, máxima 20 caracteres."
    if not re.search(r"[A-Z]", contrasena):
        return False, "Debe contener al menos una mayúscula."
    if not re.search(r"[a-z]", contrasena):
        return False, "Debe contener al menos una minúscula."
    if not re.search(r"[0-9]", contrasena):
        return False, "Debe contener al menos un número."
    if not re.search(r"[!@#$%^&*]", contrasena):
        return False, "Debe contener al menos un carácter especial (!@#$%^&*)."
    
    return True, "Contraseña válida."

# --- ENDPOINTS ---

@app.post("/api/register")
def register_user(usuario: Usuario):
    """Endpoint para registrar un nuevo usuario."""
    email = usuario.email.strip()
    contrasena = usuario.contrasena.strip()

    if email in USUARIOS_DB:
        raise HTTPException(status_code=400, detail="El email ya está registrado.")
    
    es_valida, mensaje = validar_politicas_contrasena(contrasena)
    if not es_valida:
        raise HTTPException(status_code=400, detail=f"Contraseña inválida: {mensaje}")
    
    # En un sistema real, aquí se haría el hash de la contraseña.
    USUARIOS_DB[email] = contrasena 
    
    return {"mensaje": f"Usuario {email} registrado correctamente."}

@app.post("/api/login")
def login_user(usuario: Usuario):
    """Endpoint para iniciar sesión."""
    email = usuario.email.strip()
    contrasena = usuario.contrasena.strip()

    if email not in USUARIOS_DB:
        # Nota: Por seguridad, se recomienda dar un mensaje genérico para no revelar si el email existe o no.
        raise HTTPException(status_code=401, detail="Credenciales incorrectas (Email no encontrado o Contraseña inválida).")
    
    # En un sistema real, aquí se compararía el hash
    if USUARIOS_DB[email] == contrasena:
        return {"mensaje": f"¡BIENVENIDO, {email}! Acceso concedido al sistema."}
    else:
        # En un sistema real se registraría el intento fallido por email para el bloqueo
        raise HTTPException(status_code=401, detail="Credenciales incorrectas (Email no encontrado o Contraseña inválida).")
        
# --- INSTRUCCIONES PARA EJECUTAR ---
# 1. Guarda este código como app.py
# 2. Instala FastAPI y uvicorn: pip install fastapi uvicorn pydantic
# 3. Ejecuta el servidor desde la terminal: uvicorn app:app --reload