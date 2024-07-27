<!-- NoteCardSkeleton.vue -->
<template>
  <li
    class="custom-card break-inside-avoid h-min mb-6 md:mb-8 p-2 flex flex-col overflow-x-auto relative group select-none"
    :style="{
      height: `${props.layout?.height || 100}px`,
      width: `${props.layout?.width || '100%'}`,
    }"
  >
    <!-- Title skeleton -->
    <div class="h-6 skeleton rounded mb-3 w-full"></div>

    <!-- Content skeleton -->
    <div class="space-y-2 w-full">
      <div class="h-2 skeleton rounded"></div>
      <div class="h-2 skeleton rounded"></div>
      <div class="h-2 skeleton rounded"></div>
    </div>

    <!-- Footer skeleton -->
    <div class="flex items-center justify-between pt-3 mt-auto">
      <!-- Folder skeleton -->
      <div class="w-full">
        <div class="h-3 skeleton rounded"></div>
      </div>
    </div>
  </li>
</template>

<script setup lang="ts">
  import { NoteLayout } from '@/store/uiStore';

  const props = defineProps<{
    layout?: NoteLayout | null;
  }>();
</script>
