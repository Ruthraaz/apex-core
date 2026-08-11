import React, { useState, useEffect, useRef } from 'react';
import { Film, Search, Star } from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000';

function MoviePosterImage({ src, title }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="w-10 h-14 bg-[#070908] border border-[#18201a] rounded flex items-center justify-center text-zinc-600 shrink-0">
        <Film className="w-5 h-5 text-[#2be29d]/40" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title}
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
      className="w-10 h-14 object-cover rounded border border-[#18201a] shrink-0"
    />
  );
}

export default function MovieAutocomplete({ onSelectMovie }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Fecha o dropdown ao clicar fora do componente
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Requisição dinâmica com Debounce de 300ms a partir de 2 caracteres
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/movies/search?query=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data || []);
          setIsOpen(true);
        }
      } catch (e) {
        console.error('Erro na busca de filmes OMDb:', e);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Handler de seleção do filme na lista suspensa com busca direta de detalhes por imdb_id
  const handleSelect = async (item) => {
    const imdbId = item.imdb_id || item.imdbID;
    const title = item.title || item.Title || '';
    setQuery(title);
    setIsOpen(false);
    setResults([]);

    if (imdbId) {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/movies/omdb-detail/${imdbId}`);
        if (res.ok) {
          const detail = await res.json();
          const selectedData = {
            title: detail.Title || title,
            poster: detail.Poster && detail.Poster !== 'N/A' ? detail.Poster : '',
            year: detail.Year || item.year || '',
            runtime: detail.Runtime || item.runtime || '120 min',
            genre: detail.Genre || item.genre || 'Drama',
            imdb_rating: detail.imdbRating || item.imdb_rating || '8.0',
            imdb_id: detail.imdbID || imdbId,
            media_type: detail.Type === 'series' ? 'series' : 'movie',
            type: detail.Type === 'series' ? 'series' : 'movie',
            plot: detail.Plot || '',
          };
          if (onSelectMovie) onSelectMovie(selectedData);
        } else {
          if (onSelectMovie) onSelectMovie(item);
        }
      } catch (e) {
        console.error('Erro ao buscar detalhes do filme por imdb_id:', e);
        if (onSelectMovie) onSelectMovie(item);
      } finally {
        setLoading(false);
      }
    } else {
      if (onSelectMovie) onSelectMovie(item);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (onSelectMovie) {
      onSelectMovie({ title: val });
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full z-40">
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar filme/série na OMDb ou digitar título manual (ex: Oppenheimer, Dune)..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
          className="w-full bg-[#070908] border border-[#18201a] p-3 pl-10 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#2be29d] transition-colors"
        />
        <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
        {loading && (
          <div className="absolute right-3 top-3.5">
            <span className="w-3 h-3 rounded-full bg-[#25d08e] animate-ping block" />
          </div>
        )}
      </div>

      {/* Dropdown de Autocomplete com z-[9999] e top-full */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-[9999] mt-1 max-h-60 overflow-y-auto bg-[#0e1210] border border-[#18201a] rounded-lg shadow-2xl divide-y divide-[#18201a] custom-scrollbar">
          {results.map((movie, idx) => {
            const isSeries = movie.media_type === 'series' || (movie.genre && movie.genre.toLowerCase().includes('series'));
            const categoryTag = isSeries ? '[SERIES]' : '[MOVIE]';

            return (
              <div
                key={idx}
                onClick={() => handleSelect(movie)}
                className="flex items-center gap-3 p-2 hover:bg-[#18201a] cursor-pointer transition-colors"
              >
                {/* Poster em Miniatura (w-10 h-14) */}
                <MoviePosterImage src={movie.poster} title={movie.title} />

                {/* Detalhes do Filme */}
                <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-zinc-100 text-sm truncate">{movie.title}</span>
                    <span className="font-mono text-[9px] text-[#2be29d] bg-[#070908] px-1.5 py-0.5 rounded border border-[#18201a] font-bold shrink-0">
                      {categoryTag}
                    </span>
                  </div>
                  <span className="text-xs text-[#2be29d] font-mono mt-0.5 flex items-center justify-between">
                    <span>{movie.year || '2024'} • {movie.runtime || '120 min'}</span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current text-[#2be29d]" />
                      {movie.imdb_rating || '8.0'}
                    </span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
