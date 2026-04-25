export type PremiumExperimentVariant = 'premium_access' | 'no_access';

export type PremiumExperimentAction =
  | 'paywall_viewed'
  | 'paywall_dismissed'
  | 'switch_to_paid_alpha_clicked'
  | 'attach_photo_attempted'
  | 'attach_photo_selected'
  | 'favorites_unlock_clicked'
  | 'meal_rating_tapped'
  | 'favorite_toggled';

type ExperimentField = `premiumExperiment_${PremiumExperimentVariant}_${PremiumExperimentAction}`;

export type DailyAnalytics = {
  date: string;
  mealsLogged: number;
  sessionsStarted: number;
  sessionsCompleted: number;
  sessionsAbandoned: number;
  clarificationsTotal: number;
  voiceModeSessions: number;
  voiceToggles: number;
  premiumUpsellClicks: number;
  totalCalories: number;
  totalSessionDuration: number;
  activeUsers: string[];
} & Partial<Record<ExperimentField, number>> & {
  sessionsStarted_premium_access?: number;
  sessionsStarted_no_access?: number;
  sessionsCompleted_premium_access?: number;
  sessionsCompleted_no_access?: number;
  totalSessionDuration_premium_access?: number;
  totalSessionDuration_no_access?: number;
  mealsLogged_premium_access?: number;
  mealsLogged_no_access?: number;
};

export type UserAnalytics = {
  uid: string;
  email?: string;
  lastActive: string;
  totalMeals: number;
  totalSessions: number;
  totalSessionsCompleted: number;
  activeDates: string[];
  premiumUpsellClicks?: number;
  premiumAccessExperimentId?: string;
  premiumAccessVariant?: PremiumExperimentVariant;
  premiumAccessAssignedAt?: string;
};
