// Scripts.js – SEARI
document.addEventListener('DOMContentLoaded', function () {

    // ════════════════════════════════════════════════════════
    // DATATABLE ENGINE
    // ════════════════════════════════════════════════════════

    const dtDataEl = document.getElementById('dt-data');
    if (!dtDataEl) return; // no records, nothing to do

    // Raw dataset from Jinja
    const ALL_ROWS = JSON.parse(dtDataEl.textContent);

    // State
    let state = {
        query:   '',
        filter:  'all',   // 'all' | 'ingreso' | 'egreso'
        sortCol: 'fecha',
        sortDir: 'desc',  // 'asc' | 'desc'
        page:    1,
        perPage: 10,
    };

    // ── Format helpers ───────────────────────────────────────
    const fmtVal = v => '$' + Number(v).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    function highlight(text, query) {
        if (!query) return escHtml(text);
        const re = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
        return escHtml(String(text)).replace(re, '<mark class="hl">$1</mark>');
    }

    function escHtml(s) {
        return String(s)
            .replace(/&/g,'&amp;').replace(/</g,'&lt;')
            .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // ── Filter + Search ──────────────────────────────────────
    function applyFilters() {
        const q = state.query.toLowerCase().trim();
        return ALL_ROWS.filter(r => {
            // tipo filter
            if (state.filter !== 'all' && r.tipo.toLowerCase() !== state.filter) return false;
            // search
            if (!q) return true;
            return (
                r.concepto.toLowerCase().includes(q) ||
                r.fecha.includes(q) ||
                String(r.id).includes(q) ||
                fmtVal(r.valor).toLowerCase().includes(q) ||
                r.tipo.toLowerCase().includes(q)
            );
        });
    }

    // ── Sort ─────────────────────────────────────────────────
    function applySort(rows) {
        const { sortCol, sortDir } = state;
        const dir = sortDir === 'asc' ? 1 : -1;
        return [...rows].sort((a, b) => {
            let va = a[sortCol], vb = b[sortCol];
            if (sortCol === 'valor' || sortCol === 'id') {
                return (Number(va) - Number(vb)) * dir;
            }
            return String(va).localeCompare(String(vb), 'es') * dir;
        });
    }

    // ── Paginate ─────────────────────────────────────────────
    function paginate(rows) {
        const start = (state.page - 1) * state.perPage;
        return rows.slice(start, start + state.perPage);
    }

    // ── Render rows ──────────────────────────────────────────
    function renderRows(rows) {
        const body = document.getElementById('dt-body');
        if (!body) return;

        if (rows.length === 0) {
            body.innerHTML = `
                <div class="dt-empty">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <p>Sin resultados</p>
                    <small>Intenta con otra búsqueda o filtro</small>
                </div>`;
            return;
        }

        const q = state.query.trim();
        body.innerHTML = rows.map(r => {
            const isEg  = r.tipo.toLowerCase() === 'egreso';
            const valCls = isEg ? 'neg' : 'pos';
            const badgeCls = isEg ? 'eg' : 'ing';
            return `
            <div class="dt-row" data-id="${r.id}">
                <span class="dt-id">#${r.id}</span>
                <span class="dt-name">${highlight(r.concepto, q)}</span>
                <span class="dt-val ${valCls}">${highlight(fmtVal(r.valor), q)}</span>
                <span class="dt-date">${highlight(r.fecha, q)}</span>
                <span><span class="dt-badge ${badgeCls}">${highlight(r.tipo, q)}</span></span>
                <span class="dt-actions">
                    <button class="edit" data-edit-id="${r.id}">Editar</button>
                    <button class="delete" data-id="${r.id}">Borrar</button>
                </span>
            </div>`;
        }).join('');
    }

    // ── Render info ──────────────────────────────────────────
    function renderInfo(filtered, total) {
        const el = document.getElementById('dt-info');
        if (!el) return;
        const start = Math.min((state.page - 1) * state.perPage + 1, filtered);
        const end   = Math.min(state.page * state.perPage, filtered);
        if (filtered === 0) {
            el.innerHTML = 'Sin resultados';
            return;
        }
        el.innerHTML = `Mostrando <span>${start}–${end}</span> de <span>${filtered}</span>${filtered < total ? ` &nbsp;(${total} total)` : ''}`;
    }

    // ── Render pagination ────────────────────────────────────
    function renderPagination(totalRows) {
        const el = document.getElementById('dt-pagination');
        if (!el) return;

        const totalPages = Math.ceil(totalRows / state.perPage);
        if (totalPages <= 1) { el.innerHTML = ''; return; }

        const cur = state.page;
        let pages = [];

        // Always show: 1, prev-1, cur, next+1, last  (with dots)
        const range = new Set([1, totalPages, cur, cur-1, cur+1].filter(p => p >= 1 && p <= totalPages));
        const sorted = [...range].sort((a,b) => a-b);

        let html = '';

        // Prev button
        html += `<button class="dt-page-btn" data-page="${cur-1}" ${cur===1?'disabled':''}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>`;

        let prev = 0;
        sorted.forEach(p => {
            if (prev && p - prev > 1) html += `<span class="dt-page-dots">…</span>`;
            html += `<button class="dt-page-btn ${p===cur?'current':''}" data-page="${p}">${p}</button>`;
            prev = p;
        });

        // Next button
        html += `<button class="dt-page-btn" data-page="${cur+1}" ${cur===totalPages?'disabled':''}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>`;

        el.innerHTML = html;
    }

    // ── Render sort indicators ───────────────────────────────
    function renderSortHeaders() {
        document.querySelectorAll('.dt-th[data-col]').forEach(th => {
            const col = th.dataset.col;
            if (col === '_actions') return;
            th.classList.remove('sorted-asc','sorted-desc');
            const asc  = th.querySelector('.asc-arrow');
            const desc = th.querySelector('.desc-arrow');
            const neu  = th.querySelector('.neutral-arrow');
            if (asc)  asc.style.display  = 'none';
            if (desc) desc.style.display = 'none';
            if (neu)  neu.style.display  = 'block';
            if (col === state.sortCol) {
                th.classList.add(state.sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc');
                if (state.sortDir === 'asc'  && asc)  { asc.style.display  = 'block'; if(neu) neu.style.display='none'; }
                if (state.sortDir === 'desc' && desc)  { desc.style.display = 'block'; if(neu) neu.style.display='none'; }
            }
        });
    }

    // ── Master render ────────────────────────────────────────
    function render() {
        const filtered = applyFilters();
        const sorted   = applySort(filtered);
        const page     = paginate(sorted);

        renderRows(page);
        renderInfo(filtered.length, ALL_ROWS.length);
        renderPagination(filtered.length);
        renderSortHeaders();
    }

    // ── Event: search ────────────────────────────────────────
    const searchInput = document.getElementById('dt-search');
    if (searchInput) {
        let debounce;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(() => {
                state.query = searchInput.value;
                state.page  = 1;
                render();
            }, 160);
        });
    }

    // ── Event: filter pills ──────────────────────────────────
    document.querySelectorAll('.dt-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.dt-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            state.filter = pill.dataset.filter;
            state.page   = 1;
            render();
        });
    });

    // ── Event: per-page ──────────────────────────────────────
    const perPageSel = document.getElementById('dt-perpage');
    if (perPageSel) {
        perPageSel.addEventListener('change', () => {
            state.perPage = parseInt(perPageSel.value, 10);
            state.page    = 1;
            render();
        });
    }

    // ── Event: column sort ───────────────────────────────────
    document.querySelectorAll('.dt-th[data-col]').forEach(th => {
        if (th.dataset.col === '_actions') return;
        th.addEventListener('click', () => {
            const col = th.dataset.col;
            if (state.sortCol === col) {
                state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
            } else {
                state.sortCol = col;
                state.sortDir = 'asc';
            }
            state.page = 1;
            render();
        });
    });

    // ── Event: pagination (delegated) ────────────────────────
    document.getElementById('dt-pagination')?.addEventListener('click', e => {
        const btn = e.target.closest('.dt-page-btn');
        if (!btn || btn.disabled) return;
        state.page = parseInt(btn.dataset.page, 10);
        render();
        document.querySelector('.dt-shell')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    // ── Event: row actions (delegated on dt-body) ────────────
    document.getElementById('dt-body')?.addEventListener('click', e => {
        const delBtn  = e.target.closest('.delete[data-id]');
        const editBtn = e.target.closest('.edit[data-edit-id]');

        if (delBtn) {
            pendingDeleteId = delBtn.dataset.id;
            openModal('modal-delete');
        }
        if (editBtn) {
            const id = editBtn.dataset.editId;
            fetch(`/edit/${id}`, { headers: { accept: 'application/json' } })
                .then(r => r.ok ? r.json() : Promise.reject())
                .then(data => {
                    const f = document.getElementById('edit-form');
                    f.action = `/edit/${data.id}`;
                    document.getElementById('edit-badge').textContent   = `#${data.id}`;
                    document.getElementById('edit-concepto').value      = data.concepto;
                    document.getElementById('edit-valor').value         = parseFloat(data.valor).toFixed(2);
                    document.getElementById('edit-fecha').value         = data.fecha;
                    document.getElementById('edit-tipo').value          = data.tipo;
                    openModal('modal-edit');
                    setTimeout(() => document.getElementById('edit-concepto')?.focus(), 120);
                })
                .catch(() => alert('No se pudo cargar el registro.'));
        }
    });

    // Initial render
    render();


    // ════════════════════════════════════════════════════════
    // MODAL HELPERS
    // ════════════════════════════════════════════════════════

    let pendingDeleteId = null;

    function openModal(id)  { const m = document.getElementById(id); if (m) m.style.display = 'flex'; }
    function closeModal(id) { const m = document.getElementById(id); if (m) m.style.display = 'none'; }

    ['modal-delete','modal-edit'].forEach(id => {
        document.getElementById(id)?.addEventListener('click', e => {
            if (e.target === document.getElementById(id)) closeModal(id);
        });
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { closeModal('modal-delete'); closeModal('modal-edit'); }
    });

    document.getElementById('confirm-delete')?.addEventListener('click', () => {
        if (!pendingDeleteId) return;
        const form = document.createElement('form');
        form.method = 'post';
        form.action = `/delete/${pendingDeleteId}`;
        document.body.appendChild(form);
        form.submit();
    });

    document.getElementById('cancel-delete')?.addEventListener('click', () => closeModal('modal-delete'));
    document.getElementById('cancel-edit')?.addEventListener('click',   () => closeModal('modal-edit'));

    // add form valor formatting
    document.querySelectorAll('form:not(#edit-form) input[name="valor"]').forEach(i => {
        i.addEventListener('blur', () => {
            if (i.value) { const v = parseFloat(i.value); if (!isNaN(v)) i.value = v.toFixed(2); }
        });
    });

    console.log('🔷 SEARI DataTable cargado —', ALL_ROWS.length, 'registros');
});