#!/usr/bin/env python3
"""Charge API réelle + 503 isolé (priorité 2).

Démarre deux serveurs uvicorn éphémères :
- mode mock : 24 requêtes concurrentes FR/EN, vérifie statuts et latences ;
- mode réel sans modèle : vérifie qu'une cible ewondo renvoie un 503 isolé
  sans casser /health.

Écrit docs/test-results/api-load-2026-11-10.json.
"""

from __future__ import annotations

import json
import os
import socket
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parent.parent
SERVER = ROOT / "server"
OUTPUT = ROOT / "docs" / "test-results" / "api-load-2026-11-10.json"
RESULTS: dict = {}


def free_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def start_server(port: int, mock: bool) -> subprocess.Popen:
    env = os.environ.copy()
    env["NK_MOCK"] = "1" if mock else "0"
    env["NK_DEVICE"] = "cpu"
    env["PYTHONUNBUFFERED"] = "1"
    process = subprocess.Popen(
        [
            sys.executable,
            "-m",
            "uvicorn",
            "app:app",
            "--host",
            "127.0.0.1",
            "--port",
            str(port),
            "--log-level",
            "warning",
        ],
        cwd=SERVER,
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        text=True,
    )
    deadline = time.time() + 25
    while time.time() < deadline:
        if process.poll() is not None:
            error = process.stderr.read() if process.stderr else ""
            raise RuntimeError(f"serveur arrêté : {error[-1200:]}")
        try:
            response = httpx.get(f"http://127.0.0.1:{port}/health", timeout=1)
            if response.status_code == 200:
                return process
        except Exception:
            time.sleep(0.2)
    process.terminate()
    raise RuntimeError("serveur non prêt après 25 s")


def stop_server(process: subprocess.Popen) -> None:
    process.terminate()
    try:
        process.wait(timeout=8)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=5)


def percentile(values: list[float], ratio: float) -> float:
    ordered = sorted(values)
    index = min(len(ordered) - 1, max(0, round(ratio * (len(ordered) - 1))))
    return round(ordered[index], 2)


def main() -> int:
    mock_port = free_port()
    real_port = free_port()
    mock_server = start_server(mock_port, mock=True)
    real_server = start_server(real_port, mock=False)
    try:
        base = f"http://127.0.0.1:{mock_port}"
        payloads = []
        for index in range(24):
            english = index % 2 == 1
            payloads.append(
                {
                    "source": "en" if english else "fr",
                    "target": "fub",
                    "segments": [
                        {
                            "id": f"q{index}",
                            "text": (
                                f"The customer service number {index} is available."
                                if english
                                else f"Le service client numéro {index} est disponible."
                            ),
                        }
                    ],
                }
            )

        latencies: list[float] = []
        errors: list[str] = []
        statuses: dict[str, int] = {}
        mixed = 0

        def send(payload: dict) -> None:
            started = time.perf_counter()
            try:
                with httpx.Client(timeout=30) as client:
                    response = client.post(f"{base}/translate", json=payload)
                elapsed = (time.perf_counter() - started) * 1000
                latencies.append(round(elapsed, 2))
                statuses[str(response.status_code)] = statuses.get(str(response.status_code), 0) + 1
                if response.status_code != 200:
                    errors.append(f"{payload['source']} {response.status_code} {response.text[:120]}")
                    return
                translation = response.json()["translations"][0]["text"]
                expected = "service client" if payload["source"] == "fr" else "customer service"
                if expected not in translation.lower():
                    nonlocal mixed
                    mixed += 1
            except Exception as error:  # noqa: BLE001
                errors.append(f"{payload['source']} exception {error}")

        started = time.perf_counter()
        with ThreadPoolExecutor(max_workers=12) as pool:
            list(pool.map(send, payloads))
        total_ms = round((time.perf_counter() - started) * 1000, 2)

        assert len(latencies) == 24, f"{len(latencies)} réponses sur 24"
        assert not errors, errors[:3]
        assert statuses == {"200": 24}, statuses
        assert mixed == 0, f"{mixed} réponses mélangées FR/EN"

        RESULTS["load"] = {
            "requests": 24,
            "concurrency": 12,
            "statuses": statuses,
            "mixed": mixed,
            "totalMs": total_ms,
            "p50Ms": percentile(latencies, 0.50),
            "p95Ms": percentile(latencies, 0.95),
            "maxMs": max(latencies),
            "errors": errors,
        }

        # 503 isolé : cible ewondo sans modèle flagship, en mode réel.
        real = f"http://127.0.0.1:{real_port}"
        with httpx.Client(timeout=20) as client:
            first = client.post(
                f"{real}/translate",
                json={
                    "source": "fr",
                    "target": "ewo",
                    "segments": [{"id": "x", "text": "Bonjour, merci."}],
                },
            )
            health = client.get(f"{real}/health")

        assert first.status_code == 503, f"503 attendu, reçu {first.status_code}: {first.text[:200]}"
        assert "ewondo" in first.text.lower(), first.text[:300]
        assert health.status_code == 200, health.status_code
        assert health.json().get("mock") is False, health.json()

        # Isolation : plusieurs 503 puis /health toujours vert.
        def hit_503() -> int:
            with httpx.Client(timeout=20) as client:
                return client.post(
                    f"{real}/translate",
                    json={
                        "source": "fr",
                        "target": "ewo",
                        "segments": [{"id": "x", "text": "Bonjour, merci."}],
                    },
                ).status_code

        with ThreadPoolExecutor(max_workers=6) as pool:
            codes = list(pool.map(lambda _: hit_503(), range(6)))
        with httpx.Client(timeout=10) as client:
            health_after = client.get(f"{real}/health")
        assert codes == [503] * 6, codes
        assert health_after.status_code == 200, health_after.status_code

        RESULTS["isolated503"] = {
            "firstStatus": first.status_code,
            "detail": first.json().get("detail", "")[:200],
            "healthAfter": health_after.status_code,
            "parallel503": codes,
        }
        RESULTS["status"] = "pass"

        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_text(json.dumps(RESULTS, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(RESULTS, ensure_ascii=False, indent=2))
        return 0
    finally:
        stop_server(mock_server)
        stop_server(real_server)


if __name__ == "__main__":
    raise SystemExit(main())
