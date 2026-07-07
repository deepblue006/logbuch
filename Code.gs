/**
 * Logbuch des Kapitäns — Funkverbindung (Privatdeck) · v1
 *
 * Liefert die Termine der nächsten 14 Tage als JSON — genug für
 * „Termine heute“ und den Ausguck. Läuft ausschließlich im eigenen
 * Google-Konto; die Web-App-Adresse ist ein Geheimnis wie ein
 * Haustürschlüssel und gehört in keine fremde Hand.
 *
 * Serientermine löst Google selbst korrekt auf — deshalb dieser Weg
 * statt fragilem iCal-Parsing.
 */

var TAGE_VORAUS = 14;

// Auf true setzen, wenn NUR der Hauptkalender geliefert werden soll
// (sonst: alle Kalender, auch Familien- und abonnierte Kalender).
var NUR_HAUPTKALENDER = false;

function doGet() {
  var von = new Date();
  von.setHours(0, 0, 0, 0);
  var bis = new Date(von.getTime() + TAGE_VORAUS * 24 * 60 * 60 * 1000);
  var zone = Session.getScriptTimeZone();

  var kalender = NUR_HAUPTKALENDER
    ? [CalendarApp.getDefaultCalendar()]
    : CalendarApp.getAllCalendars();

  var termine = [];
  kalender.forEach(function (kal) {
    kal.getEvents(von, bis).forEach(function (ev) {
      termine.push({
        titel: ev.getTitle() || '(ohne Titel)',
        ort: ev.getLocation() || '',
        datum: Utilities.formatDate(ev.getStartTime(), zone, 'yyyy-MM-dd'),
        uhrzeit: ev.isAllDayEvent()
          ? null
          : Utilities.formatDate(ev.getStartTime(), zone, 'HH:mm')
      });
    });
  });

  termine.sort(function (a, b) {
    return (a.datum + (a.uhrzeit || '00:00')).localeCompare(b.datum + (b.uhrzeit || '00:00'));
  });

  return ContentService
    .createTextOutput(JSON.stringify({
      formatVersion: 1,
      stand: new Date().toISOString(),
      termine: termine
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
