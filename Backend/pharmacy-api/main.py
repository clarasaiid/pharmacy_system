from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
# Import routers
from app.routes.auth import router as auth_router
from app.routes.patient import router as patient_router
from app.routes.medication import router as medication_router
from app.routes.organization import router as organization_router
from app.routes.prescription import router as prescription_router
from app.routes.purchase import router as purchase_router
from app.routes.sale import router as sale_router
from app.routes.test_email import router as test_email_router
from app.routes import audit_log as audit_log_router
from app.routes.medication_request import router as medication_request_router
from app.routes.user import router as user_router
from app.routes.medication_dispenses import router as medication_dispense_router
from app.routes.inventory import router as inventory_router
from app.api.v1.endpoints.auth import router as custom_auth_router

app = FastAPI(
    title="Pharmacy System API",
    description="""
    FHIR-compliant Pharmacy System API with SNOMED CT support.

    ## Features
    * FHIR-compliant resources
    * SNOMED CT validation
    * Patient management
    * Medication requests
    * Practitioner management
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://localhost:19006",
        "exp://localhost:19006",
        "exp://192.168.1.64:8081",  # Added local network IP for Metro bundler
        "http://192.168.1.64:8081"   # Added local network IP for web access
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(patient_router)
app.include_router(medication_router)
app.include_router(organization_router)
app.include_router(prescription_router)
app.include_router(purchase_router)
app.include_router(sale_router)
app.include_router(test_email_router)
app.include_router(audit_log_router.router)
app.include_router(medication_request_router)
app.include_router(user_router)
app.include_router(medication_dispense_router)
app.include_router(inventory_router)
app.include_router(custom_auth_router, prefix="/auth")

# Health check
@app.get("/api/health", tags=["System"], summary="Health check")
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

