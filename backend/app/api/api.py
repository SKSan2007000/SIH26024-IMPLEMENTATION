from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.api.endpoints import (
    regions, areas, mines, zones, departments, users, auth,
    safety_reports, environment, contractors, inspections, compliance,
    corrective_actions, reports, risk, ml, governance, command_center,
    demo, field_evidence, tasks, incident_reports, iot, notifications,
    verifications, timeline, governance_score, audit, settings
)

api_router = APIRouter()

# Public & Auth routes
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(incident_reports.router, prefix="/incident-reports", tags=["incident_reports"])

# Authenticated Core Governance routes
api_router.include_router(users.router, prefix="/users", tags=["users"], dependencies=[Depends(get_current_user)])
api_router.include_router(regions.router, prefix="/regions", tags=["regions"], dependencies=[Depends(get_current_user)])
api_router.include_router(areas.router, prefix="/areas", tags=["areas"], dependencies=[Depends(get_current_user)])
api_router.include_router(mines.router, prefix="/mines", tags=["mines"], dependencies=[Depends(get_current_user)])
api_router.include_router(zones.router, prefix="/zones", tags=["zones"], dependencies=[Depends(get_current_user)])
api_router.include_router(departments.router, prefix="/departments", tags=["departments"], dependencies=[Depends(get_current_user)])
api_router.include_router(safety_reports.router, prefix="/safety-reports", tags=["safety_reports"], dependencies=[Depends(get_current_user)])
api_router.include_router(environment.router, prefix="/environment", tags=["environment"], dependencies=[Depends(get_current_user)])
api_router.include_router(contractors.router, prefix="/contractors", tags=["contractors"], dependencies=[Depends(get_current_user)])
api_router.include_router(inspections.router, prefix="/inspections", tags=["inspections"], dependencies=[Depends(get_current_user)])
api_router.include_router(compliance.router, prefix="/compliance", tags=["compliance"], dependencies=[Depends(get_current_user)])
api_router.include_router(corrective_actions.router, prefix="/corrective-actions", tags=["corrective_actions"], dependencies=[Depends(get_current_user)])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"], dependencies=[Depends(get_current_user)])
api_router.include_router(risk.router, prefix="/risk", tags=["risk"], dependencies=[Depends(get_current_user)])
api_router.include_router(ml.router, prefix="/ml", tags=["ml"], dependencies=[Depends(get_current_user)])
api_router.include_router(governance.router, prefix="/governance", tags=["governance"], dependencies=[Depends(get_current_user)])
api_router.include_router(governance_score.router, prefix="/governance-score", tags=["governance_score"], dependencies=[Depends(get_current_user)])
api_router.include_router(command_center.router, prefix="/command-center", tags=["command_center"], dependencies=[Depends(get_current_user)])
api_router.include_router(demo.router, prefix="/demo", tags=["demo"], dependencies=[Depends(get_current_user)])
api_router.include_router(field_evidence.router, prefix="/field-evidence", tags=["field_evidence"], dependencies=[Depends(get_current_user)])
api_router.include_router(verifications.router, prefix="/verifications", tags=["verifications"], dependencies=[Depends(get_current_user)])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"], dependencies=[Depends(get_current_user)])
api_router.include_router(iot.router, prefix="/iot", tags=["iot"], dependencies=[Depends(get_current_user)])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"], dependencies=[Depends(get_current_user)])
api_router.include_router(timeline.router, prefix="/timeline", tags=["timeline"], dependencies=[Depends(get_current_user)])
api_router.include_router(audit.router, prefix="/audit", tags=["audit"], dependencies=[Depends(get_current_user)])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"], dependencies=[Depends(get_current_user)])
