import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  jsonb,
  uuid,
  index,
  uniqueIndex,
  numeric,
  boolean,
  date,
  doublePrecision,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import type { AdapterAccountType } from 'next-auth/adapters';

// ==========================================
// 1. AUTHENTICATION & IDENTITY (Auth.js)
// ==========================================

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

export const calendarConnections = pgTable('calendar_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(), // 'google'
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  expiresAt: integer('expires_at'),
  email: text('email'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userProviderIdx: uniqueIndex('calendar_conn_user_provider_idx').on(table.userId, table.provider),
}));

// ==========================================
// 2. USER PREFERENCES
// ==========================================

export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  timezone: text('timezone').default('UTC').notNull(),
  weekStartsOn: integer('week_starts_on').default(1).notNull(), // 0 for Sunday, 1 for Monday
  theme: text('theme').default('system').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 3. UNIVERSAL SEARCH DOCUMENTS
// ==========================================

export const searchDocuments = pgTable(
  'search_documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    title: text('title').notNull(),
    subtitle: text('subtitle'),
    searchText: text('search_text').notNull(),
    destination: text('destination').notNull(),
    module: text('module').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdEntityIdx: uniqueIndex('search_docs_user_entity_idx').on(table.userId, table.entityType, table.entityId),
    userUpdatedIdx: index('search_docs_user_updated_idx').on(table.userId, table.updatedAt.desc()),
    // We will manage the GIN index on search_text later via raw SQL if needed,
    // or just rely on standard ILIKE for the MVP scale. The spec mentions GIN + ILIKE.
    // Drizzle doesn't support tsvector directly in schema generation without custom types,
    // so we'll start with text and we can add raw SQL migration for tsvector if desired.
  })
);

// ==========================================
// 4. AUDIT EVENTS
// ==========================================

export const auditEvents = pgTable('audit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 5. FOOD DOMAIN (Phase 2)
// ==========================================

export const foodSources = pgTable('food_sources', {
  id: text('id').primaryKey(), // e.g., 'usda', 'open_food_facts'
  displayName: text('display_name').notNull(),
  reliabilityConfig: jsonb('reliability_config'),
  enabled: boolean('enabled').default(true).notNull(),
  attribution: text('attribution'),
});

export const foodSourceRecords = pgTable('food_source_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceId: text('source_id').notNull().references(() => foodSources.id),
  externalId: text('external_id').notNull(),
  normalizedRecordVersion: text('normalized_record_version').notNull(),
  normalizedIdentity: text('normalized_identity').notNull(),
  provenance: jsonb('provenance'),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }).defaultNow().notNull(),
  staleAt: timestamp('stale_at', { withTimezone: true }),
}, (table) => ({
  sourceExtVersionIdx: uniqueIndex('food_src_rec_ext_ver_idx').on(table.sourceId, table.externalId, table.normalizedRecordVersion),
}));

export const foodNutrients = pgTable('food_nutrients', {
  id: uuid('id').primaryKey().defaultRandom(),
  recordId: uuid('record_id').notNull().references(() => foodSourceRecords.id, { onDelete: 'cascade' }),
  nutrientKey: text('nutrient_key').notNull(),
  amount: numeric('amount').notNull(),
  unit: text('unit').notNull(),
  basis: text('basis'),
  status: text('status'), // e.g. 'known', 'imputed'
}, (table) => ({
  recordNutrientIdx: index('food_nutrients_rec_idx').on(table.recordId),
}));

export const foodPortions = pgTable('food_portions', {
  id: uuid('id').primaryKey().defaultRandom(),
  recordId: uuid('record_id').notNull().references(() => foodSourceRecords.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  grams: numeric('grams'),
  milliliters: numeric('milliliters'),
  ordering: integer('ordering').default(0).notNull(),
});

export const foodSearchCache = pgTable('food_search_cache', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceKey: text('source_key').notNull(),
  queryKey: text('query_key').notNull(),
  resultRefs: jsonb('result_refs').notNull(), // array of references
  retrievedAt: timestamp('retrieved_at', { withTimezone: true }).defaultNow().notNull(),
  staleAt: timestamp('stale_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
}, (table) => ({
  sourceQueryIdx: index('food_search_cache_src_query_idx').on(table.sourceKey, table.queryKey),
}));

export const userFoods = pgTable('user_foods', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull(), // 'custom', 'override', 'saved_public'
  name: text('name').notNull(),
  searchFields: text('search_fields'),
  linkedPublicRecordId: uuid('linked_public_record_id').references(() => foodSourceRecords.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userFoodsUserIdIdx: index('user_foods_user_id_idx').on(table.userId),
}));

