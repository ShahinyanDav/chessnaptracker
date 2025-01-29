// Lichess API types and interfaces
export interface LichessGame {
  id: string;
  createdAt: number;
  moves: string;
  clocks?: number[];
  clock?: {
    initial: number;
    increment: number;
  };
  players: {
    white: {
      user: {
        name: string;
      };
      rating: number;
      aiLevel?: number;
    };
    black: {
      user: {
        name: string;
      };
      rating: number;
      aiLevel?: number;
    };
  };
  winner?: 'white' | 'black';
  speed: string;
  rated: boolean;
  initialFen?: string;
}

export interface LichessMove {
  move: string;
  clockWhite?: string;
  clockBlack?: string;
  timeSpentWhite?: string;
  timeSpentBlack?: string;
  moveNumber: number;
}

// Utility functions
function formatClockTime(centiseconds: number): string {
  const totalSeconds = Math.floor(centiseconds / 100);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function calculateTimeSpent(currentClock: string | undefined, previousClock: string | undefined, increment: number = 0): string | undefined {
  if (!currentClock || !previousClock) return undefined;
  
  const [currentMin, currentSec] = currentClock.split(':').map(Number);
  const [previousMin, previousSec] = previousClock.split(':').map(Number);
  
  const currentTotal = currentMin * 60 + currentSec;
  const previousTotal = previousMin * 60 + previousSec;
  
  const timeSpent = previousTotal - currentTotal + increment;
  
  if (timeSpent <= 0) return undefined;
  
  return `${timeSpent}s`;
}

// Main Lichess API function
export async function fetchLichessGames(
  username: string, 
  gameType: string = 'all',
  startDate?: string,
  endDate?: string
): Promise<any[]> {
  try {
    const startTimestamp = startDate ? new Date(startDate).getTime() : 0;
    const endTimestamp = endDate ? new Date(endDate).getTime() : Date.now();
    
    // Set perfType based on gameType
    let perfTypes = '';
    if (gameType === 'all') {
      perfTypes = '&perfType=blitz,rapid,classical';
    } else if (gameType === 'blitz') {
      perfTypes = '&perfType=blitz';
    } else if (gameType === 'rapid') {
      perfTypes = '&perfType=rapid';
    } else if (gameType === 'classical') {
      perfTypes = '&perfType=classical';
    }
    
    const dateParams = `&since=${Math.floor(startTimestamp)}&until=${Math.floor(endTimestamp)}`;
    
    const response = await fetch(
      `https://lichess.org/api/games/user/${username}?tags=true&clocks=true${perfTypes}${dateParams}`,
      { headers: { 'Accept': 'application/x-ndjson' } }
    );
    
    if (!response.ok) {
      throw new Error('No games found');
    }

    const text = await response.text();
    if (!text.trim()) {
      throw new Error('No games found');
    }

    const games = text.trim().split('\n').map(line => JSON.parse(line));
    
    const filteredGames = games
      .filter((game: LichessGame) => {
        return !game.initialFen || game.initialFen === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      })
      .filter((game: LichessGame) => {
        // Filter out games against AI
        if (game.players.white.aiLevel !== undefined || game.players.black.aiLevel !== undefined) {
          return false;
        }

        const opponent = game.players.white.user.name.toLowerCase() === username.toLowerCase()
          ? game.players.black.user.name.toLowerCase()
          : game.players.white.user.name.toLowerCase();
          
        // Filter out bots and engine accounts
        if (opponent.includes('bot') || opponent.includes('stockfish') || opponent.includes('engine')) {
          return false;
        }
        
        return true;
      })
      .map((game: LichessGame) => {
        const moves: LichessMove[] = [];
        const movesArray = game.moves.split(' ');
        let previousWhiteClock: string | undefined;
        let previousBlackClock: string | undefined;
        const increment = game.clock?.increment || 0;

        for (let i = 0; i < movesArray.length; i++) {
          const move = movesArray[i];
          if (move.trim()) {
            const isWhiteMove = i % 2 === 0;
            const currentClock = game.clocks && i < game.clocks.length ? formatClockTime(game.clocks[i]) : undefined;
            
            const moveObj: LichessMove = {
              move,
              moveNumber: Math.floor(i / 2) + 1,
              ...(isWhiteMove 
                ? { 
                    clockWhite: currentClock,
                    timeSpentWhite: calculateTimeSpent(currentClock, previousWhiteClock, increment)
                  }
                : {
                    clockBlack: currentClock,
                    timeSpentBlack: calculateTimeSpent(currentClock, previousBlackClock, increment)
                  }
              )
            };

            if (isWhiteMove) {
              previousWhiteClock = currentClock;
            } else {
              previousBlackClock = currentClock;
            }

            moves.push(moveObj);
          }
        }

        return {
          id: game.id,
          date: new Date(game.createdAt).toISOString(),
          whitePlayer: game.players.white.user.name,
          blackPlayer: game.players.black.user.name,
          result: game.winner 
            ? (game.winner === 'white' ? 'win' : 'loss')
            : 'draw',
          rating: game.players.white.rating,
          gameType: `${game.speed}${game.rated ? ' rated' : ' casual'}`,
          timeControl: game.clock ? `${game.clock.initial/60}+${game.clock.increment}` : '-',
          moves,
          expanded: false
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (filteredGames.length === 0) {
      throw new Error('No games found');
    }

    return filteredGames;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('No games found');
  }
}

export function openLichessPosition(gameId: string, moveNumber: number): void {
  window.open(`https://lichess.org/${gameId}#${moveNumber}`, '_blank');
}