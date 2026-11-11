"""
Fast parallel shard downloader for ASL Citizen dataset.
Uses ThreadPoolExecutor to download multiple shards simultaneously.
Run BEFORE train_asl_citizen.py, or let train_asl_citizen.py call this.
"""
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from huggingface_hub import hf_hub_download, list_repo_files

HF_REPO_ID = "SharoonArshad/asl-citizen-processed-200"
LOCAL_DIR  = os.path.join(os.path.dirname(__file__), "data_asl_citizen")
SHARD_DIR  = os.path.join(LOCAL_DIR, "shards")
META_DIR   = os.path.join(LOCAL_DIR, "metadata")
MAX_WORKERS = 8   # parallel downloads

def download_one(fname: str, token: str) -> str:
    dest_dir  = SHARD_DIR if fname.startswith("shards/") else META_DIR
    dest_file = os.path.join(dest_dir, os.path.basename(fname))
    if os.path.exists(dest_file):
        return f"[skip] {fname}"
    hf_hub_download(
        repo_id=HF_REPO_ID,
        filename=fname,
        repo_type="dataset",
        local_dir=LOCAL_DIR,
        token=token,
    )
    return f"[done] {fname}"

def download_all(token: str):
    os.makedirs(SHARD_DIR, exist_ok=True)
    os.makedirs(META_DIR,  exist_ok=True)

    all_files = list(list_repo_files(HF_REPO_ID, repo_type="dataset", token=token))
    targets   = [f for f in all_files if f.startswith("shards/") or f.startswith("metadata/")]
    pending   = [f for f in targets
                 if not os.path.exists(os.path.join(
                     SHARD_DIR if f.startswith("shards/") else META_DIR,
                     os.path.basename(f)))]

    print(f"[Download] {len(targets)} total files | {len(pending)} to download | {MAX_WORKERS} workers")

    if not pending:
        print("[Download] ✅ All shards already cached.")
        return

    done = 0
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = {pool.submit(download_one, f, token): f for f in pending}
        for fut in as_completed(futures):
            done += 1
            try:
                msg = fut.result()
                print(f"  ({done}/{len(pending)}) {msg}")
            except Exception as e:
                print(f"  ({done}/{len(pending)}) ERROR {futures[fut]}: {e}")

    print("[Download] ✅ All done.")

if __name__ == "__main__":
    tok = os.environ.get("HF_TOKEN") or (sys.argv[1] if len(sys.argv) > 1 else None)
    if not tok:
        print("Usage: python fast_download.py <HF_TOKEN>")
        sys.exit(1)
    download_all(tok)
