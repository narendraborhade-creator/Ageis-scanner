"""
FastAPI Server for Aegis Python Cybersecurity AI Bot.
Provides high-performance local cybersecurity analysis, terminology queries,
and exploit payload inspection.
"""

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from .knowledge_base import CYBER_TERMS, get_all_terms_summary
from .payload_analyzer import inspect_cyber_payload
from .cyber_engine import generate_cyber_response

app = FastAPI(
    title="Aegis Python Cyber AI Bot",
    description="Specialized Cybersecurity and Threat Analysis Intelligence Engine",
    version="1.0.0"
)

# Enable CORS for local Vite development and node server proxying
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    persona_id: Optional[str] = "cyber-sentinel"
    system_instruction: Optional[str] = None
    model: Optional[str] = None

class PayloadAnalysisRequest(BaseModel):
    payload: str

@app.get("/")
@app.get("/health")
def health_check():
    return {
        "status": "online",
        "engine": "Aegis Specialized Python CyberBot Engine",
        "version": "1.0.0",
        "indexed_terms_count": len(CYBER_TERMS),
        "capabilities": [
            "MITRE ATT&CK Mapping",
            "Zero Trust & NIST Standards",
            "Payload & Exploit Heuristic Inspection",
            "Shannon Entropy & Deobfuscation",
            "CWE & OWASP Top 10 Classification",
            "High-Assurance Remediation Blueprints"
        ]
    }

@app.post("/chat")
def chat_endpoint(req: ChatRequest):
    try:
        messages_dict = [{"role": m.role, "content": m.content} for m in req.messages]
        result = generate_cyber_response(
            messages=messages_dict,
            persona_id=req.persona_id or "cyber-sentinel",
            system_instruction=req.system_instruction
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze")
def analyze_payload_endpoint(req: PayloadAnalysisRequest):
    try:
        result = inspect_cyber_payload(req.payload)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/terms")
def list_terms():
    return {
        "count": len(CYBER_TERMS),
        "terms": get_all_terms_summary()
    }

@app.get("/term/{term_key}")
def get_term_detail(term_key: str):
    key = term_key.lower().strip()
    if key in CYBER_TERMS:
        entry = dict(CYBER_TERMS[key])
        entry["key"] = key
        return entry
    raise HTTPException(status_code=404, detail=f"Cyber term '{term_key}' not found in local index.")

if __name__ == "__main__":
    uvicorn.run("python_backend.main:app", host="127.0.0.1", port=5005, log_level="info")
