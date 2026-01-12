import { z } from 'zod';

/**
 * Zod validation schemas for subscription data
 * Ensures data integrity and provides type-safe validation
 */

export const subscriptionCategorySchema = z.enum(['IA', 'Productivité', 'Design', 'Vidéo', 'Audio', 'Autre']);

export const billingCycleSchema = z.enum(['monthly', 'annual']);

export const currencySchema = z.enum(['EUR', 'USD', 'GBP', 'CAD', 'CHF']);

/**
 * Schema for creating a new subscription
 */
export const createSubscriptionSchema = z.object({
  name: z
    .string()
    .min(1, 'Subscription name is required')
    .max(100, 'Subscription name must be less than 100 characters'),
  icon: z.string().min(1, 'Icon is required'),
  renewal_day: z.number().int().min(1).max(31),
  renewal_month: z.number().int().min(1).max(12).optional(),
  price: z.number().nonnegative('Price must be a positive number'),
  credits_total: z.number().int().nonnegative('Total credits must be a positive integer'),
  credits_remaining: z.number().int().nonnegative('Remaining credits must be a positive integer'),
  currency: currencySchema.default('EUR'),
  category: subscriptionCategorySchema.optional(),
  billing_cycle: billingCycleSchema.default('monthly'),
  trial_end_date: z.string().datetime().optional(),
  credits_tracking_disabled: z.boolean().default(false),
}).refine(
  (data) => data.credits_remaining <= data.credits_total,
  {
    message: 'Remaining credits cannot exceed total credits',
    path: ['credits_remaining'],
  }
);

/**
 * Schema for updating an existing subscription
 */
export const updateSubscriptionSchema = createSubscriptionSchema.partial().extend({
  id: z.string().uuid(),
});

/**
 * Schema for updating credits
 */
export const updateCreditsSchema = z.object({
  subscription_id: z.string().uuid(),
  credits_remaining: z.number().int().nonnegative(),
  credits_total: z.number().int().nonnegative().optional(),
}).refine(
  (data) => !data.credits_total || data.credits_remaining <= data.credits_total,
  {
    message: 'Remaining credits cannot exceed total credits',
    path: ['credits_remaining'],
  }
);

/**
 * Schema for authentication
 */
export const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Export types
export type SubscriptionCategory = z.infer<typeof subscriptionCategorySchema>;
export type BillingCycle = z.infer<typeof billingCycleSchema>;
export type Currency = z.infer<typeof currencySchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type UpdateCreditsInput = z.infer<typeof updateCreditsSchema>;
export type AuthInput = z.infer<typeof authSchema>;
