async function cargarReportes() {
  try {
    const response = await fetch("/api/reportes");
    const reportesData = response.ok ? await response.json() : {};

    console.log("✅ Datos de reportes cargados:", reportesData);

    crearGraficoVentasMensuales(reportesData);
    crearGraficoVentasPorZona(reportesData);
    crearGraficoProductosTop(reportesData);


    setTimeout(() => {
      agregarEventoFiltrar();
    }, 200);

  } catch (error) {
    console.error("❌ Error al cargar reportes:", error);
  }
}

function crearGraficoVentasMensuales(data) {
  const ctx = document.getElementById("ventas-mensuales-chart");
  if (!ctx) return;

  if (window.ventasMensualesChart) {
    try { window.ventasMensualesChart.destroy(); } catch {}
  }

  window.ventasMensualesChart = new Chart(ctx.getContext('2d'), {
    type: "bar",
    data: {
      labels: data.meses || [],
      datasets: [{
        label: "Ventas",
        data: data.ventasMensuales || [],
        backgroundColor: "#3b82f6"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function crearGraficoVentasPorZona(data) {
  const canvas = document.getElementById("ventas-zona-chart");
  if (!canvas) {
    console.warn("⚠️ Canvas ventas-zona-chart no encontrado");
    return;
  }

  const zonas = data.ventasPorZona || [];
  const labels = zonas.map(z => z.zona);
  const valores = zonas.map(z => z.ventas);
  const colores = ["#3b82f6", "#2563eb", "#10b981", "#f59e0b"];

  if (window.ventasZonaChart) {
    try { window.ventasZonaChart.destroy(); } catch {}
    window.ventasZonaChart = null;
  }

  window.ventasZonaChart = new Chart(canvas.getContext('2d'), {
    type: "pie",
    data: {
      labels: labels.length > 0 ? labels : ["Sin datos"],
      datasets: [{
        data: valores.length > 0 ? valores : [0],
        backgroundColor: colores
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}
function crearGraficoProductosTop(data) {
  const canvas = document.getElementById("productos-top-chart");
  if (!canvas) {
    console.warn("⚠️ Canvas productos-top-chart no encontrado");
    return;
  }

  const productos = data.productosTop || [];
  const labels = productos.map(p => p.nombre);
  const valores = productos.map(p => p.ventas);
  const colores = ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444"];

  if (window.productosTopChart) {
    try { window.productosTopChart.destroy(); } catch {}
    window.productosTopChart = null;
  }

  window.productosTopChart = new Chart(canvas.getContext('2d'), {
    type: "bar",
    data: {
      labels: labels.length > 0 ? labels : ["Sin datos"],
      datasets: [{
        label: "Productos Top",
        data: valores.length > 0 ? valores : [0],
        backgroundColor: colores
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: valores.length > 0 ? Math.max(...valores) * 1.1 : 10
        }
      }
    }
  });
}

function agregarEventoFiltrar() {
  const filtrarBtn = document.getElementById('filtrar-btn');
  if (filtrarBtn && !filtrarBtn.dataset.listenerAdded) {
    filtrarBtn.dataset.listenerAdded = 'true';
    filtrarBtn.addEventListener('click', async () => {
      const periodo = document.getElementById('periodo-select')?.value || '6';
      const zona = document.getElementById('zona-select')?.value || 'todas';

      console.log(`📊 Filtrando: Periodo=${periodo} meses, Zona=${zona}`);

      try {
        const response = await fetch(`/api/reportes?periodo=${periodo}&zona=${zona}`);
        const datosFiltrados = response.ok ? await response.json() : {};

        console.log("✅ Datos filtrados:", datosFiltrados);

        crearGraficoVentasMensuales(datosFiltrados);
        crearGraficoVentasPorZona(datosFiltrados);
        crearGraficoProductosTop(datosFiltrados);
      } catch (err) {
        console.error("❌ Error al filtrar:", err);
      }
    });
  }
}
document.getElementById("exportar-todo-btn")?.addEventListener("click", () => {
  const periodo = document.getElementById("periodo-select")?.value || "6";
  const zona = document.getElementById("zona-select")?.value || "todas";
  const url = `/api/reportes/exportar?periodo=${periodo}&zona=${zona}`;
  window.open(url, "_blank");
});

window.initReportes = cargarReportes;