export const userFoodNutrients = pgTable('user_food_nutrients', {
  id: uuid('id').primaryKey().defaultRandom(),
  userFoodId: uuid('user_food_id').notNull().references(() => userFoods.id, { onDelete: 'cascade' }),
  nutrientKey: text('nutrient_key').notNull(),
  amount: numeric('amount').notNull(),
  unit: text('unit').notNull(),
  basis: text('basis'),
  status: text('status'),
});

export const userFoodPortions = pgTable('user_food_portions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userFoodId: uuid('user_food_id').notNull().references(() => userFoods.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  measure: numeric('measure'),
  amount: numeric('amount').notNull(),
  equivalentGrams: numeric('equivalent_grams'),
  equivalentMilliliters: numeric('equivalent_milliliters'),
});

export const meals = pgTable('meals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  localDate: date('local_date').notNull(), // format YYYY-MM-DD
  mealType: text('meal_type').notNull(), // 'BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'OTHER'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }), // Soft delete implementation
}, (table) => ({
  mealsUserDateIdx: index('meals_user_date_idx').on(table.userId, table.localDate.desc()),
}));

export const mealItems = pgTable('meal_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  mealId: uuid('meal_id').notNull().references(() => meals.id, { onDelete: 'cascade' }),
  ordering: integer('ordering').default(0).notNull(),
  selectedSourceRef: text('selected_source_ref'),
  selectedUserFoodId: uuid('selected_user_food_id').references(() => userFoods.id),
  displaySnapshot: jsonb('display_snapshot').notNull(),
  selectedPortionSnapshot: jsonb('selected_portion_snapshot').notNull(),
  quantity: numeric('quantity').notNull(),
}, (table) => ({
  mealItemsMealIdx: index('meal_items_meal_id_idx').on(table.mealId),
}));

export const mealItemNutrients = pgTable('meal_item_nutrients', {
  id: uuid('id').primaryKey().defaultRandom(),
  mealItemId: uuid('meal_item_id').notNull().references(() => mealItems.id, { onDelete: 'cascade' }),
  nutrientKey: text('nutrient_key').notNull(),
  amount: numeric('amount').notNull(),
  unit: text('unit').notNull(),
  status: text('status').notNull(), // 'known', 'missing'
});

export const mealRevisions = pgTable('meal_revisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  mealId: uuid('meal_id').notNull().references(() => meals.id, { onDelete: 'cascade' }),
  revisionNumber: integer('revision_number').notNull(),
  actorId: uuid('actor_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  payloadSummary: jsonb('payload_summary').notNull(),
});

// ==========================================
// 6. WEIGHT DOMAIN (Phase 3)
// ==========================================

export const weightEntries = pgTable('weight_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  weight: numeric('weight', { precision: 5, scale: 2 }).notNull(),
  unit: text('unit').notNull(),
  note: text('note'),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }), // Soft delete implementation
}, (table) => ({
  weightEntriesUserDateIdx: index('weight_entries_user_date_idx').on(table.userId, table.recordedAt.desc()),
}));

// ==========================================
// 7. WORKOUT DOMAIN (Phase 4)
// ==========================================

export const workoutRoutines = pgTable('workout_routines', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  remark: text('remark'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  workoutRoutinesUserIdx: index('workout_routines_user_idx').on(table.userId),
}));

export const workoutExercises = pgTable('workout_exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  routineId: uuid('routine_id').notNull().references(() => workoutRoutines.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  position: integer('position').notNull(),
  libraryId: uuid('library_id'), // optional link to exercise library

}, (table) => ({
  workoutExercisesRoutineIdx: index('workout_exercises_routine_idx').on(table.routineId, table.position),
}));

