from fastapi import FastAPI, Request, Form, Query, Depends
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import Generator

from app.services.db_service import SessionLocal, engine
from app.database.models import Registro, Base
from analytics import router as analytics_router  # ← CORREGIDO: "router as analytics_router"

# 1. Crear la aplicación FastAPI
app = FastAPI()

# 2. Incluir el router de analytics
app.include_router(analytics_router)

# 3. Crear las tablas en la base de datos
Base.metadata.create_all(bind=engine)

# 4. Configurar templates y archivos estáticos
templates = Jinja2Templates(directory="app/templates")
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# 5. Filtro personalizado para formatear números
def formato_moneda(valor):
    return f"{valor:.2f}"

templates.env.filters['moneda'] = formato_moneda

# 6. Función para obtener la sesión de base de datos
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 7. Página principal: lista registros
@app.get("/")
def index(request: Request):
    db = SessionLocal()
    registros = db.query(Registro).all()
    db.close()
    return templates.TemplateResponse(
        "index.html",
        {"request": request, "registros": registros}
    )

# 8. Agregar registro
@app.post("/add")
def add_registro(
    concepto: str = Form(...),
    valor: float = Form(...),
    fecha: str = Form(...),
    tipo: str = Form(...)
):
    db = SessionLocal()
    nuevo = Registro(
        concepto=concepto,
        valor=valor,
        fecha=date.fromisoformat(fecha),
        tipo=tipo
    )
    db.add(nuevo)
    db.commit()
    db.close()
    return RedirectResponse(url="/", status_code=303)

# 9. Obtener datos de un registro (para el modal de edición)
@app.get("/edit/{registro_id}")
def edit_page(registro_id: int, request: Request):
    if request.headers.get("accept") == "application/json":
        db = SessionLocal()
        registro = db.query(Registro).filter(Registro.id == registro_id).first()
        db.close()
        if not registro:
            return JSONResponse(status_code=404, content={"error": "No encontrado"})
        return JSONResponse({
            "id":       registro.id,
            "concepto": registro.concepto,
            "valor":    float(registro.valor),
            "fecha":    str(registro.fecha),
            "tipo":     registro.tipo,
        })
    return RedirectResponse(url="/", status_code=303)

# 10. Guardar cambios (editar registro)
@app.post("/edit/{registro_id}")
def edit_registro(
    registro_id: int,
    concepto: str = Form(...),
    tipo: str = Form(...),
    valor: float = Form(...),
    fecha: str = Form(...)
):
    db = SessionLocal()
    registro = db.query(Registro).filter(Registro.id == registro_id).first()
    if registro:
        registro.concepto = concepto
        registro.tipo = tipo
        registro.valor = valor
        registro.fecha = date.fromisoformat(fecha)
        db.commit()
    db.close()
    return RedirectResponse(url="/", status_code=303)

# 11. Borrar registro
@app.post("/delete/{registro_id}")
def delete_registro(registro_id: int):
    db = SessionLocal()
    registro = db.query(Registro).filter(Registro.id == registro_id).first()
    if registro:
        db.delete(registro)
        db.commit()
    db.close()
    return RedirectResponse(url="/", status_code=303)

# 12. Endpoint para datos de gráficos (dashboard)
@app.get("/data")
def get_data(
    start_date: str = Query(None),
    end_date: str = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Registro)

    if start_date:
        fecha_inicio = datetime.strptime(start_date, "%Y-%m-%d")
        query = query.filter(Registro.fecha >= fecha_inicio)

    if end_date:
        fecha_fin = datetime.strptime(end_date, "%Y-%m-%d")
        query = query.filter(Registro.fecha <= fecha_fin)

    registros = query.order_by(Registro.fecha.asc()).all()

    fechas, ingresos, egresos = [], [], []
    total_ingresos = total_egresos = 0

    for r in registros:
        fechas.append(r.fecha.strftime("%Y-%m-%d"))
        if r.tipo == "Ingreso":
            ingresos.append(float(r.valor))
            egresos.append(0)
            total_ingresos += float(r.valor)
        else:
            egresos.append(float(r.valor))
            ingresos.append(0)
            total_egresos += float(r.valor)

    return {
        "fechas":          fechas,
        "ingresos":        ingresos,
        "egresos":         egresos,
        "total_ingresos":  round(total_ingresos, 2),
        "total_egresos":   round(total_egresos, 2),
        "balance":         round(total_ingresos - total_egresos, 2),
    }

# 13. Dashboard
@app.get("/dashboard")
def dashboard(request: Request, db: Session = Depends(get_db)):
    return templates.TemplateResponse("dashboard.html", {"request": request})

# 14. Página de Análisis  ← NUEVA
@app.get("/analytics")
def analytics_page(request: Request):
    return templates.TemplateResponse("analytics.html", {"request": request})