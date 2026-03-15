import os
import zipfile
import tempfile
import requests
from dotenv import load_dotenv

load_dotenv()


def download_and_extract(extract_to: str):
    url = os.environ.get("UV_DATA_URL")
    if not url:
        raise EnvironmentError("UV_DATA_URL environment variable is not set.")

    print("Downloading UV history data...")
    response = requests.get(url, stream=True)
    response.raise_for_status()

    with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as tmp_file:
        for chunk in response.iter_content(chunk_size=8192):
            tmp_file.write(chunk)
        tmp_path = tmp_file.name

    print(f"Extracting to {extract_to}...")
    with zipfile.ZipFile(tmp_path, 'r') as zip_ref:
        zip_ref.extractall(extract_to)

    os.unlink(tmp_path)
    print("Download and extraction complete.")
