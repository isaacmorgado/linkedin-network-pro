import { z } from 'zod';

// ============================================================================
// User & Subscription Types
// ============================================================================

export const SubscriptionTierSchema = z.enum(['free', 'pro', 'elite']);
export type SubscriptionTier = z.infer<typeof SubscriptionTierSchema>;

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  fullName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  education: z.array(z.object({
    school: z.string(),
    degree: z.string().optional(),
    field: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })).default([]),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string().optional(),
    date: z.string().optional(),
    credentialId: z.string().optional(),
  })).default([]),
  experience: z.array(z.object({
    company: z.string(),
    role: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    bullets: z.array(z.string()).default([]),
    keywords: z.array(z.string()).default([]),
  })).default([]),
  projects: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    technologies: z.array(z.string()).default([]),
    url: z.string().url().optional(),
  })).default([]),
  skills: z.array(z.string()).default([]),
  subscriptionTier: SubscriptionTierSchema.default('free'),
  subscriptionExpiresAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// ============================================================================
// LinkedIn Profile Types
// ============================================================================

export const LinkedInProfileSchema = z.object({
  id: z.string(), // LinkedIn public identifier
  publicId: z.string().optional(),
  name: z.string(),
  headline: z.string().optional(),
  location: z.string().optional(),
  industry: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  photoUrl: z.string().url().optional(), // Alias for avatarUrl
  profileUrl: z.string().url().optional(), // LinkedIn profile URL
  about: z.string().optional(),
  currentRole: z.object({
    title: z.string(),
    company: z.string(),
  }).optional(), // Current employment position
  experience: z.array(z.object({
    company: z.string(),
    title: z.string(),
    duration: z.string().optional(),
    location: z.string().optional(),
  })).default([]),
  education: z.array(z.object({
    school: z.string(),
    degree: z.string().optional(),
    field: z.string().optional(),
    startYear: z.number().optional(),  // Year started (e.g., 2016)
    endYear: z.number().optional(),    // Year graduated (e.g., 2020, null if Present)
  })).default([]),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string().optional(),
    dateObtained: z.string().optional(),  // ISO date string
  })).default([]),
  skills: z.array(z.object({
    name: z.string(),
    endorsementCount: z.number().default(0),     // Number of endorsements
    endorsedBy: z.array(z.string()).default([]), // Array of profile IDs who endorsed
  })).default([]),
  connections: z.number().optional(),
  mutualConnections: z.array(z.string()).default([]),
  recentPosts: z.array(z.object({
    content: z.string(),
    date: z.string(),
    engagement: z.number().optional(),
  })).default([]),
  userPosts: z.array(z.object({
    content: z.string(),
    timestamp: z.string().datetime(),
    likes: z.number().default(0),
    comments: z.number().default(0),
  })).default([]),
  engagedPosts: z.array(z.object({
    authorId: z.string(),      // LinkedIn profile ID of post author
    authorName: z.string(),    // Display name of post author
    topic: z.string(),         // Post topic/content preview
    timestamp: z.string().datetime(),
    engagementType: z.enum(['comment', 'reaction', 'share']).optional(),
  })).default([]),
  recentActivity: z.array(z.object({
    preview: z.string(),       // Activity content preview
    timestamp: z.string().datetime().optional(),
    type: z.string().optional(), // Activity type (post, comment, share, etc.)
    url: z.string().url().optional(), // URL to the activity
  })).default([]),
  scrapedAt: z.string().datetime(),
});

export type LinkedInProfile = z.infer<typeof LinkedInProfileSchema>;

// ============================================================================
// Network Graph Types
// ============================================================================

export const ConnectionStatusSchema = z.enum(['connected', 'pending', 'not_contacted']);
export type ConnectionStatus = z.infer<typeof ConnectionStatusSchema>;

export const NetworkNodeSchema = z.object({
  id: z.string(),
  profile: LinkedInProfileSchema,
  status: ConnectionStatusSchema,
  degree: z.number().min(1).max(3), // 1st, 2nd, 3rd degree
  matchScore: z.number().min(0).max(100), // 0-100 percentage
  activityScore: z.number().optional(),
  lastContactedAt: z.string().datetime().optional(),
});

export type NetworkNode = z.infer<typeof NetworkNodeSchema>;

