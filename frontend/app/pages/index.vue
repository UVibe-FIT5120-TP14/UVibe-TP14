<script setup lang="ts">
// Public landing page — no auth required

const featuresOpen = ref(false)

const previewOutfit = {
  head: {
    id: 'sunhat',
    name: 'Broad-brimmed Hat',
    icon: '🎩',
    color: 'bg-amber-700',
    description: 'Wide-brimmed hat that shields your face, neck and ears from UV exposure.',
  },
  eyes: {
    id: 'wrap-shades',
    name: 'UV Shades',
    icon: '🕶️',
    color: 'bg-gray-900',
    description: 'Wrap-around sunglasses that block UV rays from all angles.',
  },
  torso: {
    id: 'jacket',
    name: 'UPF 50+ Jacket',
    icon: '🧥',
    color: 'bg-sky-700',
    description: 'Full-sleeve UPF 50+ jacket blocking 98% of UV radiation.',
  },
  legs: {
    id: 'long-pants',
    name: 'Long Pants',
    icon: '👖',
    color: 'bg-slate-600',
    description: 'Full-length pants providing lower-body UV protection.',
  },
  accessory: {
    id: 'umbrella',
    name: 'Sun Umbrella',
    icon: '☂️',
    description: 'Portable shade that dramatically reduces UV exposure on the go.',
  },
}
</script>

