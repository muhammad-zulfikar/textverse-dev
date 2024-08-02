<!-- view.vue -->
<template>
  <button
    @click="openModal"
    class="flex hover:underline items-center"
  >
    <img v-if="uiStore.viewType === 'card'" src="@/assets/icons/view/card.svg" class="size-5 mr-2 dark:invert" />
    <img v-else-if="uiStore.viewType === 'table'" src="@/assets/icons/view/table.svg" class="size-5 mr-2 dark:invert"/>
    <img v-else-if="uiStore.viewType === 'mail'" src="@/assets/icons/view/mail.svg" class="size-5 mr-2 dark:invert" />
    <img v-else-if="uiStore.viewType === 'folder'" src="@/assets/icons/view/folder.svg" class="size-5 mr-2 dark:invert" />

    <span v-if="uiStore.viewType === 'card'">Card</span>
    <span v-else-if="uiStore.viewType === 'table'">Table</span>
    <span v-else-if="uiStore.viewType === 'mail'">Mail</span>
    <span v-else-if="uiStore.viewType === 'folder'">Folder</span>
  </button>

  <ModalBackdrop v-model="isOpen" />
  <Teleport to="body">
    <Transition name="zoom">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-40 flex items-center justify-center text-sm"
      >
        <div @click="closeModal" class="absolute inset-0"></div>
        <div
          @click.stop
          class="z-50 font-serif p-2 relative flex flex-col w-56 md:w-96 max-w-md"
          :class="[uiStore.blurEnabled ? 'custom-card-blur' : 'custom-card']"
        >
          <div class="space-y-3">
            <div
              class="w-full rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <div class="flex items-center justify-between">
                <button
                  @click="setViewType('card')"
                  class="flex-grow text-left flex items-center p-3"
                  :class="[
                    uiStore.viewType === 'card' ? 'font-bold' : 'font-default',
                  ]"
                >
                  <img src="@/assets/icons/view/card.svg" class="size-5 mr-3 dark:invert" />
                  Card
                </button>
                <button
                  @click="toggleOptions('card')"
                  class="p-1 mr-3 rounded-full hover:bg-[#d9c698] dark:hover:bg-gray-600 transition-transform duration-200"
                  :class="{ 'rotate-180': expandedOption === 'card' }"
                >
                  <svg
                    class="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M19 9L12 16L5 9"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
              </div>
              <Transition name="expand">
                <div
                  v-if="expandedOption === 'card'"
                  class="flex items-center justify-between px-3"
                >
                  <span class="text-sm mb-4 text-gray-750 dark:text-gray-400">
                    Columns: {{ uiStore.columns }}
                  </span>
                  <div class="flex items-center space-x-2 mb-4">
                    <button
                      @click="decreaseColumns"
                      class="p-1 rounded-full hover:bg-[#d9c698] dark:hover:bg-gray-600"
                    >
                      <svg
                        class="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5 12H19"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      @click="increaseColumns"
                      class="p-1 rounded-full hover:bg-[#d9c698] dark:hover:bg-gray-600"
                    >
                      <svg
                        class="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 5V19M5 12H19"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
            <button
              @click="setViewType('table')"
              class="w-full text-left p-3 rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
            >
              <img src="@/assets/icons/view/table.svg" class="size-5 mr-3 dark:invert" />
              <span
                :class="[
                  uiStore.viewType === 'table' ? 'font-bold' : 'font-default',
                ]"
              >
                Table
              </span>
            </button>
            <button
              @click="setViewType('mail')"
              class="w-full text-left p-3 rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
            >
              <img src="@/assets/icons/view/mail.svg" class="size-5 mr-3 dark:invert" />
              <span
                :class="[
                  uiStore.viewType === 'mail' ? 'font-bold' : 'font-default',
                ]"
              >
                Mail
              </span>
            </button>
            <div
              class="w-full rounded-md hover:bg-[#ebdfc0] dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <div class="flex items-center justify-between">
                <button
                  @click="setViewType('folder')"
                  class="flex-grow text-left flex items-center p-3"
                  :class="[
                    uiStore.viewType === 'folder'
                      ? 'font-bold'
                      : 'font-default',
                  ]"
                >
                  <img src="@/assets/icons/view/folder.svg" class="size-5 mr-3 dark:invert" />
                  Folder
                </button>
                <button
                  @click="toggleOptions('folder')"
                  class="p-1 mr-3 rounded-full hover:bg-[#d9c698] dark:hover:bg-gray-600 transition-transform duration-200"
                  :class="{ 'rotate-180': expandedOption === 'folder' }"
                >
                  <svg
                    class="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M19 9L12 16L5 9"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
              </div>
              <Transition name="expand">
                <div
                  v-if="expandedOption === 'folder'"
                  class="space-y-2 px-2 pb-2 text-gray-750 dark:text-gray-400"
                >
                  <button
                    @click="setFolderViewType('grid')"
                    class="w-full text-left text-sm p-2 rounded-md hover:bg-[#d9c698] dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <span>Grid</span>
                  </button>
                  <button
                    @click="setFolderViewType('list')"
                    class="w-full text-left text-sm p-2 rounded-md hover:bg-[#d9c698] dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <span>List</span>
                  </button>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue';
  import { uiStore } from '@/store/stores';
  import ModalBackdrop from '@/components/modal/modalBackdrop.vue';

  const isOpen = ref(false);
  const isMobile = ref(window.innerWidth < 640);
  const expandedOption = ref('');

  const openModal = () => {
    isOpen.value = true;
  };

  const closeModal = () => {
    isOpen.value = false;
    expandedOption.value = '';
  };

  const toggleOptions = (option: string) => {
    expandedOption.value = expandedOption.value === option ? '' : option;
  };

  const setViewType = (viewType: 'card' | 'table' | 'mail' | 'folder') => {
    uiStore.setViewType(viewType);
    if (viewType !== 'card') {
      uiStore.setColumns(isMobile.value ? 1 : 4);
    }
    closeModal();
  };

  const increaseColumns = () => {
    if (uiStore.columns < (isMobile.value ? 2 : 5)) {
      uiStore.setColumns(uiStore.columns + 1);
    }
  };

  const decreaseColumns = () => {
    if (uiStore.columns > 1) {
      uiStore.setColumns(uiStore.columns - 1);
    }
  };

  const setFolderViewType = (viewType: 'grid' | 'list') => {
    uiStore.setFolderViewType(viewType);
  };

  const handleResize = () => {
    const newIsMobile = window.innerWidth < 640;
    if (newIsMobile !== isMobile.value) {
      isMobile.value = newIsMobile;
      if (isMobile.value && uiStore.columns > 2) {
        uiStore.setColumns(2);
      } else if (!isMobile.value && uiStore.columns < 3) {
        uiStore.setColumns(4);
      }
    }
  };

  onMounted(() => {
    window.addEventListener('resize', handleResize);
    handleResize();
  });

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
  });
</script>
