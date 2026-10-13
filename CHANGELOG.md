# Changelog

## Unreleased

### Breaking

### Added
- Pierwsze salto jest bezkarną próbą: pokaz zatrzymuje się w pionie do puszczenia przycisku, a błędna próba pozwala spróbować ponownie.
- Dodano samouczek czekający na pierwszy ruch, konkretne nazwy przycisków i kontekstowe objaśnienia zmiany figur.
- Po sześciu misjach pojawiają się opcjonalne wezwania publiczności z limitem trzech skoków, bez kary za pominięcie.
- Oprawa zmienia się między rozgrzewką, pokazem i finałem; wzmocniono sylwetki figur i kontury postaci.
- Dodano sześć misji z premiami, aplauz i bis z mnożnikiem ×1,5 przez cztery czyste lądowania.
- Trzy idealne lądowania z rzędu zapewniają jednorazowy ratunek po błędzie.
- Dodano rangi pokazu, nazwy podwójnych salt i Flow, reakcje widowni, światła sceny oraz konfetti w bisie.
- Podsumowanie końcowe pokazuje ukończone misje i najlepsze combo; powiększono tekst zadań na telefonach.
- Dodano wskazówki puszczenia przycisku, objaśnione odliczanie do lądowania i progresję figur.
- Dodano układ pionowy dla telefonów.
- Uspokojono tło cyrku i poprawiono czytelność akrobatki przy wysokich skokach.

### Fixed
- Podczas obrotu schowano dodatkowe panele; ocenę poprzedniego skoku oznaczono jednoznacznie, a porażka podpowiada konkretny błąd puszczenia.
- Skupiono instrukcje, orientację i ocenę lądowania przy akrobatce; usunięto narożny dial, anonimowe kwadraty, surowy zegar i powtórzony mnożnik.
- Poprawiono kontrast komunikatów, czas ich wyświetlania i opis automatycznego ratunku.
- Poprawiono ocenę niepełnego obrotu: niebezpieczny kąt lądowania kończy pokaz także przed pierwszym saltem.
- Naprawiono naliczanie figur przy trzymaniu przycisku między odbiciami; krótkie dotknięcie figury nie daje premii za różnorodność.
- Kamera utrzymuje trampolinę w kadrze, a akrobatka i wskaźniki pozostają czytelne.
- Pierwsze salto jest zgłaszane również po wcześniejszych pustych odbiciach; poprawiono polskie etykiety i kolory chorągiewek poza lewą krawędzią.

### Internal
- Wydzielono symulację lotu i dodano dwadzieścia trzy testy regresji dostępnych przez npm test.

## 0.2.0 — 2026-10-11

### Added
- Dodano npm run dev z lokalnym podglądem i automatycznym przygotowaniem Creator Kit.

## 0.1.2 — 2026-10-11

### Fixed
- Dodano menu wymagane przez aktualny GameKit i opisy gry w językach polskim i angielskim.

### Internal
- Przeniesiono pliki gry do src/ i dodano animowany podgląd w README.
- Usunięto style.css; wygląd ramki gry jest generowany z GAME.json.theme.

## 0.1.1 — 2026-10-11

### Fixed
- Naprawiono uprawnienia automatyzacji do tworzenia i aktualizowania PR synchronizacji ze Studio.

## 0.1.0 — 2026-10-11

### Added
- Zaimportowano źródła Airtime z Gamedev.pl.
- Dodano deployment podglądu, synchronizację źródeł przez PR oraz wydania sterowane changelogiem.
