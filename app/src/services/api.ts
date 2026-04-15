// API client service

import type {
  GameState,
  LegalMove,
  MoveRequest,
  PlayerColor,
} from "../types/game";
import type { VariantRules } from "../types/variant";

const API_BASE_URL = (
  import.meta as { env?: Record<string, string | undefined> }
).env?.VITE_API_URL?.trim();
const CONFIG_ERROR_MESSAGE =
  "Game service is not configured. Please refresh the page or contact support.";
const SERVER_UNREACHABLE_MESSAGE =
  "Server is not responding right now. Please try again in a moment.";

class ApiClient {
  private baseUrl: string | null;

  constructor(baseUrl: string | undefined = API_BASE_URL) {
    this.baseUrl = baseUrl && baseUrl.length > 0 ? baseUrl : null;
  }

  private getBaseUrl(): string {
    if (!this.baseUrl) {
      throw new Error(CONFIG_ERROR_MESSAGE);
    }
    return this.baseUrl;
  }

  private async request<T>(
    endpoint: string,
    init: RequestInit,
    fallbackMessage: string,
  ): Promise<T> {
    const baseUrl = this.getBaseUrl();

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, init);

      if (!response.ok) {
        let detail: string | null = null;
        try {
          const errorData = await response.json();
          if (
            typeof errorData?.detail === "string" &&
            errorData.detail.trim().length > 0
          ) {
            detail = errorData.detail;
          }
        } catch {
          // No JSON body, fallback to a user-friendly message.
        }
        throw new Error(detail || fallbackMessage);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        return undefined as T;
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === CONFIG_ERROR_MESSAGE) {
          throw error;
        }

        if (
          error instanceof TypeError ||
          error.message.includes("Failed to fetch")
        ) {
          throw new Error(SERVER_UNREACHABLE_MESSAGE);
        }

        throw error;
      }

      throw new Error(fallbackMessage);
    }
  }

  async listVariants(): Promise<string[]> {
    const data = await this.request<{ variants: string[] }>(
      "/variants",
      {},
      "Could not load game variants. Please try again.",
    );
    return data.variants;
  }

  async getVariantRules(variant: string): Promise<VariantRules> {
    return this.request(
      `/variants/${variant}`,
      {},
      "Could not load variant rules. Please try again.",
    );
  }

  async createGame(
    variant: string = "standard",
    gameId?: string,
  ): Promise<GameState> {
    return this.request(
      "/games",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ variant, game_id: gameId }),
      },
      "Could not start a new game. Please try again.",
    );
  }

  async getGame(gameId: string): Promise<GameState> {
    return this.request(
      `/games/${gameId}`,
      {},
      "Could not load the game state. Please try again.",
    );
  }

  async rollDice(
    gameId: string,
  ): Promise<{
    dice: [number, number];
    legal_moves: LegalMove[];
    game_state: GameState;
    message?: string;
  }> {
    return this.request(
      `/games/${gameId}/roll`,
      {
        method: "POST",
      },
      "Could not roll the dice. Please try again.",
    );
  }

  async makeMove(
    gameId: string,
    move: MoveRequest,
  ): Promise<{
    success: boolean;
    explanations: string[];
    game_state: GameState;
  }> {
    return this.request(
      `/games/${gameId}/move`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(move),
      },
      "Could not make that move. Please try again.",
    );
  }

  async getLegalMoves(
    gameId: string,
  ): Promise<{ legal_moves: LegalMove[]; dice?: [number, number] }> {
    return this.request(
      `/games/${gameId}/legal-moves`,
      {},
      "Could not load legal moves. Please try again.",
    );
  }

  async setStartingPlayer(
    gameId: string,
    player: PlayerColor,
  ): Promise<GameState> {
    const data = await this.request<{ game_state: GameState }>(
      `/games/${gameId}/set-player`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ player }),
      },
      "Could not set the starting player. Please try again.",
    );
    return data.game_state;
  }

  async deleteGame(gameId: string): Promise<void> {
    await this.request(
      `/games/${gameId}`,
      {
        method: "DELETE",
      },
      "Could not close this game right now.",
    );
  }

  async aiMove(
    gameId: string,
    difficulty: string = "medium",
  ): Promise<{
    success: boolean;
    move?: LegalMove;
    message?: string;
    explanations: string[];
    game_state: GameState;
  }> {
    return this.request(
      `/games/${gameId}/ai-move?difficulty=${difficulty}`,
      {
        method: "POST",
      },
      "AI move failed. Please try again.",
    );
  }
}

export const api = new ApiClient();
