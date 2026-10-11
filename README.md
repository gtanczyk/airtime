# Airtime

Źródła gry Airtime z Gamedev.pl, wersja `v20260807T072237694Z-069f28`,
z metadanymi `howToPlay` wymaganymi przez aktualny silnik.

[Gra](https://www.gamedev.pl/play/airtime) · [Studio](https://www.gamedev.pl/studio/airtime)

## Deployment

Push taga `preview-*` albo ręczne uruchomienie workflow **Deploy Airtime preview**
wysyła źródła do Gamedev.pl i uruchamia build podglądu. Platforma wykonuje typecheck,
smoke i build; wynik oraz podgląd są w Studio. Zielony workflow oznacza przyjęcie
źródeł i uruchomienie buildu, a nie zakończenie jego weryfikacji.

1. W [połączeniu twórcy w Studio](https://www.gamedev.pl/studio/airtime/connect)
   utwórz personal access token (PAT) do CI.
2. Dodaj go w [sekretach Actions](https://github.com/gtanczyk/airtime/settings/secrets/actions)
   jako **GAMEDEV_CREATOR_KEY** (nazwa pozostała dla zgodności; wartością jest PAT). Nie zapisuj go w plikach ani commitach.
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

## Kontrolowany deployment przez tag

Commity i push do master nie wdrażają gry. Aby wdrożyć konkretny commit:

```sh
git tag preview-2026-10-11-1
git push origin preview-2026-10-11-1
```

Używaj nowej nazwy taga dla każdego wdrożenia. Workflow pobiera commit wskazany
przez tag i wysyła go jako podgląd. Opis w Studio wskazuje repozytorium, tag i commit.

## Gamedev.pl → GitHub

Workflow **Sync sources from Gamedev.pl** sprawdza źródła co godzinę i na żądanie
(**Actions → Run workflow**). Jeśli są różnice względem master, tworzy lub aktualizuje
PR z gałęzi `sync/gamedev`. Bez różnic nie tworzy PR. Synchronizuje również usunięcia
plików gry; nie nadpisuje workflow, skryptów, licencji ani dokumentacji repo.

Importuje aktualne dostarczone źródła ze Studio, również podglądy. To nie oznacza,
że dana wersja przeszła weryfikację buildu. Przy aktywnym agencie albo niezapisanych
edycjach w Studio pomija sprawdzenie. Przejrzyj PR: źródła z platformy mogą zastępować
zmiany, które są już w master, lecz nie zostały jeszcze wdrożone tagiem.

Oba workflow używają tego samego PAT. Jeśli GitHub odmawia tworzenia PR przez Actions,
w **Settings → Actions → General → Workflow permissions** włącz
**Allow GitHub Actions to create and approve pull requests**.
Scalenie synchronizującego PR nie wdraża gry; deployment wymaga taga `preview-*`.
