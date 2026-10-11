# Airtime

Źródła gry Airtime z Gamedev.pl, wersja `v20260807T072237694Z-069f28`,
z metadanymi `howToPlay` wymaganymi przez aktualny silnik.

[Gra](https://www.gamedev.pl/play/airtime) · [Studio](https://www.gamedev.pl/studio/airtime)

## Deployment

Push zmian źródeł do `master` albo ręczne uruchomienie workflow **Deploy Airtime preview**
wysyła źródła do Gamedev.pl i uruchamia build podglądu. Platforma wykonuje typecheck,
smoke i build; wynik oraz podgląd są w Studio. Zielony workflow oznacza przyjęcie
źródeł i uruchomienie buildu, a nie zakończenie jego weryfikacji.

1. W [połączeniu twórcy w Studio](https://www.gamedev.pl/studio/airtime/connect)
   skopiuj klucz twórcy Gamedev.pl.
2. Dodaj go w [sekretach Actions](https://github.com/gtanczyk/airtime/settings/secrets/actions)
   jako **GAMEDEV_CREATOR_KEY**. Nie zapisuj go w plikach ani commitach.
3. Uruchom workflow w zakładce Actions.

Workflow aktualizuje podgląd w Studio. Publiczna wersja gry wymaga osobnej publikacji
i pełnej weryfikacji; stare `TRACE.json` i `PLAYTEST.json` nie są dowodem dla nowych zmian.
Nie edytuj równolegle tej samej rundy w Studio i w CI. Gdy Studio zgłasza stop lub ma
oczekujące wiadomości twórcy, workflow przerywa pracę.

`index.html` jest zachowaną stroną źródłowej wersji. Aktualna platforma generuje stronę
z `GAME.json.howToPlay`; workflow nie wysyła `index.html` ani konfiguracji repozytorium.

## Sprawdzenie paczki lokalnie

Wymagany Node.js 22 lub nowszy; brak dodatkowych zależności.

```sh
node scripts/deploy.mjs --dry-run
```

Do lokalnego uruchamiania gry użyj oficjalnego [gamedevpl CLI](https://www.gamedev.pl/connect)
i jego poleceń `checkout airtime` oraz `play` — gra korzysta z Creator Kit, nie jest
samodzielną stroną HTML.
