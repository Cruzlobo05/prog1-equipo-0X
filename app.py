from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import json

app = FastAPI()

# Datos hardcodeados
USUARIO = "admin"
CONTRASENA = "1234"
clientes = []
inventario = []

# Modelo para login
class LoginData(BaseModel):
    usuario: str
    contrasena: str

# Modelo para cliente
class ClienteData(BaseModel):
    action: str
    id: int = None
    nombre: str = None
    email: str = None

# Modelo para producto
class ProductoData(BaseModel):
    action: str
    id: int = None
    nombre: str = None
    stock: int = None
    precio: float = None

# Ruta para servir index.html
@app.get("/", response_class=HTMLResponse)
async def get_index():
    with open("index.html", "r") as f:
        return f.read()

# Ruta para login
@app.post("/login")
async def login(data: LoginData, response: Response):
    if data.usuario == USUARIO and data.contrasena == CONTRASENA:
        response.set_cookie(key="logged_in", value="true")
        return {"success": True}
    raise HTTPException(status_code=401, detail="Credenciales incorrectas.")

# Ruta para verificar sesión
@app.get("/check_session")
async def check_session(request: Request):
    logged_in = request.cookies.get("logged_in") == "true"
    return {"logged_in": logged_in}

# Ruta para logout
@app.post("/logout")
async def logout(response: Response):
    response.delete_cookie("logged_in")
    return {"success": True}

# Ruta para clientes
@app.get("/clientes")
async def get_clientes(request: Request):
    if request.cookies.get("logged_in") != "true":
        raise HTTPException(status_code=401, detail="No autorizado")
    return clientes

@app.post("/clientes")
async def manage_clientes(data: ClienteData, request: Request):
    if request.cookies.get("logged_in") != "true":
        raise HTTPException(status_code=401, detail="No autorizado")
    if data.action == "agregar":
        id_cliente = len(clientes) + 1
        clientes.append({"id": id_cliente, "nombre": data.nombre, "email": data.email})
    elif data.action == "editar":
        for cliente in clientes:
            if cliente["id"] == data.id:
                cliente["nombre"] = data.nombre
                cliente["email"] = data.email
                break
        else:
            raise HTTPException(status_code=404, detail="Cliente no encontrado.")
    elif data.action == "eliminar":
        for cliente in clientes:
            if cliente["id"] == data.id:
                clientes.remove(cliente)
                break
        else:
            raise HTTPException(status_code=404, detail="Cliente no encontrado.")
    return {"success": True, "clientes": clientes}

# Ruta para inventario
@app.get("/inventario")
async def get_inventario(request: Request):
    if request.cookies.get("logged_in") != "true":
        raise HTTPException(status_code=401, detail="No autorizado")
    return inventario

@app.post("/inventario")
async def manage_inventario(data: ProductoData, request: Request):
    if request.cookies.get("logged_in") != "true":
        raise HTTPException(status_code=401, detail="No autorizado")
    if data.action == "agregar":
        id_producto = len(inventario) + 1
        inventario.append({"id": id_producto, "nombre": data.nombre, "stock": data.stock, "precio": data.precio})
    elif data.action == "editar":
        for producto in inventario:
            if producto["id"] == data.id:
                producto["nombre"] = data.nombre
                producto["stock"] = data.stock
                producto["precio"] = data.precio
                break
        else:
            raise HTTPException(status_code=404, detail="Producto no encontrado.")
    elif data.action == "eliminar":
        for producto in inventario:
            if producto["id"] == data.id:
                inventario.remove(producto)
                break
        else:
            raise HTTPException(status_code=404, detail="Producto no encontrado.")
    return {"success": True, "inventario": inventario}