import React, { useState } from 'react';
import { Brain, Clock, ChevronRight as ChessKnight, Search, Loader2, ExternalLink, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { fetchLichessGames, openLichessPosition } from '../lichess';
import { fetchChessComGames, openChessComPosition } from '../chess-com';
import { Link } from 'react-router-dom';

type Platform = 'chess.com' | 'lichess.org';
type GameResult = 'win' | 'loss' | 'draw';
type GameType = 'blitz' | 'rapid' | 'classical' | 'all';
type SortType = 'time' | 'date';

interface Move {
  move: string;
  clockWhite?: string;
  clockBlack?: string;
  timeSpentWhite?: string;
  timeSpentBlack?: string;
  moveNumber: number;
}

interface Game {
  id: string;
  date: string;
  whitePlayer: string;
  blackPlayer: string;
  result: GameResult;
  rating: number;
  gameType: string;
  timeControl: string;
  moves?: Move[];
  clocks?: any[];
  expanded?: boolean;
  pgn?: string;
  whiteMoves?: { moveNumber: number; move: string; time?: string }[];
  blackMoves?: { moveNumber: number; move: string; time?: string }[];
}

function formatTimeSpent(seconds: string): string {
  const totalSeconds = parseInt(seconds);
  if (isNaN(totalSeconds)) return seconds;
  
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatMoveNotation(moveNumber: number, move: string, isWhite: boolean): string {
  return isWhite ? `${moveNumber}.${move}` : `${moveNumber}...${move}`;
}

function ChessNapTracker() {
  const [minTimeFilter, setMinTimeFilter] = useState<number>(20);
  const [username, setUsername] = useState('');
  const [platform, setPlatform] = useState<Platform>('chess.com');
  const [selectedGameType, setSelectedGameType] = useState<GameType>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [sortBy, setSortBy] = useState<SortType>('time');

  const gameTypes = platform === 'lichess.org' 
    ? ['all', 'blitz', 'rapid', 'classical'] as const
    : ['all', 'blitz', 'rapid'] as const;

  const handleMoveClick = (gameId: string, moveNumber: number, platform: Platform) => {
    if (platform === 'lichess.org') {
      openLichessPosition(gameId, moveNumber);
    } else if (platform === 'chess.com') {
      openChessComPosition(gameId, moveNumber);
    }
  };

  const fetchGames = async () => {
    if (!username) {
      setError('Please enter a username');
      return;
    }

    setIsLoading(true);
    setError('');
    setGames([]);

    try {
      const games = await (platform === 'chess.com' 
        ? fetchChessComGames(username, startDate, endDate, selectedGameType)
        : fetchLichessGames(username, selectedGameType, startDate, endDate));
      
      setGames(games);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch games. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSort = () => {
    setSortBy(prev => prev === 'time' ? 'date' : 'time');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <header className="bg-black/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-blue-400 hover:text-blue-300 flex items-center gap-2">
              <span>←</span>
              <span>Back to Tools</span>
            </Link>
            <h1 className="text-3xl font-bold">ChessNapTracker</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gray-800 rounded-2xl p-8 shadow-xl">
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* First column */}
                <div>
                  <label className="block">
                    <span className="text-gray-300 block mb-2">Username</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </label>
                </div>
                
                {/* Second column */}
                <div>
                  <span className="text-gray-300 block mb-2">Platform</span>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setPlatform('chess.com')}
                      className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                        platform === 'chess.com'
                          ? 'bg-blue-600 shadow-lg shadow-blue-500/30'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      Chess.com
                    </button>
                    <button
                      onClick={() => setPlatform('lichess.org')}
                      className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                        platform === 'lichess.org'
                          ? 'bg-blue-600 shadow-lg shadow-blue-500/30'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      Lichess.org
                    </button>
                  </div>
                </div>

                {/* Date range row - spans full width */}
                <div className="md:col-span-2">
                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-gray-300 block mb-2">Start Date</span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="text-gray-300 block mb-2">End Date</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <span className="text-gray-300 block mb-2">Game Type</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {gameTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedGameType(type)}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        selectedGameType === type
                          ? 'bg-blue-600 shadow-lg shadow-blue-500/30'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-center mb-8">
                <button
                  onClick={fetchGames}
                  disabled={isLoading}
                  className="flex items-center px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Wake Me Up
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="text-red-400 text-center mb-6">{error}</div>
              )}

              {games.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold">The moves you spent most time on</h3>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={toggleSort}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                      >
                        <span>Sort by {sortBy === 'time' ? 'Time Spent' : 'Date'}</span>
                        <ArrowUpDown className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-400">Min. Time (seconds):</label>
                        <input
                          type="number"
                          value={minTimeFilter}
                          onChange={(e) => setMinTimeFilter(Number(e.target.value))}
                          className="w-24 px-3 py-1 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="px-4 py-3 text-left">Date</th>
                          <th className="px-4 py-3 text-left">Players</th>
                          <th className="px-4 py-3 text-left">Time Control</th>
                          <th className="px-4 py-3 text-left">Move</th>
                          <th className="px-4 py-3 text-left">Time Spent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {games
                          .filter(game => game.moves || game.clocks)
                          .flatMap(game => {
                            const isWhite = game.whitePlayer.toLowerCase() === username.toLowerCase();
                            
                            if (platform === 'lichess.org' && game.moves) {
                              return game.moves
                                .filter((_, index) => isWhite ? index % 2 === 0 : index % 2 === 1)
                                .map(move => ({
                                  move: move.move,
                                  timeSpent: isWhite ? move.timeSpentWhite : move.timeSpentBlack,
                                  moveNumber: Math.floor(move.moveNumber),
                                  isWhite,
                                  linkMoveNumber: isWhite ? move.moveNumber * 2 - 1 : move.moveNumber * 2,
                                  date: game.date,
                                  players: `${game.whitePlayer} vs ${game.blackPlayer}`,
                                  timeControl: game.timeControl,
                                  gameId: game.id
                                }))
                                .filter(move => move.timeSpent && parseInt(move.timeSpent) >= minTimeFilter);
                            } else if (game.clocks) {
                              return game.clocks
                                .filter(clock => clock.isWhite === isWhite)
                                .map(clock => ({
                                  move: clock.moveText,
                                  timeSpent: clock.timeSpent,
                                  moveNumber: clock.moveNumber,
                                  isWhite,
                                  linkMoveNumber: isWhite ? clock.moveNumber * 2 - 1 : clock.moveNumber * 2,
                                  date: game.date,
                                  players: `${game.whitePlayer} vs ${game.blackPlayer}`,
                                  timeControl: game.timeControl,
                                  gameId: game.id
                                }))
                                .filter(clock => clock.timeSpent && parseInt(clock.timeSpent) >= minTimeFilter);
                            }
                            return [];
                          })
                          .sort((a, b) => {
                            if (sortBy === 'time') {
                              return parseInt(b.timeSpent!) - parseInt(a.timeSpent!);
                            } else {
                              return new Date(b.date).getTime() - new Date(a.date).getTime();
                            }
                          })
                          .map((highlight, index) => (
                            <tr 
                              key={`${highlight.gameId}-${highlight.moveNumber}`} 
                              className="border-b border-gray-700/50 hover:bg-gray-700/30 cursor-pointer"
                              onClick={() => handleMoveClick(highlight.gameId, highlight.linkMoveNumber, platform)}
                            >
                              <td className="px-4 py-3">
                                {format(new Date(highlight.date), 'MMM d, yyyy')}
                              </td>
                              <td className="px-4 py-3">
                                {highlight.players}
                              </td>
                              <td className="px-4 py-3">
                                {highlight.timeControl}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <span className="font-mono">
                                    {formatMoveNotation(highlight.moveNumber, highlight.move, highlight.isWhite)}
                                  </span>
                                  <ExternalLink className="w-3 h-3 opacity-50" />
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="flex items-center gap-1 text-red-400">
                                  <Clock className="w-4 h-4" />
                                  {formatTimeSpent(highlight.timeSpent!)}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ChessNapTracker;