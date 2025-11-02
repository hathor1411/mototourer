from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

app = FastAPI()

# ✅ CORS aktivieren
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # später kannst du das auf deine Domain beschränken
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/ping")
def ping():
    return {"message": "pong"}