export const NetworkEdgeSchema = z.object({
  from: z.string(), // node ID
  to: z.string(),   // node ID
  weight: z.number().min(0.1).max(1.0), // Lower is better for Dijkstra
  relationshipType: z.enum(['mutual', 'colleague', 'school', 'unknown']).optional(),
});

export type NetworkEdge = z.infer<typeof NetworkEdgeSchema>;

export const ConnectionRouteSchema = z.object({
  targetId: z.string(),
  nodes: z.array(NetworkNodeSchema),
  edges: z.array(NetworkEdgeSchema),
  totalWeight: z.number(),
  successProbability: z.number().min(0).max(100), // Percentage
  computedAt: z.string().datetime(),
});

export type ConnectionRoute = z.infer<typeof ConnectionRouteSchema>;

// ============================================================================
// Watchlist Types
// ============================================================================

export const WatchlistPersonSchema = z.object({
  id: z.string().uuid(),
  profileId: z.string(),
  profile: LinkedInProfileSchema,
  bestRoute: ConnectionRouteSchema.optional(),
  matchScore: z.number().min(0).max(100),
  progress: z.object({
    connectedNodes: z.number(),
    totalNodes: z.number(),
    percentage: z.number().min(0).max(100),
  }),
  keywords: z.array(z.string()).default([]),
  notes: z.string().optional(),
  addedAt: z.string().datetime(),
  lastCheckedAt: z.string().datetime().optional(),
});

export type WatchlistPerson = z.infer<typeof WatchlistPersonSchema>;

export const WatchlistCompanySchema = z.object({
  id: z.string().uuid(),
  companyId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  logoUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  location: z.string().optional(),
  jobs: z.array(z.object({
    id: z.string(),
    title: z.string(),
    location: z.string().optional(),
    postedDate: z.string().optional(),
    url: z.string().url(),
  })).default([]),
  bestContact: WatchlistPersonSchema.optional(),
  addedAt: z.string().datetime(),
  lastCheckedAt: z.string().datetime().optional(),
});

export type WatchlistCompany = z.infer<typeof WatchlistCompanySchema>;

// ============================================================================
// Job Types
// ============================================================================

export const JobPostingSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  location: z.string().optional(),
  description: z.string(),
  requirements: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  salaryRange: z.string().optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead', 'executive']).optional(),
  jobType: z.enum(['full-time', 'part-time', 'contract', 'internship']).optional(),
  postedDate: z.string(),
  url: z.string().url(),
  source: z.enum(['linkedin', 'manual']),
  scrapedAt: z.string().datetime(),
});

export type JobPosting = z.infer<typeof JobPostingSchema>;

export const SavedJobSchema = z.object({
  id: z.string().uuid(),
  job: JobPostingSchema,
  tailoredResume: z.string().optional(), // PDF base64 or URL
  coverLetter: z.string().optional(),
  matchScore: z.number().min(0).max(100).optional(),
  applicationStatus: z.enum(['saved', 'applied', 'interview', 'rejected', 'accepted']).default('saved'),
  appliedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  savedAt: z.string().datetime(),
});

export type SavedJob = z.infer<typeof SavedJobSchema>;

// ============================================================================
// Message & Content Generation Types
// ============================================================================

export const PersonalizedMessageSchema = z.object({
  targetProfileId: z.string(),
  messageType: z.enum(['connection_request', 'follow_up', 'introduction']),
  content: z.string(),
  tone: z.enum(['professional', 'casual', 'enthusiastic', 'formal']).default('professional'),
  citations: z.array(z.object({
    fact: z.string(),
    source: z.string(), // e.g., "profile.about", "recentPosts[0]"
  })).default([]),
  validatedAt: z.string().datetime(),
  generatedAt: z.string().datetime(),
});

export type PersonalizedMessage = z.infer<typeof PersonalizedMessageSchema>;

export const CoverLetterSchema = z.object({
  jobId: z.string(),
  sections: z.object({
    opening: z.string(),
    body: z.array(z.string()),
    value: z.string(),
    closing: z.string(),
  }),
  fullText: z.string(),
  tone: z.enum(['professional', 'casual', 'enthusiastic', 'formal']).default('professional'),
  generatedAt: z.string().datetime(),
});

