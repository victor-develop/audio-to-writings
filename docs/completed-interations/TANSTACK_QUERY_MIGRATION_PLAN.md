# 🚀 TanStack Query Migration Plan

## **📋 Phase 1: Setup & Infrastructure**

### **1.1 Install Dependencies**
- [x] Install @tanstack/react-query
- [x] Install @tanstack/react-query-devtools

### **1.2 Create Query Client Setup**
- [x] Create src/lib/queryClient.ts
- [x] Configure default options (staleTime, retry, refetchOnWindowFocus)

### **1.3 Update App.tsx with QueryProvider**
- [x] Wrap app with QueryClientProvider
- [x] Add ReactQueryDevtools
- [x] Maintain existing LoadingProvider structure

---

## **📊 Phase 2: Query Keys & API Functions**

### **2.1 Define Query Keys**
- [x] Create src/lib/queryKeys.ts
- [x] Define recordings query keys
- [x] Define prompts query keys

### **2.2 Create API Service Layer**
- [x] Create src/services/recordingsApi.ts
- [x] Create src/services/promptsApi.ts
- [x] Implement CRUD operations with proper error handling
- [x] Add data transformation functions

---

## **🎯 Phase 3: Custom Query Hooks**

### **3.1 Recordings Hooks**
- [x] Create src/hooks/queries/useRecordingsQueries.ts
- [x] Implement useRecordings query hook
- [x] Implement useCreateRecording mutation hook
- [x] Implement useUpdateRecording mutation hook
- [x] Implement useDeleteRecording mutation hook
- [x] Add optimistic updates and error rollback

### **3.2 Prompts Hooks**
- [x] Create src/hooks/queries/usePromptsQueries.ts
- [x] Implement usePrompts query hook
- [x] Implement useCreatePrompt mutation hook
- [x] Implement useUpdatePrompt mutation hook
- [x] Implement useDeletePrompt mutation hook
- [x] Implement useTogglePromptFavorite mutation hook
- [x] Implement useIncrementPromptUsage mutation hook

---

## **🔄 Phase 4: Component Migration**

### **4.1 Update RecordingInterface**
- [x] Replace useSupabaseRecordings with TanStack Query hooks
- [x] Remove manual loading states
- [x] Remove manual error handling
- [x] Remove manual cache management
- [x] Update delete, rename, and other operations

### **4.2 Update TranscriptionModal**
- [x] Replace useUserPrompts with TanStack Query hooks
- [x] Update prompt management operations
- [x] Remove manual state management

---

## **⚡ Phase 5: Global Loading Integration**

### **5.1 Smart Loading Context**
- [x] Enhance LoadingContext to auto-track TanStack Query states
- [x] Integrate useIsFetching and useIsMutating
- [x] Maintain backward compatibility with existing loading calls

---

## **🧹 Phase 6: Cleanup**

### **6.1 Remove Redundant Code**
- [x] Delete useSupabaseRecordings.ts
- [x] Delete useUserPrompts.ts
- [x] Remove manual loading states from components
- [x] Remove manual error handling in components
- [x] Remove manual cache management

### **6.2 Update Types**
- [x] Create src/types/api.ts
- [x] Define CreateRecordingData interface
- [x] Define UpdateRecordingData interface
- [x] Update existing types as needed

---

## **🎯 Phase 7: Advanced Features**

### **7.1 Optimistic Updates**
- [x] Verify optimistic updates work for all mutations
- [x] Test error rollback scenarios
- [x] Ensure background refetch consistency

### **7.2 Smart Caching**
- [x] Configure appropriate cache times
- [x] Test automatic background refetch
- [x] Verify cache invalidation on mutations

### **7.3 Offline Support**
- [x] Test auto-retry for failed mutations
- [x] Verify offline behavior

---

## **📊 Benefits After Migration**

### **🚀 Performance**
- ✅ **Smart caching** - No unnecessary API calls
- ✅ **Background updates** - Data stays fresh
- ✅ **Optimistic updates** - Instant UI feedback
- ✅ **Request deduplication** - Multiple components, single request

### **🛠️ Developer Experience**
- ✅ **90% less boilerplate** - No manual loading/error states
- ✅ **Built-in DevTools** - Debug queries visually
- ✅ **Type safety** - Full TypeScript support
- ✅ **Standardized patterns** - Consistent across the app

### **💪 Features**
- ✅ **Auto-retry** - Network failures handled automatically
- ✅ **Polling** - Real-time data updates
- ✅ **Pagination** - Built-in support
- ✅ **Infinite queries** - Scroll-to-load more

---

## **🚦 Migration Timeline**

### **Week 1: Foundation**
- [x] Complete Phase 1: Setup & Infrastructure
- [x] Complete Phase 2: Query Keys & API Functions

### **Week 2: Core Queries**
- [x] Complete Phase 3: Custom Query Hooks
- [x] Complete Phase 4: Component Migration

### **Week 3: Mutations & Polish**
- [x] Complete Phase 5: Global Loading Integration
- [x] Complete Phase 6: Cleanup

### **Week 4: Testing & Polish**
- [x] Complete Phase 7: Advanced Features
- [x] Final testing and cleanup

---

## **🎯 What This Migration Achieves:**

1. **🔥 Eliminates 90% of boilerplate code**
2. **⚡ Automatic loading states for everything**
3. **🚀 Optimistic updates and smart caching**
4. **🛠️ Built-in error handling and retries**
5. **📊 DevTools for debugging queries**
6. **🎯 Follows industry best practices**

---

**Status: ✅ COMPLETED**
**Started: [Current Date]**
**Completed: [Current Date]**
