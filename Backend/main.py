from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.database import engine, Base
from routes import auth_router, project_router

app = FastAPI(title="Darukaa Earth API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://darukaa-earth-beige.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",   # 🔥 ADD THIS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Automatically create tables on startup (For Dev only)
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


app.include_router(auth_router)
app.include_router(project_router)