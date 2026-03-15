import tempfile

from scripts.downloader import download_and_extract
from scripts.uv_index_wrangler import wrangle_uv_history
from scripts.cancer_incident_wrangler import wrangle_cancer_incident_history


if __name__ == "__main__":
    tmp_dir = tempfile.mkdtemp()
    download_and_extract(extract_to=tmp_dir)
    wrangle_uv_history(base_dir=tmp_dir)
    wrangle_cancer_incident_history(base_dir=tmp_dir)