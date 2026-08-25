"""
storage.py — Gerenciador de Persistência Atômica e Backups Seguros (Python Engine)
Gravação atômica de arquivos JSON com proteção contra corrupção e criação de backups compactados.
"""

import os
import json
import zipfile
import tempfile
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
INFODATA_DIR = ROOT_DIR / "database" / "infodata"
SAVES_DIR = ROOT_DIR / "database" / "saves"
BACKUPS_DIR = SAVES_DIR / "backups"

ALLOWED_FOLDERS = {
    "personalities", "classes", "effects", "auras", "species", "tendencies",
    "ambients", "biomes", "elements", "locations", "modifications", "sessions",
    "heroes", "npcs", "creatures", "items", "skills"
}

class SaveEntityRequest(BaseModel):
    folder: str
    id: str
    data: Dict[str, Any]

class SaveEntityResponse(BaseModel):
    success: bool
    path: str
    bytes_written: int
    sha256_checksum: str
    message: str

class BackupRequest(BaseModel):
    campaign_name: str = "Campanha_Coalizao"
    include_saves: bool = True

class BackupResponse(BaseModel):
    success: bool
    backup_file: str
    file_size_kb: float
    total_files_archived: int
    created_at: str

def save_entity_atomic(req: SaveEntityRequest) -> SaveEntityResponse:
    folder_clean = req.folder.strip().lower()
    id_clean = req.id.strip().replace("..", "").replace("/", "").replace("\\", "")

    if folder_clean not in ALLOWED_FOLDERS:
        raise ValueError(f"Pasta '{req.folder}' não permitida para gravação canônica.")

    target_dir = INFODATA_DIR / folder_clean
    target_dir.mkdir(parents=True, exist_ok=True)
    target_file = target_dir / f"{id_clean}.json"

    # Serializar JSON formatado
    json_bytes = (json.dumps(req.data, indent=2, ensure_ascii=False) + "\n").encode("utf-8")
    checksum = hashlib.sha256(json_bytes).hexdigest()

    # Gravação atômica segura via arquivo temporário
    temp_fd, temp_path = tempfile.mkstemp(dir=str(target_dir), prefix=f"{id_clean}_temp_", suffix=".tmp")
    try:
        with os.fdopen(temp_fd, "wb") as f:
            f.write(json_bytes)
            f.flush()
            os.fsync(f.fileno())

        # Substituição atômica no nível do sistema operacional
        os.replace(temp_path, str(target_file))
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise RuntimeError(f"Falha na gravação atômica do arquivo: {str(e)}")

    return SaveEntityResponse(
        success=True,
        path=str(target_file.relative_to(ROOT_DIR)),
        bytes_written=len(json_bytes),
        sha256_checksum=checksum,
        message=f"Entidade '{folder_clean}/{id_clean}' salva com gravação atômica segura."
    )

def create_campaign_backup(req: BackupRequest) -> BackupResponse:
    BACKUPS_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    clean_name = req.campaign_name.replace(" ", "_").replace("/", "")
    backup_filename = f"{clean_name}_{timestamp}.vttpack"
    backup_path = BACKUPS_DIR / backup_filename

    files_count = 0

    with zipfile.ZipFile(backup_path, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        # Arquivar infodata
        if INFODATA_DIR.exists():
            for root, _, files in os.walk(INFODATA_DIR):
                for file in files:
                    full_path = Path(root) / file
                    rel_archive_path = Path("infodata") / full_path.relative_to(INFODATA_DIR)
                    zf.write(full_path, str(rel_archive_path))
                    files_count += 1

        # Arquivar saves se solicitado
        if req.include_saves and SAVES_DIR.exists():
            for root, _, files in os.walk(SAVES_DIR):
                if "backups" in root:
                    continue
                for file in files:
                    full_path = Path(root) / file
                    rel_archive_path = Path("saves") / full_path.relative_to(SAVES_DIR)
                    zf.write(full_path, str(rel_archive_path))
                    files_count += 1

    file_size_kb = round(os.path.getsize(backup_path) / 1024, 2)

    return BackupResponse(
        success=True,
        backup_file=str(backup_path.relative_to(ROOT_DIR)),
        file_size_kb=file_size_kb,
        total_files_archived=files_count,
        created_at=datetime.now().isoformat()
    )

def list_backups() -> List[Dict[str, Any]]:
    if not BACKUPS_DIR.exists():
        return []

    backups = []
    for f in sorted(BACKUPS_DIR.glob("*.vttpack"), key=os.path.getmtime, reverse=True):
        stat = f.stat()
        backups.append({
            "filename": f.name,
            "path": str(f.relative_to(ROOT_DIR)),
            "size_kb": round(stat.st_size / 1024, 2),
            "modified_at": datetime.fromtimestamp(stat.st_mtime).strftime("%d/%m/%Y %H:%M:%S")
        })
    return backups