export const workoutSchedules = pgTable('workout_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  routineId: uuid('routine_id').notNull().references(() => workoutRoutines.id, { onDelete: 'cascade' }),
  weekday: integer('weekday').notNull(), // 0 for Sunday, 1 for Monday, etc.
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  workoutSchedulesUserWeekdayIdx: uniqueIndex('workout_schedules_user_weekday_idx').on(table.userId, table.weekday),
}));

export const workoutDisplayStates = pgTable('workout_display_states', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  routineId: uuid('routine_id').notNull().references(() => workoutRoutines.id, { onDelete: 'cascade' }),
  localDate: date('local_date').notNull(), // YYYY-MM-DD format
  checkedExerciseIds: jsonb('checked_exercise_ids').default('[]').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  workoutDisplayStateUserDateIdx: uniqueIndex('workout_display_state_user_date_idx').on(table.userId, table.localDate),
}));

export const workoutExerciseLibrary = pgTable('workout_exercise_library', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }), // null means system/public
  name: text('name').notNull(),
  type: text('type').default('strength').notNull(), // strength, cardio, bodyweight, timed
  muscle: text('muscle'),
  equipment: text('equipment'),
  instructions: text('instructions'),
  source: text('source').default('internal').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const workoutSessions = pgTable('workout_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  routineId: uuid('routine_id').references(() => workoutRoutines.id), // optional if ad-hoc
  localDate: date('local_date').notNull(),
  startTime: timestamp('start_time', { withTimezone: true }).defaultNow(),
  endTime: timestamp('end_time', { withTimezone: true }),
  status: text('status').default('in_progress').notNull(), // in_progress, completed
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const workoutSets = pgTable('workout_sets', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => workoutSessions.id, { onDelete: 'cascade' }),
  exerciseLibraryId: uuid('exercise_library_id').notNull().references(() => workoutExerciseLibrary.id),
  routineExerciseId: uuid('routine_exercise_id').references(() => workoutExercises.id), // optional link to original routine mapping
  setNumber: integer('set_number').notNull(),
  weight: numeric('weight', { precision: 5, scale: 2 }), // sourced from Weight module implicitly if bodyweight
  reps: integer('reps'),
  durationSeconds: integer('duration_seconds'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});


// ==========================================
// 8. FINANCE MVP (Phase 5)
// ==========================================

export const financeCategories = pgTable('finance_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  suggestionKeys: jsonb('suggestion_keys').$type<string[]>(), // optional keywords for auto-categorization
});

export const financeIncomeTypes = pgTable('finance_income_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
});

export const financeAccounts = pgTable('finance_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'BANK_ACCOUNT' or 'CREDIT_CARD'
  currencyCode: text('currency_code').default('INR').notNull(),
  
  // Bank Account fields
  openingBalance: integer('opening_balance').default(0).notNull(),
  openingBalanceDate: timestamp('opening_balance_date', { withTimezone: true }),
  
  // Credit Card fields
  creditLimit: integer('credit_limit'),
  openingOutstanding: integer('opening_outstanding').default(0).notNull(),
  openingOutstandingDate: timestamp('opening_outstanding_date', { withTimezone: true }),
  statementDay: integer('statement_day'),
  dueDay: integer('due_day'),
  
  lastFour: text('last_four'),
  notes: text('notes'),
  institutionId: text('institution_id'),
  logo: text('logo'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  userTypeIdx: index('finance_accounts_user_type_idx').on(table.userId, table.type),
}));

export const financeTransactions = pgTable('finance_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'INCOME', 'EXPENSE', 'TRANSFER', 'CREDIT_CARD_PAYMENT'
  amount: doublePrecision('amount').notNull(),
  currencyCode: text('currency_code').notNull(),
  transactionDate: date('transaction_date', { mode: 'string' }).notNull(), // YYYY-MM-DD
  
  accountId: uuid('account_id').references(() => financeAccounts.id), // Source account
  destinationAccountId: uuid('destination_account_id').references(() => financeAccounts.id), // For transfers/payments
  externalRecipientName: text('external_recipient_name'), // For external transfers
  
  categoryId: uuid('category_id').references(() => financeCategories.id),
  incomeTypeId: uuid('income_type_id').references(() => financeIncomeTypes.id),
  
  description: text('description'),
  merchant: text('merchant'),
  notes: text('notes'),
  
  source: text('source').notNull(), // 'MANUAL', 'OCR', 'IMPORT'
  sourceMetadata: jsonb('source_metadata'),
  
  status: text('status').default('POSTED').notNull(), // 'POSTED' or 'VOIDED'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdDateIdx: index('finance_transactions_user_id_date_idx').on(table.userId, table.transactionDate),
  userIdTypeDateIdx: index('finance_transactions_user_id_type_date_idx').on(table.userId, table.type, table.transactionDate),
}));

