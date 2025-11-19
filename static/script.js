const API_URL = window.location.origin


document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault()

  const email = document.getElementById("email").value
  const password = document.getElementById("password").value
  const remember = document.getElementById("remember").checked
  const errorMessage = document.getElementById("errorMessage")
  const submitButton = document.getElementById("submit-button")

  errorMessage.style.display = "none"
  submitButton.disabled = true
  submitButton.textContent = "Iniciando sesión..."

  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, remember }),
    })

    let data
    try {
      data = await response.json()
    } catch (jsonError) {
      throw new Error("Error interno del servidor")
    }

    if (!response.ok) {
      throw new Error(data.detail || "Error al iniciar sesión")
    }

    if (remember) {
      localStorage.setItem("token", data.access_token)
    } else {
      sessionStorage.setItem("token", data.access_token)
    }

    localStorage.setItem("user", JSON.stringify(data.user))

    window.location.href = "/static/base.html"
  } catch (error) {
    errorMessage.textContent = error.message
    errorMessage.style.display = "block"
  } finally {
    submitButton.disabled = false
    submitButton.textContent = "Iniciar Sesión"
  }
})