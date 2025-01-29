export interface ChessComGame {
  url: string;
  pgn: string;
  end_time: number;
  time_control: string;
  time_class: string;
  rated: boolean;
  rules: string;
  white: {
    username: string;
    rating: number;
    result: string;
  };
  black: {
    username: string;
    rating: number;
    result: string;
  };
  initial_setup?: string;
}

interface ClockInfo {
  time: string;
  moveText: string;
  moveNumber: number;
  isWhite: boolean;
  timeSpent?: string;
}

function parseClockComment(comment: string): string | null {
  const match = comment.match(/\[%clk\s+(\d+):(\d+):(\d+(?:\.\d+)?)\]/);
  if (match) {
    const [_, hours, minutes, seconds] = match;
    return `${hours}:${minutes}:${Math.floor(parseFloat(seconds))}`;
  }
  return null;
}

function calculateTimeSpent(currentTime: string, previousTime: string): string | undefined {
  const [currentHours, currentMinutes, currentSeconds] = currentTime.split(':').map(Number);
  const [previousHours, previousMinutes, previousSeconds] = previousTime.split(':').map(Number);
  
  const currentTotal = currentHours * 3600 + currentMinutes * 60 + currentSeconds;
  const previousTotal = previousHours * 3600 + previousMinutes * 60 + previousSeconds;
  
  const timeSpent = previousTotal - currentTotal;
  return timeSpent > 0 ? timeSpent.toString() : undefined;
}

export function formatPGN(pgn: string): { text: string; clocks: ClockInfo[] } {
  // Remove header information
  const moves = pgn.replace(/\[.*?\]\s*\n/g, '').trim();
  
  // Split into moves while preserving clock comments
  const movePattern = /(\d+\.(?:\.\.)?\s*\S+(?:\s*\{[^}]*\})?)/g;
  const clockPattern = /\{([^}]*)\}/;
  const formattedMoves: string[] = [];
  const clocks: ClockInfo[] = [];
  
  let match;
  let currentMoveNumber = 1;
  let isWhiteMove = true;
  let previousWhiteTime: string | null = null;
  let previousBlackTime: string | null = null;

  while ((match = movePattern.exec(moves)) !== null) {
    const moveText = match[1];
    const clockMatch = moveText.match(clockPattern);
    
    if (clockMatch) {
      const clockComment = clockMatch[1];
      const clock = parseClockComment(clockComment);
      if (clock) {
        const cleanMove = moveText.replace(clockPattern, '').trim();
        formattedMoves.push(cleanMove);
        
        // Calculate time spent
        let timeSpent: string | undefined;
        if (isWhiteMove && previousWhiteTime) {
          timeSpent = calculateTimeSpent(clock, previousWhiteTime);
        } else if (!isWhiteMove && previousBlackTime) {
          timeSpent = calculateTimeSpent(clock, previousBlackTime);
        }

        clocks.push({
          time: clock,
          moveText: cleanMove.replace(/^\d+\.\.?\.?\s*/, ''),
          moveNumber: currentMoveNumber,
          isWhite: isWhiteMove,
          timeSpent
        });

        if (isWhiteMove) {
          previousWhiteTime = clock;
        } else {
          previousBlackTime = clock;
          currentMoveNumber++;
        }
        isWhiteMove = !isWhiteMove;
      }
    } else {
      formattedMoves.push(moveText);
      if (!isWhiteMove) {
        currentMoveNumber++;
      }
      isWhiteMove = !isWhiteMove;
    }
  }

  return {
    text: formattedMoves.join(' '),
    clocks
  };
}

export function parseTimeControl(timeControl: string): string {
  // Handle daily games
  if (timeControl === '1/86400') return '1 day';
  if (timeControl === '1/259200') return '3 days';
  if (timeControl === '1/432000') return '5 days';
  if (timeControl === '1/604800') return '7 days';
  if (timeControl === '1/1209600') return '14 days';

  // Handle standard time controls
  const [baseTime, increment] = timeControl.split('+').map(Number);
  if (!isNaN(baseTime)) {
    const minutes = Math.floor(baseTime / 60);
    const seconds = baseTime % 60;
    
    let timeStr = '';
    if (minutes > 0) {
      timeStr += `${minutes}`;
      if (seconds > 0) timeStr += `:${seconds.toString().padStart(2, '0')}`;
    } else {
      timeStr += `${seconds}s`;
    }
    
    // Always show increment, use +0 if no increment
    timeStr += `+${!isNaN(increment) ? increment : '0'}`;
    
    return timeStr;
  }

  return '-';
}

