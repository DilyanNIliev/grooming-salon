/* =========================================================
   Пух & Мустак — script.js
   Vanilla JS, без зависимости.
   Съдържание:
     1. Данни (услуги, галерия, работно време)
     2. Помощни функции
     3. Навигация и скрол
     4. Анимации при скрол (reveal)
     5. Услуги и цени (табове)
     6. Галерия „преди/след" + филтри
     7. Календар
     8. Свободни часове
     9. Форма за резервация + валидация
    10. Модал и toast
   ========================================================= */
(function () {
  'use strict';

  /* ------------- 1. ДАННИ ------------- */

  // Цените са в лева, по размер: малко / средно / голямо куче / котка
  const SERVICES = [
    {
      id: 'kapane',
      icon: '🛁',
      name: 'Къпане и сушене',
      desc: 'Топла баня с хипоалергенен шампоан, масаж на кожата, сушене с безшумен сешоар и сресване.',
      price: { small: 25, medium: 35, large: 45, cat: 40 },
      time: { small: '45 мин', medium: '60 мин', large: '80 мин', cat: '50 мин' }
    },
    {
      id: 'podstrigvane',
      icon: '✂️',
      name: 'Подстригване',
      desc: 'Оформяне с машинка или ножица по стандарта на породата или по ваше желание.',
      price: { small: 35, medium: 50, large: 70, cat: 60 },
      time: { small: '60 мин', medium: '90 мин', large: '120 мин', cat: '75 мин' }
    },
    {
      id: 'nokti',
      icon: '💅',
      name: 'Подрязване на нокти',
      desc: 'Внимателно скъсяване и изпиляване, без досягане на кръвоносния съд.',
      price: { small: 10, medium: 12, large: 15, cat: 15 },
      time: { small: '15 мин', medium: '15 мин', large: '20 мин', cat: '20 мин' }
    },
    {
      id: 'ushi',
      icon: '👂',
      name: 'Почистване на уши',
      desc: 'Почистване с ветеринарен разтвор и обезкосмяване на ушния канал при нужда.',
      price: { small: 10, medium: 12, large: 15, cat: 15 },
      time: { small: '15 мин', medium: '15 мин', large: '20 мин', cat: '15 мин' }
    },
    {
      id: 'vazli',
      icon: '🪮',
      name: 'Третиране на възли',
      desc: 'Търпеливо разплитане със специален балсам. Ако възлите са до кожата — обсъждаме заедно.',
      price: { small: 20, medium: 30, large: 40, cat: 45 },
      time: { small: '30 мин', medium: '45 мин', large: '60 мин', cat: '60 мин' }
    },
    {
      id: 'paket',
      icon: '⭐',
      featured: true,
      name: 'Пълен пакет',
      desc: 'Къпане + подстригване + нокти + уши + парфюм и панделка. Най-изгодно.',
      price: { small: 55, medium: 75, large: 100, cat: 85 },
      time: { small: '90 мин', medium: '120 мин', large: '150 мин', cat: '110 мин' }
    }
  ];

  const SIZE_LABEL = {
    small: 'малко куче',
    medium: 'средно куче',
    large: 'голямо куче',
    cat: 'котка'
  };

  const GALLERY = [
    { slug: 'bichon',    name: 'Луси',  breed: 'Бишон фризе',            tags: ['dog', 'long'],  service: 'Пълен пакет · 55 лв.' },
    { slug: 'yorkie',    name: 'Чарли', breed: 'Йоркширски териер',      tags: ['dog', 'long'],  service: 'Подстригване · 35 лв.' },
    { slug: 'persian',   name: 'Мая',   breed: 'Персийска котка',        tags: ['cat', 'long'],  service: 'Третиране на възли · 45 лв.' },
    { slug: 'poodle',    name: 'Боби',  breed: 'Пудел',                  tags: ['dog', 'long'],  service: 'Пълен пакет · 75 лв.' },
    { slug: 'maltese',   name: 'Рошко', breed: 'Малтезе',                tags: ['dog', 'long'],  service: 'Къпане и подстригване · 60 лв.' },
    { slug: 'britanska', name: 'Сиси',  breed: 'Британска късокосместа', tags: ['cat', 'short'], service: 'Къпане и нокти · 50 лв.' }
  ];

  // Работно време: 0 = неделя … 6 = събота
  const HOURS = {
    1: [9, 19], 2: [9, 19], 3: [9, 19], 4: [9, 19], 5: [9, 19],
    6: [10, 16], 0: null // неделя — почивен ден
  };

  const MONTHS = ['януари', 'февруари', 'март', 'април', 'май', 'юни',
    'юли', 'август', 'септември', 'октомври', 'ноември', 'декември'];
  const DAYS_SHORT = ['нд', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

  const STORE_KEY = 'puh-mustak-bookings';

  /* ------------- 2. ПОМОЩНИ ------------- */

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const iso = (d) => {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  };

  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  /** Детерминиран псевдо-случаен генератор — за да са „заетите" часове
   *  еднакви при всяко зареждане на страницата (иначе изглежда счупено). */
  function seeded(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return () => {
      h += 0x6D2B79F5;
      let t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const readBookings = () => {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY)) || [];
    } catch (e) {
      return [];
    }
  };

  const saveBooking = (b) => {
    try {
      const all = readBookings();
      all.push(b);
      localStorage.setItem(STORE_KEY, JSON.stringify(all));
    } catch (e) {
      /* localStorage може да е блокиран — резервацията пак се показва */
    }
  };

  /** Всички часове за дадена дата + кои са заети. */
  function slotsFor(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const range = HOURS[d.getDay()];
    if (!range) return [];

    const rnd = seeded(dateStr);
    const taken = readBookings()
      .filter((b) => b.date === dateStr)
      .map((b) => b.time);

    // За днешния ден не предлагаме часове, които вече са минали
    // (плюс 1 час буфер за пътуване до салона).
    const now = new Date();
    const isToday = dateStr === iso(now);
    const earliest = isToday ? now.getHours() + 1 : -1;

    const out = [];
    for (let h = range[0]; h < range[1]; h++) {
      const time = String(h).padStart(2, '0') + ':00';
      const busy = h <= earliest || rnd() < 0.38 || taken.indexOf(time) !== -1;
      out.push({ time: time, free: !busy, past: h <= earliest });
    }
    return out;
  }

  const freeCount = (dateStr) => slotsFor(dateStr).filter((s) => s.free).length;

  /* ------------- 3. НАВИГАЦИЯ ------------- */

  const header = $('#header');
  const nav = $('#nav');
  const burger = $('#burger');

  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Затвори менюто' : 'Отвори менюто');
  });

  $$('#nav a').forEach((a) => a.addEventListener('click', () => {
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  }));

  const toTop = $('#to-top');
  const onScroll = () => {
    header.classList.toggle('is-stuck', window.scrollY > 8);
    toTop.classList.toggle('is-visible', window.scrollY > 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  toTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Подчертаване на активната секция в менюто
  const navLinks = $$('#nav .nav__list a');
  const sections = navLinks
    .map((a) => $(a.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle(
          'is-active', a.getAttribute('href') === '#' + en.target.id
        ));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
  }

  $('#year').textContent = new Date().getFullYear();

  /* ------------- 4. REVEAL АНИМАЦИИ ------------- */

  const revealables = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const ro = new IntersectionObserver((entries, obs) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('is-visible');
          obs.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    revealables.forEach((el) => ro.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add('is-visible'));
  }

  /* ------------- 5. УСЛУГИ И ЦЕНИ ------------- */

  const grid = $('#services-grid');
  let activeSize = 'small';

  function renderServices(size) {
    grid.innerHTML = SERVICES.map((s) => `
      <article class="card${s.featured ? ' card--featured' : ''}">
        ${s.featured ? '<span class="card__ribbon">Най-избирано</span>' : ''}
        <div class="card__ico" aria-hidden="true">${s.icon}</div>
        <h3>${s.name}</h3>
        <p class="card__desc">${s.desc}</p>
        <div class="card__meta">
          <span class="card__price">${s.price[size]} лв. <small>/ ${SIZE_LABEL[size]}</small></span>
          <span class="card__time">⏱ ${s.time[size]}</span>
        </div>
        <button type="button" class="btn btn--ghost card__btn" data-book="${s.id}" data-size="${size}">
          Запази час
        </button>
      </article>`).join('');
  }

  $$('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      $$('.tab').forEach((t) => {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      grid.setAttribute('aria-labelledby', tab.id);
      activeSize = tab.dataset.size;
      renderServices(activeSize);
    });
  });

  // Бутон „Запази час" в картата → попълва формата и скролва
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-book]');
    if (!btn) return;
    $('#size').value = btn.dataset.size;
    fillServiceOptions();
    $('#service').value = btn.dataset.book;
    updatePrice();
    $('#rezervaciya').scrollIntoView({ behavior: 'smooth' });
  });

  renderServices(activeSize);

  /* ------------- 6. ГАЛЕРИЯ ПРЕДИ/СЛЕД ------------- */

  const gallery = $('#gallery');

  function renderGallery(filter) {
    const items = GALLERY.filter((g) => filter === 'all' || g.tags.indexOf(filter) !== -1);

    if (!items.length) {
      gallery.innerHTML = '<p class="gallery__empty">Няма трансформации в тази категория.</p>';
      return;
    }

    gallery.innerHTML = items.map((g, i) => `
      <figure class="ba" style="animation-delay:${i * 60}ms">
        <div class="ba__stage">
          <img src="assets/img/${g.slug}-before.svg" loading="lazy" width="560" height="560"
               alt="${g.breed} ${g.name} преди груминг процедура">
          <img class="ba__after" src="assets/img/${g.slug}-after.svg" loading="lazy" width="560" height="560"
               alt="${g.breed} ${g.name} след груминг процедура">
          <span class="ba__tag ba__tag--before">Преди</span>
          <span class="ba__tag ba__tag--after">След</span>
          <input class="ba__range" type="range" min="0" max="100" value="50" step="1"
                 aria-label="Плъзгач преди/след за ${g.name}">
          <span class="ba__handle"><span class="ba__knob" aria-hidden="true">⇄</span></span>
        </div>
        <figcaption class="ba__info">
          <span>
            <strong>${g.name}</strong>
            <small>${g.breed}</small>
          </span>
          <span class="ba__price">${g.service}</span>
        </figcaption>
      </figure>`).join('');

    // Плъзгачи
    $$('.ba', gallery).forEach((fig) => {
      const range = $('.ba__range', fig);
      const after = $('.ba__after', fig);
      const handle = $('.ba__handle', fig);
      const stage = $('.ba__stage', fig);

      const set = (v) => {
        after.style.clipPath = `inset(0 0 0 ${v}%)`;
        handle.style.left = v + '%';
      };
      range.addEventListener('input', () => set(range.value));

      // Плъзгане с мишка/пръст директно върху снимката
      let dragging = false;
      const move = (clientX) => {
        const r = stage.getBoundingClientRect();
        const v = Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100));
        range.value = v;
        set(v);
      };
      stage.addEventListener('pointerdown', (e) => {
        dragging = true;
        stage.setPointerCapture(e.pointerId);
        move(e.clientX);
      });
      stage.addEventListener('pointermove', (e) => { if (dragging) move(e.clientX); });
      stage.addEventListener('pointerup', () => { dragging = false; });
      stage.addEventListener('pointercancel', () => { dragging = false; });

      set(50);
    });
  }

  $$('.filter').forEach((f) => {
    f.addEventListener('click', () => {
      $$('.filter').forEach((x) => x.classList.remove('is-active'));
      f.classList.add('is-active');
      renderGallery(f.dataset.filter);
    });
  });

  renderGallery('all');

  /* ------------- 7. КАЛЕНДАР ------------- */

  const calGrid = $('#cal-grid');
  const calTitle = $('#cal-title');
  const prevBtn = $('#cal-prev');
  const nextBtn = $('#cal-next');

  const today = startOfDay(new Date());
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 3, 0); // 3 месеца напред
  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth();
  let selectedDate = null;
  let selectedTime = null;

  function renderCalendar() {
    calTitle.textContent = MONTHS[viewMonth] + ' ' + viewYear;

    const first = new Date(viewYear, viewMonth, 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const offset = (first.getDay() + 6) % 7; // понеделник = 0

    let html = '';
    for (let i = 0; i < offset; i++) html += '<span class="day day--empty"></span>';

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      const key = iso(date);
      const closed = !HOURS[date.getDay()];
      const past = date < today;
      const tooFar = date > maxDate;
      const free = (closed || past || tooFar) ? 0 : freeCount(key);
      const disabled = closed || past || tooFar || free === 0;

      html += `<button type="button" class="day${key === selectedDate ? ' is-selected' : ''}${
        key === iso(today) ? ' is-today' : ''}" data-date="${key}"${disabled ? ' disabled' : ''}
        aria-label="${d} ${MONTHS[viewMonth]}${disabled
          ? (closed ? ', почивен ден' : ', няма свободни часове')
          : ', ' + free + ' свободни часа'}">
        ${d}${disabled ? '<span class="day__dot"></span>' : '<span class="day__dot"></span>'}
      </button>`;
    }

    calGrid.innerHTML = html;

    prevBtn.disabled = (viewYear === today.getFullYear() && viewMonth === today.getMonth());
    nextBtn.disabled = new Date(viewYear, viewMonth + 1, 1) > maxDate;
  }

  prevBtn.addEventListener('click', () => {
    if (--viewMonth < 0) { viewMonth = 11; viewYear--; }
    renderCalendar();
  });
  nextBtn.addEventListener('click', () => {
    if (++viewMonth > 11) { viewMonth = 0; viewYear++; }
    renderCalendar();
  });

  calGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.day[data-date]');
    if (!btn || btn.disabled) return;
    selectedDate = btn.dataset.date;
    selectedTime = null;
    renderCalendar();
    renderSlots();
    updateSummary();
  });

  renderCalendar();

  /* ------------- 8. ЧАСОВЕ ------------- */

  const slotsBox = $('#slots');

  function renderSlots() {
    if (!selectedDate) {
      slotsBox.innerHTML = '<p class="slots__empty">Първо избери дата от календара.</p>';
      return;
    }
    const list = slotsFor(selectedDate).filter((s) => !s.past);
    if (!list.length) {
      slotsBox.innerHTML =
        '<p class="slots__empty">За днес вече няма свободни часове — изберете друга дата.</p>';
      return;
    }
    slotsBox.innerHTML = list.map((s) => `
      <button type="button" class="slot${s.time === selectedTime ? ' is-selected' : ''}"
        data-time="${s.time}"${s.free ? '' : ' disabled'}
        aria-label="${s.time}${s.free ? '' : ' — зает'}">${s.time}</button>`).join('');
  }

  slotsBox.addEventListener('click', (e) => {
    const btn = e.target.closest('.slot[data-time]');
    if (!btn || btn.disabled) return;
    selectedTime = btn.dataset.time;
    renderSlots();
    updateSummary();
  });

  function prettyDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return `${DAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} г.`;
  }

  function updateSummary() {
    const box = $('#selection-summary');
    if (selectedDate && selectedTime) {
      box.innerHTML = `✅ Избрахте <strong>${prettyDate(selectedDate)}</strong> в <strong>${selectedTime} ч.</strong>`;
    } else if (selectedDate) {
      box.innerHTML = `📅 <strong>${prettyDate(selectedDate)}</strong> — сега избери час.`;
    } else {
      box.textContent = '';
    }
  }

  /* ------------- 9. ФОРМА ------------- */

  const form = $('#booking-form');
  const sizeSel = $('#size');
  const serviceSel = $('#service');

  function fillServiceOptions() {
    const size = sizeSel.value;
    const current = serviceSel.value;
    serviceSel.innerHTML = '<option value="">— избери услуга —</option>' +
      SERVICES.map((s) => {
        const label = size
          ? `${s.name} — ${s.price[size]} лв. · ${s.time[size]}`
          : s.name;
        return `<option value="${s.id}">${label}</option>`;
      }).join('');
    if (current) serviceSel.value = current;
  }

  function updatePrice() {
    const box = $('#price-box');
    const svc = SERVICES.find((s) => s.id === serviceSel.value);
    const size = sizeSel.value;
    if (!svc || !size) { box.hidden = true; return; }
    box.hidden = false;
    $('#price-value').textContent = svc.price[size] + ' лв.';
    $('#price-duration').textContent =
      `${svc.name} за ${SIZE_LABEL[size]} · продължителност ${svc.time[size]}`;
  }

  sizeSel.addEventListener('change', () => { fillServiceOptions(); updatePrice(); });
  serviceSel.addEventListener('change', updatePrice);
  fillServiceOptions();

  // --- валидация ---
  const showError = (name, msg) => {
    const el = $(`[data-error-for="${name}"]`);
    const field = $('#' + name).closest('.field');
    if (el) { el.textContent = msg; el.classList.add('is-shown'); }
    if (field) field.classList.add('has-error');
  };

  const clearError = (name) => {
    const el = $(`[data-error-for="${name}"]`);
    const field = $('#' + name).closest('.field');
    if (el) el.classList.remove('is-shown');
    if (field) field.classList.remove('has-error');
  };

  const PHONE_RE = /^(\+359|0)\s?8[7-9][0-9]([\s-]?[0-9]{3}){2}$/;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

  function validate() {
    let ok = true;
    const fail = (name, msg) => { showError(name, msg); ok = false; };

    ['owner', 'phone', 'email', 'pet', 'size', 'service', 'gdpr'].forEach(clearError);

    if ($('#owner').value.trim().length < 2) fail('owner', 'Моля, въведете вашето име.');

    const phone = $('#phone').value.replace(/\s/g, '');
    if (!PHONE_RE.test(phone)) fail('phone', 'Въведете валиден мобилен номер, напр. 0888 123 456.');

    if (!EMAIL_RE.test($('#email').value.trim())) fail('email', 'Въведете валиден имейл адрес.');

    if ($('#pet').value.trim().length < 2) fail('pet', 'Как се казва любимецът ви?');
    if (!sizeSel.value) fail('size', 'Изберете размер.');
    if (!serviceSel.value) fail('service', 'Изберете услуга.');

    if (!$('#gdpr').checked) {
      const el = $('[data-error-for="gdpr"]');
      el.textContent = 'Необходимо е съгласие, за да запазим часа.';
      el.classList.add('is-shown');
      ok = false;
    }

    if (!selectedDate || !selectedTime) {
      toast('⚠️ Моля, изберете дата и свободен час от календара.');
      $('#rezervaciya').scrollIntoView({ behavior: 'smooth' });
      ok = false;
    }
    return ok;
  }

  // Изчистване на грешката при коригиране
  ['owner', 'phone', 'email', 'pet', 'size', 'service'].forEach((name) => {
    $('#' + name).addEventListener('input', () => clearError(name));
  });
  $('#gdpr').addEventListener('change', () => {
    if ($('#gdpr').checked) $('[data-error-for="gdpr"]').classList.remove('is-shown');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) {
      const firstErr = $('.field.has-error input, .field.has-error select');
      if (firstErr) firstErr.focus();
      return;
    }

    const svc = SERVICES.find((s) => s.id === serviceSel.value);
    const size = sizeSel.value;

    const booking = {
      date: selectedDate,
      time: selectedTime,
      owner: $('#owner').value.trim(),
      phone: $('#phone').value.trim(),
      email: $('#email').value.trim(),
      pet: $('#pet').value.trim(),
      breed: $('#breed').value.trim(),
      size: size,
      service: svc.name,
      price: svc.price[size],
      duration: svc.time[size],
      notes: $('#notes').value.trim(),
      sms: $('#sms').checked,
      created: new Date().toISOString()
    };

    saveBooking(booking);

    /* --- ТУК се свързва истински бекенд ---
       Виж README.md → „Как да получавам резервациите на имейл".
       Пример:
       fetch('https://formspree.io/f/ВАШИЯТ_ID', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(booking)
       });
    */

    showModal(booking);
    form.reset();
    selectedTime = null;
    $('#price-box').hidden = true;
    fillServiceOptions();
    renderCalendar();
    renderSlots();
    updateSummary();
  });

  /* ------------- 10. МОДАЛ И TOAST ------------- */

  const modal = $('#modal');
  let lastFocused = null;

  function showModal(b) {
    $('#modal-lead').innerHTML =
      `Очакваме <strong>${b.pet}</strong> на <strong>${prettyDate(b.date)}</strong> в <strong>${b.time} ч.</strong>`;

    $('#modal-details').innerHTML = `
      <dt>Услуга</dt><dd>${b.service}</dd>
      <dt>Размер</dt><dd>${SIZE_LABEL[b.size]}</dd>
      ${b.breed ? `<dt>Порода</dt><dd>${b.breed}</dd>` : ''}
      <dt>Продължителност</dt><dd>${b.duration}</dd>
      <dt>Цена</dt><dd>${b.price} лв.</dd>`;

    $('#modal-email').textContent = b.email;
    $('#modal-phone').textContent = b.phone;
    $('#modal-sms').hidden = !b.sms;

    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    $('.modal__close', modal).focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
    toast('🎉 Часът е запазен! Проверете пощата си.');
  }

  modal.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
    // фокус-капан в модала
    if (e.key === 'Tab' && !modal.hidden) {
      const f = $$('button, a[href], input, select, textarea', modal)
        .filter((el) => !el.disabled && el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    requestAnimationFrame(() => t.classList.add('is-shown'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      t.classList.remove('is-shown');
      setTimeout(() => { t.hidden = true; }, 300);
    }, 4200);
  }
})();
