import csv
from datetime import date
from app.services.db_service import SessionLocal
from app.database.models import Registro

def importar_datos():
    db = SessionLocal()

    try:
        with open('datos.csv', newline='', encoding='utf-8') as file:
            reader = csv.DictReader(file)

            for row in reader:
                # Validación básica
                if row['tipo'] not in ['Ingreso', 'Egreso']:
                    print(f"Tipo inválido: {row['tipo']}")
                    continue

                try:
                    registro = Registro(
                        concepto=row['concepto'],
                        valor=float(row['valor']),
                        fecha=date.fromisoformat(row['fecha']),
                        tipo=row['tipo']
                    )

                    db.add(registro)

                except Exception as e:
                    print(f"Error en fila {row}: {e}")

        db.commit()
        print("✅ Datos importados correctamente")

    except FileNotFoundError:
        print("❌ No se encontró el archivo datos.csv")

    finally:
        db.close()

if __name__ == "__main__":
    importar_datos()