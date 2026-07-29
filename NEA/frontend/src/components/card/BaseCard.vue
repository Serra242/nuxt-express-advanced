<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
  variant?: 'default' | 'flat'
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  subtitle: undefined,
  variant: 'default',
})
</script>

<template>
  <section
    :class="[
      'c-base-card-tpl',
      `c-base-card-tpl--${props.variant}`,
    ]"
  >
    <header
      v-if="props.title || props.subtitle"
      class="c-base-card-tpl__header"
    >
      <h2
        v-if="props.title"
        class="c-base-card-tpl__title"
      >
        {{ props.title }}
      </h2>

      <p
        v-if="props.subtitle"
        class="c-base-card-tpl__subtitle"
      >
        {{ props.subtitle }}
      </p>
    </header>

    <div class="c-base-card-tpl__body">
      <slot />
    </div>

    <footer
      v-if="$slots.footer"
      class="c-base-card-tpl__footer"
    >
      <slot name="footer" />
    </footer>
  </section>
</template>