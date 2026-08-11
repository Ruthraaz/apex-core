import React, { useState, useEffect } from 'react';
import { loginWithSpotify, logoutSpotify, getStoredToken, getClientId, setClientId } from '../services/spotifyAuth';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Music, X, LogOut, Settings, ListMusic, Disc } from 'lucide-react';

export default function SpotifyWebPlayerModal({ isOpen, onClose }) {
  const [token, setToken] = useState(getStoredToken());
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylistUri, setSelectedPlaylistUri] = useState('');
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [customClientId, setCustomClientId] = useState(getClientId());
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setToken(getStoredToken());
  }, [isOpen]);

  // Fetch das playlists do usuário
  useEffect(() => {
    if (token && isOpen) {
      fetchUserPlaylists();
      fetchCurrentlyPlaying();
    }
  }, [token, isOpen]);

  // Polling a cada 4 segundos da faixa atual quando o modal estiver ativo e logado
  useEffect(() => {
    let interval = null;
    if (token && isOpen) {
      interval = setInterval(() => {
        fetchCurrentlyPlaying();
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [token, isOpen]);

  const fetchUserPlaylists = async () => {
    if (!token) return;
    setLoadingPlaylists(true);
    try {
      const res = await fetch('https://api.spotify.com/v1/me/playlists?limit=20', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data.items || []);
      } else if (res.status === 401) {
        logoutSpotify();
        setToken(null);
      }
    } catch (e) {
      console.error('Erro ao carregar playlists do Spotify:', e);
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const fetchCurrentlyPlaying = async () => {
    if (!token) return;
    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200) {
        const data = await res.json();
        if (data && data.item) {
          setCurrentTrack({
            title: data.item.name,
            artist: data.item.artists?.map((a) => a.name).join(', ') || 'Artista Desconhecido',
            albumCover: data.item.album?.images?.[0]?.url || '',
            durationMs: data.item.duration_ms,
            progressMs: data.progress_ms,
          });
          setIsPlaying(data.is_playing);
        }
      } else if (res.status === 24) {
        setCurrentTrack(null);
      }
    } catch (e) {
      console.error('Erro ao buscar faixa atual no Spotify:', e);
    }
  };

  const handlePlayPause = async () => {
    if (!token) return;
    const endpoint = isPlaying ? 'pause' : 'play';
    try {
      const res = await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok || res.status === 204) {
        setIsPlaying(!isPlaying);
        setTimeout(fetchCurrentlyPlaying, 500);
      }
    } catch (e) {
      console.error('Erro ao alterar play/pause:', e);
    }
  };

  const handleNext = async () => {
    if (!token) return;
    try {
      await fetch('https://api.spotify.com/v1/me/player/next', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setTimeout(fetchCurrentlyPlaying, 600);
    } catch (e) {
      console.error('Erro ao avançar faixa:', e);
    }
  };

  const handlePrevious = async () => {
    if (!token) return;
    try {
      await fetch('https://api.spotify.com/v1/me/player/previous', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setTimeout(fetchCurrentlyPlaying, 600);
    } catch (e) {
      console.error('Erro ao voltar faixa:', e);
    }
  };

  const handleVolumeChange = async (newVol) => {
    setVolume(newVol);
    if (!token) return;
    try {
      await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${newVol}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.error('Erro ao ajustar volume:', e);
    }
  };

  const handleSelectPlaylist = async (playlistUri) => {
    setSelectedPlaylistUri(playlistUri);
    if (!token || !playlistUri) return;
    try {
      await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ context_uri: playlistUri }),
      });
      setTimeout(fetchCurrentlyPlaying, 800);
    } catch (e) {
      console.error('Erro ao reproduzir playlist selecionada:', e);
    }
  };

  const handleSaveClientId = (e) => {
    e.preventDefault();
    setClientId(customClientId);
    setShowSettings(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:right-auto sm:bottom-6 sm:left-6 z-50 bg-[#0e1210] border border-[#18201a] p-4 sm:p-5 rounded-2xl w-[92%] sm:w-[420px] max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl space-y-4 backdrop-blur-md">
      {/* Header do Player */}
      <div className="flex items-center justify-between border-b border-[#18201a] pb-3 font-mono text-xs uppercase tracking-widest text-[#2be29d]">
        <span className="flex items-center gap-2 font-bold">
          <Music className="w-4 h-4 text-[#2be29d]" />
          SPOTIFY WEB CONTROLLER
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-zinc-500 hover:text-zinc-200 transition p-1 cursor-pointer"
            title="Configurar Client ID OAuth"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 font-mono text-[10px] bg-[#070908] px-2 py-0.5 rounded border border-[#18201a] transition cursor-pointer"
          >
            [ - ] MINIMIZAR
          </button>
        </div>
      </div>

      {/* Painel de Configurações de Credentials se ativado */}
      {showSettings && (
        <form onSubmit={handleSaveClientId} className="bg-[#070908] p-3 rounded-xl border border-[#18201a] space-y-2">
          <span className="font-mono text-[9px] text-[#2be29d] uppercase block">SPOTIFY CLIENT ID (OAUTH PKCE)</span>
          <input
            type="text"
            value={customClientId}
            onChange={(e) => setCustomClientId(e.target.value)}
            className="w-full bg-[#0e1210] border border-[#18201a] px-2.5 py-1.5 rounded text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#2be29d]"
            placeholder="Cole seu Spotify Client ID"
            required
          />
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="px-2.5 py-1 font-mono text-[10px] text-zinc-400 bg-transparent hover:text-zinc-200 cursor-pointer"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              className="px-3 py-1 font-mono text-[10px] font-bold text-[#070908] bg-[#25d08e] rounded hover:bg-[#2be29d] cursor-pointer"
            >
              SALVAR ID
            </button>
          </div>
        </form>
      )}

      {/* CONTEÚDO QUANDO NÃO AUTENTICADO */}
      {!token ? (
        <div className="py-6 text-center space-y-4 bg-[#070908] p-4 rounded-xl border border-[#18201a]">
          <Disc className="w-10 h-10 text-[#2be29d]/50 mx-auto animate-spin-slow" />
          <div className="space-y-1">
            <h4 className="font-semibold text-xs text-zinc-100">Conecte sua conta do Spotify</h4>
            <p className="font-mono text-[10px] text-zinc-500">
              Controle a reprodução de faixas e acesse suas playlists reais via API.
            </p>
          </div>
          <button
            onClick={loginWithSpotify}
            className="w-full py-2.5 bg-[#25d08e] text-[#070908] font-mono text-xs font-bold rounded-lg hover:bg-[#2be29d] transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Music className="w-4 h-4" />
            CONECTAR CONTA SPOTIFY
          </button>
        </div>
      ) : (
        /* CONTEÚDO QUANDO AUTENTICADO */
        <div className="space-y-4">
          {/* Faixa Atual / Player Active UI */}
          <div className="bg-[#070908] p-3.5 rounded-xl border border-[#18201a] flex items-center gap-3">
            {currentTrack?.albumCover ? (
              <img
                src={currentTrack.albumCover}
                alt={currentTrack.title}
                className="w-14 h-14 rounded-lg object-cover border border-[#18201a] shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-[#0e1210] border border-[#18201a] flex items-center justify-center shrink-0">
                <Disc className={`w-7 h-7 ${isPlaying ? 'text-[#2be29d] animate-spin' : 'text-zinc-600'}`} />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <span className="font-mono text-[9px] text-[#2be29d] uppercase tracking-wider block">
                {isPlaying ? '● TOCANDO AGORA' : 'PAUSADO'}
              </span>
              <p className="font-semibold text-xs text-zinc-100 truncate">
                {currentTrack?.title || 'Abra o Spotify no PC/Celular'}
              </p>
              <p className="font-mono text-[10px] text-zinc-400 truncate">
                {currentTrack?.artist || 'Dispositivo Ativo Necessário'}
              </p>
            </div>
          </div>

          {/* Controles de Reprodução (Previous, Play/Pause, Next) */}
          <div className="flex items-center justify-center gap-4 bg-[#070908] p-2 rounded-xl border border-[#18201a]">
            <button
              onClick={handlePrevious}
              className="p-2 text-zinc-400 hover:text-[#2be29d] transition cursor-pointer"
              title="Voltar Faixa"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={handlePlayPause}
              className="w-10 h-10 rounded-full bg-[#25d08e] hover:bg-[#2be29d] text-[#070908] flex items-center justify-center transition cursor-pointer shadow-sm"
              title={isPlaying ? 'Pausar' : 'Reproduzir'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
            <button
              onClick={handleNext}
              className="p-2 text-zinc-400 hover:text-[#2be29d] transition cursor-pointer"
              title="Avançar Faixa"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Slider de Volume */}
          <div className="flex items-center gap-3 bg-[#070908] px-3 py-2 rounded-xl border border-[#18201a]">
            {volume === 0 ? (
              <VolumeX className="w-4 h-4 text-zinc-500 shrink-0" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#2be29d] shrink-0" />
            )}
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-full h-1 bg-[#18201a] rounded-lg appearance-none cursor-pointer accent-[#25d08e]"
            />
            <span className="font-mono text-[10px] text-zinc-400 w-7 text-right">{volume}%</span>
          </div>

          {/* Dropdown de Playlists Pessoais */}
          <div className="space-y-1">
            <label className="font-mono text-[9px] uppercase tracking-widest text-[#2be29d] flex items-center gap-1.5">
              <ListMusic className="w-3 h-3 text-[#2be29d]" />
              SUAS PLAYLISTS DO SPOTIFY
            </label>
            {loadingPlaylists ? (
              <div className="text-center font-mono text-[10px] text-zinc-500 py-2">Carregando playlists...</div>
            ) : (
              <select
                value={selectedPlaylistUri}
                onChange={(e) => handleSelectPlaylist(e.target.value)}
                className="w-full bg-[#070908] border border-[#18201a] px-3 py-2 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-[#2be29d] transition-colors"
              >
                <option value="">Selecione uma playlist para tocar...</option>
                {playlists.map((pl) => (
                  <option key={pl.id} value={pl.uri}>
                    {pl.name} ({pl.tracks?.total || 0} faixas)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Sair da Conta */}
          <div className="pt-2 border-t border-[#18201a] flex justify-between items-center font-mono text-[10px]">
            <span className="text-zinc-500 uppercase">SESSÃO SPOTIFY CONECTADA</span>
            <button
              onClick={() => {
                logoutSpotify();
                setToken(null);
              }}
              className="text-[#e05252] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              DESCONECTAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
