// analytics.js — SEARI Analytics Frontend
document.addEventListener('DOMContentLoaded', () => {

    // ── State ────────────────────────────────────────────────────────────────
    let state = { periodo: 'mensual', start: '', end: '' };

    // ── Helpers ───────────────────────────────────────────────────────────────
    const fmtCurrency = v => '$' + Number(v).toLocaleString('es-CO', {
        minimumFractionDigits: 2, maximumFractionDigits: 2
    });
    const fmtPct = v => v === null || v === undefined ? '—' : `${v > 0 ? '+' : ''}${Number(v).toFixed(1)}%`;
    const $ = id => document.getElementById(id);

    // ── Period pills ──────────────────────────────────────────────────────────
    document.querySelectorAll('.an-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.an-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            state.periodo = pill.dataset.periodo;
            load();
        });
    });

    // ── Apply / reset ─────────────────────────────────────────────────────────
    $('an-apply')?.addEventListener('click', () => {
        state.start = $('an-start')?.value || '';
        state.end   = $('an-end')?.value   || '';
        load();
    });

    $('an-reset')?.addEventListener('click', () => {
        state.start = state.end = '';
        if ($('an-start')) $('an-start').value = '';
        if ($('an-end'))   $('an-end').value   = '';
        load();
    });

    // ── Export buttons ────────────────────────────────────────────────────────
    document.querySelectorAll('.an-btn-export').forEach(btn => {
        btn.addEventListener('click', () => {
            const fmt  = btn.dataset.fmt;
            const params = buildParams();
            window.location.href = `/analytics/export/${fmt}?${params}`;
        });
    });

    function buildParams() {
        const p = new URLSearchParams({ periodo: state.periodo });
        if (state.start) p.append('start_date', state.start);
        if (state.end)   p.append('end_date',   state.end);
        return p.toString();
    }

    // ── Render KPIs ───────────────────────────────────────────────────────────
    function renderKPIs(data) {
        const t = data.totales;
        $('kpi-ingresos').textContent   = fmtCurrency(t.ingresos);
        $('kpi-egresos').textContent    = fmtCurrency(t.egresos);
        $('kpi-balance').textContent    = fmtCurrency(t.balance);
        $('kpi-n').textContent          = `${t.n} movimientos`;
        $('kpi-eg-sub').textContent     = `${t.n} movimientos`;
        $('kpi-margen').textContent     = `Margen: ${t.margen.toFixed(1)}%`;

        const tend = data.tendencia;
        const tendMap = {
            creciente:     ['↗ Creciente',     'green'],
            decreciente:   ['↘ Decreciente',   'red'],
            estable:       ['→ Estable',        'amber'],
            insuficiente:  ['— Sin datos suf.', 'muted'],
        };
        const [label, cls] = tendMap[tend] || ['—', 'muted'];
        const tendEl = $('kpi-tendencia');
        tendEl.textContent = label;
        tendEl.className = `an-kpi-value`;
        tendEl.style.color = `var(--${cls === 'muted' ? 'text-muted' : cls})`;

        const nat = data.atipicos?.length || 0;
        $('kpi-atipicos').textContent = nat > 0
            ? `⚠ ${nat} valor${nat > 1 ? 'es' : ''} atípico${nat > 1 ? 's' : ''}`
            : '✓ Sin atípicos';
        $('kpi-atipicos').style.color = nat > 0 ? 'var(--amber)' : 'var(--green)';
    }

    // ── Render Insights ───────────────────────────────────────────────────────
    const ICONS = {
        positivo: '✓',
        negativo: '✗',
        alerta:   '⚠',
        neutro:   '●',
    };

    function renderInsights(insights) {
        const el = $('an-insights');
        if (!insights?.length) {
            el.innerHTML = '<div class="an-insight neutro"><span class="an-insight-text">Sin datos suficientes.</span></div>';
            return;
        }
        el.innerHTML = insights.map(ins => `
            <div class="an-insight ${ins.tipo}">
                <span class="an-insight-icon">${ICONS[ins.tipo] || '●'}</span>
                <span class="an-insight-text">${ins.msg}</span>
            </div>
        `).join('');
    }

    function renderRecs(recs) {
        const el = $('an-recs');
        if (!recs?.length) { el.innerHTML = ''; return; }
        el.innerHTML = recs.map((r, i) => `
            <div class="an-rec">
                <span class="an-rec-num">${i + 1}</span>
                <span>${r}</span>
            </div>
        `).join('');
    }

    // ── Render Table ──────────────────────────────────────────────────────────
    function varCell(v) {
        if (v === null || v === undefined) return `<td class="num var-none">—</td>`;
        const cls = v > 0 ? 'var-up' : v < 0 ? 'var-down' : '';
        const arrow = v > 0 ? '▲' : v < 0 ? '▼' : '';
        return `<td class="num ${cls}">${arrow} ${Math.abs(v).toFixed(1)}%</td>`;
    }

    function renderTable(data) {
        const periodos = data.periodos || [];
        const label    = $('an-table-label');
        if (label) label.textContent = `${periodos.length} períodos`;

        const tbody = $('an-tbody');
        tbody.innerHTML = periodos.map(p => {
            const balCls = p.balance >= 0 ? 'val-pos' : 'val-neg';
            return `
            <tr>
                <td>${p.label}</td>
                <td class="num">${fmtCurrency(p.ingresos)}</td>
                <td class="num">${fmtCurrency(p.egresos)}</td>
                <td class="num ${balCls}">${fmtCurrency(p.balance)}</td>
                <td class="num">${p.margen.toFixed(1)}%</td>
                ${varCell(p.var_ingresos)}
                ${varCell(p.var_egresos)}
                ${varCell(p.var_balance)}
                <td class="num">${p.n}</td>
            </tr>`;
        }).join('');

        const t = data.totales;
        const balCls = t.balance >= 0 ? 'val-pos' : 'val-neg';
        $('an-tfoot').innerHTML = `
            <tr>
                <td>TOTALES</td>
                <td>${fmtCurrency(t.ingresos)}</td>
                <td>${fmtCurrency(t.egresos)}</td>
                <td class="${balCls}">${fmtCurrency(t.balance)}</td>
                <td>${t.margen.toFixed(1)}%</td>
                <td>—</td><td>—</td><td>—</td>
                <td>${t.n}</td>
            </tr>`;
    }

    // ── Render Outliers ───────────────────────────────────────────────────────
    function renderOutliers(atipicos) {
        const card  = $('an-outliers-card');
        const count = $('an-outliers-count');
        const tbody = $('an-outliers-body');

        if (!atipicos?.length) {
            card.style.display = 'none';
            return;
        }
        card.style.display = 'block';
        count.textContent  = atipicos.length;
        tbody.innerHTML = atipicos.map(a => {
            const ing = a.tipo.toLowerCase() === 'ingreso';
            return `
            <tr>
                <td><span style="font-family:var(--mono);font-size:11px;color:var(--text-dim)">#${a.id}</span></td>
                <td>${a.concepto}</td>
                <td class="num ${ing ? 'val-pos' : 'val-neg'}">${fmtCurrency(a.valor)}</td>
                <td style="font-family:var(--mono);font-size:11px;color:var(--text-muted)">${a.fecha}</td>
                <td><span class="dt-badge ${ing ? 'ing' : 'eg'}">${a.tipo}</span></td>
                <td style="color:var(--amber);font-size:11px">${a.razon}</td>
            </tr>`;
        }).join('');
    }

    // ── Skeleton ──────────────────────────────────────────────────────────────
    function showSkeletons() {
        $('an-insights').innerHTML = `
            <div class="an-skeleton"></div>
            <div class="an-skeleton short"></div>
            <div class="an-skeleton"></div>`;
        $('an-recs').innerHTML = `
            <div class="an-skeleton"></div>
            <div class="an-skeleton short"></div>`;
        ['kpi-ingresos','kpi-egresos','kpi-balance','kpi-tendencia'].forEach(id => {
            $(id).textContent = '—';
        });
    }

    // ── Main load ─────────────────────────────────────────────────────────────
    function load() {
        showSkeletons();
        fetch(`/analytics/data?${buildParams()}`)
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then(data => {
                if (data.empty) {
                    $('an-insights').innerHTML = '<div class="an-insight neutro"><span class="an-insight-icon">●</span><span class="an-insight-text">No hay registros para el período seleccionado.</span></div>';
                    $('an-recs').innerHTML     = '';
                    $('an-tbody').innerHTML    = '<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--text-muted)">Sin datos</td></tr>';
                    $('an-tfoot').innerHTML    = '';
                    $('an-outliers-card').style.display = 'none';
                    ['kpi-ingresos','kpi-egresos','kpi-balance'].forEach(id => $(id).textContent = '$0.00');
                    $('kpi-tendencia').textContent = '—';
                    return;
                }
                renderKPIs(data);
                renderInsights(data.insights);
                renderRecs(data.recomendaciones);
                renderTable(data);
                renderOutliers(data.atipicos);
            })
            .catch(err => {
                console.error('SEARI analytics error:', err);
                $('an-insights').innerHTML = '<div class="an-insight negativo"><span class="an-insight-icon">✗</span><span class="an-insight-text">Error al cargar los datos. Intenta de nuevo.</span></div>';
            });
    }

    // ── Init ─────────────────────────────────────────────────────────────────
    load();
    console.log('🔷 SEARI Analytics cargado');
});