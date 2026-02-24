// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM completamente cargado');
    
    // Verificar que el canvas existe
    const chartElement = document.getElementById('chart');
    if (!chartElement) {
        console.error('Error: No se encontró el elemento canvas con id "chart"');
        return;
    }
    
    const ctx = chartElement.getContext('2d');
    if (!ctx) {
        console.error('Error: No se pudo obtener el contexto 2D del canvas');
        return;
    }

    fetch('/data')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json();
        })
        .then(data => {
            console.log('Datos recibidos:', data);

            // Verificar que los elementos existen antes de usarlos
            const totalIngresosEl = document.getElementById('total-ingresos');
            const totalEgresosEl = document.getElementById('total-egresos');
            const balanceEl = document.getElementById('balance');
            
            if (!totalIngresosEl || !totalEgresosEl || !balanceEl) {
                console.error('Error: No se encontraron los elementos de las cards');
                return;
            }

            // Verificar si hay datos
            if (data.fechas.length === 0) {
                totalIngresosEl.textContent = '0.00';
                totalEgresosEl.textContent = '0.00';
                balanceEl.textContent = '0.00';
                return;
            }

            // Actualizar tarjetas financieras con 2 decimales
            totalIngresosEl.textContent = data.total_ingresos.toFixed(2);
            totalEgresosEl.textContent = data.total_egresos.toFixed(2);
            balanceEl.textContent = data.balance.toFixed(2);

            // Procesar etiquetas para el gráfico
            const muchosRegistros = data.fechas.length > 15;
            let labels = data.fechas;

            if (muchosRegistros) {
                labels = data.fechas.map((label, index) => {
                    return index % 3 === 0 || index === data.fechas.length - 1 ? label : '';
                });
            }

            // Destruir gráfico anterior si existe
            if (window.myChart instanceof Chart) {
                window.myChart.destroy();
            }

            // Crear nuevo gráfico
            window.myChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Ingresos',
                            data: data.ingresos,
                            borderColor: 'rgba(46, 204, 113, 1)',
                            backgroundColor: 'rgba(46, 204, 113, 0.1)',
                            borderWidth: 2,
                            tension: 0.2,
                            fill: true
                        },
                        {
                            label: 'Egresos',
                            data: data.egresos,
                            borderColor: 'rgba(231, 76, 60, 1)',
                            backgroundColor: 'rgba(231, 76, 60, 0.1)',
                            borderWidth: 2,
                            tension: 0.2,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true
                        },
                        title: {
                            display: true,
                            text: 'Ingresos vs Egresos'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return value.toFixed(2);
                                }
                            }
                        }
                    }
                }
            });
            
            console.log('Gráfico creado exitosamente');
        })
        .catch(error => {
            console.error('Error al cargar los datos:', error);
            // Verificar que los elementos existen antes de asignarles texto
            const totalIngresos = document.getElementById('total-ingresos');
            const totalEgresos = document.getElementById('total-egresos');
            const balance = document.getElementById('balance');
            
            if (totalIngresos) totalIngresos.textContent = 'Error';
            if (totalEgresos) totalEgresos.textContent = 'Error';
            if (balance) balance.textContent = 'Error';
        });
});