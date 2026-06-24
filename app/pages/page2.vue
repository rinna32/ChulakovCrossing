<script setup lang="ts">
</script>

<template>
  <section class="px-[clamp(24px,6vw,96px)] pt-[clamp(32px,6vh,80px)] pb-24">
    <p class="mb-4 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">О студии</p>

    <h1 class="m-0 max-w-[15ch] font-bold leading-[1.0] tracking-[-0.02em] text-[clamp(40px,7vw,92px)]">
      Делаем цифровые продукты, которым доверяют
    </h1>

    <p class="mt-8 max-w-[760px] text-[clamp(17px,2vw,22px)] leading-[1.6] text-muted">
      Chulakov — продуктовая студия дизайна и разработки. Мы проектируем и собираем сайты,
      мобильные приложения и интерактивные цифровые продукты — от первого исследования и
      прототипа до запуска и развития. Среди работ — проекты для крупных российских брендов,
      собственные продукты и дизайн-системы, а команда исследований помогает выпускать
      решения, основанные на данных, а не на догадках. По версии крупнейших отраслевых
      рейтингов студия входит в число лидеров российского диджитал-рынка.
    </p>

    <h2 class="mt-20 mb-10 font-bold tracking-[-0.01em] text-[clamp(28px,4vw,52px)]">
      Наши ценности
    </h2>

    <div class="grid gap-5 md:grid-cols-3">
      <article class="rounded-card border border-line bg-white p-8">
        <span class="block h-1.5 w-10 rounded-full bg-[#fbde33]"></span>
        <p class="mt-6 text-[44px] font-bold leading-none">01</p>
        <h3 class="mt-4 text-2xl font-semibold">Ответственность</h3>
        <p class="mt-3 leading-[1.6] text-muted">
          Основа отношений — ответственность за результат. Мы верим в ответственность,
          не ограниченную инструкциями: каждый доводит дело до конца и отвечает за то,
          что отдаёт пользователю и клиенту, а не за формальное «сделал, что просили».
        </p>
      </article>

      <article class="rounded-card border border-line bg-white p-8">
        <span class="block h-1.5 w-10 rounded-full bg-[#fbde33]"></span>
        <p class="mt-6 text-[44px] font-bold leading-none">02</p>
        <h3 class="mt-4 text-2xl font-semibold">Прозрачность</h3>
        <p class="mt-3 leading-[1.6] text-muted">
          Честно и открыто обсуждаем проблемы и решения — внутри команды и с клиентами.
          Это укрепляет доверие и даёт ясность на каждом этапе проекта: никто не остаётся
          в неведении, а сложности решаются раньше, чем успевают стать проблемами.
        </p>
      </article>

      <article class="rounded-card border border-line bg-white p-8">
        <span class="block h-1.5 w-10 rounded-full bg-[#fbde33]"></span>
        <p class="mt-6 text-[44px] font-bold leading-none">03</p>
        <h3 class="mt-4 text-2xl font-semibold">Скорость</h3>
        <p class="mt-3 leading-[1.6] text-muted">
          Скорость достижения результата важна не меньше, чем качество. Мы быстро доводим
          идеи до пользы и обратной связи, дробим большое на маленькие шаги и не застреваем
          в бесконечной полировке там, где можно проверить гипотезу уже сегодня.
        </p>
      </article>
    </div>

    <div class="mt-20 flex flex-wrap items-center gap-6">
      <p class="m-0 font-medium text-[clamp(18px,2.4vw,28px)]">
        Готов проверить, как ты понимаешь эти ценности?
      </p>
      <NuxtLink to="/game" class="btn btn--primary">
        Играть <span class="btn__arrow">→</span>
      </NuxtLink>
    </div>
  </section>
</template>
