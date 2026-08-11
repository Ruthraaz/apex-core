import React, { useState, useEffect, useRef } from 'react';

const API_BASE_URL = 'http://127.0.0.1:8000';

function AutocompleteCoverImage({ src, title }) {
    const [hasError, setHasError] = useState(false);

    if (!src || hasError) {
        return (
            <div className="w-10 h-12 bg-[#070908] border border-[#18201a] rounded flex items-center justify-center font-mono text-[9px] text-[#2be29d] font-bold text-center px-1 truncate">
                {title ? title.substring(0, 4).toUpperCase() : 'GAME'}
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={title}
            onError={() => setHasError(true)}
            className="w-10 h-12 object-cover rounded"
        />
    );
}

export default function GameAutocomplete({ onSelectGame, initialTitle = '' }) {
    const [query, setQuery] = useState(initialTitle);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/games/search-igdb?query=${encodeURIComponent(query)}`);
                const data = await res.json();
                setResults(data || []);
                setIsOpen(true);
            } catch (e) {
                console.error('Erro ao buscar no IGDB:', e);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (game) => {
        setQuery(game.title);
        setIsOpen(false);

        onSelectGame({
            title: game.title,
            cover_image: game.cover_image,
            steam_app_id: game.steam_app_id,
        });
    };

    return (
        <div ref={containerRef} className="relative w-full">
            <input
                type="text"
                placeholder="Buscar jogo no arsenal (IGDB)..."
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    onSelectGame({ title: e.target.value, cover_image: '', steam_app_id: null });
                }}
                onFocus={() => query.length >= 2 && setIsOpen(true)}
                className="w-full bg-[#070908] border border-[#18201a] px-3.5 py-2.5 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#2be29d] transition-colors"
                required
            />

            {loading && (
                <span className="absolute right-3 top-3 font-mono text-[10px] text-[#2be29d]">Buscando...</span>
            )}

            {isOpen && results.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-[#0e1210] border border-[#18201a] rounded-lg shadow-2xl max-h-64 overflow-y-auto">
                    {results.map((game, index) => (
                        <div
                            key={index}
                            onClick={() => handleSelect(game)}
                            className="flex items-center gap-3 p-2.5 hover:bg-[#18201a]/70 cursor-pointer transition border-b border-[#18201a]/60 last:border-none"
                        >
                            <AutocompleteCoverImage src={game.cover_image} title={game.title} />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-zinc-100 truncate">{game.title}</p>
                                {game.steam_app_id && (
                                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#2be29d] bg-[#070908] px-1.5 py-0.5 rounded border border-[#18201a] inline-block mt-0.5">
                                        Steam ID Available
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}