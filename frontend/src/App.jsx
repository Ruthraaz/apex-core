import React, { useState, useEffect } from 'react';
import './index.css';
import './services/api';
import { getCurrentUser, API_BASE_URL } from './services/api';
import AuthModal from './components/AuthModal';
import BodyMap from './components/BodyMap';
import GameAutocomplete from './components/GameAutocomplete';
import FormattedAIResponse from './components/FormattedAIResponse';
import SpotifyWebPlayerModal from './components/SpotifyWebPlayerModal';
import MovieAutocomplete from './components/MovieAutocomplete';
import MovieRadarChart from './components/MovieRadarChart';
import { handleSpotifyCallback } from './services/spotifyAuth';
import { Dumbbell, Utensils, Gamepad2, Bot, Plus, Trash2, RefreshCw, Send, Sparkles, Filter, Activity, Flame, ShieldAlert, Play, X, Trophy, Music, Square, Clock, Menu, Film, Star, Eye, Award, Clapperboard, Search, LogOut } from 'lucide-react';

// Playlists Padrão do Spotify para o Widget Minimalista
const SPOTIFY_PLAYLISTS = {
  TREINO: { id: '37i9dQZF1DX76Wlfdnj7AP', label: '[TREINO]' },
  FOCO: { id: '37i9dQZF1DX10zKhmuYy2I', label: '[FOCO]' },
  GAMING: { id: '37i9dQZF1DX6Xv8VoiKOGl', label: '[GAMING]' },
};

// Helper para Capa de Jogo com Fallback
function GameCardCover({ src, title }) {
  const [imgError, setImgError] = useState(false);

  if (!src || imgError) {
    return (
      <div className="w-full h-full bg-[#070908] border border-[#18201a] flex flex-col items-center justify-center p-3 text-center select-none">
        <Gamepad2 className="w-8 h-8 text-[#2be29d]/40 mb-1.5" />
        <span className="font-mono text-[10px] text-[#2be29d] font-bold uppercase tracking-wider truncate max-w-full">
          {title || 'GAME'}
        </span>
        <span className="font-mono text-[8px] text-zinc-600 uppercase mt-0.5">ARSENAL DIGITAL</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title}
      onError={() => setImgError(true)}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
    />
  );
}

// Helper para Poster de Filme com Fallback
function MoviePosterCover({ src, title }) {
  const [imgError, setImgError] = useState(false);

  const posterUrl = src && src !== 'N/A' ? src : null;

  if (!posterUrl || imgError) {
    return (
      <div className="w-full h-full bg-[#070908] border border-[#18201a] flex flex-col items-center justify-center p-3 text-center select-none">
        <Film className="w-8 h-8 text-[#2be29d]/40 mb-1.5" />
        <span className="font-mono text-[10px] text-[#2be29d] font-bold uppercase tracking-wider truncate max-w-full">
          {title || 'FILME'}
        </span>
        <span className="font-mono text-[8px] text-zinc-600 uppercase mt-0.5">CINE-BIO ACERVO</span>
      </div>
    );
  }

  return (
    <img
      src={posterUrl}
      alt={title}
      referrerPolicy="no-referrer"
      onError={() => setImgError(true)}
      className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
    />
  );
}

