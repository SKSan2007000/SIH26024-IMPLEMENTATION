import uuid
from fastapi.testclient import TestClient

def test_create_region(client: TestClient):
    uid = str(uuid.uuid4())[:8]
    response = client.post("/api/regions/", json={"name": "Test Region", "code": f"TR1-{uid}"})
    assert response.status_code == 201
    assert response.json()["code"] == f"TR1-{uid}"

def test_duplicate_region_code(client: TestClient):
    uid = str(uuid.uuid4())[:8]
    client.post("/api/regions/", json={"name": "Test Region", "code": f"TR2-{uid}"})
    response = client.post("/api/regions/", json={"name": "Test Region 2", "code": f"TR2-{uid}"})
    assert response.status_code == 400

def test_create_area(client: TestClient):
    uid = str(uuid.uuid4())[:8]
    reg_response = client.post("/api/regions/", json={"name": "Test Region", "code": f"TR-{uid}"})
    reg_id = reg_response.json()["id"]
    
    response = client.post("/api/areas/", json={"name": "Test Area", "code": f"TA1-{uid}", "region_id": reg_id})
    assert response.status_code == 201
    assert response.json()["region_id"] == reg_id

def test_invalid_region_for_area(client: TestClient):
    response = client.post("/api/areas/", json={"name": "Invalid Area", "code": "IA1", "region_id": "invalid-id"})
    assert response.status_code == 400

def test_create_mine(client: TestClient):
    uid = str(uuid.uuid4())[:8]
    reg_response = client.post("/api/regions/", json={"name": "Test Region", "code": f"TR-{uid}"})
    reg_id = reg_response.json()["id"]
    
    area_response = client.post("/api/areas/", json={"name": "Test Area", "code": f"TA1-{uid}", "region_id": reg_id})
    area_id = area_response.json()["id"]

    response = client.post("/api/mines/", json={
        "name": "Test Mine", "code": f"TM1-{uid}", "region_id": reg_id, "area_id": area_id
    })
    assert response.status_code == 400 # Must be canonical mine

def test_create_department(client: TestClient):
    uid = str(uuid.uuid4())[:8]
    reg_response = client.post("/api/regions/", json={"name": "Test Region", "code": f"TR-{uid}"})
    reg_id = reg_response.json()["id"]
    
    area_response = client.post("/api/areas/", json={"name": "Test Area", "code": f"TA1-{uid}", "region_id": reg_id})
    area_id = area_response.json()["id"]

    mine_response = client.get("/api/mines/")
    mine_id = None
    for m in mine_response.json():
        if m["code"] == "SECL-GEVRA":
            mine_id = m["id"]
            break
    assert mine_id is not None

    response = client.post("/api/departments/", json={
        "name": "Test Safety", "type": "SAFETY", "mine_id": mine_id
    })
    assert response.status_code == 201
    assert response.json()["type"] == "SAFETY"

def test_create_user(client: TestClient):
    uid = str(uuid.uuid4())[:8]
    response = client.post("/api/users/", json={
        "full_name": "Test User",
        "email": f"test{uid}@user.com",
        "password": "password123",
        "role": "HEAD_ADMIN"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == f"test{uid}@user.com"
    assert "password" not in data
    assert "password_hash" not in data

def test_get_mines(client: TestClient):
    response = client.get("/api/mines/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_users(client: TestClient):
    response = client.get("/api/users/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
