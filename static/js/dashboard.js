const API_URL = "http://127.0.0.1:8000";

let chartsInstances = {
  sales: null,
  deliveries: null,
};

// ==================== CARGA INICIAL ====================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Dashboard cargado ✅");

  // Cargar datos iniciales
  await cargarEstadisticas();
  await crearGraficos();

  // Escuchar cambios en el inventario
  window.addEventListener("inventarioActualizado", (e) => {
    actualizarEstadisticasInventario(e.detail);
  });
});

// ==================== CARGAR ESTADÍSTICAS ====================

async function cargarEstadisticas() {
  try {
    const response = await fetch(`${API_URL}/api/dashboard/stats`);
    if (!response.ok) throw new Error("Error al cargar estadísticas");

    const stats = await response.json();

    // Actualizar valores en el dashboard
    document.getElementById("stat-value-1").textContent = stats.clientes_activos || 0;
    document.getElementById("stat-value-2").textContent = stats.stock_total || 0;
    document.getElementById("stat-value-3").textContent = `$${(stats.ventas_totales || 0).toLocaleString("es-AR")}`;
    document.getElementById("stat-value-4").textContent = stats.entregas_semana || 0;
  } catch (error) {
    console.error("Error al cargar estadísticas:", error);
  }
}

// ==================== CREAR GRÁFICOS ====================

async function crearGraficos() {
  try {
    // Gráfico de Ventas
    const ventasResponse = await fetch(`${API_URL}/api/dashboard/ventas`);
    const ventasData = await ventasResponse.json();

    const ctxSales = document.getElementById("sales-chart");
    if (ctxSales && !chartsInstances.sales) {
      chartsInstances.sales = new Chart(ctxSales, {
        type: "line",
        data: {
          labels: ventasData.labels,
          datasets: [
            {
              label: "Ventas ($)",
              data: ventasData.data,
              borderColor: "#1e6bb8",
              backgroundColor: "rgba(30, 107, 184, 0.1)",
              borderWidth: 2,
              fill: true,
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              labels: { color: "#1f2937" },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { color: "#6b7280" },
              grid: { color: "#e5e7eb" },
            },
            x: {
              ticks: { color: "#6b7280" },
              grid: { color: "#e5e7eb" },
            },
          },
        },
      });
    }

    // Gráfico de Entregas
    const entregasResponse = await fetch(`${API_URL}/api/dashboard/entregas`);
    const entregasData = await entregasResponse.json();

    const ctxDeliveries = document.getElementById("deliveries-chart");
    if (ctxDeliveries && !chartsInstances.deliveries) {
      chartsInstances.deliveries = new Chart(ctxDeliveries, {
        type: "bar",
        data: {
          labels: entregasData.labels,
          datasets: [
            {
              label: "Entregas",
              data: entregasData.data,
              backgroundColor: "#10b981",
              borderColor: "#059669",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              labels: { color: "#1f2937" },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { color: "#6b7280" },
              grid: { color: "#e5e7eb" },
            },
            x: {
              ticks: { color: "#6b7280" },
              grid: { color: "#e5e7eb" },
            },
          },
        },
      });
    }
  } catch (error) {
    console.error("Error al crear gráficos:", error);
  }
}

// ==================== ACTUALIZAR INVENTARIO ====================

function actualizarEstadisticasInventario(stats) {
  // Actualizar el stock total en el dashboard
  document.getElementById("stat-value-2").textContent = stats.totalStock || 0;

  console.log("✅ Dashboard actualizado con datos del inventario:", stats);
}
