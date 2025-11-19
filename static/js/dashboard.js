async function cargarDashboard() {
  try {
    // --- CARGAR VENTAS REALES (array de objetos) ---
    const ventasRes = await fetch("/data/ventas.json");
    const ventasArr = ventasRes.ok ? await ventasRes.json() : [];

    // Calcular últimos 7 días (incluye hoy)
    const hoy = new Date();
    const hace7dias = new Date();
    hace7dias.setDate(hoy.getDate() - 6); // 7 días incluyendo hoy: día -6 .. 0

    // Generar labels (fechas YYYY-MM-DD) para los últimos 7 días
    const ventasLabels = [];
    const ventasDataArr = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(hace7dias);
      d.setDate(hace7dias.getDate() + i);
      const ymd = d.toISOString().split("T")[0];
      ventasLabels.push(ymd);
      // sumar montos del día
      const montoDia = ventasArr
        .filter(v => typeof v.fecha === "string" && v.fecha.startsWith(ymd))
        .reduce((s, v) => s + (Number(v.total_calculado) || Number(v.monto) || 0), 0);

      ventasDataArr.push(montoDia);
    }

    const ventasData = { labels: ventasLabels, data: ventasDataArr };
    // Datos para gráfico de entregas por día de la semana (Lun-Dom)
    const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const entregasPorDiaSemana = [0, 0, 0, 0, 0, 0, 0];

    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay() + 1); // lunes
    inicioSemana.setHours(0, 0, 0, 0);

    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6); // domingo
    finSemana.setHours(23, 59, 59, 999);

    ventasArr.forEach(v => {
      if (v.is_pago_de_deuda || !v.fecha) return;
      const d = new Date(v.fecha);
      if (isNaN(d)) return;
      if (d >= inicioSemana && d <= finSemana) {
        entregasPorDiaSemana[d.getDay()]++;
      }
    });


    const entregasData = {
      labels: diasSemana,
      data: entregasPorDiaSemana
    };

    // --- CARGAR INVENTARIO (para stock total)
    const inventarioRes = await fetch("/api/inventario");
    const inventarioData = inventarioRes.ok ? await inventarioRes.json() : { items: [] };
    const inventario = inventarioData.items || [];

    // --- CLIENTES (TOTALES Y DEUDORES) ---
    try {
      const clientesRes = await fetch("/data/clientes.json");
      const clientes = clientesRes.ok ? await clientesRes.json() : [];
      const stat1 = document.getElementById("stat-value-1");
      if (stat1) stat1.textContent = clientes.length;
    } catch (err) {
      console.error("Error cargando clientes:", err);
      const stat1 = document.getElementById("stat-value-1");
      if (stat1) stat1.textContent = "0";
    }
    try {
      const clientesRes = await fetch("/data/clientes.json");
      const clientes = clientesRes.ok ? await clientesRes.json() : [];

      const deudores = clientes
        .filter(c => Number(c.deuda) > 0)
        .sort((a, b) => b.deuda - a.deuda)
        .slice(0, 5);

      const tbody = document.getElementById("clientes-deudores-body");
      if (tbody) {
        tbody.innerHTML = "";
        deudores.forEach(c => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
        <td>${c.nombre}</td>
        <td>$${Number(c.deuda).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
      `;
          tbody.appendChild(tr);
        });
        // Activar botón de exportar deudores
        const exportBtn = document.getElementById("exportar-deudores-btn");
        if (exportBtn) {
          exportBtn.addEventListener("click", () => {
            const filas = document.querySelectorAll("#clientes-deudores-table tbody tr");
            if (!filas.length) return;

            let csv = "Cliente,Deuda\n";
            filas.forEach(tr => {
              const cols = tr.querySelectorAll("td");
              const nombre = cols[0]?.textContent.trim() || "";
              const deuda = cols[1]?.textContent.trim().replace("$", "").replace(/\./g, "").replace(",", ".");
              csv += `"${nombre}",${deuda}\n`;
            });

            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "clientes_deudores.csv";
            link.click();
            URL.revokeObjectURL(url);
          });
        }
      }

      const stat1 = document.getElementById("stat-value-1");
      if (stat1) stat1.textContent = clientes.length;
    } catch (err) {
      console.error("Error cargando clientes:", err);
      const stat1 = document.getElementById("stat-value-1");
      if (stat1) stat1.textContent = "0";
    }


    // --- STOCK TOTAL)
    const stockTotal = inventario.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
    const stat2 = document.getElementById("stat-value-2");
    if (stat2) stat2.textContent = stockTotal;

    // --- VENTAS TOTALES y COLOR (STAT 3)
    // Calculamos con TODOS los registros de ventas
    const totalVendido = ventasArr.reduce(
      (acc, v) => acc + (Number(v.total_calculado) || Number(v.monto) || 0),
      0
    );

    const totalPagado = ventasArr.reduce(
      (acc, v) => acc + (Number(v.pago_cliente) || 0),
      0
    );

    const totalFiado = ventasArr.reduce(
      (acc, v) => acc + (Number(v.deuda_generada) || 0),
      0
    );

    const gananciaReal = totalPagado - totalFiado;

    const stat3 = document.getElementById("stat-value-3");
    if (stat3) {
      // Mostrar el valor (gananciaReal) en pesos
      stat3.textContent = `$${gananciaReal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;

      // Poner color: verde si >=0, rojo si <0
      stat3.style.color = gananciaReal >= 0 ? "#16a34a" : "#dc2626";
    }

    // --- ENTREGAS TOTALES (últimos 7 días)
    // Contamos entregas en los últimos 7 días (basadas en ventas)
    const ventasUltimos7 = ventasArr.filter(v => {
      if (v.is_pago_de_deuda) return false;  
      if (!v.fecha) return false;

      const f = new Date(v.fecha);
      return f >= new Date(hace7dias.getFullYear(), hace7dias.getMonth(), hace7dias.getDate()) &&
        f <= new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59, 999);
    });

    const stat4 = document.getElementById("stat-value-4");
    if (stat4) stat4.textContent = ventasUltimos7.length;

    // --- GRAFICOS: VENTAS y ENTREGAS ---
    crearGraficoVentas(ventasData);
    crearGraficoEntregas(entregasData);

  } catch (error) {
    console.error("Error al cargar dashboard:", error);
  }
}

function crearGraficoVentas(data) {
  const canvas = document.getElementById("sales-chart");
  if (!canvas) return;

  if (window.salesChart) {
    try { window.salesChart.destroy(); } catch (e) { }
  }

  window.salesChart = new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels: data.labels || [],
      datasets: [{
        label: "Ventas",
        data: data.data || [],
        backgroundColor: "rgba(37, 99, 235, 0.1)",
        borderColor: "#2563eb",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

function crearGraficoEntregas(data) {
  const canvas = document.getElementById("deliveries-chart");
  if (!canvas) return;

  if (window.deliveriesChart) {
    try { window.deliveriesChart.destroy(); } catch (e) { }
  }

  window.deliveriesChart = new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: data.labels || [],
      datasets: [{
        label: "Entregas",
        data: data.data || [],
        backgroundColor: "#10b981"
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

window.initDashboard = cargarDashboard;
