"""
tunnel.py — Assistente de Conectividade e Conexões Remotas (Python Engine)
Detecta interfaces de rede, IPs locais/públicos e gera links diretos de acesso com 1 clique para jogadores.
"""

import socket
import urllib.request
import json
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class NetworkStatusResponse(BaseModel):
    local_ip: str
    all_local_ips: List[str]
    public_ip: Optional[str]
    master_url: str
    player_lan_url: str
    player_remote_url: Optional[str]
    session_code: str
    connection_mode: str # "LAN", "Relay", "Direct"
    instructions: List[str]

class GenerateLinkRequest(BaseModel):
    session_code: str
    server_port: int = 5173
    ws_port: int = 3001
    player_name: Optional[str] = None

def get_all_local_ips() -> List[str]:
    ips = set()
    try:
        hostname = socket.gethostname()
        for ip in socket.gethostbyname_ex(hostname)[2]:
            if not ip.startswith("127."):
                ips.add(ip)
    except Exception:
        pass

    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ips.add(s.getsockname()[0])
        s.close()
    except Exception:
        pass

    return sorted(list(ips)) if ips else ["127.0.0.1"]

def get_public_ip() -> Optional[str]:
    try:
        req = urllib.request.Request(
            "https://api.ipify.org?format=json",
            headers={"User-Agent": "VTT-Coalizao/8.0"}
        )
        with urllib.request.urlopen(req, timeout=1.5) as response:
            data = json.loads(response.read().decode("utf-8"))
            return data.get("ip")
    except Exception:
        return None

def get_network_status(session_code: str = "V4QUMN", server_port: int = 5173, ws_port: int = 3001) -> NetworkStatusResponse:
    local_ips = get_all_local_ips()
    primary_ip = local_ips[0] if local_ips else "127.0.0.1"
    pub_ip = get_public_ip()

    master_url = f"http://localhost:{server_port}"
    player_lan_url = f"http://{primary_ip}:{server_port}/#/player?code={session_code}&server=ws://{primary_ip}:{ws_port}"
    player_remote_url = f"http://{pub_ip}:{server_port}/#/player?code={session_code}&server=ws://{pub_ip}:{ws_port}" if pub_ip else None

    instructions = [
        f"1. Para jogar na mesma rede Wi-Fi/LAN: envie o link '{player_lan_url}' para os jogadores.",
        f"2. Os jogadores no celular ou PC podem abrir diretamente o link com o código '{session_code}' pré-preenchido.",
        "3. Para jogar pela Internet: utilize o servidor Relay em nuvem oficial ou envie o link com IP Público.",
    ]

    return NetworkStatusResponse(
        local_ip=primary_ip,
        all_local_ips=local_ips,
        public_ip=pub_ip,
        master_url=master_url,
        player_lan_url=player_lan_url,
        player_remote_url=player_remote_url,
        session_code=session_code,
        connection_mode="LAN / Hybrid",
        instructions=instructions
    )
