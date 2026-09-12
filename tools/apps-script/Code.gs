/**
 * Пух & Мустак — Google Apps Script за резервациите
 * ==================================================
 * Какво прави:
 *   GET  ?date=2026-09-20  ->  {"status":"success","busySlots":["10:00","11:00"]}
 *   POST (JSON тяло)       ->  записва ред в Google Sheets, създава събитие
 *                              в Google Calendar и изпраща имейл на клиента
 *                              и на салона.
 *
 * Как се качва — виж README.md, раздел „Свързване с Google Apps Script".
 *
 * Този файл е съвместим със съществуващия скрипт на LUMINA (същите имена на
 * полета), но допълнително:
 *   • блокира ВСИЧКИ часове, които една услуга покрива (не само началния);
 *   • отказва резервация, ако часът е зает (връща status:"busy");
 *   • записва името и породата на любимеца в отделни колони.
 */

/* ============ НАСТРОЙКИ ============ */

var CONFIG = {
  // ID на Google Sheet таблицата (от адреса: /spreadsheets/d/ТОВА_Е_ID/edit).
  // Остави празно, ако скриптът е прикачен към самата таблица.
  SHEET_ID: '',
  SHEET_NAME: 'Резервации',

  // ID на календара: „primary" за основния, или адресът на отделен календар.
  CALENDAR_ID: 'primary',

  // Имейл на салона — там идват известията за нова резервация.
  SALON_EMAIL: 'zdravei@puhimustak.bg',
  SALON_NAME: 'Пух & Мустак',
  SALON_PHONE: '0888 123 456',
  SALON_ADDRESS: 'ул. „Цар Иван Асен II“ 42, София',

  // Стъпката трябва да съвпада със SLOT_STEP_MINUTES в assets/js/script.js
  SLOT_STEP_MINUTES: 60,

  TIMEZONE: 'Europe/Sofia'
};

/* ============ GET — свободни часове ============ */

function doGet(e) {
  try {
    var dateStr = e && e.parameter ? e.parameter.date : null;
    if (!dateStr) {
      return json({ status: 'error', message: 'Липсва параметър date' });
    }
    return json({ status: 'success', date: dateStr, busySlots: getBusySlots_(dateStr) });
  } catch (err) {
    return json({ status: 'error', message: String(err) });
  }
}

/**
 * Връща заетите начални часове за деня. Ако едно събитие продължава
 * 90 минути, се блокират всички стъпки, които то застъпва.
 */
function getBusySlots_(dateStr) {
  var cal = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID) || CalendarApp.getDefaultCalendar();
  var dayStart = new Date(dateStr + 'T00:00:00');
  var dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  var events = cal.getEvents(dayStart, dayEnd);
  var step = CONFIG.SLOT_STEP_MINUTES;
  var busy = {};

  events.forEach(function (ev) {
    if (ev.isAllDayEvent()) return;
    var from = ev.getStartTime().getTime();
    var to = ev.getEndTime().getTime();

    // Минаваме по всички стъпки в деня и маркираме застъпените.
    for (var m = 0; m < 24 * 60; m += step) {
      var slotStart = new Date(dayStart.getTime() + m * 60000).getTime();
      var slotEnd = slotStart + step * 60000;
      if (slotStart < to && slotEnd > from) {
        busy[pad_(Math.floor(m / 60)) + ':' + pad_(m % 60)] = true;
      }
    }
  });

  return Object.keys(busy).sort();
}

/* ============ POST — нова резервация ============ */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (!data.rawDate || !data.rawTime || !data.name || !data.phone) {
      return json({ status: 'error', message: 'Непълни данни за резервацията' });
    }

    var duration = Number(data.duration) || 60;
    var start = new Date(data.rawDate + 'T' + data.rawTime + ':00');
    var end = new Date(start.getTime() + duration * 60000);

    // Проверка дали часът не е зает в този момент.
    var cal = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID) || CalendarApp.getDefaultCalendar();
    var overlapping = cal.getEvents(start, end).filter(function (ev) {
      return !ev.isAllDayEvent();
    });
    if (overlapping.length > 0) {
      return json({ status: 'busy', message: 'Часът вече е зает' });
    }

    var title = (data.petName || data.name) + ' — ' + (data.serviceName || 'груминг');
    var description =
      'Клиент: ' + data.name + '\n' +
      'Телефон: ' + data.phone + '\n' +
      'Имейл: ' + (data.email || '—') + '\n' +
      'Любимец: ' + (data.petName || '—') +
      (data.petBreed ? ' (' + data.petBreed + ')' : '') + '\n' +
      'Размер: ' + (data.categoryLabel || '—') + '\n' +
      'Услуга: ' + (data.serviceName || '—') + ' — ' + (data.price || '—') + ' лв.\n' +
      'Бележки: ' + (data.ownerNotes || data.notes || '—');

    cal.createEvent(title, start, end, {
      description: description,
      location: CONFIG.SALON_ADDRESS
    });

    saveToSheet_(data);
    sendEmails_(data);

    return json({ status: 'success', message: 'Резервацията е приета' });
  } catch (err) {
    return json({ status: 'error', message: String(err) });
  }
}

