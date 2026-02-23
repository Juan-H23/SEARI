from fastapi import FastAPI, Request, Form
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.orm import Session
from app.services.db_service import SessionLocal, engine
from app.database.models import Registro, Base
from datetime import date

app = FastAPI()

Base.metadata.create_all(bind=engine)

templates = Jinja2Templates(directory="app/templates")
app.mount("/static", StaticFiles(directory="app/static"), name="static")




from typing import Generator

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



# Página principal: lista registros
@app.get("/")
def index(request: Request):
    db = SessionLocal()
    registros = db.query(Registro).all()
    db.close()
    return templates.TemplateResponse(
        "index.html",
        {"request": request, "registros": registros}
    )


# Agregar registro
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


# Editar registro
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
        registro.valor = valor
        registro.fecha = date.fromisoformat(fecha)
        db.commit()
    db.close()
    return RedirectResponse(url="/", status_code=303)


# Borrar registro
@app.post("/delete/{registro_id}")
def delete_registro(registro_id: int):
    db = SessionLocal()
    registro = db.query(Registro).filter(Registro.id == registro_id).first()
    if registro:
        db.delete(registro)
        db.commit()
    db.close()
    return RedirectResponse(url="/", status_code=303)


from fastapi import FastAPI, Request, Depends

@app.get("/data")
def get_data(db: Session = Depends(get_db)):
    registros = db.query(Registro).all()

    conceptos = []
    valores = []
    fechas = []

    for r in registros:
        conceptos.append(r.concepto)
        valores.append(float(r.valor))  # FORZAMOS A FLOAT
        fechas.append(r.fecha.strftime("%Y-%m-%d"))

    total_registros = len(valores)
    valor_total = float(sum(valores))
    valor_promedio = float(valor_total / total_registros) if total_registros > 0 else 0

    return {
        "conceptos": conceptos,
        "valores": valores,
        "fechas": fechas,
        "total_registros": total_registros,
        "valor_total": round(valor_total, 2),
        "valor_promedio": round(valor_promedio, 2)
    }

@app.get("/dashboard")
def dashboard(request: Request, db: Session = Depends(get_db)):
    return templates.TemplateResponse("dashboard.html", {"request": request})