export const financeMonthlyPlans = pgTable('finance_monthly_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  month: integer('month').notNull(), // 1-12
  year: integer('year').notNull(), // e.g. 2026
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userMonthYearIdx: uniqueIndex('finance_monthly_plans_user_month_year_idx').on(table.userId, table.month, table.year),
}));

export const financeSavingsGoals = pgTable('finance_savings_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  ultimateTargetAmount: doublePrecision('ultimate_target_amount'),
  accountId: uuid('account_id').references(() => financeAccounts.id),
  monthlyTargetAmount: doublePrecision('monthly_target_amount'),
  currentSavedAmount: doublePrecision('current_saved_amount').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const financeMonthlyPlanItems = pgTable('finance_monthly_plan_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  planId: uuid('plan_id').notNull().references(() => financeMonthlyPlans.id, { onDelete: 'cascade' }),
  amount: doublePrecision('amount').notNull(),
  expenseCategoryId: uuid('expense_category_id').references(() => financeCategories.id), // for spending allocations
  savingsGoalId: uuid('savings_goal_id').references(() => financeSavingsGoals.id), // for savings allocations
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 8. TASKS
// ==========================================

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  remark: text('remark'),
  status: text('status').default('todo').notNull(), // 'todo', 'in_progress', 'completed', 'cancelled'
  priority: text('priority').default('normal').notNull(), // 'low', 'normal', 'high'
  
  // Time & Calendar
  dueDate: date('due_date', { mode: 'string' }),
  startTime: timestamp('start_time', { withTimezone: true }),
  endTime: timestamp('end_time', { withTimezone: true }),
  allDay: boolean('all_day').default(false).notNull(),
  timezone: text('timezone'),
  reminderMinutes: integer('reminder_minutes'),
  recurrenceRule: text('recurrence_rule'),
  
  position: integer('position').default(0).notNull(),
  
  // External Sync
  externalProvider: text('external_provider'), // e.g. 'google'
  externalAccountId: text('external_account_id'), // map to calendarConnections
  externalCalendarId: text('external_calendar_id'),
  externalEventId: text('external_event_id'),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  syncHash: text('sync_hash'),

  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  openTasksIdx: index('tasks_open_idx').on(table.userId, table.status, table.priority, table.position),
  dueDateIdx: index('tasks_due_date_idx').on(table.userId, table.dueDate),
  externalSyncIdx: index('tasks_external_sync_idx').on(table.externalProvider, table.externalAccountId, table.externalEventId),
  trashIdx: index('tasks_trash_idx').on(table.userId, table.deletedAt),
}));

// ==========================================
// 9. NOTES
// ==========================================

export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').default('').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  activeUserIdx: index('notes_active_user_idx').on(table.userId, table.updatedAt, table.id).where(sql`${table.deletedAt} IS NULL`),
  trashIdx: index('notes_trash_idx').on(table.userId, table.deletedAt),
}));

// ==========================================
// 10. RELATIONSHIPS (Phase 9)
// ==========================================

export const objectRelationships = pgTable('object_relationships', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sourceType: text('source_type').notNull(),
  sourceId: text('source_id').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id').notNull(),
  relationshipType: text('relationship_type').default('RELATED').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  sourceIdx: index('rel_source_idx').on(table.userId, table.sourceType, table.sourceId),
  targetIdx: index('rel_target_idx').on(table.userId, table.targetType, table.targetId),
  uniqueRelIdx: uniqueIndex('rel_unique_idx').on(table.userId, table.sourceType, table.sourceId, table.targetType, table.targetId),
}));
