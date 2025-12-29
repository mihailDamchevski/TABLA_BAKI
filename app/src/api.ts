// API client for backgammon game

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface PointData {
  number: number;
  white_pieces: number;
  black_pieces: number;
}

export interface BoardState {
  points: PointData[];
  bar_white: number;
  bar_black: number;
  borne_off_white: number;
  borne_off_black: number;
  current_player: string | null;
  dice: [number, number] | null;
  game_over: boolean;
  winner: string | null;
}

export interface LegalMove {
  move_type: string;
  from_point: number | null;
  to_point: number | null;
  die_value: number;
}

export interface GameState {
  game_id: string;
  variant: string;
  board: BoardState;
  legal_moves: LegalMove[];
  can_roll: boolean;
}

export interface MoveRequest {
  from_point?: number | null;
  to_point?: number | null;
  move_type: string;
  die_value?: number | null;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async listVariants(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/variants`);
    const data = await response.json();
    return data.variants;
  }

  async createGame(variant: string = 'standard', gameId?: string): Promise<GameState> {
    const response = await fetch(`${this.baseUrl}/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ variant, game_id: gameId }),
    });
    if (!response.ok) {
      throw new Error('Failed to create game');
    }
    return response.json();
  }

  async getGame(gameId: string): Promise<GameState> {
    const response = await fetch(`${this.baseUrl}/games/${gameId}`);
    if (!response.ok) {
      throw new Error('Failed to get game');
    }
    return response.json();
  }

  async rollDice(gameId: string): Promise<{ dice: [number, number]; legal_moves: LegalMove[]; game_state: GameState }> {
    const response = await fetch(`${this.baseUrl}/games/${gameId}/roll`, {
      method: 'POST',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to roll dice');
    }
    return response.json();
  }

  async makeMove(gameId: string, move: MoveRequest): Promise<{ success: boolean; explanations: string[]; game_state: GameState }> {
    const response = await fetch(`${this.baseUrl}/games/${gameId}/move`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(move),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to make move');
    }
    return response.json();
  }

  async getLegalMoves(gameId: string): Promise<{ legal_moves: LegalMove[]; dice?: [number, number] }> {
    const response = await fetch(`${this.baseUrl}/games/${gameId}/legal-moves`);
    if (!response.ok) {
      throw new Error('Failed to get legal moves');
    }
    return response.json();
  }

  async setStartingPlayer(gameId: string, player: 'white' | 'black'): Promise<GameState> {
    const response = await fetch(`${this.baseUrl}/games/${gameId}/set-player`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ player }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to set starting player');
    }
    const data = await response.json();
    return data.game_state;
  }

  async deleteGame(gameId: string): Promise<void> {
    await fetch(`${this.baseUrl}/games/${gameId}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();

