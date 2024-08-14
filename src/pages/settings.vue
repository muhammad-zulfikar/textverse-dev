<!-- settings.vue -->

<template>
  <div
    class="max-w-xl md:max-w-2xl p-8 m-8 flex flex-col mx-auto gap-8 overflow-y-auto font-serif"
  >
    <div class="flex-grow flex flex-col gap-8">
      <!-- Sync notes section -->
      <div class="p-4 custom-card">
        <h2 class="text-2xl font-semibold mb-4">Sync your notes</h2>
        <div class="flex flex-col gap-4">
          <SyncStatus />
          <ImportNotes />
        </div>
      </div>

      <!-- Appearance section -->
      <div class="p-4 custom-card">
        <h2 class="text-2xl font-semibold mb-4">Appearance</h2>
        <div class="flex flex-col gap-4">
          <ThemeSelector />
          <ViewTypeSelector />
          <NoteOpenPreferenceSelector />
          <BlurToggle />
        </div>
      </div>

      <!-- Manage data section -->
      <div class="p-4 custom-card">
        <h2 class="text-2xl font-semibold mb-4">Manage your data</h2>
        <div class="flex flex-col gap-4">
          <BackupData />
          <DeleteData />
        </div>
      </div>

      <!-- User settings section -->
      <UserSettings v-if="authStore.isLoggedIn" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { authStore } from '@/store/stores';
  import SyncStatus from '@/components/settings/sync/syncStatus.vue';
  import ImportNotes from '@/components/settings/sync/importNotes.vue';
  import ThemeSelector from '@/components/settings/appearance/themeSelector.vue';
  import ViewTypeSelector from '@/components/settings/appearance/viewTypeSelector.vue';
  import NoteOpenPreferenceSelector from '@/components/settings/appearance/noteOpenPreferenceSelector.vue';
  import BlurToggle from '@/components/settings/appearance/blurToggle.vue';
  import BackupData from '@/components/settings/data/backupData.vue';
  import DeleteData from '@/components/settings/data/deleteData.vue';
  import UserSettings from '@/components/settings/user/userSettings.vue';
</script>
