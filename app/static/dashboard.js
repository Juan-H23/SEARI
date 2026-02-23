// Configuración optimizada para muchos registros
const ctx = document.getElementById('chart').getContext('2d');

fetch('/data')
    .then(response => response.json())
    .then(data => {
       // Calcular estadísticas
        document.getElementById('total-registros').textContent = data.total_registros;
        document.getElementById('valor-total').textContent = data.valor_total;
        document.getElementById('valor-promedio').textContent = data.valor_promedio;

        const totalRegistros = data.total_registros;
        const muchosRegistros = totalRegistros > 15;
        
        // Limitar la cantidad de etiquetas mostradas si hay muchos registros
        let labels = data.conceptos;
        let valores = data.valores;
        
        if (muchosRegistros) {
            // Mostrar solo algunas etiquetas para no saturar
            labels = data.conceptos.map((label, index) => {
                // Mostrar etiqueta cada 3 registros o el último
                return index % 3 === 0 || index === data.conceptos.length - 1 ? label : '';
            });
        }

        // Crear gráfico más profesional y compacto
        const myChart = new Chart(ctx, {
            type: 'line', // Cambiado a línea para mejor visualización con muchos datos
            data: {
                labels: labels,
                datasets: [{
                    label: 'Valor de los registros',
                    data: valores,
                    backgroundColor: 'rgba(74, 144, 226, 0.1)',
                    borderColor: 'rgba(74, 144, 226, 1)',
                    borderWidth: 2,
                    pointRadius: muchosRegistros ? 2 : 3, // Puntos más pequeños si hay muchos registros
                    pointHoverRadius: 5,
                    tension: 0.1, // Suavizado ligero de la línea
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { 
                        display: false 
                    },
                    title: { 
                        display: true, 
                        text: muchosRegistros ? 'Tendencia de Registros' : 'Dashboard de Registros',
                        font: { size: 14 }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: { 
                    y: { 
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: {
                            maxRotation: muchosRegistros ? 45 : 0, // Rotar etiquetas si hay muchos
                            font: { size: muchosRegistros ? 9 : 11 }
                        }
                    }
                },
                elements: {
                    line: {
                        borderWidth: 2
                    }
                },
                layout: {
                    padding: {
                        top: 10,
                        bottom: 10
                    }
                }
            }
        });
    })
    .catch(error => {
        console.error('Error al cargar los datos:', error);
        document.getElementById('total-registros').textContent = 'Error';
        document.getElementById('valor-total').textContent = 'Error';
        document.getElementById('valor-promedio').textContent = 'Error';
    });