export async function fetchChessComGames(
  username: string,
  startDate?: string,
  endDate?: string,
  gameType: string = 'all'
): Promise<any[]> {
  try {
    const startTimestamp = startDate ? new Date(startDate).getTime() / 1000 : 0;
    const endTimestamp = endDate ? new Date(endDate).getTime() / 1000 : Infinity;

    // Fetch archives
    const response = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`);
    if (!response.ok) {
      throw new Error('No games found');
    }
    
    const data = await response.json();
    if (!data || !data.archives || !Array.isArray(data.archives)) {
      throw new Error('No games found');
    }

    // Get all archives that might contain games within the date range
    const relevantArchives = data.archives
      .filter((archiveUrl: string) => {
        try {
          const [year, month] = archiveUrl.split('/').slice(-2);
          // Create date for the first day of the month
          const archiveStartDate = new Date(parseInt(year), parseInt(month) - 1, 1);
          // Create date for the last day of the month
          const archiveEndDate = new Date(parseInt(year), parseInt(month), 0);
          
          const archiveStartTimestamp = archiveStartDate.getTime() / 1000;
          const archiveEndTimestamp = archiveEndDate.getTime() / 1000;

          // Include archive if there's any overlap with the requested date range
          return (
            (archiveStartTimestamp <= endTimestamp && archiveEndTimestamp >= startTimestamp) ||
            (archiveStartTimestamp >= startTimestamp && archiveStartTimestamp <= endTimestamp) ||
            (archiveEndTimestamp >= startTimestamp && archiveEndTimestamp <= endTimestamp)
          );
        } catch (e) {
          console.error('Error processing archive URL:', e);
          return false;
        }
      })
      .reverse();

    // Fetch games from all relevant archives
    const allGames = [];
    for (const archiveUrl of relevantArchives) {
      try {
        const gamesResponse = await fetch(archiveUrl);
        if (!gamesResponse.ok) {
          console.error(`Failed to fetch games from archive ${archiveUrl}`);
          continue;
        }
        
        const gamesData = await gamesResponse.json();
        if (gamesData && gamesData.games) {
          allGames.push(...gamesData.games);
        }
      } catch (e) {
        console.error(`Error fetching games from archive ${archiveUrl}:`, e);
        continue;
      }
    }

    // Filter and process games
    const filteredGames = allGames
      .filter((game: ChessComGame) => {
        if (!game || !game.end_time) return false;
        const gameTimestamp = game.end_time;
        return gameTimestamp >= startTimestamp && gameTimestamp <= endTimestamp;
      })
      .filter((game: ChessComGame) => {
        if (gameType === 'all') {
          return ['blitz', 'rapid'].includes(game.time_class);
        }
        return game.time_class === gameType;
      })
      .filter((game: ChessComGame) => {
        // Only include standard chess games (exclude variants)
        return !game.rules || game.rules === 'chess';
      })
      .filter((game: ChessComGame) => {
        // Check if game starts from standard position
        return !game.initial_setup || game.initial_setup === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      })
      .filter((game: ChessComGame) => {
        // Filter out games against bots (Chess.com bots have "@bot" in their usernames)
        const opponent = game.white.username.toLowerCase() === username.toLowerCase() 
          ? game.black.username.toLowerCase()
          : game.white.username.toLowerCase();
        return !opponent.includes('bot') && !opponent.includes('computer');
      })
      .map((game: ChessComGame) => {
        const isWhite = game.white.username.toLowerCase() === username.toLowerCase();
        const playerRating = isWhite ? game.white.rating : game.black.rating;
        
        let result: 'win' | 'loss' | 'draw' = 'draw';
        if (game.white.result === 'win') {
          result = isWhite ? 'win' : 'loss';
        } else if (game.black.result === 'win') {
          result = isWhite ? 'loss' : 'win';
        }

        const { text: formattedPgn, clocks } = formatPGN(game.pgn || '');

        return {
          id: game.url,
          date: new Date(game.end_time * 1000).toISOString(),
          whitePlayer: game.white.username,
          blackPlayer: game.black.username,
          result,
          rating: playerRating,
          gameType: `${game.time_class}${game.rated ? ' rated' : ' casual'}`,
          timeControl: parseTimeControl(game.time_control),
          pgn: formattedPgn,
          clocks,
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

export function openChessComPosition(gameUrl: string, moveNumber: number): void {
  // Extract the game ID from the URL
  const extractedId = gameUrl.split('/').pop()?.split('?')[0];
  if (extractedId) {
    window.open(`https://www.chess.com/analysis/game/live/${extractedId}?tab=review&move=${moveNumber}`, '_blank');
  }
}