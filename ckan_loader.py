"""
CKAN API Loader for Contract Intelligence Platform
Loads last 10 years of procurement data from Open Canada API
Dataset: https://open.canada.ca/data/en/dataset/d8f85d91-7dec-4fd1-8055-483b77225d8b
"""
import requests
import json
import time
from datetime import datetime

RESOURCE_ID = "fac950c0-00d5-4ec1-a4d3-9cbebf98a305"
API_URL = "https://open.canada.ca/data/en/api/3/action/datastore_search"
BATCH_SIZE = 5000
YEAR_START = datetime.now().year - 10
YEAR_END = datetime.now().year

def fetch_contracts():
    """Fetch contracts from CKAN API for last 10 years"""
    all_records = []
    offset = 0
    total = None
    
    print(f"Fetching contracts from {YEAR_START} to {YEAR_END}...")
    
    while True:
        params = {
            "resource_id": RESOURCE_ID,
            "limit": BATCH_SIZE,
            "offset": offset,
        }
        
        try:
            response = requests.get(API_URL, params=params, timeout=60)
            response.raise_for_status()
            data = response.json()
            
            if not data.get("success"):
                print(f"API error: {data}")
                break
                
            result = data["result"]
            records = result["records"]
            
            if total is None:
                total = result["total"]
                print(f"Total records available: {total:,}")
            
            if not records:
                break
            
            # Filter by year
            for record in records:
                contract_date = record.get("contract_date", "")
                if contract_date:
                    try:
                        year = int(contract_date[:4])
                        if YEAR_START <= year <= YEAR_END:
                            all_records.append(record)
                    except (ValueError, IndexError):
                        pass
            
            offset += len(records)
            print(f"Progress: {offset:,}/{total:,} fetched, {len(all_records):,} filtered")
            
            if offset >= total:
                break
                
            time.sleep(0.1)  # Rate limiting
            
        except Exception as e:
            print(f"Error fetching data: {e}")
            time.sleep(2)
            continue
    
    return all_records

def save_to_json(records, filename="contracts_data.json"):
    """Save records to JSON file"""
    with open(filename, "w") as f:
        json.dump(records, f, indent=2)
    print(f"Saved {len(records):,} records to {filename}")

if __name__ == "__main__":
    print("=" * 60)
    print("Contract Intelligence - CKAN Data Loader")
    print("=" * 60)
    
    records = fetch_contracts()
    
    if records:
        save_to_json(records)
        print(f"\n✅ Successfully loaded {len(records):,} contracts")
        
        # Show sample
        if records:
            print("\nSample record fields:")
            print(json.dumps(list(records[0].keys()), indent=2))
    else:
        print("\n❌ No records loaded")