export type CoverLetter = z.infer<typeof CoverLetterSchema>;

// ============================================================================
// Notification Types
// ============================================================================

export const NotificationTypeSchema = z.enum([
  'job_alert',
  'connection_accepted',
  'message_follow_up',
  'activity_update',
  'system',
]);

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  type: NotificationTypeSchema,
  title: z.string(),
  message: z.string(),
  actionUrl: z.string().url().optional(),
  read: z.boolean().default(false),
  createdAt: z.string().datetime(),
});

export type Notification = z.infer<typeof NotificationSchema>;

export const NotificationPreferencesSchema = z.object({
  email: z.object({
    enabled: z.boolean().default(false),
    types: z.array(NotificationTypeSchema).default([]),
    frequency: z.enum(['instant', 'daily', 'weekly']).default('daily'),
  }),
  push: z.object({
    enabled: z.boolean().default(true),
    types: z.array(NotificationTypeSchema).default(['job_alert', 'connection_accepted']),
  }),
});

export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;

// ============================================================================
// Settings Types
// ============================================================================

export const ThemeSchema = z.object({
  mode: z.enum(['light', 'dark', 'system']).default('system'),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#0A66C2'), // LinkedIn blue
  blurIntensity: z.number().min(0).max(20).default(10),
  curvePreset: z.enum(['subtle', 'moderate', 'pronounced']).default('moderate'),
});

export type Theme = z.infer<typeof ThemeSchema>;

export const PrivacySettingsSchema = z.object({
  cloudSyncEnabled: z.boolean().default(false),
  autoSendEnabled: z.boolean().default(false), // Elite only
  analyticsEnabled: z.boolean().default(false),
  clearDataOnLogout: z.boolean().default(false),
});

export type PrivacySettings = z.infer<typeof PrivacySettingsSchema>;

export const AppSettingsSchema = z.object({
  theme: ThemeSchema,
  notifications: NotificationPreferencesSchema,
  privacy: PrivacySettingsSchema,
  panelPosition: z.object({
    x: z.number().default(100),
    y: z.number().default(100),
  }),
  panelSize: z.object({
    width: z.number().default(420),
    height: z.number().default(680),
  }),
});

export type AppSettings = z.infer<typeof AppSettingsSchema>;

// ============================================================================
// AI/LLM Types
// ============================================================================

export const AIRequestSchema = z.object({
  type: z.enum(['message', 'resume', 'cover_letter', 'rewrite']),
  context: z.record(z.any()), // Flexible context object
  tone: z.enum(['professional', 'casual', 'enthusiastic', 'formal']).optional(),
  maxTokens: z.number().optional(),
});

export type AIRequest = z.infer<typeof AIRequestSchema>;

// ============================================================================
// Storage Keys (for chrome.storage)
// ============================================================================

export const STORAGE_KEYS = {
  // Session storage (in-memory, sensitive)
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',

  // Local storage (persistent)
  USER_PROFILE: 'user_profile',
  APP_SETTINGS: 'app_settings',
  WATCHLIST_PEOPLE: 'watchlist_people',
  WATCHLIST_COMPANIES: 'watchlist_companies',
  SAVED_JOBS: 'saved_jobs',
  NOTIFICATIONS: 'notifications',

  // Session storage (temporary)
  CURRENT_ROUTE: 'current_route',
  TEMP_MESSAGE: 'temp_message',
} as const;

// ============================================================================
// Graph Interface for Universal Pathfinder
// ============================================================================

/**
 * Graph interface for universal pathfinder compatibility
 */
export interface Graph {
  /**
   * Get all 1st-degree connections for a user
   */
  getConnections(userId: string): NetworkNode[] | Promise<NetworkNode[]>;

  /**
   * Get mutual connections between two users
   */
  getMutualConnections?(userId1: string, userId2: string): NetworkNode[];

  /**
   * Bidirectional BFS pathfinding
   */
  bidirectionalBFS?(
    sourceId: string,
    targetId: string
  ): Promise<{
    path: NetworkNode[];
    probability: number;
    mutualConnections: number;
  } | null>;

  /**
   * Get a single node by ID
   */
  getNode?(nodeId: string): NetworkNode | null;
}
