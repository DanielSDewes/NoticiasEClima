from fastapi import FastAPI, HTTPException, Depends, status, Query
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from passlib.context import CryptContext
from typing import Optional
import jwt
import time
import httpx
import databases
import sqlalchemy
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os

load_dotenv()  # Carrega variáveis do .env

DATABASE_URL = "sqlite:///./users.db"
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_SECONDS = 3600
NEWSAPI_API_KEY = os.getenv("NEWSAPI_API_KEY")
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")

database = databases.Database(DATABASE_URL)
metadata = sqlalchemy.MetaData()

users = sqlalchemy.Table(
    "users",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("username", sqlalchemy.String, unique=True),
    sqlalchemy.Column("hashed_password", sqlalchemy.String),
)

engine = sqlalchemy.create_engine(DATABASE_URL)
metadata.create_all(engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserCreate(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str

class Token(BaseModel):
    access_token: str
    token_type: str

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_jwt_token(data: dict):
    to_encode = data.copy()
    to_encode.update({"exp": time.time() + JWT_EXPIRATION_SECONDS})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def decode_jwt_token(token: str):
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if decoded["exp"] < time.time():
            return None
        return decoded
    except Exception:
        return None

async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_jwt_token(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido ou expirado")
    user = await database.fetch_one(query=users.select().where(users.c.username == payload.get("sub")))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário não encontrado")
    return user

@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.connect()
    yield
    await database.disconnect()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # domínio do seu frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/register", response_model=UserOut)
async def register(user: UserCreate):
    existing_user = await database.fetch_one(query=users.select().where(users.c.username == user.username))
    if existing_user:
        raise HTTPException(status_code=400, detail="Usuário já existe")

    hashed_pw = hash_password(user.password)
    query = users.insert().values(username=user.username, hashed_password=hashed_pw)
    user_id = await database.execute(query)
    return {"id": user_id, "username": user.username}

@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await database.fetch_one(query=users.select().where(users.c.username == form_data.username))
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Usuário ou senha incorretos")

    token = create_jwt_token({"sub": user["username"]})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/market-data")
async def get_market_data(
    q: Optional[str] = Query("finance", min_length=1),
    current_user: dict = Depends(get_current_user)
):
    query = q or "finance"
    url = (
        "https://newsapi.org/v2/everything?"
        f"q={query}&"
        "language=pt&"
        "pageSize=8&"
        "apiKey=" + NEWSAPI_API_KEY
    )
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail="Erro ao consultar NewsAPI")
        data = resp.json()
    return {"data": data.get("articles", [])}

@app.get("/weather")
async def get_weather(
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    if lat is None or lon is None:
        lat = -23.55
        lon = -46.63

    url = f"https://api.weatherapi.com/v1/current.json?key={WEATHER_API_KEY}&q={lat},{lon}&lang=pt"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail="Erro ao consultar WeatherAPI")
        return resp.json()

from fastapi.staticfiles import StaticFiles
app.mount("/static", StaticFiles(directory="static"), name="static")
