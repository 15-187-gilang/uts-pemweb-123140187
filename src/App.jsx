import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [keyword, setKeyword] = useState('');
  const [mediaType, setMediaType] = useState('all');
  const [results, setResults] = useState([]);
  const [playlist, setPlaylist] = useState([]);
  const [sortBy, setSortBy] = useState('releaseDate');
  const [currentPreview, setCurrentPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const audioRef = useRef(null);

  // Sync darkMode dengan class body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.remove('light');
    } else {
      document.body.classList.add('light');
    }
  }, [darkMode]);

  // Load playlist
  useEffect(() => {
    const saved = localStorage.getItem('musicPlaylist');
    if (saved) setPlaylist(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('musicPlaylist', JSON.stringify(playlist));
  }, [playlist]);

  // Fetch iTunes API
  useEffect(() => {
    if (!keyword.trim()) {
      setResults([]);
      setLoading(false);
      setError('');
      return;
    }

    setLoading(true);
    setError('');

    const entity = mediaType === 'all' ? 'song,album' : mediaType;
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(keyword)}&media=music&entity=${entity}&limit=20`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.resultCount === 0) {
          setError('Tidak ditemukan hasil.');
          setResults([]);
        } else {
          const formatted = data.results.map(item => ({
            id: item.trackId || item.collectionId,
            type: item.kind === 'song' ? 'song' : 'album',
            artwork: item.artworkUrl100?.replace('100x100bb', '300x300bb') || 'https://via.placeholder.com/80/333/fff?text=No Image',
            trackName: item.trackName || item.collectionName,
            artist: item.artistName,
            price: item.trackPrice ?? item.collectionPrice ?? 0,
            previewUrl: item.previewUrl || '',
            releaseDate: item.releaseDate?.split('T')[0] || '',
          }));

          const sorted = formatted.sort((a, b) => {
            if (sortBy === 'price') return a.price - b.price;
            return new Date(b.releaseDate) - new Date(a.releaseDate);
          });

          setResults(sorted);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Gagal terhubung ke server. Coba lagi.');
        setLoading(false);
      });
  }, [keyword, mediaType, sortBy]);

  const addToPlaylist = (item) => {
    if (!playlist.find(p => p.id === item.id)) {
      setPlaylist([...playlist, item]);
    }
  };

  const removeFromPlaylist = (id) => {
    setPlaylist(playlist.filter(p => p.id !== id));
  };

  const playPreview = (url) => {
    if (!url) return;
    if (currentPreview === url && audioRef.current) {
      audioRef.current.pause();
      setCurrentPreview('');
    } else {
      setCurrentPreview(url);
    }
  };

  const toggleTheme = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <>
      {/* TOMBOL SUN/MOON AKTIF */}
      <button className="toggle-theme" onClick={toggleTheme} aria-label="Toggle theme">
        {darkMode ? 'Sun' : 'Moon'}
      </button>

      <div className="container">
        <h1>TuneFlow</h1>

        {/* Search Form */}
        <div className="card">
          <div className="input-group">
            <input
              type="text"
              placeholder="Cari lagu, album, atau artis..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="search-input"
            />
            <select value={mediaType} onChange={(e) => setMediaType(e.target.value)} className="select">
              <option value="all">Semua</option>
              <option value="song">Lagu</option>
              <option value="album">Album</option>
            </select>
          </div>

          <div style={{ textAlign: 'center' }}>
            <label style={{ marginRight: '0.5rem', fontWeight: 500 }}>Urutkan:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="select">
              <option value="releaseDate">Tanggal Rilis</option>
              <option value="price">Harga</option>
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="card">
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Hasil Pencarian</h2>

          {loading && (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="spinner"></div>
              <p style={{ marginTop: '1rem' }}>Mencari di iTunes...</p>
            </div>
          )}

          {error && !loading && (
            <p className="empty-state" style={{ color: '#feb2b2' }}>{error}</p>
          )}

          {!loading && !error && results.length === 0 && keyword && (
            <p className="empty-state">Tidak ada hasil untuk "<strong>{keyword}</strong>"</p>
          )}

          {!loading && !error && results.length > 0 && (
            <table className="table">
              <thead>
                <tr>
                  <th></th>
                  <th>Judul</th>
                  <th>Artis</th>
                  <th>Harga</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {results.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <img src={item.artwork} alt="cover" className="artwork" />
                    </td>
                    <td>
                      <strong>{item.trackName}</strong>
                      {item.type === 'album' && <small style={{ display: 'block', opacity: 0.7 }}>Album</small>}
                    </td>
                    <td>{item.artist}</td>
                    <td>
                      {item.price > 0 ? `$${item.price.toFixed(2)}` : '—'}
                    </td>
                    <td>
                      {item.type === 'song' && item.previewUrl && (
                        <button onClick={() => playPreview(item.previewUrl)} className="btn btn-play">
                          {currentPreview === item.previewUrl ? 'Pause' : 'Play'} Play
                        </button>
                      )}
                      <button
                        onClick={() => addToPlaylist(item)}
                        className={`btn ${playlist.some(p => p.id === item.id) ? 'btn-disabled' : 'btn-add'}`}
                        disabled={playlist.some(p => p.id === item.id)}
                      >
                        {playlist.some(p => p.id === item.id) ? 'Ditambahkan Check' : 'Add +'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Audio Player */}
        {currentPreview && (
          <audio
            ref={audioRef}
            src={currentPreview}
            controls
            autoPlay
            className="audio-player"
            onEnded={() => setCurrentPreview('')}
          />
        )}

        {/* Playlist */}
        <div className="card">
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>
            Playlist Saya ({playlist.length})
          </h2>
          {playlist.length === 0 ? (
            <p className="empty-state">Belum ada lagu di playlist. Cari dan tambahkan!</p>
          ) : (
            <div>
              {playlist.map((item) => (
                <div key={item.id} className="playlist-item">
                  <img src={item.artwork} alt="cover" className="artwork" />
                  <div className="playlist-info">
                    <strong>{item.trackName}</strong>
                    <small>{item.artist}</small>
                  </div>
                  <button onClick={() => removeFromPlaylist(item.id)} className="btn btn-remove">
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;