/* ============ ПОМОЩНИ ============ */

function saveToSheet_(d) {
  var ss = CONFIG.SHEET_ID
    ? SpreadsheetApp.openById(CONFIG.SHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;

  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    sheet.appendRow([
      'Получена на', 'Дата', 'Час', 'Клиент', 'Телефон', 'Имейл',
      'Любимец', 'Порода', 'Размер', 'Услуга', 'Времетраене (мин)',
      'Цена (лв.)', 'SMS напомняне', 'Бележки'
    ]);
    sheet.getRange(1, 1, 1, 14).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  sheet.appendRow([
    new Date(), d.rawDate || '', d.rawTime || '', d.name || '', d.phone || '',
    d.email || '', d.petName || '', d.petBreed || '', d.categoryLabel || '',
    d.serviceName || '', d.duration || '', d.price || '',
    d.smsReminder ? 'да' : 'не', d.ownerNotes || d.notes || ''
  ]);
}

function sendEmails_(d) {
  var when = (d.dateFormatted || d.rawDate) + ' в ' + (d.time || d.rawTime) + ' ч.';

  // 1) Потвърждение до клиента
  if (d.email) {
    MailApp.sendEmail({
      to: d.email,
      subject: 'Часът ви в ' + CONFIG.SALON_NAME + ' е запазен',
      htmlBody:
        '<p>Здравейте, ' + esc_(d.name) + '!</p>' +
        '<p>Часът за <strong>' + esc_(d.petName || 'вашия любимец') + '</strong> е запазен за <strong>' +
        esc_(when) + '</strong></p>' +
        '<ul>' +
        '<li>Услуга: ' + esc_(d.serviceName) + '</li>' +
        '<li>Времетраене: около ' + esc_(String(d.duration)) + ' мин.</li>' +
        '<li>Цена: ' + esc_(String(d.price)) + ' лв.</li>' +
        '</ul>' +
        '<p>Адрес: ' + esc_(CONFIG.SALON_ADDRESS) + '<br>' +
        'Телефон: ' + esc_(CONFIG.SALON_PHONE) + '</p>' +
        '<p>Ако се налага отказ или преместване, обадете се поне 12 часа предварително.</p>' +
        '<p>До скоро!<br>' + esc_(CONFIG.SALON_NAME) + '</p>'
    });
  }

  // 2) Известие до салона
  MailApp.sendEmail({
    to: CONFIG.SALON_EMAIL,
    subject: 'Нова резервация: ' + when + ' — ' + (d.petName || d.name),
    htmlBody:
      '<h3>Нова резервация</h3>' +
      '<p><strong>' + esc_(when) + '</strong></p>' +
      '<ul>' +
      '<li>Клиент: ' + esc_(d.name) + '</li>' +
      '<li>Телефон: ' + esc_(d.phone) + '</li>' +
      '<li>Имейл: ' + esc_(d.email || '—') + '</li>' +
      '<li>Любимец: ' + esc_(d.petName || '—') +
      (d.petBreed ? ' (' + esc_(d.petBreed) + ')' : '') + '</li>' +
      '<li>Размер: ' + esc_(d.categoryLabel || '—') + '</li>' +
      '<li>Услуга: ' + esc_(d.serviceName || '—') + ' — ' + esc_(String(d.price)) + ' лв.</li>' +
      '<li>SMS напомняне: ' + (d.smsReminder ? 'да' : 'не') + '</li>' +
      '<li>Бележки: ' + esc_(d.ownerNotes || d.notes || '—') + '</li>' +
      '</ul>'
  });
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function pad_(n) {
  return String(n).length < 2 ? '0' + n : String(n);
}

function esc_(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ============ ТЕСТ ============
 * Стартирай ръчно от редактора (Run -> testSetup), за да дадеш
 * разрешения на скрипта и да провериш, че всичко работи.
 */
function testSetup() {
  var today = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd');
  Logger.log('Заети часове днес: ' + JSON.stringify(getBusySlots_(today)));
}
