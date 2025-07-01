"""
Quick data verification script for parkinsons.data
"""
import pandas as pd
import os

def verify_data():
    """Verify the parkinsons.data file is readable and properly formatted."""
    data_file = "parkinsons.data"
    
    if not os.path.exists(data_file):
        print(f"❌ Data file not found: {data_file}")
        return False
    
    try:
        # Load the data
        df = pd.read_csv(data_file)
        
        print("✅ Data file loaded successfully!")
        print(f"📊 Dataset shape: {df.shape}")
        print(f"📋 Columns: {list(df.columns)}")
        print(f"🎯 Target distribution:")
        print(f"   - Healthy (0): {(df['status'] == 0).sum()}")
        print(f"   - Parkinson's (1): {(df['status'] == 1).sum()}")
        
        # Show first few rows
        print("\n📄 First 3 rows:")
        print(df.head(5))
        
        # Check for missing values
        missing = df.isnull().sum().sum()
        print(f"\n🔍 Missing values: {missing}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error loading data: {str(e)}")
        return False

if __name__ == "__main__":
    verify_data()