export default function App() {
  // ── HOOKS DE ESTADO ──────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('dashboard');

  // Autenticação & Operador Logado
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Treinos & Dias da Semana
  const [selectedDay, setSelectedDay] = useState('QUA');
  const [exercises, setExercises] = useState([]);
  const [exerciseForm, setExerciseForm] = useState({ name: '', muscle_group: '', weight: '', reps: '' });
  const [workoutAnalysis, setWorkoutAnalysis] = useState('');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Games & Sessão Ativa de Jogo
  const [games, setGames] = useState([]);
  const [gameForm, setGameForm] = useState({ title: '', status: 'Jogando', rating: 10, hours_played: 0, notes: '', cover_image: '', steam_app_id: null });
  const [gameTips, setGameTips] = useState({});
  const [loadingGameTips, setLoadingGameTips] = useState({});
  const [syncingGameId, setSyncingGameId] = useState(null);
  const [gameFilter, setGameFilter] = useState('TODOS');
  const [recommendationModal, setRecommendationModal] = useState(null);
  const [selectedGameDetails, setSelectedGameDetails] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loadingAchievements, setLoadingAchievements] = useState(false);

  // Cine-Bio / Cinema
  const [movies, setMovies] = useState([]);
  const [movieFilter, setMovieFilter] = useState('TODOS');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isAddMovieModalOpen, setIsAddMovieModalOpen] = useState(false);
  const [movieForm, setMovieForm] = useState({
    title: '',
    poster: '',
    year: '',
    runtime: '120 min',
    genre: 'Biopic / Sci-Fi',
    imdb_rating: '8.8',
    user_rating: 9.4,
    user_review: '',
    status: 'ASSISTINDO',
    priority_level: 'P1',
    video_quality: '4K',
    imdb_id: '',
    plot_score: 8.8,
    cinematography_score: 9.5,
    sound_score: 9.0,
    pacing_score: 8.5,
    cognitive_score: 9.4,
    originality_score: 9.0,
  });

  // Catálogo IMDb / OMDb (Exploração & Busca na API)
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [catalogResults, setCatalogResults] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Sessão Ativa de Jogo (Cronômetro & Polling do SO)
  const [activeGameSession, setActiveGameSession] = useState(null);

  // Spotify Modal / Drawer Expandível
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
  const [spotifyPlaylist, setSpotifyPlaylist] = useState('TREINO');

  // IA Command
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);

  // Nutrição
  const [meals, setMeals] = useState([]);
  const [mealForm, setMealForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  const [nutritionAnalysis, setNutritionAnalysis] = useState('');
  const [loadingNutrition, setLoadingNutrition] = useState(false);

  // Verificação Inicial de Autenticação JWT
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('apex_access_token');
      if (!token) {
        setIsAuthenticated(false);
        setIsAuthModalOpen(true);
        setAuthLoading(false);
        return;
      }
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        setIsAuthenticated(true);
        setIsAuthModalOpen(false);
      } catch (err) {
        console.warn('Sessão expirada:', err);
        localStorage.removeItem('apex_access_token');
        setIsAuthenticated(false);
        setIsAuthModalOpen(true);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();

    const handleUnauthorized = () => {
      setUser(null);
      setIsAuthenticated(false);
      setIsAuthModalOpen(true);
    };

    window.addEventListener('apex_auth_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('apex_auth_unauthorized', handleUnauthorized);
  }, []);

  // Carregamento Inicial de Dados após Autenticação
  useEffect(() => {
    if (isAuthenticated) {
      fetchExercises();
      fetchGames();
      fetchMeals();
      fetchMovies();
    }

    handleSpotifyCallback().then((token) => {
      if (token) {
        setIsSpotifyModalOpen(true);
      }
    });
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem('apex_access_token');
    setUser(null);
    setIsAuthenticated(false);
    setIsAuthModalOpen(true);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
  };

  // Seleciona o primeiro filme para o Radar Chart assim que a lista carregar
  useEffect(() => {
    if (movies.length > 0 && !selectedMovie) {
      setSelectedMovie(movies[0]);
    }
  }, [movies]);

  // Busca conquistas reais da Steam quando um jogo é selecionado no Modal
  useEffect(() => {
    if (selectedGameDetails) {
      fetchGameAchievements(selectedGameDetails.id);
    } else {
      setAchievements([]);
    }
  }, [selectedGameDetails]);

  // Cronômetro da Sessão Ativa de Jogo
  useEffect(() => {
    let interval = null;
    if (activeGameSession) {
      interval = setInterval(() => {
        setActiveGameSession((prev) => {
          if (!prev) return null;
          return { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 };
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeGameSession?.gameId]);

  // Polling automático no SO (Windows via psutil) para monitorar fechamento do jogo
  useEffect(() => {
    let processCheckInterval = null;
    if (activeGameSession) {
      processCheckInterval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/games/check-process?title=${encodeURIComponent(activeGameSession.gameTitle)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.is_running === false && activeGameSession.elapsedSeconds > 15) {
              console.log(`[Auto-Tracker] O processo de ${activeGameSession.gameTitle} foi encerrado no Windows. Finalizando sessão...`);
              handleEndSession();
            }
          }
        } catch (e) {
          console.error('Erro ao verificar processo do jogo no SO:', e);
        }
      }, 10000);
    }

    return () => {
      if (processCheckInterval) clearInterval(processCheckInterval);
    };
  }, [activeGameSession?.gameId, activeGameSession?.elapsedSeconds]);

  // ── FUNÇÕES DE INTEGRAÇÃO COM A API ──────────────────────────────
  const fetchExercises = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/exercises/`);
      if (res.ok) setExercises(await res.json());
    } catch (e) { console.error('Erro ao buscar exercícios:', e); }
  };

  const fetchGames = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/games/`);
      if (res.ok) setGames(await res.json());
    } catch (e) { console.error('Erro ao buscar jogos:', e); }
  };

  const fetchMeals = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/meals/`);
      if (res.ok) setMeals(await res.json());
    } catch (e) { console.error('Erro ao buscar refeições:', e); }
  };

  const fetchMovies = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/movies/`);
      if (res.ok) {
        const data = await res.json();
        setMovies(data || []);
        if (data && data.length > 0 && !selectedMovie) {
          setSelectedMovie(data[0]);
        }
      }
    } catch (e) { console.error('Erro ao buscar filmes:', e); }
  };

  const fetchGameAchievements = async (gameId) => {
    setLoadingAchievements(true);
    try {
      const res = await fetch(`${API_BASE_URL}/games/${gameId}/achievements`);
      if (res.ok) {
        const data = await res.json();
        setAchievements(data || []);
      } else {
        setAchievements([]);
      }
    } catch (e) {
      console.error('Erro ao buscar conquistas da Steam:', e);
      setAchievements([]);
    } finally {
      setLoadingAchievements(false);
    }
  };

  // Controladores Cine-Bio / Cinema
  const handleAddMovie = async (e) => {
    if (e) e.preventDefault();
    
    // Se o usuário digitou qualquer texto no input, usa como título; senão usa "Sem Título"
    const movieTitle = (movieForm.title && movieForm.title.trim()) ? movieForm.title.trim() : "Sem Título";

    const payload = {
      title: movieTitle,
      poster: (movieForm.poster && movieForm.poster !== 'N/A') ? movieForm.poster : null,
      year: movieForm.year || '',
      runtime: movieForm.runtime || '120 min',
      genre: movieForm.genre || 'Drama',
      imdb_rating: String(movieForm.imdb_rating || '8.0'),
      user_rating: Number(movieForm.user_rating) || 9.0,
      user_review: movieForm.user_review || '',
      status: movieForm.status || 'ASSISTINDO',
      priority_level: movieForm.priority_level || 'P1',
      video_quality: movieForm.video_quality || '4K',
      imdb_id: movieForm.imdb_id || null,
      media_type: movieForm.media_type || 'movie',
      plot_score: Number(movieForm.plot_score) || 8.5,
      cinematography_score: Number(movieForm.cinematography_score) || 9.0,
      sound_score: Number(movieForm.sound_score) || 8.0,
      pacing_score: Number(movieForm.pacing_score) || 8.0,
      cognitive_score: Number(movieForm.cognitive_score) || 9.2,
      originality_score: Number(movieForm.originality_score) || 8.8,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/movies/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const newMovie = await res.json();
        setMovies((prev) => [newMovie, ...prev]);
        setSelectedMovie(newMovie);
        setIsAddMovieModalOpen(false);
        setMovieForm({
          title: '', poster: '', year: '', runtime: '120 min', genre: 'Drama',
          imdb_rating: '8.5', user_rating: 9.4, user_review: '', status: 'ASSISTINDO',
          priority_level: 'P1', video_quality: '4K', imdb_id: '', media_type: 'movie',
          plot_score: 8.5, cinematography_score: 9.0, sound_score: 8.0,
          pacing_score: 8.0, cognitive_score: 9.2, originality_score: 8.8,
        });
      } else {
        const errorData = await res.json();
        console.error('Erro retornado pela API ao salvar filme:', errorData);
      }
    } catch (e) {
      console.error('Erro ao comunicar com a API para salvar filme:', e);
    }
  };

  const handleDeleteMovie = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/movies/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMovies((prev) => {
          const next = prev.filter((m) => m.id !== id);
          if (selectedMovie?.id === id) {
            setSelectedMovie(next[0] || null);
          }
          return next;
        });
      }
    } catch (e) { console.error('Erro ao deletar filme:', e); }
  };

  const handleOpenStremio = (movie) => {
    if (!movie) return;

    if (movie.imdb_id && String(movie.imdb_id).startsWith('tt')) {
      // Se possui IMDb ID válido, abre o detalhe direto no app desktop
      const isSeries = movie.media_type === 'series' || movie.type === 'series' || (movie.genre && movie.genre.toLowerCase().includes('series'));
      const type = isSeries ? 'series' : 'movie';
      window.location.href = `stremio://detail/${type}/${movie.imdb_id}`;
    } else {
      // Se não possui IMDb ID (cadastro manual), redireciona para a busca limpa no Stremio Web
      const query = encodeURIComponent(movie.title || '');
      window.open(`https://web.stremio.com/#/search?search=${query}`, '_blank');
    }
  };

  const handleCatalogSearch = async (e) => {
    if (e) e.preventDefault();
    if (!catalogSearchQuery || !catalogSearchQuery.trim()) return;

    setLoadingCatalog(true);
    try {
      const response = await fetch(`https://www.omdbapi.com/?apikey=fc1855dc&s=${encodeURIComponent(catalogSearchQuery.trim())}`);
      const data = await response.json();

      if (data.Response === "True") {
        setCatalogResults(data.Search || []);
      } else {
        setCatalogResults([]);
        alert("Nenhum título encontrado na OMDb API.");
      }
    } catch (err) {
      console.error("Erro na busca da OMDb:", err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const handleEvaluateFromCatalog = async (item) => {
    const imdbId = item.imdb_id || item.imdbID;
    let selectedData = {
      title: item.title || item.Title || '',
      poster: item.poster && item.poster !== 'N/A' ? item.poster : (item.Poster && item.Poster !== 'N/A' ? item.Poster : ''),
      year: item.year || item.Year || '',
      runtime: item.runtime || '120 min',
      genre: item.genre || 'Drama',
      imdb_rating: item.imdb_rating || item.imdbRating || '8.0',
      imdb_id: imdbId || '',
      media_type: item.media_type || (item.Type === 'series' ? 'series' : 'movie'),
    };

    if (imdbId) {
      try {
        const res = await fetch(`${API_BASE_URL}/movies/omdb-detail/${imdbId}`);
        if (res.ok) {
          const detail = await res.json();
          selectedData = {
            title: detail.Title || selectedData.title,
            poster: detail.Poster && detail.Poster !== 'N/A' ? detail.Poster : selectedData.poster,
            year: detail.Year || selectedData.year,
            runtime: detail.Runtime || selectedData.runtime,
            genre: detail.Genre || selectedData.genre,
            imdb_rating: detail.imdbRating || selectedData.imdb_rating,
            imdb_id: detail.imdbID || imdbId,
            media_type: detail.Type === 'series' ? 'series' : 'movie',
          };
        }
      } catch (err) {
        console.error('Erro ao buscar detalhes para modal:', err);
      }
    }

    setMovieForm((prev) => ({
      ...prev,
      ...selectedData,
    }));
    setIsAddMovieModalOpen(true);
  };

  // Funções de Controle da Sessão Ativa de Jogo
  const handleStartSession = (game) => {
    setActiveGameSession({
      gameId: game.id,
      gameTitle: game.title,
      startTime: Date.now(),
      elapsedSeconds: 0,
    });

    if (game.steam_app_id) {
      try {
        window.location.href = `steam://run/${game.steam_app_id}`;
      } catch (err) {
        console.error('Erro ao acionar protocolo da Steam:', err);
      }
    }
  };

  const handleEndSession = async () => {
    if (!activeGameSession) return;
    const { gameId, elapsedSeconds } = activeGameSession;
    
    const hoursAdded = Math.max(0.1, Number((elapsedSeconds / 3600).toFixed(1)));
    const targetGame = games.find((g) => g.id === gameId);

    if (targetGame) {
      const newHours = Number(((targetGame.hours_played || 0) + hoursAdded).toFixed(1));
      
      setGames((prev) =>
        prev.map((g) => (g.id === gameId ? { ...g, hours_played: newHours } : g))
      );

      try {
        await fetch(`${API_BASE_URL}/games/${gameId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hours_played: newHours }),
        });
      } catch (e) {
        console.error('Aviso ao atualizar horas da sessão no servidor:', e);
      }
    }

    setActiveGameSession(null);
  };

  const formatElapsedTime = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const handleSubmitExercise = async (e) => {
    e.preventDefault();
    if (!exerciseForm.name || !exerciseForm.muscle_group) return;

    const payload = {
      name: exerciseForm.name,
      muscle_group: exerciseForm.muscle_group,
      weight: Number(exerciseForm.weight) || 0,
      reps: Number(exerciseForm.reps) || 0,
      day: selectedDay,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/exercises/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const newExercise = await res.json();
        setExercises((prev) => [newExercise, ...prev]);
        setExerciseForm({ name: '', muscle_group: '', weight: '', reps: '' });
      }
    } catch (e) { console.error('Erro ao adicionar exercício:', e); }
  };

  const handleDeleteExercise = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/exercises/${id}`, { method: 'DELETE' });
      if (res.ok) setExercises((prev) => prev.filter((ex) => ex.id !== id));
    } catch (e) { console.error('Erro ao deletar exercício:', e); }
  };

  const handleAnalyzeWorkouts = async () => {
    setLoadingAnalysis(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ai/analyze-workouts`, { method: 'POST' });
      const data = await res.json();
      setWorkoutAnalysis(data.response || data.detail);
    } catch (e) { setWorkoutAnalysis('Erro ao obter análise da IA.'); }
    finally { setLoadingAnalysis(false); }
  };

  const handleAddGame = async (e) => {
    e.preventDefault();
    if (!gameForm.title) return;

    const payload = {
      title: gameForm.title,
      status: gameForm.status || 'Jogando',
      rating: Number(gameForm.rating) || 10,
      hours_played: Number(gameForm.hours_played) || 0,
      notes: gameForm.notes || '',
      cover_image: gameForm.cover_image || '',
      steam_app_id: gameForm.steam_app_id || null,
    };
    try {
      const res = await fetch(`${API_BASE_URL}/games/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const newGame = await res.json();
        setGames((prev) => [newGame, ...prev]);
        setGameForm({ title: '', status: 'Jogando', rating: 10, hours_played: 0, notes: '', cover_image: '', steam_app_id: null });
      }
    } catch (e) { console.error('Erro ao adicionar jogo:', e); }
  };

  const handleDeleteGame = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/games/${id}`, { method: 'DELETE' });
      if (res.ok) setGames((prev) => prev.filter((g) => g.id !== id));
    } catch (e) { console.error('Erro ao deletar jogo:', e); }
  };

  const handleGetGameTips = async (gameId) => {
    setLoadingGameTips((prev) => ({ ...prev, [gameId]: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/ai/game-tips/${gameId}`, { method: 'POST' });
      const data = await res.json();
      setGameTips((prev) => ({ ...prev, [gameId]: data.response || data.detail }));
    } catch (e) { setGameTips((prev) => ({ ...prev, [gameId]: 'Erro ao buscar dicas.' })); }
    finally { setLoadingGameTips((prev) => ({ ...prev, [gameId]: false })); }
  };

  const handleSyncSteam = async (gameId) => {
    setSyncingGameId(gameId);
    try {
      const res = await fetch(`${API_BASE_URL}/games/sync-steam/${gameId}`, { method: 'POST' });
      if (res.ok) fetchGames();
    } catch (e) { console.error('Erro ao sincronizar com a Steam:', e); }
    finally { setSyncingGameId(null); }
  };

  const handleRecommendNextGame = () => {
    const backlogGames = games.filter((g) => g.status === 'Backlog');
    if (backlogGames.length > 0) {
      const randomIndex = Math.floor(Math.random() * backlogGames.length);
      setRecommendationModal(backlogGames[randomIndex]);
    } else {
      setRecommendationModal({ noGame: true });
    }
  };

  const handleSubmitMeal = async (e) => {
    e.preventDefault();
    if (!mealForm.name) return;

    const payload = {
      name: mealForm.name,
      calories: Number(mealForm.calories) || 0,
      protein: Number(mealForm.protein) || 0,
      carbs: Number(mealForm.carbs) || 0,
      fat: Number(mealForm.fat) || 0,
    };
    try {
      const res = await fetch(`${API_BASE_URL}/meals/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const newMeal = await res.json();
        setMeals((prev) => [newMeal, ...prev]);
        setMealForm({ name: '', calories: '', protein: '', carbs: '', fat: '' });
      }
    } catch (e) { console.error('Erro ao adicionar refeição:', e); }
  };

  const handleDeleteMeal = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/meals/${id}`, { method: 'DELETE' });
      if (res.ok) setMeals((prev) => prev.filter((m) => m.id !== id));
    } catch (e) { console.error('Erro ao deletar refeição:', e); }
  };

  const handleAnalyzeNutrition = async () => {
    setLoadingNutrition(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ai/analyze-nutrition`, { method: 'POST' });
      const data = await res.json();
      setNutritionAnalysis(data.response || data.detail);
    } catch (e) { setNutritionAnalysis('Erro ao obter análise nutricional.'); }
    finally { setLoadingNutrition(false); }
  };

  const handleSendPrompt = async (e, customPrompt = null) => {
    if (e) e.preventDefault();
    const targetPrompt = customPrompt || chatPrompt;
    if (!targetPrompt) return;
    setLoadingChat(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: targetPrompt }),
      });
      const data = await res.json();
      setChatResponse(data.response || data.detail);
    } catch (e) { setChatResponse('Erro ao comunicar com a IA.'); }
    finally { setLoadingChat(false); }
  };

  // ── VALORES COMPUTADOS ──────────────────────────────────────────
  const totalCalories = meals.reduce((sum, m) => sum + (Number(m.calories) || 0), 0);
  const totalProtein = meals.reduce((sum, m) => sum + (Number(m.protein) || 0), 0);
  const totalCarbs = meals.reduce((sum, m) => sum + (Number(m.carbs) || 0), 0);
  const totalFat = meals.reduce((sum, m) => sum + (Number(m.fat) || 0), 0);

  const exercisesForSelectedDay = exercises.filter((ex) => (ex.day || 'QUA') === selectedDay);
  const activeGame = games.find((g) => g.status === 'Jogando') || (games.length > 0 ? games[0] : null);

  // Configuração das abas de navegação (APEX CORE)
  const navTabs = [
    { id: 'fitness', label: 'Treinos', Icon: Dumbbell },
    { id: 'nutrition', label: 'Nutrição', Icon: Utensils },
    { id: 'games', label: 'Games', Icon: Gamepad2 },
    { id: 'cinema', label: 'Cine-Bio', Icon: Film },
    { id: 'ai', label: 'Central IA', Icon: Bot },
  ];

  const aiShortcuts = [
    { label: 'Analisar Treino', desc: 'Fadiga muscular & RPE', prompt: 'Faça uma análise detalhada da fadiga muscular e sugestão de recuperação baseada nos meus últimos exercícios.' },
    { label: 'Otimizar Dieta', desc: 'Balanço de macros & Kcal', prompt: 'Analise minha meta diária de calorias e proteínas e recomende ajustes para otimizar ganhos.' },
    { label: 'Sugestão de Backlog', desc: 'Próximo jogo da fila', prompt: 'Quais são as melhores sugestões de build, equipamentos e meta estratégias para os jogos do meu backlog?' },
    { label: 'Análise Cine-Bio', desc: 'Crítica tática de enredo & foco', prompt: 'Analise meu acervo de filmes cadastrados e recomende os melhores títulos biográficos/estratégicos.' },
  ];

  const filteredGames = games.filter((game) => {
    if (gameFilter === 'TODOS') return true;
    if (gameFilter === 'JOGANDO') return game.status === 'Jogando';
    if (gameFilter === 'BACKLOG') return game.status === 'Backlog';
    if (gameFilter === 'ZERADOS') return game.status === 'Zerado';
    return true;
  });

  const filteredMovies = movies.filter((movie) => {
    if (movieFilter === 'TODOS') return true;
    return movie.status === movieFilter;
  });

  // Tokens de estilo APEX CORE / Stitch
  const inputCls = "bg-[#070908] border border-[#18201a] px-3.5 py-2.5 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#2be29d] transition-colors duration-200";
  const inputMonoCls = `${inputCls} font-mono`;

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-[#070908] text-zinc-100 font-sans antialiased selection:bg-[#25d08e]/30 selection:text-zinc-100 relative">

      {/* ═══ BARRA SUPERIOR MOBILE ═══ */}
      <header className="md:hidden bg-[#0a0d0b] border-b border-[#161d18] px-4 py-3 flex items-center justify-between shrink-0 select-none z-30">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#0e1210] border border-[#18201a] flex items-center justify-center font-mono font-bold text-xs text-[#2be29d]">
            A
          </div>
          <div>
            <h1 className="text-xs font-semibold text-zinc-100 tracking-tight flex items-center gap-1">
              APEX CORE <span className="font-mono text-[8px] text-[#2be29d] bg-[#070908] px-1 py-0.5 rounded border border-[#18201a] uppercase tracking-wider">STITCH</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSpotifyModalOpen(true)}
            className="p-2 bg-[#090c0a] border border-[#1b231f] text-[#2be29d] rounded-lg transition"
            title="Spotify Player"
          >
            <Music className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 bg-[#0e1210] border border-[#18201a] text-zinc-300 rounded-lg transition"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* MENU DRAWER MOBILE */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0a0d0b] border-b border-[#161d18] p-4 space-y-2 z-30 animate-in fade-in slide-in-from-top duration-200">
          <nav className="space-y-1">
            {navTabs.map((tab) => {
              const IconComponent = tab.Icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center space-x-2.5 transition-all text-xs font-medium ${
                    isActive
                      ? 'bg-[#18201a]/80 text-[#2be29d] border border-[#2be29d]/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18201a]/40'
                  }`}
                >
                  <IconComponent className={`w-4 h-4 ${isActive ? 'text-[#2be29d]' : 'text-zinc-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* ═══ SIDEBAR LATERAL APEX CORE (DESKTOP) ═══ */}
      <aside className="hidden md:flex w-64 bg-[#0a0d0b] border-r border-[#161d18] p-6 flex-col justify-between select-none shrink-0 overflow-y-auto custom-scrollbar">
        <div>
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-[#0e1210] border border-[#18201a] flex items-center justify-center font-mono font-bold text-xs text-[#2be29d]">
              A
            </div>
            <div>
              <h1 className="text-sm font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
                APEX CORE <span className="font-mono text-[10px] text-[#2be29d] bg-[#070908] px-2 py-0.5 rounded border border-[#18201a] uppercase tracking-widest">STITCH</span>
              </h1>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#2be29d]">v2.4 Kinetic System</p>
            </div>
          </div>

          <nav className="space-y-1">
            {navTabs.map((tab) => {
              const IconComponent = tab.Icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center space-x-2.5 transition-all duration-200 text-xs font-medium cursor-pointer ${
                    isActive
                      ? 'bg-[#18201a]/80 text-[#2be29d] border border-[#2be29d]/30 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18201a]/40 border border-transparent'
                  }`}
                >
                  <IconComponent className={`w-4 h-4 ${isActive ? 'text-[#2be29d]' : 'text-zinc-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="my-4 pt-4 border-t border-[#161d18]">
          <button
            onClick={() => setIsSpotifyModalOpen(true)}
            className="w-full py-2.5 bg-[#090c0a] hover:bg-[#18201a] border border-[#1b231f] hover:border-[#2be29d]/40 rounded-lg font-mono text-[10px] text-[#2be29d] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Music className="w-3.5 h-3.5 text-[#2be29d]" />
            ABRIR PLAYER SPOTIFY
          </button>
        </div>

        <div className="border-t border-[#161d18] pt-4 font-mono text-[10px] space-y-2.5">
          <div className="flex items-center justify-between uppercase tracking-widest bg-[#070908] p-2 rounded-lg border border-[#18201a]">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-[#25d08e] animate-pulse shrink-0" />
              <span className="text-zinc-200 font-bold truncate">
                {user?.username || 'OPERADOR'}
              </span>
            </div>
            <span className="text-[9px] text-[#2be29d] bg-[#25d08e]/20 px-1.5 py-0.5 rounded font-bold">ONLINE</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2 bg-[#0e1210] hover:bg-[#18201a] border border-[#18201a] hover:border-[#e05252]/40 text-zinc-400 hover:text-[#e05252] rounded-lg transition-all flex items-center justify-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider cursor-pointer shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            🚪 SAIR / LOGOUT
          </button>
        </div>
      </aside>

      {/* ═══ MODAL DE AUTENTICAÇÃO TÁTICA APEX ═══ */}
      <AuthModal isOpen={isAuthModalOpen || !isAuthenticated} onLoginSuccess={handleLoginSuccess} />

      {/* ═══ MODAL / DRAWER SPOTIFY CONTROLLER ═══ */}
      <SpotifyWebPlayerModal isOpen={isSpotifyModalOpen} onClose={() => setIsSpotifyModalOpen(false)} />

      {/* ═══ ÁREA DE CONTEÚDO PRINCIPAL ═══ */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#070908] w-full overflow-x-hidden min-h-screen">

        {/* ══════════ BANNER / INDICADOR GLOBAL DE SESSÃO ATIVA DE JOGO ══════════ */}
        {activeGameSession && (
          <div className="mb-6 p-3.5 bg-[#0e1210] border border-[#2be29d]/50 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_0_15px_rgba(43,226,157,0.1)]">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#25d08e] animate-ping shrink-0" />
              <div>
                <span className="font-mono text-[10px] text-[#2be29d] uppercase tracking-widest font-bold block flex items-center gap-2">
                  ● EM SESSÃO DE JOGO ATIVA
                  <span className="text-zinc-500 font-normal hidden sm:inline">| MONITORANDO PROCESSO SO...</span>
                </span>
                <span className="text-sm font-semibold text-zinc-100">{activeGameSession.gameTitle}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <div className="font-mono text-sm font-bold text-[#2be29d] bg-[#070908] px-3 py-1.5 rounded-lg border border-[#18201a]">
                {formatElapsedTime(activeGameSession.elapsedSeconds)}
              </div>
              <button
                onClick={handleEndSession}
                className="bg-[#25d08e] hover:bg-[#2be29d] text-[#070908] font-mono text-xs font-bold px-4 py-2 rounded-lg transition-all uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                ENCERRAR
              </button>
            </div>
          </div>
        )}

        {/* ══════════ ABA 1: TREINOS ══════════ */}
        {activeTab === 'fitness' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#18201a] pb-4 gap-3">
              <div>
                <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">
                  Boa tarde, Atleta.
                </h2>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#2be29d] mt-1">
                  MÓDULO 04 — MAPEAMENTO DE CARGA MUSCULAR & PLANO DE EXECUÇÃO
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest bg-[#0e1210] text-[#2be29d] border border-[#18201a] px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#25d08e]" />
                  Frequência 4/5 Dias
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest bg-[#0e1210] text-zinc-300 border border-[#18201a] px-3 py-1.5 rounded-lg">
                  Volume 18.4 TON
                </span>
              </div>
            </div>

            <div className="bg-[#0e1210] p-4 sm:p-5 rounded-xl border border-[#18201a] space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-[#18201a]">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#2be29d]">VOLUME DE TREINO SEMANAL</span>
                <span className="font-mono text-[10px] text-zinc-400">DIA: <span className="text-[#2be29d] font-bold">{selectedDay}</span></span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'].map((day) => {
                  const dayCount = exercises.filter((ex) => (ex.day || 'QUA') === day).length;
                  const isSelected = selectedDay === day;
                  const statusLabel = dayCount > 0 ? 'TREINADO' : isSelected ? 'EM SESSÃO' : 'PENDENTE';

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`p-2 sm:p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#18201a] border-[#2be29d] text-[#2be29d] shadow-sm'
                          : dayCount > 0
                          ? 'bg-[#0e1210] border-[#2be29d]/40 text-zinc-200 hover:bg-[#18201a]/50'
                          : 'bg-[#070908] border-[#18201a] text-zinc-500 hover:text-zinc-300 hover:bg-[#18201a]/30'
                      }`}
                    >
                      <span className="font-mono text-xs font-bold block">{day}</span>
                      <span className={`font-mono text-[8px] uppercase block mt-1 tracking-wider ${
                        dayCount > 0 ? 'text-[#2be29d] font-bold' : isSelected ? 'text-zinc-200' : 'opacity-60'
                      }`}>
                        {statusLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
              <div className="col-span-1 lg:col-span-5">
                <BodyMap onSelectMuscle={(muscle) => setExerciseForm((prev) => ({ ...prev, muscle_group: muscle }))} />
              </div>

              <div className="col-span-1 lg:col-span-7 bg-[#0e1210] p-4 sm:p-5 rounded-xl border border-[#18201a] space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center pb-3 border-b border-[#18201a]">
                    <div>
                      <h3 className="font-semibold text-xs text-zinc-100 uppercase tracking-wider font-mono">Plano de Execução</h3>
                      <span className="font-mono text-[9px] text-[#2be29d]">EXERCÍCIOS PARA {selectedDay} ({exercisesForSelectedDay.length})</span>
                    </div>
                    <button onClick={handleAnalyzeWorkouts} disabled={loadingAnalysis || exercises.length === 0}
                      className="bg-[#070908] border border-[#18201a] text-[#2be29d] hover:bg-[#18201a] disabled:opacity-40 font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all cursor-pointer">
                      {loadingAnalysis ? 'Analisando...' : 'Análise IA'}
                    </button>
                  </div>

                  {workoutAnalysis && (
                    <div className="mt-3 p-3.5 bg-[#070908] border border-[#18201a] rounded-xl">
                      <FormattedAIResponse content={workoutAnalysis} />
                    </div>
                  )}

                  <form onSubmit={handleSubmitExercise} className="my-4 space-y-2.5 bg-[#070908] p-3.5 rounded-xl border border-[#18201a]">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#2be29d] block mb-1">
                      + REGISTRAR EXERCÍCIO EM <span className="underline">{selectedDay}</span>
                    </span>
                    <input type="text" placeholder="Nome do Exercício (ex: Supino Reto)" value={exerciseForm.name}
                      onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })} className={`w-full ${inputCls}`} required />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input type="text" placeholder="Grupo (Peito)" value={exerciseForm.muscle_group}
                        onChange={(e) => setExerciseForm({ ...exerciseForm, muscle_group: e.target.value })} className={`w-full ${inputCls}`} required />
                      <input type="number" placeholder="Carga (kg)" value={exerciseForm.weight}
                        onChange={(e) => setExerciseForm({ ...exerciseForm, weight: e.target.value })} className={inputMonoCls} required />
                      <input type="number" placeholder="Reps" value={exerciseForm.reps}
                        onChange={(e) => setExerciseForm({ ...exerciseForm, reps: e.target.value })} className={inputMonoCls} required />
                    </div>
                    <button type="submit" className="w-full py-2.5 bg-[#18201a] hover:bg-[#25d08e]/20 text-[#2be29d] border border-[#2be29d]/40 font-mono text-xs font-semibold rounded-lg transition-all cursor-pointer">
                      SALVAR EM {selectedDay}
                    </button>
                  </form>

                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                    {exercisesForSelectedDay.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-[#18201a] rounded-lg">
                        <p className="font-mono text-xs text-zinc-500">Nenhum exercício registrado para {selectedDay}.</p>
                      </div>
                    ) : (
                      exercisesForSelectedDay.map((ex) => (
                        <div key={ex.id} className="bg-[#070908] p-3 rounded-lg flex justify-between items-center border border-[#18201a]">
                          <div>
                            <span className="font-medium text-xs text-zinc-100">{ex.name}</span>
                            <span className="font-mono text-[10px] text-[#2be29d] bg-[#18201a] px-2 py-0.5 rounded border border-[#18201a] ml-2">{ex.muscle_group}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs text-zinc-300 bg-[#18201a] px-2.5 py-1 rounded border border-[#18201a]">
                              {ex.weight}kg × {ex.reps}
                            </span>
                            <button onClick={() => handleDeleteExercise(ex.id)} className="text-zinc-500 hover:text-[#e05252] transition-colors p-1 cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <button className="w-full py-3 mt-4 bg-[#25d08e] text-[#070908] font-bold rounded-lg hover:bg-[#2be29d] transition-all flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider cursor-pointer">
                  <Play className="w-4 h-4 fill-current" />
                  INICIAR SESSÃO ({selectedDay})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ ABA 2: NUTRIÇÃO ══════════ */}
        {activeTab === 'nutrition' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="border-b border-[#18201a] pb-4">
              <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">
                Nutrition Log
              </h2>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#2be29d] mt-1">METABOLISMO, INGESTÃO DIÁRIA & DISTRIBUIÇÃO DE MACROS</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0e1210] p-4 rounded-xl border border-[#18201a] space-y-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#2be29d]">CALORIES</span>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-lg font-bold text-zinc-100">{totalCalories} <span className="text-xs text-zinc-500">/ 3,000 kcal</span></span>
                </div>
                <div className="w-full bg-[#070908] h-1.5 rounded-full overflow-hidden border border-[#18201a]">
                  <div className="bg-[#25d08e] h-full rounded-full transition-all duration-300" style={{ width: `${Math.min((totalCalories / 3000) * 100, 100)}%` }} />
                </div>
              </div>

              <div className="bg-[#0e1210] p-4 rounded-xl border border-[#18201a] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#2be29d]">PROTEIN</span>
                  <span className="font-mono text-[9px] text-[#2be29d] bg-[#070908] px-1.5 py-0.5 rounded border border-[#18201a]">
                    {Math.max(0, 200 - totalProtein)}g Left
                  </span>
                </div>
                <span className="font-mono text-lg font-bold text-zinc-100">{totalProtein}g <span className="text-xs text-zinc-500">/ 200g</span></span>
                <div className="w-full bg-[#070908] h-1.5 rounded-full overflow-hidden border border-[#18201a]">
                  <div className="bg-[#25d08e] h-full rounded-full transition-all duration-300" style={{ width: `${Math.min((totalProtein / 200) * 100, 100)}%` }} />
                </div>
              </div>

              <div className="bg-[#0e1210] p-4 rounded-xl border border-[#18201a] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#2be29d]">CARBS</span>
                  <span className="font-mono text-[9px] text-zinc-400 bg-[#070908] px-1.5 py-0.5 rounded border border-[#18201a]">{Math.round((totalCarbs / 350) * 100)}%</span>
                </div>
                <span className="font-mono text-lg font-bold text-zinc-100">{totalCarbs}g <span className="text-xs text-zinc-500">/ 350g</span></span>
                <div className="w-full bg-[#070908] h-1.5 rounded-full overflow-hidden border border-[#18201a]">
                  <div className="bg-[#25d08e] h-full rounded-full transition-all duration-300" style={{ width: `${Math.min((totalCarbs / 350) * 100, 100)}%` }} />
                </div>
              </div>

              <div className="bg-[#0e1210] p-4 rounded-xl border border-[#18201a] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#e05252]">FAT</span>
                  <span className="font-mono text-[9px] text-[#e05252] bg-[#070908] px-1.5 py-0.5 rounded border border-[#e05252]/40">
                    {totalFat > 70 ? 'Warning' : 'Normal'}
                  </span>
                </div>
                <span className="font-mono text-lg font-bold text-zinc-100">{totalFat}g <span className="text-xs text-zinc-500">/ 85g</span></span>
                <div className="w-full bg-[#070908] h-1.5 rounded-full overflow-hidden border border-[#18201a]">
                  <div className="bg-[#e05252] h-full rounded-full transition-all duration-300" style={{ width: `${Math.min((totalFat / 85) * 100, 100)}%` }} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
              <form onSubmit={handleSubmitMeal} className="col-span-1 lg:col-span-6 bg-[#0e1210] p-4 sm:p-5 rounded-xl border border-[#18201a] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#18201a]">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#2be29d]">QUICK ENTRY</span>
                  <span className="font-mono text-[10px] text-zinc-500">MACRO PREVIEW</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 block mb-1">FOOD ITEM</label>
                    <input type="text" placeholder="Nome da Refeição (ex: Frango com Batata Doce)" value={mealForm.name}
                      onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })} className={`w-full ${inputCls}`} required />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 block mb-1">QUANTITY (KCAL)</label>
                      <input type="number" placeholder="Kcal" value={mealForm.calories}
                        onChange={(e) => setMealForm({ ...mealForm, calories: e.target.value })} className={inputMonoCls} required />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 block mb-1">PROTEIN (G)</label>
                      <input type="number" placeholder="Proteína" value={mealForm.protein}
                        onChange={(e) => setMealForm({ ...mealForm, protein: e.target.value })} className={inputMonoCls} required />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 block mb-1">CARBS (G)</label>
                      <input type="number" placeholder="Carboidratos" value={mealForm.carbs}
                        onChange={(e) => setMealForm({ ...mealForm, carbs: e.target.value })} className={inputMonoCls} required />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 block mb-1">UNIT / FAT (G)</label>
                      <input type="number" placeholder="Gorduras" value={mealForm.fat}
                        onChange={(e) => setMealForm({ ...mealForm, fat: e.target.value })} className={inputMonoCls} required />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#18201a]">
                  <div className="bg-[#070908] p-2 rounded text-center border border-[#18201a]">
                    <span className="font-mono text-[9px] text-zinc-500 block">P</span>
                    <span className="font-mono text-xs text-[#2be29d] font-bold">{Number(mealForm.protein) || 0}g</span>
                  </div>
                  <div className="bg-[#070908] p-2 rounded text-center border border-[#18201a]">
                    <span className="font-mono text-[9px] text-zinc-500 block">C</span>
                    <span className="font-mono text-xs text-[#2be29d] font-bold">{Number(mealForm.carbs) || 0}g</span>
                  </div>
                  <div className="bg-[#070908] p-2 rounded text-center border border-[#18201a]">
                    <span className="font-mono text-[9px] text-zinc-500 block">F</span>
                    <span className="font-mono text-xs text-[#e05252] font-bold">{Number(mealForm.fat) || 0}g</span>
                  </div>
                  <div className="bg-[#070908] p-2 rounded text-center border border-[#18201a]">
                    <span className="font-mono text-[9px] text-zinc-500 block">KCAL</span>
                    <span className="font-mono text-xs text-zinc-200 font-bold">{Number(mealForm.calories) || 0}</span>
                  </div>
                </div>

                <button type="submit" className="w-full py-3 bg-[#25d08e] text-[#070908] font-bold rounded-lg hover:bg-[#2be29d] transition-all font-mono text-xs uppercase tracking-wider cursor-pointer">
                  + LOG ENTRY
                </button>
              </form>

              <div className="col-span-1 lg:col-span-6 bg-[#0e1210] p-4 sm:p-5 rounded-xl border border-[#18201a] flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-center pb-3 border-b border-[#18201a]">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#2be29d]">TODAY'S LOG</span>
                    <button onClick={handleAnalyzeNutrition} disabled={loadingNutrition || meals.length === 0}
                      className="bg-[#070908] border border-[#18201a] text-[#2be29d] hover:bg-[#18201a] disabled:opacity-40 font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all cursor-pointer">
                      {loadingNutrition ? 'Analisando...' : 'Análise de Dieta IA'}
                    </button>
                  </div>

                  {nutritionAnalysis && (
                    <div className="mt-3 p-3.5 bg-[#070908] border border-[#18201a] rounded-xl">
                      <FormattedAIResponse content={nutritionAnalysis} />
                    </div>
                  )}

                  <div className="my-4 space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                    {meals.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-[#18201a] rounded-lg">
                        <p className="font-mono text-xs text-zinc-500">Nenhuma refeição registrada hoje.</p>
                      </div>
                    ) : (
                      meals.map((m) => (
                        <div key={m.id} className="bg-[#070908] p-3 rounded-lg flex justify-between items-center border border-[#18201a]">
                          <div>
                            <span className="font-medium text-xs text-zinc-100">{m.name}</span>
                            <span className="font-mono text-[10px] text-zinc-400 ml-2">({m.calories} kcal)</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[10px] text-[#2be29d] bg-[#18201a] px-2 py-0.5 rounded border border-[#18201a]">
                              P:{m.protein}g C:{m.carbs}g G:{m.fat}g
                            </span>
                            <button onClick={() => handleDeleteMeal(m.id)} className="text-zinc-500 hover:text-[#e05252] transition-colors p-1 cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="p-3 bg-[#070908] border border-[#18201a] rounded-lg flex justify-between items-center">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">TOTAL KCAL ACUMULADO</span>
                  <span className="font-mono text-sm font-bold text-[#2be29d]">{totalCalories} KCAL</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ ABA 3: GAMES ══════════ */}
        {activeTab === 'games' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#18201a] pb-4 gap-3">
              <div>
                <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">
                  Backlog de Jogos
                </h2>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#2be29d] mt-1">ARSENAL DIGITAL, METAS & REGISTRO DE CONQUISTAS</p>
              </div>
              <button
                onClick={handleRecommendNextGame}
                className="border border-pink-500/60 text-pink-400 hover:bg-pink-500/10 font-mono text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg transition-all flex items-center gap-2 shadow-[0_0_12px_rgba(236,72,153,0.15)] cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                RECOMENDAR PRÓXIMO JOGO
              </button>
            </div>

            {/* Modal de Recomendação do Próximo Jogo */}
            {recommendationModal && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#0e1210] border border-[#2be29d]/50 p-5 sm:p-6 rounded-2xl w-[95%] sm:w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar space-y-4 shadow-2xl relative">
                  <button
                    onClick={() => setRecommendationModal(null)}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 p-1 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-2 text-[#2be29d] font-mono text-xs uppercase tracking-widest border-b border-[#18201a] pb-2">
                    <Trophy className="w-4 h-4" />
                    <span>SUGESTÃO DE PRÓXIMO JOGO DO BACKLOG</span>
                  </div>

                  {recommendationModal.noGame ? (
                    <div className="py-6 text-center space-y-2">
                      <p className="text-sm text-zinc-300 font-medium">Nenhum jogo no seu backlog no momento!</p>
                      <p className="text-xs text-zinc-500">Adicione jogos com o status "Backlog" para usar o recomendador automático.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-full h-48 rounded-xl overflow-hidden border border-[#18201a]">
                        <GameCardCover src={recommendationModal.cover_image} title={recommendationModal.title} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-zinc-100">{recommendationModal.title}</h3>
                        <p className="font-mono text-[10px] text-[#2be29d] uppercase tracking-wider mt-0.5">STATUS: BACKLOG</p>
                      </div>

                      {recommendationModal.notes && (
                        <p className="text-xs text-zinc-400 italic bg-[#070908] p-3 rounded-lg border border-[#18201a]">
                          "{recommendationModal.notes}"
                        </p>
                      )}

                      <div className="pt-2 flex gap-2">
                        <button
                          onClick={() => setRecommendationModal(null)}
                          className="w-full py-2.5 bg-[#25d08e] text-[#070908] font-mono text-xs font-bold rounded-lg hover:bg-[#2be29d] transition-all cursor-pointer"
                        >
                          EXCELENTE, VOU JOGAR!
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal de Detalhes do Jogo & Conquistas */}
            {selectedGameDetails && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#0e1210] border border-[#18201a] p-5 sm:p-6 rounded-2xl w-[95%] sm:w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl relative custom-scrollbar">
                  <button
                    onClick={() => setSelectedGameDetails(null)}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 p-1 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex flex-col sm:flex-row gap-4 items-start pb-4 border-b border-[#18201a]">
                    <div className="w-full sm:w-32 h-40 rounded-xl overflow-hidden border border-[#18201a] shrink-0">
                      <GameCardCover src={selectedGameDetails.cover_image} title={selectedGameDetails.title} />
                    </div>
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded border ${
                          selectedGameDetails.status === 'Jogando'
                            ? 'bg-[#25d08e]/20 text-[#2be29d] border-[#2be29d]/40'
                            : selectedGameDetails.status === 'Zerado'
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                            : 'bg-zinc-900/80 text-zinc-400 border-[#18201a]'
                        }`}>
                          {selectedGameDetails.status}
                        </span>
                        <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                          {selectedGameDetails.steam_app_id ? 'PC (Steam)' : 'Digital'}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-zinc-100">{selectedGameDetails.title}</h3>
                      <p className="font-mono text-xs text-[#2be29d]">
                        TEMPO JOGADO: <span className="font-bold text-zinc-100">{selectedGameDetails.hours_played || 0} HRS</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#2be29d] block">
                      ANOTAÇÕES & NOTAS DE BUILD
                    </span>
                    <div className="bg-[#070908] p-3.5 rounded-xl border border-[#18201a]">
                      <p className="text-xs text-zinc-300 leading-relaxed font-mono">
                        {selectedGameDetails.notes || 'Nenhuma anotação de build cadastrada para este título.'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-[#18201a]">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-[#2be29d] flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-[#2be29d]" />
                        CONQUISTAS REAL TIME ({achievements.length})
                      </span>
                      <span className="font-mono text-[10px] text-zinc-500">
                        {selectedGameDetails.steam_app_id ? 'STEAM API V2' : 'SISTEMA LOCAL'}
                      </span>
                    </div>

                    {loadingAchievements ? (
                      <div className="py-8 text-center bg-[#070908] rounded-xl border border-[#18201a] space-y-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#25d08e] animate-ping mx-auto" />
                        <p className="font-mono text-xs text-[#2be29d] tracking-wider uppercase">BUSCANDO CONQUISTAS NA STEAM...</p>
                      </div>
                    ) : achievements.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                        {achievements.map((ach, idx) => (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-lg border flex items-start gap-3 transition-all ${
                              ach.achieved
                                ? 'bg-[#070908] border-[#2be29d]/40 text-zinc-100'
                                : 'bg-[#070908]/60 border-[#18201a] text-zinc-500 opacity-70'
                            }`}
                          >
                            {ach.icon ? (
                              <img
                                src={ach.icon}
                                alt={ach.name}
                                className="w-8 h-8 rounded border border-[#18201a] object-cover shrink-0 mt-0.5"
                              />
                            ) : (
                              <Trophy className={`w-6 h-6 shrink-0 mt-1 ${ach.achieved ? 'text-[#2be29d]' : 'text-zinc-600'}`} />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="font-mono text-xs font-bold truncate">{ach.name}</p>
                              <p className="text-[10px] text-zinc-400 line-clamp-2">{ach.description}</p>
                              <span className={`font-mono text-[9px] uppercase tracking-wider block mt-1 ${
                                ach.achieved ? 'text-[#2be29d] font-bold' : 'text-zinc-500'
                              }`}>
                                {ach.achieved ? 'DESBLOQUEADO' : 'BLOQUEADO'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center bg-[#070908] rounded-xl border border-[#18201a]">
                        <p className="font-mono text-xs text-zinc-500">Nenhuma conquista sincronizada via Steam API.</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#18201a] flex justify-end">
                    <button
                      onClick={() => setSelectedGameDetails(null)}
                      className="px-4 py-2 bg-[#18201a] hover:bg-[#25d08e]/20 text-[#2be29d] border border-[#2be29d]/40 font-mono text-xs font-semibold rounded-lg transition-all cursor-pointer"
                    >
                      FECHAR DETALHES
                    </button>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleAddGame} className="bg-[#0e1210] p-4 rounded-xl border border-[#18201a] space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <GameAutocomplete
                    onSelectGame={({ title, cover_image, steam_app_id }) =>
                      setGameForm((prev) => ({ ...prev, title, cover_image, steam_app_id }))
                    }
                  />
                </div>
                <select value={gameForm.status} onChange={(e) => setGameForm({ ...gameForm, status: e.target.value })} className={inputCls}>
                  <option value="Jogando">Jogando</option>
                  <option value="Backlog">Backlog</option>
                  <option value="Zerado">Zerados</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input type="text" placeholder="Anotações / Notas de Build" value={gameForm.notes}
                  onChange={(e) => setGameForm({ ...gameForm, notes: e.target.value })} className={`flex-1 ${inputCls}`} />
                <button type="submit" className="px-5 py-2.5 bg-[#25d08e] text-[#070908] font-bold rounded-lg hover:bg-[#2be29d] transition-all font-mono text-xs uppercase tracking-wider shrink-0 cursor-pointer">
                  + ADICIONAR
                </button>
              </div>
            </form>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0e1210] p-3 rounded-xl border border-[#18201a]">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#2be29d]">
                <Filter className="w-3.5 h-3.5" />
                <span>FILTRAR STATUS:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['TODOS', 'JOGANDO', 'BACKLOG', 'ZERADOS'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setGameFilter(filter)}
                    className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      gameFilter === filter
                        ? 'bg-[#18201a] text-[#2be29d] border-[#2be29d]/50 font-bold'
                        : 'bg-[#070908] text-zinc-400 border-[#18201a] hover:text-zinc-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredGames.length === 0 ? (
                <div className="col-span-full p-12 rounded-xl border border-[#18201a] bg-[#0e1210] text-center font-mono text-xs text-zinc-500">
                  Nenhum jogo encontrado neste filtro.
                </div>
              ) : (
                filteredGames.map((game) => {
                  const isCurrentSessionGame = activeGameSession?.gameId === game.id;

                  return (
                    <div
                      key={game.id}
                      onClick={() => setSelectedGameDetails(game)}
                      className={`group relative bg-[#0e1210] border rounded-xl overflow-hidden transition-all duration-200 flex flex-col justify-between cursor-pointer w-full ${
                        isCurrentSessionGame
                          ? 'border-[#2be29d] shadow-[0_0_15px_rgba(43,226,157,0.2)]'
                          : 'border-[#18201a] hover:border-[#2be29d]/40'
                      }`}
                    >
                      <div>
                        <div className="relative w-full h-44 bg-[#070908] overflow-hidden">
                          <GameCardCover src={game.cover_image} title={game.title} />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0e1210] via-transparent to-transparent pointer-events-none" />
                          
                          <span className={`absolute top-2.5 left-2.5 font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded border backdrop-blur-md ${
                            isCurrentSessionGame
                              ? 'bg-[#25d08e] text-[#070908] border-[#2be29d] font-bold animate-pulse'
                              : game.status === 'Jogando'
                              ? 'bg-[#25d08e]/20 text-[#2be29d] border-[#2be29d]/40'
                              : game.status === 'Zerado'
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                              : 'bg-zinc-900/80 text-zinc-400 border-[#18201a]'
                          }`}>
                            {isCurrentSessionGame ? 'EM SESSÃO' : game.status}
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGame(game.id);
                            }}
                            className="absolute top-2.5 right-2.5 p-1.5 rounded bg-[#070908]/80 text-zinc-400 hover:text-[#e05252] transition-all border border-[#18201a] cursor-pointer"
                            title="Remover"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="p-4 space-y-2">
                          <h3 className="font-semibold text-sm text-zinc-100 truncate" title={game.title}>{game.title}</h3>
                          <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                            PLATAFORMA: {game.steam_app_id ? 'PC (Steam)' : 'Digital'}
                          </p>

                          {game.notes && (
                            <p className="text-xs text-zinc-400 italic line-clamp-2 bg-[#070908] p-2 rounded border border-[#18201a]">
                              "{game.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="p-3 pt-0 space-y-2 border-t border-[#18201a]/60 mt-2">
                        <div className="flex justify-between items-center pt-2 font-mono text-[10px]">
                          <span className="text-zinc-500 uppercase">HORAS JOGADAS</span>
                          <span className="text-[#2be29d] font-bold">{game.hours_played || 0} HRS</span>
                        </div>

                        <div>
                          {isCurrentSessionGame ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEndSession();
                              }}
                              className="w-full py-2 bg-[#25d08e] text-[#070908] font-mono text-[10px] font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <Square className="w-3 h-3 fill-current" />
                              ENCERRAR SESSÃO ({formatElapsedTime(activeGameSession.elapsedSeconds)})
                            </button>
                          ) : activeGameSession ? (
                            <button
                              disabled
                              className="w-full py-2 bg-[#070908] text-zinc-600 border border-[#18201a] font-mono text-[10px] uppercase tracking-wider rounded opacity-50 cursor-not-allowed"
                            >
                              EM OUTRA SESSÃO
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartSession(game);
                              }}
                              className="w-full py-2 bg-[#18201a] hover:bg-[#25d08e]/20 text-[#2be29d] border border-[#2be29d]/40 rounded font-mono text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              ENTRAR EM SESSÃO
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGetGameTips(game.id);
                            }}
                            disabled={loadingGameTips[game.id]}
                            className="py-1.5 px-2 bg-[#070908] hover:bg-[#18201a] border border-[#18201a] rounded text-[10px] font-mono text-[#2be29d] transition-all truncate cursor-pointer"
                          >
                            {loadingGameTips[game.id] ? 'Buscando...' : 'Dicas de Build'}
                          </button>

                          {game.steam_app_id ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSyncSteam(game.id);
                              }}
                              disabled={syncingGameId === game.id}
                              className="py-1.5 px-2 bg-[#070908] hover:bg-[#18201a] border border-[#18201a] rounded text-[10px] font-mono text-zinc-300 transition-all truncate cursor-pointer"
                            >
                              {syncingGameId === game.id ? 'Sync...' : 'Sync Steam'}
                            </button>
                          ) : (
                            <span className="py-1.5 text-center text-[9px] font-mono text-zinc-600">Sem Steam</span>
                          )}
                        </div>

                        {gameTips[game.id] && (
                          <div className="mt-2 p-3 bg-[#070908] border border-[#18201a] rounded-lg">
                            <FormattedAIResponse content={gameTips[game.id]} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ══════════ ABA 4: CINE-BIO / CINEMA ══════════ */}
        {activeTab === 'cinema' && (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header da Aba Cine-Bio (Catálogo IMDb & Biblioteca) */}
            <div className="border-b border-[#18201a] pb-4">
              <h2 className="text-xl font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
                <Film className="w-5 h-5 text-[#2be29d]" />
                Cine-Bio (Catálogo IMDb & Biblioteca)
              </h2>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#2be29d] mt-1">
                ACERVO CINEMATOGRÁFICO, ANÁLISE DE IMPACTO & CRÍTICA TÁTICA
              </p>
            </div>

            {/* SEÇÃO 1: EXPLORAÇÃO / BUSCA NA API (ESTILO IMDB CATALOG) */}
            <div className="bg-[#0e1210] p-4 sm:p-5 rounded-2xl border border-[#18201a] space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#2be29d] font-mono text-xs font-bold uppercase tracking-wider">
                  <Search className="w-4 h-4 text-[#2be29d]" />
                  <span>EXPLORAR CATÁLOGO IMDB / OMDB API</span>
                </div>
                {catalogResults.length > 0 && (
                  <button
                    onClick={() => { setCatalogResults([]); setCatalogSearchQuery(''); }}
                    className="font-mono text-[10px] text-zinc-400 hover:text-zinc-100 cursor-pointer underline"
                  >
                    LIMPAR RESULTADOS
                  </button>
                )}
              </div>

              <form onSubmit={handleCatalogSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="🔍 Buscar filme ou série na OMDb (ex: Oppenheimer, Dune, Hades)..."
                    value={catalogSearchQuery}
                    onChange={(e) => setCatalogSearchQuery(e.target.value)}
                    className="w-full bg-[#070908] border border-[#18201a] px-4 py-2.5 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#2be29d] transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loadingCatalog}
                  className="bg-[#25d08e] hover:bg-[#2be29d] text-[#070908] font-mono text-xs font-bold px-5 py-2.5 rounded-xl transition-all uppercase tracking-wider flex items-center gap-2 shrink-0 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Search className="w-4 h-4" />
                  {loadingCatalog ? 'BUSCANDO...' : 'BUSCAR'}
                </button>
              </form>

              {/* GRADE DE RESULTADOS DA BUSCA (Grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4) */}
              {catalogResults.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest block">
                    RESULTADOS ENCONTRADOS NA OMDB ({catalogResults.length})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {catalogResults.map((item, idx) => {
                      const posterSrc = (item.Poster && item.Poster !== 'N/A') ? item.Poster : (item.poster || '');
                      const itemTitle = item.Title || item.title || 'Sem Título';
                      const itemYear = item.Year || item.year || '2024';
                      const itemType = (item.Type || item.media_type || 'movie').toUpperCase();
                      const categoryTag = itemType === 'SERIES' ? '[SERIES]' : '[MOVIE]';

                      return (
                        <div
                          key={item.imdbID || idx}
                          onClick={() => handleEvaluateFromCatalog(item)}
                          className="bg-[#070908] border border-[#18201a] hover:border-[#2be29d] rounded-xl overflow-hidden flex flex-col justify-between transition-all group shadow-md cursor-pointer hover:shadow-[0_0_15px_rgba(43,226,157,0.15)]"
                        >
                          <div>
                            <div className="relative w-full h-52 bg-[#0a0d0b] overflow-hidden">
                              <MoviePosterCover src={posterSrc} title={itemTitle} />
                              <span className="absolute top-2 left-2 font-mono text-[9px] text-[#2be29d] bg-[#070908]/90 border border-[#2be29d]/40 px-2 py-0.5 rounded font-bold backdrop-blur-sm">
                                {categoryTag}
                              </span>
                            </div>
                            <div className="p-3 space-y-1">
                              <h4 className="font-bold text-xs text-zinc-100 truncate group-hover:text-[#2be29d] transition-colors" title={itemTitle}>
                                {itemTitle}
                              </h4>
                              <div className="flex items-center justify-between font-mono text-[10px] text-zinc-400">
                                <span>{itemYear}</span>
                                <span className="text-[#2be29d] font-bold">
                                  {categoryTag}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="p-2.5 pt-0">
                            <button
                              type="button"
                              className="w-full py-2 bg-[#18201a] group-hover:bg-[#25d08e] text-[#2be29d] group-hover:text-[#070908] border border-[#2be29d]/40 rounded font-mono text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              + AVALIAR / ADICIONAR
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal de Cadastro de Novo Filme com Autocomplete OMDb */}
            {isAddMovieModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#0e1210] border border-[#18201a] p-5 sm:p-6 rounded-2xl w-[95%] sm:w-full max-w-xl max-h-[90vh] overflow-visible space-y-4 shadow-2xl relative">
                  <button
                    onClick={() => setIsAddMovieModalOpen(false)}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 p-1 cursor-pointer z-10"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-2 text-[#2be29d] font-mono text-xs uppercase tracking-widest border-b border-[#18201a] pb-2">
                    <Clapperboard className="w-4 h-4" />
                    <span>CADASTRAR PROTOCOLO CINE-BIO</span>
                  </div>

                  <form onSubmit={handleAddMovie} className="space-y-3 relative z-30">
                    <div className="relative">
                      <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 block mb-1">
                        BUSCAR FILME NA OMDB API
                      </label>
                      <MovieAutocomplete
                        onSelectMovie={(movie) =>
                          setMovieForm((prev) => ({
                            ...prev,
                            title: movie.title || '',
                            poster: movie.poster && movie.poster !== 'N/A' ? movie.poster : '',
                            year: movie.year || '',
                            runtime: movie.runtime || '120 min',
                            genre: movie.genre || 'Drama',
                            imdb_rating: movie.imdb_rating || '8.0',
                            imdb_id: movie.imdb_id || '',
                            media_type: movie.media_type || movie.type || 'movie',
                          }))
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 block mb-1">PRIORIDADE / STATUS</label>
                        <select
                          value={movieForm.status}
                          onChange={(e) => setMovieForm({ ...movieForm, status: e.target.value })}
                          className={`w-full ${inputCls}`}
                        >
                          <option value="ASSISTINDO">ASSISTINDO (Em andamento)</option>
                          <option value="COMPLETO">COMPLETO (Concluído)</option>
                          <option value="QUERO ASSISTIR">QUERO ASSISTIR (Watchlist / Planejado)</option>
                          <option value="DROPPED">DROPPED (Abandonado)</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 block mb-1">QUALIDADE DE VÍDEO</label>
                        <select
                          value={movieForm.video_quality}
                          onChange={(e) => setMovieForm({ ...movieForm, video_quality: e.target.value })}
                          className={`w-full ${inputCls}`}
                        >
                          <option value="4K">4K UHD HDR</option>
                          <option value="1080p">1080p Full HD</option>
                          <option value="720p">720p HD</option>
                        </select>
                      </div>
                    </div>

                    {/* Sliders de Notas dos 6 Eixos do Radar Chart */}
                    <div className="p-3 bg-[#070908] rounded-xl border border-[#18201a] space-y-2.5">
                      <span className="font-mono text-[10px] text-[#2be29d] uppercase tracking-widest block border-b border-[#18201a] pb-1">
                        SCORES DE AVALIAÇÃO TÁTICA (RADAR 6 EIXOS)
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-[10px]">
                        <div>
                          <label className="text-zinc-400 block mb-0.5">HISTÓRIA: <span className="text-[#2be29d] font-bold">{movieForm.plot_score}</span></label>
                          <input type="range" min="1" max="10" step="0.1" value={movieForm.plot_score}
                            onChange={(e) => setMovieForm({ ...movieForm, plot_score: Number(e.target.value) })} className="w-full accent-[#25d08e]" />
                        </div>
                        <div>
                          <label className="text-zinc-400 block mb-0.5">VISUAL: <span className="text-[#2be29d] font-bold">{movieForm.cinematography_score}</span></label>
                          <input type="range" min="1" max="10" step="0.1" value={movieForm.cinematography_score}
                            onChange={(e) => setMovieForm({ ...movieForm, cinematography_score: Number(e.target.value) })} className="w-full accent-[#25d08e]" />
                        </div>
                        <div>
                          <label className="text-zinc-400 block mb-0.5">ÁUDIO: <span className="text-[#2be29d] font-bold">{movieForm.sound_score}</span></label>
                          <input type="range" min="1" max="10" step="0.1" value={movieForm.sound_score}
                            onChange={(e) => setMovieForm({ ...movieForm, sound_score: Number(e.target.value) })} className="w-full accent-[#25d08e]" />
                        </div>
                        <div>
                          <label className="text-zinc-400 block mb-0.5">EMPOLGAÇÃO: <span className="text-[#2be29d] font-bold">{movieForm.pacing_score}</span></label>
                          <input type="range" min="1" max="10" step="0.1" value={movieForm.pacing_score}
                            onChange={(e) => setMovieForm({ ...movieForm, pacing_score: Number(e.target.value) })} className="w-full accent-[#25d08e]" />
                        </div>
                        <div>
                          <label className="text-zinc-400 block mb-0.5">IMPACTO: <span className="text-[#2be29d] font-bold">{movieForm.cognitive_score}</span></label>
                          <input type="range" min="1" max="10" step="0.1" value={movieForm.cognitive_score}
                            onChange={(e) => setMovieForm({ ...movieForm, cognitive_score: Number(e.target.value) })} className="w-full accent-[#25d08e]" />
                        </div>
                        <div>
                          <label className="text-zinc-400 block mb-0.5">INOVAÇÃO: <span className="text-[#2be29d] font-bold">{movieForm.originality_score}</span></label>
                          <input type="range" min="1" max="10" step="0.1" value={movieForm.originality_score}
                            onChange={(e) => setMovieForm({ ...movieForm, originality_score: Number(e.target.value) })} className="w-full accent-[#25d08e]" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 block mb-1">ANÁLISE / CRÍTICA DO OPERADOR</label>
                      <textarea
                        rows="2"
                        placeholder="Escreva suas observações críticas, lições estratégicas ou notas sobre a fotografia..."
                        value={movieForm.user_review}
                        onChange={(e) => setMovieForm({ ...movieForm, user_review: e.target.value })}
                        className={`w-full ${inputCls}`}
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-[#25d08e] text-[#070908] font-mono text-xs font-bold rounded-lg hover:bg-[#2be29d] transition-all uppercase tracking-wider cursor-pointer"
                    >
                      SALVAR PROTOCOLO CINE-BIO
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* SEÇÃO 2: SUA WATCHLIST & ACERVO PESSOAL (SALVOS NO BANCO SQLITE) */}
            <div className="flex items-center gap-2 text-[#2be29d] font-mono text-xs font-bold uppercase tracking-wider pt-2 border-t border-[#18201a]">
              <Film className="w-4 h-4 text-[#2be29d]" />
              <span>SUA WATCHLIST & ACERVO PESSOAL ({movies.length})</span>
            </div>

            {/* PAINEL SUPERIOR: RADAR CHART (6 EIXOS) & MÉTRICAS DEDICADAS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
              {/* Gráfico Radar 6 Eixos */}
              <div className="col-span-1 lg:col-span-6 bg-[#0e1210] p-4 sm:p-5 rounded-xl border border-[#18201a] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#18201a]">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#2be29d] flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#2be29d]" />
                    ANÁLISE RADAR (6 EIXOS TÁTICOS)
                  </span>
                  <span className="font-mono text-[10px] text-zinc-400 bg-[#070908] px-2 py-0.5 rounded border border-[#18201a]">
                    {selectedMovie ? selectedMovie.title : 'SELECIONE UM FILME'}
                  </span>
                </div>

                <MovieRadarChart scores={selectedMovie || (movies[0] ?? {})} />
              </div>

              {/* Detalhes do Filme Selecionado & Scores Numéricos */}
              <div className="col-span-1 lg:col-span-6 bg-[#0e1210] p-4 sm:p-5 rounded-xl border border-[#18201a] space-y-4 flex flex-col justify-between min-h-[320px]">
                {selectedMovie ? (
                  <div className="space-y-4">
                    <div className="flex gap-4 items-start pb-3 border-b border-[#18201a]">
                      <div className="w-24 h-32 rounded-lg overflow-hidden border border-[#18201a] shrink-0">
                        <MoviePosterCover src={selectedMovie.poster} title={selectedMovie.title} />
                      </div>
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[9px] text-[#2be29d] bg-[#25d08e]/20 border border-[#2be29d]/40 px-2 py-0.5 rounded font-bold uppercase">
                            {selectedMovie.status || 'PRIORITY'}
                          </span>
                          <span className="font-mono text-[9px] text-zinc-400 bg-[#070908] border border-[#18201a] px-2 py-0.5 rounded font-bold">
                            {selectedMovie.video_quality || '4K'}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-zinc-100 leading-tight">{selectedMovie.title}</h3>
                        <p className="font-mono text-[10px] text-zinc-400">
                          {selectedMovie.year} • {selectedMovie.runtime} • {selectedMovie.genre}
                        </p>
                        <div className="pt-1 flex items-center gap-2">
                          <span className="font-mono text-xs text-[#2be29d] bg-[#070908] px-2.5 py-1 rounded border border-[#18201a] font-bold flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current text-[#2be29d]" />
                            {selectedMovie.user_rating || 9.4} EXP. IMPACT
                          </span>
                          <span className="font-mono text-xs text-zinc-400">IMDb {selectedMovie.imdb_rating || '8.8'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Scores Numéricos nos 6 Eixos */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 font-mono text-[9px] text-center">
                      <div className="bg-[#070908] p-2 rounded border border-[#18201a]">
                        <span className="text-zinc-500 block">HISTÓRIA</span>
                        <span className="text-[#2be29d] font-bold text-xs">{selectedMovie.plot_score || 8.5}</span>
                      </div>
                      <div className="bg-[#070908] p-2 rounded border border-[#18201a]">
                        <span className="text-zinc-500 block">VISUAL</span>
                        <span className="text-[#2be29d] font-bold text-xs">{selectedMovie.cinematography_score || 9.0}</span>
                      </div>
                      <div className="bg-[#070908] p-2 rounded border border-[#18201a]">
                        <span className="text-zinc-500 block">ÁUDIO</span>
                        <span className="text-[#2be29d] font-bold text-xs">{selectedMovie.sound_score || 8.0}</span>
                      </div>
                      <div className="bg-[#070908] p-2 rounded border border-[#18201a]">
                        <span className="text-zinc-500 block">EMPOLGAÇÃO</span>
                        <span className="text-[#2be29d] font-bold text-xs">{selectedMovie.pacing_score || 8.0}</span>
                      </div>
                      <div className="bg-[#070908] p-2 rounded border border-[#18201a]">
                        <span className="text-zinc-500 block">IMPACTO</span>
                        <span className="text-[#2be29d] font-bold text-xs">{selectedMovie.cognitive_score || 9.2}</span>
                      </div>
                      <div className="bg-[#070908] p-2 rounded border border-[#18201a]">
                        <span className="text-zinc-500 block">INOVAÇÃO</span>
                        <span className="text-[#2be29d] font-bold text-xs">{selectedMovie.originality_score || 8.8}</span>
                      </div>
                    </div>

                    {/* Resenha / Análise do Operador */}
                    {selectedMovie.user_review && (
                      <div className="p-3 bg-[#070908] border border-[#18201a] rounded-xl font-mono text-xs text-zinc-300">
                        <span className="text-[9px] text-[#2be29d] uppercase block mb-1 font-bold">CRÍTICA TÁTICA:</span>
                        "{selectedMovie.user_review}"
                      </div>
                    )}

                    {/* Botão de Disparo Nativo Stremio */}
                    <button
                      onClick={() => handleOpenStremio(selectedMovie)}
                      className="w-full py-2.5 bg-[#25d08e] hover:bg-[#2be29d] text-[#070908] font-mono text-xs font-bold rounded-lg transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Film className="w-4 h-4 fill-current" />
                      🎬 ABRIR NO STREMIO
                    </button>
                  </div>
                ) : (
                  <div className="py-16 text-center border border-dashed border-[#18201a] rounded-xl space-y-2">
                    <Film className="w-8 h-8 text-zinc-600 mx-auto" />
                    <p className="font-mono text-xs text-zinc-500">Selecione um filme do acervo para exibir a análise radar e scores de impacto.</p>
                  </div>
                )}
              </div>
            </div>

            {/* BARRA DE FILTROS CINE-BIO */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0e1210] p-3 rounded-xl border border-[#18201a]">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#2be29d]">
                <Filter className="w-3.5 h-3.5" />
                <span>WATCHLIST & BACKLOG:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['TODOS', 'ASSISTINDO', 'COMPLETO', 'QUERO ASSISTIR', 'DROPPED'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setMovieFilter(filter)}
                    className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      movieFilter === filter
                        ? 'bg-[#18201a] text-[#2be29d] border-[#2be29d]/50 font-bold'
                        : 'bg-[#070908] text-zinc-400 border-[#18201a] hover:text-zinc-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* GRID DE CARDS RESPONSIVO (grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredMovies.map((movie) => {
                const isSelected = selectedMovie?.id === movie.id;

                return (
                  <div
                    key={movie.id}
                    onClick={() => setSelectedMovie(movie)}
                    className={`group relative bg-[#0e1210] border rounded-xl overflow-hidden transition-all duration-300 flex flex-col justify-between cursor-pointer w-full ${
                      isSelected
                        ? 'border-[#2be29d] shadow-[0_0_18px_rgba(43,226,157,0.25)]'
                        : 'border-[#18201a] hover:border-[#2be29d]/40'
                    }`}
                  >
                    <div>
                      <div className="relative w-full h-64 bg-[#070908] overflow-hidden">
                        <MoviePosterCover src={movie.poster} title={movie.title} />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1210] via-transparent to-transparent pointer-events-none" />

                        {/* Priority Badge no topo */}
                        <span className="absolute top-2.5 left-2.5 font-mono text-[9px] font-bold text-[#2be29d] bg-[#070908]/90 border border-[#2be29d]/40 px-2 py-0.5 rounded backdrop-blur-md">
                          {movie.priority_level || 'P1'}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMovie(movie.id);
                          }}
                          className="absolute top-2.5 right-2.5 p-1.5 rounded bg-[#070908]/80 text-zinc-400 hover:text-[#e05252] transition-all border border-[#18201a] cursor-pointer"
                          title="Deletar filme"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between font-mono text-[10px]">
                          <span className="text-[#2be29d] font-bold bg-[#070908] px-2 py-0.5 rounded border border-[#18201a]">
                            {movie.user_rating || 9.4} EXP. IMPACT
                          </span>
                          <span className="text-zinc-500">{movie.year}</span>
                        </div>

                        <h3 className="font-semibold text-sm text-zinc-100 truncate" title={movie.title}>
                          {movie.title}
                        </h3>

                        <p className="font-mono text-[10px] text-zinc-500 truncate">
                          {movie.genre || 'Biopic / Drama'}
                        </p>
                      </div>
                    </div>

                    {/* Badges Inferiores de Qualidade & Duração + Botão Stremio */}
                    <div className="p-3 pt-0 border-t border-[#18201a]/60 mt-2 space-y-2">
                      <div className="flex items-center justify-between font-mono text-[9px] pt-2">
                        <span className="text-zinc-400 bg-[#070908] px-2 py-0.5 rounded border border-[#18201a]">
                          {movie.video_quality || '4K'}
                        </span>
                        <span className="text-zinc-500 uppercase">
                          {movie.runtime || '120 MIN'}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenStremio(movie);
                        }}
                        className="w-full py-1.5 bg-[#18201a] hover:bg-[#25d08e]/20 text-[#2be29d] border border-[#2be29d]/40 rounded font-mono text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Film className="w-3 h-3 fill-current" />
                        🎬 ABRIR NO STREMIO
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════ ABA 5: ASSISTENTE IA ══════════ */}
        {activeTab === 'ai' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="border-b border-[#18201a] pb-4">
              <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">
                Painel de Comando IA
              </h2>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#2be29d] mt-1">SÍNTESE GENERATIVA, TELEMETRIA & DIAGNÓSTICO DE PERFORMANCE</p>
            </div>

            <div className="flex flex-wrap gap-3">
              {aiShortcuts.map((shortcut) => (
                <button
                  key={shortcut.label}
                  onClick={() => handleSendPrompt(null, shortcut.prompt)}
                  className="bg-[#0e1210] hover:bg-[#18201a] border border-[#18201a] hover:border-[#2be29d]/40 px-4 py-2.5 rounded-full text-left transition-all group flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#2be29d]" />
                  <span className="font-mono text-xs text-zinc-200 font-medium group-hover:text-zinc-100">{shortcut.label}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
              <div className="col-span-1 lg:col-span-8 space-y-4">
                <div className="bg-[#0e1210] p-4 sm:p-5 rounded-xl border border-[#18201a] min-h-[360px] flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#18201a]">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-[#2be29d]">RESPOSTA GERADA</span>
                      {loadingChat && (
                        <span className="font-mono text-[10px] uppercase tracking-widest text-[#2be29d] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#25d08e] animate-pulse" />
                          PROCESSANDO
                        </span>
                      )}
                    </div>

                    {chatResponse ? (
                      <div className="p-4 bg-[#070908] border border-[#18201a] rounded-xl">
                        <FormattedAIResponse content={chatResponse} />
                      </div>
                    ) : (
                      <div className="py-16 text-center border border-dashed border-[#18201a] rounded-xl">
                        <Bot className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                        <p className="font-mono text-xs text-zinc-500">Selecione um atalho rápido acima ou envie um comando personalizado abaixo.</p>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSendPrompt} className="relative pt-2">
                    <input
                      type="text"
                      placeholder="Comando ou dúvida..."
                      value={chatPrompt}
                      onChange={(e) => setChatPrompt(e.target.value)}
                      className="w-full bg-[#070908] border border-[#18201a] p-3.5 pr-14 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#2be29d] transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={loadingChat || !chatPrompt}
                      className="absolute right-2 top-3.5 p-2 bg-[#25d08e] hover:bg-[#2be29d] disabled:opacity-30 text-[#070908] rounded-lg transition-all cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>

              <div className="col-span-1 lg:col-span-4 space-y-4">
                <div className="bg-[#0e1210] p-4 sm:p-5 rounded-xl border border-[#18201a] space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#18201a]">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#2be29d]">FOCO ATUAL</span>
                    <Activity className="w-3.5 h-3.5 text-[#2be29d]" />
                  </div>

                  <div className="bg-[#070908] p-3.5 rounded-lg border border-[#18201a] space-y-2">
                    <div className="flex justify-between items-center font-mono text-[10px]">
                      <span className="text-zinc-400 uppercase">HIPERTROFIA</span>
                      <span className="text-[#e05252] font-bold">Fadiga SNC {exercises.length > 5 ? 'Alta 85%' : exercises.length > 2 ? 'Mod 55%' : 'Baixa 20%'}</span>
                    </div>
                    <div className="w-full bg-[#0e1210] h-1.5 rounded-full overflow-hidden border border-[#18201a]">
                      <div className="bg-[#e05252] h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(exercises.length * 15 + 20, 100)}%` }} />
                    </div>
                  </div>

                  <div className="bg-[#070908] p-3.5 rounded-lg border border-[#18201a] space-y-2">
                    <div className="flex justify-between items-center font-mono text-[10px]">
                      <span className="text-zinc-400 uppercase">GAME ATIVO</span>
                      <span className="text-[#2be29d] font-bold truncate max-w-[140px]">
                        {activeGame ? `${activeGame.title}` : 'Nenhum'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400">
                      <span>TEMPO REGISTRADO</span>
                      <span className="text-zinc-200">{activeGame ? `${activeGame.hours_played || 0} HRS` : '0 HRS'}</span>
                    </div>
                    <div className="w-full bg-[#0e1210] h-1.5 rounded-full overflow-hidden border border-[#18201a]">
                      <div className="bg-[#25d08e] h-full rounded-full transition-all duration-500" style={{ width: activeGame ? `${Math.min((activeGame.hours_played || 1) * 5, 100)}%` : '0%' }} />
                    </div>
                  </div>

                  <div className="bg-[#070908] p-3.5 rounded-lg border border-[#18201a] space-y-2.5">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 block pb-1 border-b border-[#18201a]">STATUS DE ENERGIA</span>
                    <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                      <div className="bg-[#0e1210] p-2 rounded border border-[#18201a]">
                        <span className="text-zinc-500 block">PROTEÍNA</span>
                        <span className="text-[#2be29d] font-bold">{totalProtein}g</span>
                      </div>
                      <div className="bg-[#0e1210] p-2 rounded border border-[#18201a]">
                        <span className="text-zinc-500 block">CARBOS</span>
                        <span className="text-[#2be29d] font-bold">{totalCarbs}g</span>
                      </div>
                      <div className="bg-[#0e1210] p-2 rounded border border-[#18201a]">
                        <span className="text-zinc-500 block">GORDURA</span>
                        <span className="text-[#e05252] font-bold">{totalFat}g</span>
                      </div>
                      <div className="bg-[#0e1210] p-2 rounded border border-[#18201a]">
                        <span className="text-zinc-500 block">KCAL RESTANTES</span>
                        <span className="text-zinc-200 font-bold">{Math.max(0, 3000 - totalCalories)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}