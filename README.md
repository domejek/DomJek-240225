# Sw6ClickCollectTimeslot

Click & Collect Plugin für Shopware 6 mit konfigurierbaren Zeitfenstern (Timeslots).

## Funktionen

- Konfigurierbare Zeitfenster im Admin-Bereich
- Auswahl im Checkout
- Client- und serverseitige Validierung
- Speicherung an der Bestellung (Custom Fields)
- Anzeige in Bestellbestätigung, Kundenkonto und Admin

## Installation

```bash
# Plugin installieren und aktivieren
bin/console plugin:install --activate Sw6ClickCollectTimeslot

# Cache leeren
bin/console cache:clear

# Theme kompilieren
bin/console theme:compile
```

## Konfiguration

Im Admin unter **Einstellungen > Plugins > Sw6ClickCollectTimeslot**:

| Einstellung | Beschreibung | Standard |
|-------------|--------------|----------|
| Abholzeitfenster | Kommaseparierte Zeitfenster | 09:00-11:00, 11:00-13:00, 13:00-15:00 |
| Name der Versandart | Name für Click & Collect | Abholung im Store |

## Versandart einrichten

Die Click & Collect Versandart muss manuell im Shopware Admin erstellt werden:

### Schritt-für-Schritt

1. **Admin öffnen** → Einstellungen → Versandarten

2. **Neue Versandart erstellen**
   - Klick auf "+" oder "Versandart anlegen"
   
3. **Versandart konfigurieren**
   - **Name**: `Abholung im Store` (oder wie in der Plugin-Konfiguration eingestellt)
   - **Technischer Name**: `delivery_in_store`
   - **Lieferzeit**: nach Wunsch angeben
   - **Kosten**: 0,00 € (Click & Collect ist kostenlos)
   
4. **Verfügbarkeit einstellen**
   - Bei "Verfügbarkeit" eine passende Regel wählen oder anlegen
   - Alternativ: "Kunden können immer kaufen"
   
5. **Speichern**

6. **Versandart den Verfügbarkeiten zuweisen**
   - Die Versandart erscheint dann im Checkout zur Auswahl

### Alternative: Automatische Zuweisung

Die Versandart wird automatisch erkannt, wenn der Name in der Plugin-Konfiguration mit dem Namen der Versandart übereinstimmt (standardmäßig "Abholung im Store").

## Funktionsweise

1. Kunde wählt im Checkout die Versandart "Abholung im Store"
2. Zeitfenster-Auswahl wird eingeblendet
3. Kunde muss ein Zeitfenster auswählen
4. Bestellung wird gespeichert mit:
   - Gewähltem Zeitfenster
   - Flag für Click & Collect
   - Konfiguriertem Versandart-Namen
5. Anzeige in:
   - Bestellbestätigung (Thank-you Page)
   - Kundenkonto > Bestelldetails
   - Shopware Admin > Bestellung

## Deinstallation

```bash
# Plugin deinstallieren
bin/console plugin:uninstall Sw6ClickCollectTimeslot
```
