document.addEventListener('DOMContentLoaded', function () {

    const chartEl = document.getElementById('chart');
    if (!chartEl) return;
    const ctx = chartEl.getContext('2d');

    // ── Palette (matches style.css) ─────────────────
    const C = {
        green:      '#34d48a',
        greenFill:  'rgba(52,212,138,0.15)',
        red:        '#f74f4f',
        redFill:    'rgba(247,79,79,0.15)',
        blue:       '#4f8ef7',
        blueFill:   'rgba(79,142,247,0.12)',
        grid:       'rgba(255,255,255,0.05)',
        tick:       '#6b6b78',
        tooltip:    '#1c1c20',
        tooltipBorder: 'rgba(255,255,255,0.1)',
    };

    // ── Helpers ─────────────────────────────────────
    const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
    const fmtFull = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

    function groupByMonth(fechas, ingresos, egresos) {
        const map = {};
        fechas.forEach((f, i) => {
            const [y, m] = f.split('-');
            const key = `${y}-${m}`;
            if (!map[key]) map[key] = { ing: 0, eg: 0 };
            map[key].ing += ingresos[i] || 0;
            map[key].eg  += egresos[i]  || 0;
        });

        const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        const sorted = Object.keys(map).sort();
        return {
            labels:   sorted.map(k => { const [y,m] = k.split('-'); return MONTHS[+m-1] + ' ' + y.slice(2); }),
            ingresos: sorted.map(k => map[k].ing),
            egresos:  sorted.map(k => map[k].eg),
            balance:  sorted.map(k => map[k].ing - map[k].eg),
        };
    }

    function buildChart(grouped) {
        if (window._chart instanceof Chart) window._chart.destroy();

        window._chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: grouped.labels,
                datasets: [
                    {
                        type: 'bar',
                        label: 'Ingresos',
                        data: grouped.ingresos,
                        backgroundColor: C.greenFill,
                        borderColor: C.green,
                        borderWidth: 1.5,
                        borderRadius: 5,
                        borderSkipped: false,
                        order: 2,
                    },
                    {
                        type: 'bar',
                        label: 'Egresos',
                        data: grouped.egresos,
                        backgroundColor: C.redFill,
                        borderColor: C.red,
                        borderWidth: 1.5,
                        borderRadius: 5,
                        borderSkipped: false,
                        order: 2,
                    },
                    {
                        type: 'line',
                        label: 'Balance neto',
                        data: grouped.balance,
                        borderColor: C.blue,
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        pointBackgroundColor: C.blue,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        tension: 0.35,
                        yAxisID: 'yBalance',
                        order: 1,
                    },
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false },
                    title:  { display: false },
                    tooltip: {
                        backgroundColor: C.tooltip,
                        borderColor: C.tooltipBorder,
                        borderWidth: 1,
                        titleColor: '#f0f0f2',
                        bodyColor: C.tick,
                        padding: 12,
                        callbacks: {
                            label: ctx => {
                                const sign = ctx.dataset.label === 'Balance neto' && ctx.parsed.y < 0 ? '' : '';
                                return '  ' + ctx.dataset.label + ':  ' + fmtFull.format(ctx.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: C.grid },
                        ticks: { color: C.tick, font: { family: "'IBM Plex Mono'", size: 11 } },
                        border: { display: false },
                    },
                    y: {
                        position: 'left',
                        grid: { color: C.grid },
                        border: { display: false },
                        ticks: {
                            color: C.tick,
                            font: { family: "'IBM Plex Mono'", size: 11 },
                            callback: v => fmt.format(v),
                        },
                    },
                    yBalance: {
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        border: { display: false },
                        ticks: {
                            color: C.blue,
                            font: { family: "'IBM Plex Mono'", size: 10 },
                            callback: v => fmt.format(v),
                        },
                    }
                }
            }
        });
    }

    function updateStats(data) {
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

        set('total-ingresos', fmtFull.format(data.total_ingresos || 0));
        set('total-egresos',  fmtFull.format(data.total_egresos  || 0));
        set('balance',        fmtFull.format(data.balance        || 0));

        // Sub-labels: transaction counts if available
        if (data.count_ingresos != null) set('sub-ingresos', data.count_ingresos + ' movimientos');
        if (data.count_egresos  != null) set('sub-egresos',  data.count_egresos  + ' movimientos');

        const balEl = document.getElementById('balance');
        if (balEl) {
            balEl.style.color = data.balance > 0 ? 'var(--green)' : data.balance < 0 ? 'var(--red)' : 'var(--text)';
        }
        const subBal = document.getElementById('sub-balance');
        if (subBal && data.balance != null) {
            const ratio = data.total_ingresos > 0
                ? ((data.balance / data.total_ingresos) * 100).toFixed(1)
                : 0;
            subBal.textContent = ratio + '% sobre ingresos';
        }
    }

    function cargarDatos(startDate = null, endDate = null) {
        let url = '/data';
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate)   params.append('end_date', endDate);
        if ([...params].length) url += '?' + params;

        fetch(url)
            .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
            .then(data => {
                updateStats(data);

                if (!data.fechas || data.fechas.length === 0) {
                    if (window._chart instanceof Chart) window._chart.destroy();
                    return;
                }

                const grouped = groupByMonth(data.fechas, data.ingresos, data.egresos);
                buildChart(grouped);
            })
            .catch(err => {
                console.error('SEARI dashboard error:', err);
                ['total-ingresos','total-egresos','balance'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = '—';
                });
            });
    }

    // ── Init ────────────────────────────────────────
    cargarDatos();

    document.getElementById('filter-btn')?.addEventListener('click', () => {
        cargarDatos(
            document.getElementById('start-date')?.value || null,
            document.getElementById('end-date')?.value   || null,
        );
    });

    document.getElementById('reset-btn')?.addEventListener('click', () => {
        const sd = document.getElementById('start-date');
        const ed = document.getElementById('end-date');
        if (sd) sd.value = '';
        if (ed) ed.value = '';
        cargarDatos();
    });
});