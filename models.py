from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String, index=True)
    muscle_group = Column(String)
    weight = Column(Float)
    reps = Column(Integer)
    day = Column(String, default="QUA", nullable=True)
    date = Column(DateTime, default=datetime.utcnow)

class Meal(Base):
    __tablename__ = "meals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String, index=True)
    calories = Column(Float)
    protein = Column(Float)
    carbs = Column(Float)
    fat = Column(Float)
    date = Column(DateTime, default=datetime.utcnow)

class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String, index=True)
    status = Column(String)
    rating = Column(Integer, nullable=True)
    hours_played = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    cover_image = Column(String, nullable=True)
    steam_app_id = Column(Integer, nullable=True)
    achievements = Column(String, nullable=True)

class Movie(Base):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String, index=True)
    poster = Column(String, nullable=True)
    year = Column(String, nullable=True)
    runtime = Column(String, nullable=True)
    genre = Column(String, nullable=True)
    imdb_rating = Column(String, nullable=True)
    user_rating = Column(Float, default=9.0)
    user_review = Column(Text, nullable=True)
    status = Column(String, default="ASSISTINDO") # ASSISTINDO, COMPLETO, QUERO ASSISTIR, DROPPED
    priority_level = Column(String, default="P1") # P1, P2, P3
    video_quality = Column(String, default="4K") # 4K, 1080p
    imdb_id = Column(String, nullable=True)
    media_type = Column(String, default="movie") # movie, series

    # 6 Eixos de Avaliação para o Radar Chart
    plot_score = Column(Float, default=8.5)
    cinematography_score = Column(Float, default=9.0)
    sound_score = Column(Float, default=8.0)
    pacing_score = Column(Float, default=8.0)
    cognitive_score = Column(Float, default=9.2)
    originality_score = Column(Float, default=8.8)