import tempfile
import os
import csv
from datetime import datetime
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, UVHistory
from scripts.downloader import download_and_extract


def wrangle_uv_history(base_dir: str):
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    db.query(UVHistory).delete()
    db.commit()
    
    if not os.path.exists(base_dir):
        print(f"Data directory {base_dir} not found. Skipping wrangling.")
        return

    regions = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"]
    
    total_records = 0
    
    for region in regions:
        region_dir = os.path.join(base_dir, "uv_history", region)
        if not os.path.exists(region_dir):
            print(f"Directory for region {region} not found in {region_dir}. Skipping.")
            continue
            
        print(f"Processing region: {region}")
        monthly_data = {}  # (year, month): list_of_uv_values

        for filename in os.listdir(region_dir):
            if filename.endswith(".csv"):
                filepath = os.path.join(region_dir, filename)
                print(f"  Reading {filename}...")
                
                with open(filepath, 'r', encoding="utf-8-sig") as f:
                    reader = csv.reader(f)
                    header = next(reader, None)
                    if not header:
                        continue
                    
                    try:
                        if '2016' in filepath:
                            time_idx = header.index("timestamp") # 2016 historical files has 'timestamp' as the column header
                        else:
                            time_idx = header.index("Date-Time") # 2017 onwards has 'Date-time' as the column header
                        uv_idx = header.index("UV_Index")
                    except ValueError:
                        print(f"  Warning: Expected columns 'timestamp' and 'UV_Index' not found in {filename}. Skipping.")
                        continue
                    
                    for row in reader:
                        if len(row) <= max(time_idx, uv_idx):
                            continue
                            
                        timestamp_str = row[time_idx]
                        uv_val_str = row[uv_idx]
                        
                        try:
                            # Format: '2016-01-01 00:04:00'
                            dt = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
                            uv_val = float(uv_val_str)
                            
                            if uv_val < 0:
                                continue # Filter bad values if any

                            key = (dt.year, dt.month)
                            if key not in monthly_data:
                                monthly_data[key] = []
                            monthly_data[key].append(uv_val)
                            
                        except ValueError:
                            # Skip rows with parsing errors
                            pass
                            
        # Aggregate and insert
        for (year, month), uv_values in monthly_data.items():
            if uv_values:
                max_uv = max(uv_values)
                record = UVHistory(
                    region=region,
                    year=year,
                    month=month,
                    uv_index=max_uv
                )
                db.add(record)
                total_records += 1

    print(f"Committing {total_records} aggregated records to database...")
    db.commit()
    db.close()
    print("Done wrangling UV history.")
