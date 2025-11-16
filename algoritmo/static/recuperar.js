const API_URL = "http://127.0.0.1:8000"

// Enviar código de recuperación
document.getElementById("recuperarForm").addEventListener("submit", async (e) => {
  e.preventDefault()

  const email = document.getElementById("emailRecuperacion").value
  const mensaje = document.getElementById("mensajeRecuperacion")
  mensaje.textContent = ""
  mensaje.style.display = "none"

  try {
    const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    })

    const data = await response.json()
    mensaje.textContent = data.message
    mensaje.style.display = "block"
    mensaje.style.backgroundColor = response.status === 200 ? "#d1e7dd" : "#f8d7da"
    mensaje.style.color = response.status === 200 ? "#0f5132" : "#842029"
  } catch {
    mensaje.textContent = "Error al procesar la solicitud"
    mensaje.style.display = "block"
    mensaje.style.backgroundColor = "#f8d7da"
    mensaje.style.color = "#842029"
  }
})

// Botón Volver al login
document.getElementById("volver-button").addEventListener("click", () => {
  window.location.href = "/"
})