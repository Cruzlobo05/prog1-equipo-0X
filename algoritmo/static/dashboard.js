import { Chart } from "@/components/ui/chart"
// Chart.js se carga desde el CDN en dashboard.html
const API_URL = "http://localhost:8000"

// Verificar autenticación
function checkAuth() {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token")
  const user = localStorage.getItem("user")

  if (!token || !user) {
    window.location.href = "/index.html"
    return null
  }

  return JSON.parse(user)
}

// Cargar información del usuario
function loadUserInfo() {
  const user = checkAuth()
  if (!user) return

  document.getElementById("user-name").textContent = user.name
  document.getElementById("user-email").textContent = user.email
  document.getElementById("header-title").textContent = `Hola, ${user.name.split(" ")[0]}`

  // Iniciales del avatar
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
  document.getElementById("user-avatar").textContent = initials
}

// Cerrar sesión
document.getElementById("logout-button").addEventListener("click", () => {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  sessionStorage.removeItem("token")
  window.location.href = "/index.html"
})

// Gráfico de ventas
function createSalesChart() {
  const ctx = document.getElementById("sales-chart").getContext("2d")
  new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul"],
      datasets: [
        {
          label: "Ventas",
          data: [65000, 72000, 68000, 78000, 82000, 95000, 98000],
          borderColor: "#1e6bb8",
          backgroundColor: "rgba(30, 107, 184, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: (value) => "$" + value.toLocaleString(),
          },
        },
      },
    },
  })
}

// Gráfico de entregas
function createDeliveriesChart() {
  const ctx = document.getElementById("deliveries-chart").getContext("2d")
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
      datasets: [
        {
          label: "Entregas",
          data: [45, 52, 48, 62, 55, 68, 42],
          backgroundColor: "#1e6bb8",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  })
}

// Cargar acciones pendientes
function loadPendingActions() {
  const actions = [
    { name: "María González", detail: "Deuda: $3,200 (5 días)", id: 1 },
    { name: "Stock Bajo Bidones 20L", detail: "Solo quedan 12 unidades", id: 2 },
    { name: "Carlos Rodríguez", detail: "Deuda: $4,800 (7 días)", id: 3 },
    { name: "Camión 1", detail: "Revisión programada", id: 4 },
  ]

  const container = document.getElementById("pending-list")
  container.innerHTML = actions
    .map(
      (action) => `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #f9fafb; border-radius: 8px;">
      <div>
        <div style="font-weight: 500; color: #1f2937; margin-bottom: 2px;">${action.name}</div>
        <div style="font-size: 13px; color: #6b7280;">${action.detail}</div>
      </div>
      <button style="padding: 6px 16px; background: white; border: 1px solid #d1d5db; border-radius: 6px; color: #374151; font-size: 13px; cursor: pointer; font-weight: 500;">Ver</button>
    </div>
  `,
    )
    .join("")
}

// Cargar entregas de hoy
function loadTodayDeliveries() {
  const deliveries = [
    { name: "Almacén San José", detail: "Av. San Martín 1234", status: "Completado", time: "09:30" },
    { name: "Kiosco Central", detail: "Calle Principal 567", status: "En camino", time: "10:45" },
    { name: "Minimercado Norte", detail: "Barrio Alto", status: "Pendiente", time: "11:20" },
    { name: "Bar El Encuentro", detail: "5 de Julio 2345", status: "Pendiente", time: "14:30" },
  ]

  const statusColors = {
    Completado: "#10b981",
    "En camino": "#3b82f6",
    Pendiente: "#6b7280",
  }

  const container = document.getElementById("deliveries-list")
  container.innerHTML = deliveries
    .map(
      (delivery) => `
    <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #f9fafb; border-radius: 8px;">
      <div style="width: 8px; height: 8px; background: ${statusColors[delivery.status]}; border-radius: 50%; flex-shrink: 0;"></div>
      <div style="flex: 1;">
        <div style="font-weight: 500; color: #1f2937; margin-bottom: 2px;">${delivery.name}</div>
        <div style="font-size: 13px; color: #6b7280;">${delivery.detail}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 12px; font-weight: 500; color: ${statusColors[delivery.status]}; margin-bottom: 2px;">${delivery.status}</div>
        <div style="font-size: 12px; color: #9ca3af;">${delivery.time}</div>
      </div>
    </div>
  `,
    )
    .join("")
}

// Inicializar dashboard
document.addEventListener("DOMContentLoaded", () => {
  loadUserInfo()
  createSalesChart()
  createDeliveriesChart()
  loadPendingActions()
  loadTodayDeliveries()
})
