from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

# ── USER & AUTH SCHEMAS ───────────────────────────────────────────
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    username: Optional[str] = None

# ── EXERCISE SCHEMAS ──────────────────────────────────────────────
class ExerciseBase(BaseModel):
    name: str
    muscle_group: str
    weight: float
    reps: int
    day: Optional[str] = "QUA"

class ExerciseCreate(ExerciseBase):
    pass

class ExerciseResponse(ExerciseBase):
    id: int
    date: datetime

    model_config = ConfigDict(from_attributes=True)

# ── MEAL SCHEMAS ──────────────────────────────────────────────────
class MealBase(BaseModel):
    name: str
    calories: float
    protein: float
    carbs: float
    fat: float

class MealCreate(MealBase):
    pass

class MealResponse(MealBase):
    id: int
    date: datetime

    model_config = ConfigDict(from_attributes=True)

# ── GAME SCHEMAS ──────────────────────────────────────────────────
class GameBase(BaseModel):
    title: str
    status: str
    rating: Optional[int] = 10
    hours_played: Optional[float] = 0.0
    notes: Optional[str] = None
    cover_image: Optional[str] = None
    steam_app_id: Optional[int] = None
    achievements: Optional[str] = None

class GameCreate(GameBase):
    pass

class GameResponse(GameBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

# ── AI SCHEMAS ────────────────────────────────────────────────────
class AIPromptRequest(BaseModel):
    prompt: str
    model: Optional[str] = "gemini-1.5-flash"

class AIResponse(BaseModel):
    response: str

# ── MOVIE SCHEMAS ─────────────────────────────────────────────────
class MovieBase(BaseModel):
    title: str
    poster: Optional[str] = None
    year: Optional[str] = None
    runtime: Optional[str] = None
    genre: Optional[str] = None
    imdb_rating: Optional[str] = None
    user_rating: Optional[float] = 9.0
    user_review: Optional[str] = None
    status: Optional[str] = "ASSISTINDO"
    priority_level: Optional[str] = "P1"
    video_quality: Optional[str] = "4K"
    imdb_id: Optional[str] = None
    media_type: Optional[str] = "movie"
    plot_score: Optional[float] = 8.5
    cinematography_score: Optional[float] = 9.0
    sound_score: Optional[float] = 8.0
    pacing_score: Optional[float] = 8.0
    cognitive_score: Optional[float] = 9.2
    originality_score: Optional[float] = 8.8

class MovieCreate(MovieBase):
    pass

class MovieResponse(MovieBase):
    id: int

    model_config = ConfigDict(from_attributes=True)