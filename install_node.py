import os
import urllib.request
import zipfile
import sys

URL = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-win-x64.zip"
ZIP_FILE = "node-portable.zip"
TARGET_DIR = "node-portable"

def install():
    if os.path.exists(TARGET_DIR):
        print(f"Directory {TARGET_DIR} already exists. Skipping download.")
        return True

    print(f"Downloading Node.js portable from {URL}...")
    try:
        urllib.request.urlretrieve(URL, ZIP_FILE)
        print("Download complete. Extracting files...")
    except Exception as e:
        print(f"Failed to download Node.js: {e}")
        return False

    try:
        with zipfile.ZipFile(ZIP_FILE, 'r') as zip_ref:
            zip_ref.extractall(".")
        
        # Rename the extracted folder (like node-v20.11.0-win-x64) to node-portable
        extracted_dir = [d for d in os.listdir(".") if d.startswith("node-v20") and os.path.isdir(d)][0]
        os.rename(extracted_dir, TARGET_DIR)
        print(f"Successfully extracted and renamed to {TARGET_DIR}.")
    except Exception as e:
        print(f"Failed to extract zip file: {e}")
        return False
    finally:
        if os.path.exists(ZIP_FILE):
            os.remove(ZIP_FILE)
            print("Cleaned up zip file.")

    return True

if __name__ == "__main__":
    success = install()
    sys.exit(0 if success else 1)
