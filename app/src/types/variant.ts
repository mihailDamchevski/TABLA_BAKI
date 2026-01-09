// Variant-related types

export interface VariantRules {
  variant: string;
  description?: string;
  board?: {
    points?: number;
    initial_setup?: Record<string, Record<string, number>>;
  };
  movement?: {
    direction?: Record<string, number>;
    must_use_all_dice?: boolean;
    doubles_uses?: number;
    combined_moves?: {
      normal?: boolean;
      enter?: boolean;
      bear_off?: boolean;
      description?: string;
    };
    description?: string;
  };
  hitting?: {
    can_hit?: boolean;
    send_to_bar?: boolean;
    pin_instead?: boolean;
    description?: string;
  };
  bearing_off?: {
    enabled?: boolean;
    all_in_outer_board?: boolean;
    description?: string;
  };
  forced_moves?: {
    must_use_all_dice?: boolean;
    must_use_higher_if_only_one?: boolean;
    description?: string;
  };
  [key: string]: any;
}
