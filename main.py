import os
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware
import requests
import psutil

load_dotenv()

import models
import schemas
import auth
from database import engine, Base, get_db
import ai_service

# Inicializa as tabelas no banco de dados SQLite
Base.metadata.create_all(bind=engine)

# Auto-migração para garantir que todas as colunas existam no SQLite
def migrate_sqlite_schema():
    import sqlite3
    try:
        conn = sqlite3.connect("hub_pessoal.db")
        cursor = conn.cursor()
        tables = [r[0] for r in cursor.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
        
        # Garante adição da coluna user_id nas tabelas de dados
        for tbl in ["movies", "games", "exercises", "meals"]:
            if tbl in tables:
                cols = [r[1] for r in cursor.execute(f"PRAGMA table_info({tbl})").fetchall()]
                if "user_id" not in cols:
                    print(f"Migração SQLite: adicionando coluna 'user_id' em '{tbl}'...")
                    cursor.execute(f"ALTER TABLE {tbl} ADD COLUMN user_id INTEGER REFERENCES users(id)")

        if "movies" in tables:
            cols = [r[1] for r in cursor.execute("PRAGMA table_info(movies)").fetchall()]
            missing = {
                "poster": "TEXT",
                "year": "TEXT",
                "runtime": "TEXT",
                "genre": "TEXT",
                "imdb_rating": "TEXT",
                "user_rating": "REAL DEFAULT 9.0",
                "user_review": "TEXT",
                "status": "TEXT DEFAULT 'ASSISTINDO'",
                "priority_level": "TEXT DEFAULT 'P1'",
                "video_quality": "TEXT DEFAULT '4K'",
                "imdb_id": "TEXT",
                "media_type": "TEXT DEFAULT 'movie'",
                "plot_score": "REAL DEFAULT 8.5",
                "cinematography_score": "REAL DEFAULT 9.0",
                "sound_score": "REAL DEFAULT 8.0",
                "pacing_score": "REAL DEFAULT 8.0",
                "cognitive_score": "REAL DEFAULT 9.2",
                "originality_score": "REAL DEFAULT 8.8",
            }
            for name, dtype in missing.items():
                if name not in cols:
                    print(f"Migração SQLite: adicionando coluna '{name}'...")
                    cursor.execute(f"ALTER TABLE movies ADD COLUMN {name} {dtype}")
        conn.commit()
        conn.close()
    except Exception as err:
        print(f"Aviso migração SQLite: {err}")

migrate_sqlite_schema()

app = FastAPI(
    title="FORGE HUB API",
    description="Backend FastAPI para gerenciamento de treinos, nutrição, games e comandos IA",
    version="2.5.0"
)

# Configuração de CORS completa
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Chaves de API externas mantidas intactas
STEAM_API_KEY = "81D3466A1E23BC2AB4B4DA1DAF5DA4B1"
STEAM_USER_ID = "76561198450529846"

TWITCH_CLIENT_ID = os.getenv("TWITCH_CLIENT_ID", "")
TWITCH_CLIENT_SECRET = os.getenv("TWITCH_CLIENT_SECRET", "")

twitch_token_cache = {"token": None}

def get_igdb_token():
    if twitch_token_cache["token"]:
        return twitch_token_cache["token"]
    try:
        url = f"https://id.twitch.tv/oauth2/token?client_id={TWITCH_CLIENT_ID}&client_secret={TWITCH_CLIENT_SECRET}&grant_type=client_credentials"
        res = requests.post(url, timeout=5).json()
        twitch_token_cache["token"] = res.get("access_token")
        return twitch_token_cache["token"]
    except Exception as e:
        print(f"Erro ao obter token IGDB: {e}")
        return None

# ── ROOT ──────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "FORGE HUB API v2.5 Online"}

# ── AUTH ENDPOINTS ────────────────────────────────────────────────
@app.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(
        (models.User.username == user_in.username) | (models.User.email == user_in.email)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Operador ou E-mail já cadastrado no sistema."
        )
    
    hashed_pwd = auth.get_password_hash(user_in.password)
    db_user = models.User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_pwd
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/token", response_model=schemas.Token)
def login_for_access_token(
    user_in: schemas.UserLogin,
    db: Session = Depends(get_db)
):
    username = user_in.username
    password = user_in.password

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Identificador e Chave de Acesso são obrigatórios."
        )

    user = db.query(models.User).filter(
        (models.User.username == username) | (models.User.email == username)
    ).first()

    if not user or not auth.verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identificador ou Chave de Acesso incorretos.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = auth.create_access_token(data={"sub": user.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@app.get("/users/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

# ── EXERCISES ENDPOINTS ───────────────────────────────────────────
@app.get("/exercises/", response_model=List[schemas.ExerciseResponse])
def get_exercises(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.Exercise).filter(
        (models.Exercise.user_id == current_user.id) | (models.Exercise.user_id == None)
    ).order_by(models.Exercise.id.desc()).all()

@app.post("/exercises/", response_model=schemas.ExerciseResponse, status_code=status.HTTP_201_CREATED)
def create_exercise(
    exercise: schemas.ExerciseCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    data = exercise.model_dump()
    data["user_id"] = current_user.id
    db_exercise = models.Exercise(**data)
    db.add(db_exercise)
    db.commit()
    db.refresh(db_exercise)
    return db_exercise

@app.delete("/exercises/{exercise_id}")
def delete_exercise(
    exercise_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    db_exercise = db.query(models.Exercise).filter(models.Exercise.id == exercise_id).first()
    if not db_exercise:
        raise HTTPException(status_code=404, detail="Exercício não encontrado")
    if db_exercise.user_id is not None and db_exercise.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    db.delete(db_exercise)
    db.commit()
    return {"message": "Exercício removido com sucesso"}

# ── MEALS ENDPOINTS ───────────────────────────────────────────────
@app.get("/meals/", response_model=List[schemas.MealResponse])
def get_meals(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.Meal).filter(
        (models.Meal.user_id == current_user.id) | (models.Meal.user_id == None)
    ).order_by(models.Meal.id.desc()).all()

@app.post("/meals/", response_model=schemas.MealResponse, status_code=status.HTTP_201_CREATED)
def create_meal(
    meal: schemas.MealCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    data = meal.model_dump()
    data["user_id"] = current_user.id
    db_meal = models.Meal(**data)
    db.add(db_meal)
    db.commit()
    db.refresh(db_meal)
    return db_meal

@app.delete("/meals/{meal_id}")
def delete_meal(
    meal_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    db_meal = db.query(models.Meal).filter(models.Meal.id == meal_id).first()
    if not db_meal:
        raise HTTPException(status_code=404, detail="Refeição não encontrada")
    if db_meal.user_id is not None and db_meal.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    db.delete(db_meal)
    db.commit()
    return {"message": "Refeição removida com sucesso"}

# ── GAMES ENDPOINTS ───────────────────────────────────────────────
@app.get("/games/", response_model=List[schemas.GameResponse])
def get_games(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.Game).filter(
        (models.Game.user_id == current_user.id) | (models.Game.user_id == None)
    ).order_by(models.Game.id.desc()).all()

@app.post("/games/", response_model=schemas.GameResponse, status_code=status.HTTP_201_CREATED)
def create_game(
    game: schemas.GameCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    data = game.model_dump()
    data["user_id"] = current_user.id
    db_game = models.Game(**data)
    db.add(db_game)
    db.commit()
    db.refresh(db_game)
    return db_game

@app.delete("/games/{game_id}")
def delete_game(
    game_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    db_game = db.query(models.Game).filter(models.Game.id == game_id).first()
    if not db_game:
        raise HTTPException(status_code=404, detail="Jogo não encontrado")
    if db_game.user_id is not None and db_game.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    db.delete(db_game)
    db.commit()
    return {"message": "Jogo removido com sucesso"}

@app.get("/games/search-igdb")
def search_igdb_games(query: str, current_user: models.User = Depends(auth.get_current_user)):
    if len(query) < 2:
        return []
    token = get_igdb_token()
    if not token:
        return []
    
    headers = {
        "Client-ID": TWITCH_CLIENT_ID,
        "Authorization": f"Bearer {token}"
    }
    
    body = f'search "{query}"; fields name, cover.image_id, external_games.uid, external_games.category; limit 5;'
    try:
        res = requests.post("https://api.igdb.com/v4/games", headers=headers, data=body, timeout=5)
        if res.status_code != 200:
            return []
            
        games_data = res.json()
        results = []
        
        for g in games_data:
            cover_id = g.get("cover", {}).get("image_id")
            cover_url = f"https://images.igdb.com/igdb/image/upload/t_cover_big/{cover_id}.jpg" if cover_id else ""
            steam_id = None
            
            for ext in g.get("external_games", []):
                if ext.get("category") == 1:
                    try:
                        steam_id = int(ext.get("uid"))
                        break
                    except:
                        pass
            
            if not steam_id:
                try:
                    steam_search_url = f"https://store.steampowered.com/api/storesearch/?term={requests.utils.quote(g.get('name'))}&l=english&cc=US"
                    steam_res = requests.get(steam_search_url, timeout=3).json()
                    items = steam_res.get("items", [])
                    if items:
                        steam_id = items[0].get("id")
                except Exception as e:
                    print(f"Fallback Steam error: {e}")
            
            results.append({
                "title": g.get("name"),
                "cover_image": cover_url,
                "steam_app_id": steam_id
            })
            
        return results
    except Exception as e:
        print(f"Erro na busca IGDB: {e}")
        return []

@app.post("/games/sync-steam/{game_id}")
def sync_steam_game(
    game_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    game = db.query(models.Game).filter(models.Game.id == game_id).first()
    if not game or not game.steam_app_id:
        raise HTTPException(status_code=400, detail="Jogo sem vínculo Steam App ID")
        
    try:
        url = f"http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key={STEAM_API_KEY}&steamid={STEAM_USER_ID}&format=json"
        res = requests.get(url, timeout=5).json()
        games = res.get("response", {}).get("games", [])
        
        steam_game = next((g for g in games if g.get("appid") == game.steam_app_id), None)
        if steam_game:
            hours = round(steam_game.get("playtime_forever", 0) / 60, 1)
            game.hours_played = hours
            db.commit()
            db.refresh(game)
            return {"message": "Sincronizado com sucesso!", "hours_played": hours}
        else:
            return {"message": "Jogo não encontrado na biblioteca pública Steam."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao comunicar com a Steam: {str(e)}")

@app.get("/games/{game_id}/achievements")
def get_game_achievements(
    game_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    game = db.query(models.Game).filter(models.Game.id == game_id).first()
    if not game or not game.steam_app_id:
        return []
        
    try:
        schema_url = f"https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key={STEAM_API_KEY}&appid={game.steam_app_id}&l=brazilian"
        schema_res = requests.get(schema_url, timeout=5).json()
        schema_achievements = schema_res.get("game", {}).get("availableGameStats", {}).get("achievements", [])
        
        player_url = f"https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key={STEAM_API_KEY}&steamid={STEAM_USER_ID}&appid={game.steam_app_id}&l=brazilian"
        player_res = requests.get(player_url, timeout=5).json()
        player_achievements = player_res.get("playerstats", {}).get("achievements", [])
        
        player_ach_map = {a.get("apiname"): a.get("achieved") == 1 for a in player_achievements}
        
        if not schema_achievements and not player_achievements:
            return []

        result = []
        for sch in schema_achievements:
            apiname = sch.get("name")
            is_achieved = player_ach_map.get(apiname, False)
            icon = sch.get("icon") if is_achieved else sch.get("icongray", sch.get("icon"))
            
            result.append({
                "name": sch.get("displayName", apiname),
                "description": sch.get("description", "Desafio de conquista Steam"),
                "icon": icon,
                "achieved": is_achieved,
            })
            
        return result
    except Exception as e:
        print(f"Erro ao buscar conquistas na Steam API: {e}")
        return []

@app.get("/games/check-process")
def check_game_process(title: str = "", current_user: models.User = Depends(auth.get_current_user)):
    if not title:
        return {"is_running": True}
        
    try:
        search_terms = []
        clean_title = title.lower().replace(" ", "").replace(":", "").replace("-", "")
        search_terms.append(clean_title)
        
        for word in title.lower().split():
            if len(word) > 2 and word not in ["the", "and", "of", "for", "game"]:
                search_terms.append(word)

        is_running = False
        running_proc_name = ""

        for proc in psutil.process_iter(['name']):
            try:
                pname = proc.info.get('name')
                if not pname:
                    continue
                pname_lower = pname.lower()
                
                if any(ignored in pname_lower for ignored in ["chrome.exe", "msedge.exe", "firefox.exe", "python.exe", "node.exe", "code.exe"]):
                    continue

                if any(term in pname_lower for term in search_terms):
                    is_running = True
                    running_proc_name = pname
                    break
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue

        return {
            "is_running": is_running,
            "title": title,
            "process_name": running_proc_name
        }
    except Exception as e:
        print(f"Erro ao verificar processo psutil: {e}")
        return {"is_running": True, "error": str(e)}

OMDB_ENV_KEY = os.getenv("OMDB_API_KEY", "fc1855dc")
OMDB_API_KEYS = [OMDB_ENV_KEY, "trilogy"]

def fetch_omdb_api(params: dict):
    for key in OMDB_API_KEYS:
        p = {**params, "apikey": key}
        try:
            res = requests.get("https://www.omdbapi.com/", params=p, timeout=5).json()
            if res.get("Response") == "True" or "Search" in res or "Title" in res:
                if res.get("Error") != "Invalid API key!":
                    return res
        except Exception as err:
            print(f"Tentativa OMDb key '{key}' falhou: {err}")
    return {"Search": [], "Response": "False", "Error": "Nenhum resultado retornado da OMDb API"}

# ── MOVIE ENDPOINTS (CINE-BIO) ────────────────────────────────────
@app.get("/movies/", response_model=List[schemas.MovieResponse])
def get_movies(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.Movie).filter(
        (models.Movie.user_id == current_user.id) | (models.Movie.user_id == None)
    ).order_by(models.Movie.id.desc()).all()

@app.post("/movies/", response_model=schemas.MovieResponse)
def create_movie(
    movie: schemas.MovieCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    data = movie.model_dump()
    data["user_id"] = current_user.id
    db_movie = models.Movie(**data)
    db.add(db_movie)
    db.commit()
    db.refresh(db_movie)
    return db_movie

@app.delete("/movies/{movie_id}")
def delete_movie(
    movie_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    movie = db.query(models.Movie).filter(models.Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Filme não encontrado")
    if movie.user_id is not None and movie.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    db.delete(movie)
    db.commit()
    return {"message": "Filme deletado com sucesso"}

@app.get("/movies/search")
def search_omdb_movies(query: str, current_user: models.User = Depends(auth.get_current_user)):
    if not query or not query.strip():
        return {"Search": [], "Response": "False"}
    return fetch_omdb_api({"s": query.strip()})

@app.get("/movies/omdb-detail/{imdb_id}")
def get_omdb_movie_detail(imdb_id: str, current_user: models.User = Depends(auth.get_current_user)):
    if not imdb_id or not imdb_id.strip():
        return {"Response": "False", "Error": "IMDb ID inválido"}
    return fetch_omdb_api({"i": imdb_id.strip()})

# ── AI ENDPOINTS ──────────────────────────────────────────────────
@app.post("/ai/generate", response_model=schemas.AIResponse)
@app.post("/ai/analyze", response_model=schemas.AIResponse)
def generate_ai(
    request: schemas.AIPromptRequest,
    current_user: models.User = Depends(auth.get_current_user)
):
    try:
        res = ai_service.generate_ai_response(request.prompt)
        return {"response": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/analyze-workouts", response_model=schemas.AIResponse)
def analyze_workouts(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    exercises = db.query(models.Exercise).filter(
        (models.Exercise.user_id == current_user.id) | (models.Exercise.user_id == None)
    ).all()
    if not exercises:
        return {"response": "Nenhum exercício registrado para análise de treino."}
    
    summary = "\n".join([f"- {e.name} ({e.muscle_group}): {e.weight}kg x {e.reps} reps" for e in exercises])
    prompt = f"Analise o histórico de treinos a seguir e dê sugestões de hipertrofia, volume e descanso:\n{summary}"
    try:
        res = ai_service.generate_ai_response(prompt)
        return {"response": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/analyze-nutrition", response_model=schemas.AIResponse)
def analyze_nutrition(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    meals = db.query(models.Meal).filter(
        (models.Meal.user_id == current_user.id) | (models.Meal.user_id == None)
    ).all()
    if not meals:
        return {"response": "Nenhuma refeição registrada para análise nutricional."}
    
    summary = "\n".join([f"- {m.name}: {m.calories}kcal, P:{m.protein}g, C:{m.carbs}g, G:{m.fat}g" for m in meals])
    prompt = f"Analise o diário alimentar a seguir e dê sugestões de otimização de macronutrientes:\n{summary}"
    try:
        res = ai_service.generate_ai_response(prompt)
        return {"response": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/game-tips/{game_id}", response_model=schemas.AIResponse)
def game_tips(
    game_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    game = db.query(models.Game).filter(models.Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Jogo não encontrado")
    
    prompt = f"Forneça as melhores dicas de meta, builds, otimização e conquistas para o jogo '{game.title}'. Status atual: {game.status}. Horas jogadas: {game.hours_played}h."
    try:
        res = ai_service.generate_ai_response(prompt)
        return {"response": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))