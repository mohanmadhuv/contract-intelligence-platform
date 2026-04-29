#!/usr/bin/env python3
"""
Test script to verify backend configuration for Render deployment.
Tests imports and basic functionality without requiring database connection.
"""

print("=" * 60)
print("Backend Configuration Test")
print("=" * 60)

# Test 1: Import dependencies
print("\n[1/5] Testing imports...")
try:
    import fastapi
    import uvicorn
    import pydantic
    print("  ✓ FastAPI dependencies OK")
except ImportError as e:
    print(f"  ✗ FastAPI dependencies missing: {e}")
    exit(1)

try:
    import psycopg2
    print("  ✓ PostgreSQL driver (psycopg2) OK")
except ImportError:
    print("  ⚠ psycopg2 not installed (run: pip install psycopg2-binary)")

try:
    import boto3
    print("  ✓ AWS SDK (boto3) OK")
except ImportError:
    print("  ⚠ boto3 not installed (run: pip install boto3)")

try:
    import requests
    print("  ✓ Requests library OK")
except ImportError:
    print("  ⚠ requests not installed (run: pip install requests)")

# Test 2: Import backend modules
print("\n[2/5] Testing backend modules...")
try:
    import sys
    sys.path.insert(0, '/home/participant/contract-intelligence-platform/backend')
    
    # Test db module (without connecting)
    import db
    print("  ✓ db.py imports successfully")
    
    # Test queries module
    import queries
    print("  ✓ queries.py imports successfully")
    
    # Test chat module
    import chat
    print("  ✓ chat.py imports successfully")
    
    # Test main module
    import main
    print("  ✓ main.py imports successfully")
    
except Exception as e:
    print(f"  ✗ Module import error: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

# Test 3: Check environment variables
print("\n[3/5] Checking environment variables...")
import os

database_url = os.getenv("DATABASE_URL")
aws_region = os.getenv("AWS_REGION", "us-west-2")
bedrock_key = os.getenv("BEDROCK_API_KEY")

if database_url:
    print(f"  ✓ DATABASE_URL is set")
else:
    print(f"  ⚠ DATABASE_URL not set (required for production)")

print(f"  ✓ AWS_REGION: {aws_region}")

if bedrock_key:
    print(f"  ✓ BEDROCK_API_KEY is set")
else:
    print(f"  ⚠ BEDROCK_API_KEY not set (required for AI chat)")

# Test 4: Verify SQL syntax helpers
print("\n[4/5] Testing query helpers...")
try:
    from queries import _yf, EOC_LABELS, COMMODITY_LABELS
    
    # Test year filter
    year_filter = _yf(2020, 2024)
    assert "EXTRACT(YEAR FROM contract_date::date)" in year_filter
    assert "BETWEEN 2020 AND 2024" in year_filter
    print("  ✓ Year filter generates correct PostgreSQL syntax")
    
    # Test labels
    assert len(EOC_LABELS) > 0
    assert len(COMMODITY_LABELS) > 0
    print(f"  ✓ EOC labels: {len(EOC_LABELS)} codes")
    print(f"  ✓ Commodity labels: {len(COMMODITY_LABELS)} types")
    
except Exception as e:
    print(f"  ✗ Query helper error: {e}")

# Test 5: Verify API endpoints
print("\n[5/5] Checking API endpoints...")
try:
    from main import app
    
    routes = [route.path for route in app.routes if hasattr(route, 'path')]
    api_routes = [r for r in routes if r.startswith('/api/')]
    
    print(f"  ✓ Total routes: {len(routes)}")
    print(f"  ✓ API routes: {len(api_routes)}")
    
    expected_routes = [
        '/api/overview',
        '/api/what-is-bought',
        '/api/spend-trend',
        '/api/topline-trend',
        '/api/category-summaries',
        '/api/chat',
    ]
    
    for route in expected_routes:
        if route in api_routes:
            print(f"    ✓ {route}")
        else:
            print(f"    ✗ {route} missing")
    
except Exception as e:
    print(f"  ✗ API endpoint check error: {e}")

print("\n" + "=" * 60)
print("Configuration Test Complete")
print("=" * 60)
print("\nNext steps:")
print("1. Install missing dependencies: pip install -r requirements.txt")
print("2. Set environment variables in Render dashboard")
print("3. Deploy backend service")
print("4. Run load_data.py to populate database")
print("=" * 60)
