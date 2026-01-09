import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type {
  MoveRequest,
  PlayerColor,
} from '../types/game';

// Query keys
export const gameKeys = {
  all: ['games'] as const,
  lists: () => [...gameKeys.all, 'list'] as const,
  list: (filters: string) => [...gameKeys.lists(), { filters }] as const,
  details: () => [...gameKeys.all, 'detail'] as const,
  detail: (id: string) => [...gameKeys.details(), id] as const,
  legalMoves: (id: string) => [...gameKeys.detail(id), 'legal-moves'] as const,
};

export const variantKeys = {
  all: ['variants'] as const,
  lists: () => [...variantKeys.all, 'list'] as const,
  detail: (name: string) => [...variantKeys.all, name] as const,
};

// Variants queries
export function useVariants() {
  return useQuery({
    queryKey: variantKeys.lists(),
    queryFn: async () => {
      const vars = await api.listVariants();
      // Sort variants: Portes, Plakoto, Fevga first, then rest alphabetically
      const priorityVariants = ['portes', 'plakoto', 'fevga'];
      return [
        ...priorityVariants.filter(v => vars.includes(v)),
        ...vars.filter(v => !priorityVariants.includes(v)).sort()
      ];
    },
    staleTime: Infinity, // Variants don't change
  });
}

export function useVariantRules(variant: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: variantKeys.detail(variant || ''),
    queryFn: () => api.getVariantRules(variant!),
    enabled: enabled && !!variant,
    staleTime: Infinity, // Rules don't change
  });
}

// Game queries
export function useGame(gameId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: gameKeys.detail(gameId || ''),
    queryFn: () => api.getGame(gameId!),
    enabled: enabled && !!gameId,
  });
}

export function useLegalMoves(gameId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: gameKeys.legalMoves(gameId || ''),
    queryFn: () => api.getLegalMoves(gameId!),
    enabled: enabled && !!gameId,
    refetchInterval: (query) => {
      // Refetch if game is active and no dice rolled yet
      const data = query.state.data;
      if (data && !data.dice) {
        return 1000; // Poll every second
      }
      return false;
    },
  });
}

// Game mutations
export function useCreateGame() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ variant, gameId }: { variant: string; gameId?: string }) =>
      api.createGame(variant, gameId),
    onSuccess: (data) => {
      // Invalidate and set the new game
      queryClient.setQueryData(gameKeys.detail(data.game_id), data);
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
    },
  });
}

export function useRollDice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (gameId: string) => api.rollDice(gameId),
    onSuccess: (data, gameId) => {
      // Update game state
      queryClient.setQueryData(gameKeys.detail(gameId), data.game_state);
      // Invalidate legal moves to refetch with new dice
      queryClient.invalidateQueries({ queryKey: gameKeys.legalMoves(gameId) });
    },
  });
}

export function useMakeMove() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ gameId, move }: { gameId: string; move: MoveRequest }) =>
      api.makeMove(gameId, move),
    onSuccess: (data, variables) => {
      // Update game state
      queryClient.setQueryData(gameKeys.detail(variables.gameId), data.game_state);
      // Invalidate legal moves
      queryClient.invalidateQueries({ queryKey: gameKeys.legalMoves(variables.gameId) });
    },
  });
}

export function useSetStartingPlayer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ gameId, player }: { gameId: string; player: PlayerColor }) =>
      api.setStartingPlayer(gameId, player),
    onSuccess: (data, variables) => {
      // Update game state
      queryClient.setQueryData(gameKeys.detail(variables.gameId), data);
      // Invalidate legal moves
      queryClient.invalidateQueries({ queryKey: gameKeys.legalMoves(variables.gameId) });
    },
  });
}

export function useAIMove() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ gameId, difficulty }: { gameId: string; difficulty: string }) =>
      api.aiMove(gameId, difficulty),
    onSuccess: (data, variables) => {
      // Update game state
      queryClient.setQueryData(gameKeys.detail(variables.gameId), data.game_state);
      // Invalidate legal moves
      queryClient.invalidateQueries({ queryKey: gameKeys.legalMoves(variables.gameId) });
    },
  });
}

export function useDeleteGame() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (gameId: string) => api.deleteGame(gameId),
    onSuccess: (_, gameId) => {
      // Remove game from cache
      queryClient.removeQueries({ queryKey: gameKeys.detail(gameId) });
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
    },
  });
}
