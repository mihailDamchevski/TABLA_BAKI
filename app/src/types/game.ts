// Game-related types

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

export type GameMode = 'local' | 'ai';
export type AIDifficulty = 'easy' | 'medium' | 'hard';
export type PlayerColor = 'white' | 'black';

export interface MoveAnimation {
  from_point: number;
  to_point: number;
  move_type: string;
}
