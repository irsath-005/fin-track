import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Force testing database URL before importing app
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["ENVIRONMENT"] = "testing"

from app.database import Base, get_db
from app.main import app

# Setup in-memory SQLite database for fast isolated testing
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_full_auth_and_crud_workflow():
    # 1. Register User 1
    reg_payload = {
        "name": "Alex Johnson",
        "email": "alex@fintrack.io",
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!"
    }
    reg_resp = client.post("/auth/register", json=reg_payload)
    assert reg_resp.status_code == 201
    user1_token = reg_resp.json()["access_token"]
    user1_headers = {"Authorization": f"Bearer {user1_token}"}

    # 2. Login User 1
    login_resp = client.post("/auth/login", json={
        "email": "alex@fintrack.io",
        "password": "SecurePassword123!"
    })
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()

    # 3. Check Current User
    me_resp = client.get("/users/me", headers=user1_headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["name"] == "Alex Johnson"

    # 4. Add Income
    income_payload = {
        "amount": 7500.0,
        "source": "Acme Corp Tech",
        "category": "Salary",
        "date": "2026-09-01",
        "payment_method": "Bank Transfer",
        "description": "Monthly Software Engineering Salary"
    }
    inc_resp = client.post("/income", json=income_payload, headers=user1_headers)
    assert inc_resp.status_code == 201
    income_id = inc_resp.json()["id"]
    assert inc_resp.json()["amount"] == 7500.0

    # 5. Add Expense
    expense_payload = {
        "amount": 1200.0,
        "category": "Rent",
        "date": "2026-09-02",
        "payment_method": "Bank Transfer",
        "merchant": "Skyline Properties",
        "description": "Apartment Monthly Rent"
    }
    exp_resp = client.post("/expenses", json=expense_payload, headers=user1_headers)
    assert exp_resp.status_code == 201
    expense_id = exp_resp.json()["id"]
    assert exp_resp.json()["amount"] == 1200.0

    # 6. Add Investment
    inv_payload = {
        "investment_name": "Vanguard Total Stock Index (VTI)",
        "investment_type": "Stocks",
        "amount_invested": 2000.0,
        "current_value": 2250.0,
        "investment_date": "2026-09-02",
        "quantity": 10.0,
        "purchase_price": 200.0,
        "current_price": 225.0,
        "expected_return": 12.5,
        "notes": "Long term index fund"
    }
    inv_resp = client.post("/investments", json=inv_payload, headers=user1_headers)
    assert inv_resp.status_code == 201
    inv_id = inv_resp.json()["id"]
    assert inv_resp.json()["profit_loss"] == 250.0
    assert inv_resp.json()["return_percentage"] == 12.5

    # 7. Create Budget
    budget_payload = {
        "category": "Rent",
        "amount": 1500.0,
        "month": 9,
        "year": 2026
    }
    bud_resp = client.post("/budgets", json=budget_payload, headers=user1_headers)
    assert bud_resp.status_code == 201
    assert bud_resp.json()["spent"] == 1200.0
    assert bud_resp.json()["remaining"] == 300.0
    assert bud_resp.json()["status"] == "warning" # 1200 / 1500 = 80%

    # 8. Create Financial Goal
    goal_payload = {
        "goal_name": "Emergency Fund",
        "target_amount": 10000.0,
        "current_amount": 4300.0,
        "target_date": "2026-12-31",
        "description": "6 months of living expenses"
    }
    goal_resp = client.post("/goals", json=goal_payload, headers=user1_headers)
    assert goal_resp.status_code == 201
    assert goal_resp.json()["progress_percentage"] == 43.0

    # 9. Test Dashboard Summary
    dash_resp = client.get("/dashboard/summary", headers=user1_headers)
    assert dash_resp.status_code == 200
    dash_data = dash_resp.json()
    assert dash_data["total_income"] == 7500.0
    assert dash_data["total_expenses"] == 1200.0
    assert dash_data["total_investments"] == 2000.0
    # Savings = Income - Expenses - Investments = 7500 - 1200 - 2000 = 4300.0
    assert dash_data["total_savings"] == 4300.0
    assert dash_data["portfolio_value"] == 2250.0
    assert dash_data["portfolio_profit_loss"] == 250.0
    assert len(dash_data["insights"]) > 0

    # 10. Test Unified Transactions
    tx_resp = client.get("/transactions", headers=user1_headers)
    assert tx_resp.status_code == 200
    tx_data = tx_resp.json()
    assert tx_data["total"] == 3 # 1 income, 1 expense, 1 investment

    # 11. Test User Data Isolation (User 2 should NOT see or access User 1 data)
    reg_user2 = client.post("/auth/register", json={
        "name": "Sarah Miller",
        "email": "sarah@fintrack.io",
        "password": "Password123!",
        "confirm_password": "Password123!"
    })
    user2_token = reg_user2.json()["access_token"]
    user2_headers = {"Authorization": f"Bearer {user2_token}"}

    # User 2 dashboard should be clean 0
    u2_dash = client.get("/dashboard/summary", headers=user2_headers)
    assert u2_dash.json()["total_income"] == 0.0
    assert u2_dash.json()["total_expenses"] == 0.0

    # User 2 accessing User 1's expense ID should return 404
    u2_access_exp = client.get(f"/expenses/{expense_id}", headers=user2_headers)
    assert u2_access_exp.status_code == 404

    # User 2 modifying User 1's income should return 404
    u2_put_inc = client.put(f"/income/{income_id}", json={"amount": 99999.0}, headers=user2_headers)
    assert u2_put_inc.status_code == 404

    # User 2 deleting User 1's investment should return 404
    u2_del_inv = client.delete(f"/investments/{inv_id}", headers=user2_headers)
    assert u2_del_inv.status_code == 404

def test_smtp_otp_auth_workflow():
    # 1. Send OTP for user alex@fintrack.io
    send_resp = client.post("/auth/send-otp", json={"email": "alex@fintrack.io"})
    assert send_resp.status_code == 200
    otp_code = send_resp.json()["demo_otp"]
    assert len(otp_code) == 6

    # 2. Verify with invalid OTP code
    invalid_resp = client.post("/auth/verify-otp", json={"email": "alex@fintrack.io", "otp_code": "000000"})
    assert invalid_resp.status_code == 400

    # 3. Verify with valid OTP code
    verify_resp = client.post("/auth/verify-otp", json={"email": "alex@fintrack.io", "otp_code": otp_code})
    assert verify_resp.status_code == 200
    assert "access_token" in verify_resp.json()
    assert verify_resp.json()["email"] == "alex@fintrack.io"