<template>
  <!-- Brand palette: bg #FFF8F3 | text #1A1A2E | accent #FF6B2B | coral #FF9B71 | sun yellow #FFD166 -->
  <div class="min-h-screen" style="background-color: #FFF8F3; color: #1A1A2E;">

    <!-- ═══════════════════════════════════════
         TOP NAVBAR
    ═══════════════════════════════════════ -->
    <nav
      class="sticky top-0 z-50 border-b px-5 sm:px-10 py-3.5 flex items-center justify-between"
      style="background-color: rgba(255,248,243,0.92); border-color: rgba(255,107,43,0.15); backdrop-filter: blur(12px);"
    >
      <!-- Logo -->
      <span class="text-xl font-black tracking-widest select-none" style="color: #1A1A2E;">UVibe</span>

      <!-- Desktop nav links -->
      <div class="hidden sm:flex items-center gap-8 text-sm" style="color: #6B7280;">
        <!-- Features dropdown -->
        <div class="relative" @mouseenter="featuresOpen = true" @mouseleave="featuresOpen = false">
          <button
            class="flex items-center gap-1 transition-colors duration-150 hover:text-[#FF6B2B]"
            style="color: #6B7280;"
          >
            Features
            <svg class="w-3.5 h-3.5 transition-transform duration-200" :class="{ 'rotate-180': featuresOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-1"
          >
            <div
              v-if="featuresOpen"
              class="absolute left-0 top-full pt-2 w-52 z-50"
            >
              <div
                class="rounded-2xl py-2 shadow-lg border overflow-hidden"
                style="background-color: #ffffff; border-color: rgba(26,26,46,0.08);"
              >
                <NuxtLink
                  to="/home"
                  class="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[#FFF8F3]"
                  style="color: #1A1A2E;"
                  @click="featuresOpen = false"
                >
                  <span class="text-base">☀️</span>
                  <div>
                    <p class="font-semibold text-xs">Live UV</p>
                    <p class="text-[10px]" style="color: #9CA3AF;">Real-time UV index & alerts</p>
                  </div>
                </NuxtLink>
                <NuxtLink
                  to="/protect"
                  class="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[#FFF8F3]"
                  style="color: #1A1A2E;"
                  @click="featuresOpen = false"
                >
                  <span class="text-base">🧴</span>
                  <div>
                    <p class="font-semibold text-xs">Protection Planner</p>
                    <p class="text-[10px]" style="color: #9CA3AF;">Outfit, dosage & reminders</p>
                  </div>
                </NuxtLink>
                <NuxtLink
                  to="/insights"
                  class="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[#FFF8F3]"
                  style="color: #1A1A2E;"
                  @click="featuresOpen = false"
                >
                  <span class="text-base">📊</span>
                  <div>
                    <p class="font-semibold text-xs">Insights</p>
                    <p class="text-[10px]" style="color: #9CA3AF;">UV & cancer data for Australia</p>
                  </div>
                </NuxtLink>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- CTA button -->
      <NuxtLink
        to="/home"
        class="px-5 py-2 font-bold text-sm rounded-full transition-all duration-150 shadow-md hover:scale-105 active:scale-95"
        style="background-color: #FF6B2B; color: #ffffff; box-shadow: 0 4px 14px rgba(255,107,43,0.25);"
      >
        Get Started
      </NuxtLink>
    </nav>

    <!-- ═══════════════════════════════════════
         HERO SECTION
    ═══════════════════════════════════════ -->
    <section class="relative overflow-hidden px-5 sm:px-10 pt-20 pb-24 sm:pt-28 sm:pb-32 text-center">
      <!-- Warm ambient blobs -->
      <div class="pointer-events-none absolute inset-0">
        <div
          class="absolute -top-10 right-1/4 w-[500px] h-[400px] rounded-full blur-3xl"
          style="background: radial-gradient(circle, rgba(255,209,102,0.35) 0%, transparent 70%);"
        />
        <div
          class="absolute top-20 left-1/4 w-[350px] h-[350px] rounded-full blur-3xl"
          style="background: radial-gradient(circle, rgba(255,155,113,0.25) 0%, transparent 70%);"
        />
      </div>

      <div class="relative max-w-3xl mx-auto space-y-7">
        <!-- Badge -->
        <span
          class="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold tracking-widest uppercase rounded-full border"
          style="background-color: rgba(255,107,43,0.08); border-color: rgba(255,107,43,0.25); color: #FF6B2B;"
        >
          <span>🌞</span> UV Education for Young Australians
        </span>

        <!-- Headline -->
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight" style="color: #1A1A2E;">
          Australia loves the sun.<br>
          <span style="color: #FF6B2B;">The sun doesn't always<br class="hidden sm:block"> love us back.</span>
        </h1>

        <!-- Subheading -->
        <p class="text-lg sm:text-xl max-w-xl mx-auto leading-relaxed" style="color: #6B7280;">
          We have some of the highest UV levels on Earth — and one of the highest skin cancer rates to match. UVibe helps young Australians stay protected every day.
        </p>

        <!-- CTA buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <NuxtLink
            to="/home"
            class="w-full sm:w-auto px-8 py-3.5 font-bold text-base rounded-full transition-all duration-150 hover:scale-105 active:scale-95"
            style="background-color: #FF6B2B; color: #ffffff; box-shadow: 0 6px 20px rgba(255,107,43,0.3);"
          >
            Check your UV now →
          </NuxtLink>
          <NuxtLink
            to="/insights"
            class="w-full sm:w-auto px-8 py-3.5 font-medium text-base rounded-full border transition-all duration-150 hover:scale-105"
            style="border-color: rgba(26,26,46,0.2); color: #1A1A2E; background-color: transparent;"
          >
            Explore the data
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════
         STATS STRIP (inline with hero)
    ═══════════════════════════════════════ -->
    <section class="px-5 sm:px-10 pb-20 max-w-5xl mx-auto">
      <div
        class="relative rounded-3xl px-8 py-12 md:px-14 md:py-14 overflow-hidden"
        style="background: linear-gradient(135deg, #1A1A2E 0%, #2d1f3d 100%);"
      >
        <!-- Warm dot grid -->
        <div
          class="pointer-events-none absolute inset-0 opacity-10"
          style="background-image: radial-gradient(circle, #FF6B2B 1px, transparent 1px); background-size: 28px 28px;"
        />
        <!-- Sun glow -->
        <div
          class="pointer-events-none absolute -top-16 right-1/3 w-64 h-64 rounded-full blur-3xl"
          style="background: radial-gradient(circle, rgba(255,209,102,0.2) 0%, transparent 70%);"
        />

        <p class="relative text-center text-xs font-bold tracking-[0.2em] uppercase mb-10" style="color: #FF6B2B;">
          Why UV Matters
        </p>

        <div class="relative grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-6 text-center">

          <div class="space-y-2">
            <p class="text-5xl sm:text-6xl font-black leading-none" style="color: #FF6B2B;">2 in 3</p>
            <p class="text-sm leading-relaxed px-2" style="color: #9CA3AF;">Australians will be diagnosed with skin cancer by age 70</p>
            <p class="text-xs" style="color: #4b5563;">sunsmart.com.au</p>
          </div>

          <div class="relative space-y-2">
            <div class="hidden sm:block absolute -left-3 top-0 bottom-0 w-px" style="background-color: rgba(255,255,255,0.06);" />
            <div class="hidden sm:block absolute -right-3 top-0 bottom-0 w-px" style="background-color: rgba(255,255,255,0.06);" />
            <p class="text-5xl sm:text-6xl font-black leading-none" style="color: #FF6B2B;">99%</p>
            <p class="text-sm leading-relaxed px-2" style="color: #9CA3AF;">of non-melanoma skin cancers are caused by UV radiation</p>
            <p class="text-xs" style="color: #4b5563;">aihw.gov.au</p>
          </div>

          <div class="space-y-2">
            <p class="text-5xl sm:text-6xl font-black leading-none" style="color: #FF6B2B;">#1</p>
            <p class="text-sm leading-relaxed px-2" style="color: #9CA3AF;">Australia has one of the highest rates of skin cancer in the world</p>
            <p class="text-xs" style="color: #4b5563;">cancer.org.au</p>
          </div>

        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════
         FEATURE HIGHLIGHT CARDS
    ═══════════════════════════════════════ -->
    <section class="px-5 sm:px-10 pb-20 max-w-5xl mx-auto">
      <p class="text-xs font-bold tracking-[0.2em] uppercase mb-8 text-center" style="color: #FF6B2B;">What UVibe Does</p>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <!-- Card 1: Live UV Index -->
        <NuxtLink
          to="/home"
          class="group block p-6 rounded-2xl border transition-all duration-200 hover:-translate-y-1"
          style="background-color: #ffffff; border-color: rgba(26,26,46,0.08);"
        >
          <div class="text-4xl mb-5">🔆</div>
          <h3 class="font-bold text-lg mb-2 transition-colors duration-200 group-hover:text-[#FF6B2B]" style="color: #1A1A2E;">
            Live UV Index
          </h3>
          <p class="text-sm leading-relaxed" style="color: #6B7280;">
            Real-time UV levels for your location, updated continuously.
          </p>
          <div class="mt-5 flex items-center gap-1.5 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200" style="color: #FF6B2B;">
            <span>Open dashboard</span><span>→</span>
          </div>
        </NuxtLink>

        <!-- Card 2: Protection Planner -->
        <NuxtLink
          to="/protect"
          class="group block p-6 rounded-2xl border transition-all duration-200 hover:-translate-y-1"
          style="background-color: #ffffff; border-color: rgba(26,26,46,0.08);"
        >
          <div class="text-4xl mb-5">👕</div>
          <h3 class="font-bold text-lg mb-2 transition-colors duration-200 group-hover:text-[#FF6B2B]" style="color: #1A1A2E;">
            Protection Planner
          </h3>
          <p class="text-sm leading-relaxed" style="color: #6B7280;">
            Get outfit and sunscreen advice tailored to today's UV level.
          </p>
          <div class="mt-5 flex items-center gap-1.5 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200" style="color: #FF6B2B;">
            <span>Plan your outfit</span><span>→</span>
          </div>
        </NuxtLink>

        <!-- Card 3: UV Insights -->
        <NuxtLink
          to="/insights"
          class="group block p-6 rounded-2xl border transition-all duration-200 hover:-translate-y-1"
          style="background-color: #ffffff; border-color: rgba(26,26,46,0.08);"
        >
          <div class="text-4xl mb-5">📊</div>
          <h3 class="font-bold text-lg mb-2 transition-colors duration-200 group-hover:text-[#FF6B2B]" style="color: #1A1A2E;">
            UV Insights
          </h3>
          <p class="text-sm leading-relaxed" style="color: #6B7280;">
            Explore UV and skin cancer trends across Australia.
          </p>
          <div class="mt-5 flex items-center gap-1.5 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200" style="color: #FF6B2B;">
            <span>View the data</span><span>→</span>
          </div>
        </NuxtLink>

      </div>
    </section>

    <!-- ═══════════════════════════════════════
         VISOR / INTERACTIVE DEMO CTA
    ═══════════════════════════════════════ -->
    <section class="px-5 sm:px-10 pb-20 max-w-5xl mx-auto">
      <div
        class="relative rounded-3xl overflow-hidden border"
        style="background-color: #ffffff; border-color: rgba(26,26,46,0.08);"
      >
        <!-- Warm blob -->
        <div
          class="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl"
          style="background: radial-gradient(circle, rgba(255,209,102,0.3) 0%, transparent 70%);"
        />

        <div class="relative flex flex-col md:flex-row items-stretch">

          <!-- Avatar preview column — flush left, full height -->
          <div
            class="flex-shrink-0 flex items-center justify-center p-10 md:p-14 w-full md:w-[420px]"
            style="background: linear-gradient(160deg, #FFF8F3 0%, #F5E6D3 100%);"
          >
            <InteractiveAvatar :avatar-outfit="previewOutfit" />
          </div>

          <!-- Text content column -->
          <div class="flex-1 flex flex-col justify-center text-center md:text-left px-8 py-10 md:px-14 md:py-14 space-y-5">
            <span
              class="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold tracking-widest uppercase rounded-full border self-center md:self-start"
              style="background-color: rgba(255,107,43,0.08); border-color: rgba(255,107,43,0.2); color: #FF6B2B;"
            >
              <span>🧴</span> Protection Planner
            </span>
            <h2 class="text-3xl sm:text-4xl font-black leading-tight" style="color: #1A1A2E;">
              Know what to wear<br>before you head out.
            </h2>
            <p class="text-sm leading-relaxed max-w-sm mx-auto md:mx-0" style="color: #6B7280;">
              Our interactive Protection Planner shows you exactly what to wear based on real-time UV levels. Tap any item on the avatar to learn more about your gear.
            </p>
            <div>
              <NuxtLink
                to="/protect"
                class="inline-block px-8 py-3 font-bold text-sm rounded-full transition-all duration-150 hover:scale-105 active:scale-95"
                style="background-color: #FF6B2B; color: #ffffff; box-shadow: 0 4px 16px rgba(255,107,43,0.25);"
              >
                Try the Protection Planner →
              </NuxtLink>
            </div>
          </div>

        </div>
      </div>
    </section>


    <!-- ═══════════════════════════════════════
         FOOTER
    ═══════════════════════════════════════ -->
    <footer class="border-t px-5 sm:px-10 py-8" style="border-color: rgba(26,26,46,0.1);">
      <div class="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">

        <span class="text-xl font-black tracking-widest select-none" style="color: #1A1A2E;">UVibe</span>

        <div class="flex items-center gap-6 text-sm" style="color: #9CA3AF;">
          <NuxtLink to="/home" class="hover:text-[#FF6B2B] transition-colors duration-150">Dashboard</NuxtLink>
          <NuxtLink to="/protect" class="hover:text-[#FF6B2B] transition-colors duration-150">Protection Planner</NuxtLink>
          <NuxtLink to="/insights" class="hover:text-[#FF6B2B] transition-colors duration-150">Insights</NuxtLink>
        </div>

        <p class="text-xs" style="color: #D9C4B0;">© 2025 UVibe. Stay sun-safe.</p>

      </div>
    </footer>

  </div>
</template>
