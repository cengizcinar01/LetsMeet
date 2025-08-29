## 1. Einleitung und Zielsetzung

Dieses Dokument bildet den ersten Schritt der Datenbankmigration für die Let's Meet GmbH. Grundlage dafür ist eine Analyse der bestehenden Datenquellen: Excel, MongoDB, XML, sowie eine Betrachtung der zukünftigen Anwendungsfälle.

Als Ergebnis liegt ein logisches Datenmodell in Form eines Entity-Relationship-Diagramms vor. Dieses Modell dient als Grundlage für die anschließende Umsetzung in einer PostgreSQL-Datenbank.

## 2. Datenmodell

![Kozeptuelles und logisches Datenmodell für Let's Meet](assets/datenmodell.png)

## 3. Entwurfsentscheidungen

Das Modell orientiert sich an den Grundsätzen der Datenbanknormalisierung insbesondere der 3. Normalform, um Redundanzen zu minimieren und die Datenintegrität zu maximieren.

**Zentrale Entität `users`:**
Die `users`-Tabelle bildet den Kern des Modells und enthält alle Benutzer-Stammdaten.

**Atomare Speicherung von Daten:**
Werte wie Name (`first_name`, `last_name`) und Adresse (`street`, `postal_code`, `city`) wurden in Einzelfelder zerlegt, um Filterungen und Sortierungen zu ermöglichen.

**Detaillierte Modellierung von Hobbys:**
Die `hobbies`-Tabelle sorgt für eine zentrale und redundanzfreie Verwaltung aller Hobby-Bezeichnungen. Um die unterschiedlichen Kontexte klar zu trennen, wurden zwei Verknüpfungstabellen eingeführt:

- **`user_hobbies`:** Bildet ab, welche Hobbys ein Benutzer selbst hat und wie er diese priorisiert.
- **`user_hobby_preferences`:** Bildet ab, welche Hobbys ein Benutzer bei anderen Nutzern sucht und wie er diese bewertet.

## 4. Datenschutz

### Rechtsgrundlage für die Datenverarbeitung

- **Primäre Rechtsgrundlage:** Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)
- **Informierte Einwilligung:** Nutzer müssen ausdrücklich und verständlich über die Datenverarbeitung informiert werden und dieser zustimmen
- **Widerrufbarkeit:** Einwilligung muss jederzeit widerrufbar sein

### Datenkategorien im Projekt

#### Allgemeine personenbezogene Daten (Art. 6 DSGVO)

- **Stammdaten:** Name, E-Mail-Adresse, Postanschrift, Geburtsdatum
- **Kommunikationsdaten:** Private Nachrichten zwischen Nutzern
- **Interaktionsdaten:** Likes, Freundschaftsanfragen, Hobbys

#### Besonders sensible Daten (Art. 9 DSGVO)

- **Geschlecht und sexuelle Orientierung:** Geschlechtsidentität, Präferenzen bei der Partnersuche
- **Biometrische Daten:** Profilbilder und weitere hochgeladene Fotos

### Besonderer Schutzbedarf

Daten wie sexuelle Orientierung und private Nachrichten haben einen extrem hohen Schutzbedarf, da deren Missbrauch zu Diskriminierung oder erheblichen persönlichen Schäden führen kann.

### Schutzmaßnahmen

#### Technische Maßnahmen

- **Verschlüsselung:** Sichere Speicherung sensibler Daten
- **Passwort-Hashing:** Sichere Authentifizierung mit bcrypt/Argon2
- **HTTPS/TLS:** Verschlüsselte Datenübertragung
- **Backup-Verschlüsselung:** Sichere Datensicherung

#### Organisatorische Maßnahmen

- **Berechtigungskonzept:** Rollenbasierte Zugriffskontrolle
- **Datenschutzerklärung:** Transparente Information über Datenverarbeitung
- **Löschkonzept:** Automatische Löschung nach Kontodeaktivierung
- **Einwilligungsmanagement:** Granulare Einwilligungsoptionen

## 5. Erstellung des physischen Datenmodells

### 1. Docker Container starten

```bash
docker-compose up -d
```

### 2. Benutzer und Datenbank erstellen

```bash
PGPASSWORD=secret psql -h localhost -U postgres -c "CREATE USER \"user\" WITH PASSWORD 'secret';"
```

```bash
PGPASSWORD=secret psql -h localhost -U postgres -c "CREATE DATABASE lf8_lets_meet_db OWNER \"user\";"
```

### 3. Tabellen erstellen

```bash
PGPASSWORD=secret psql -h localhost -U user -d lf8_lets_meet_db -f results/scripts/create_tables.sql
```

### 4. Prüfen ob alles funktioniert

```bash
PGPASSWORD=secret psql -h localhost -U user -d lf8_lets_meet_db -c "\dt"
```

### 5. Container stoppen (wenn fertig)

```bash
docker-compose down
```

## Wichtige Verbindungsdaten

- **PostgreSQL**: localhost:5432
- **MongoDB**: localhost:27017
- **Benutzer**: user
- **Passwort**: secret
- **Datenbank**: lf8_lets_meet_db

## Import Scripts

### Installation

```bash
cd results/scripts
npm install
```

### Datenbank Setup

```bash
# 1. Container starten
docker-compose up -d

# 2. Tabellen erstellen
PGPASSWORD=secret psql -h localhost -U user -d lf8_lets_meet_db -f create_tables.sql
```

### Import Ausführung

#### Excel Import

```bash
cd results/scripts
npm run excel
```

- Liest `Lets Meet DB Dump.xlsx`
- Erstellt User in `users` Tabelle
- Speichert Hobby-Präferenzen in `user_hobbies`

#### Mongo Import

```bash
cd results/scripts
npm run mongo
```

- Liest likes und messages aus der MongoDB-Datenbank
- Importiert diese Daten in die PostgreSQL-Tabellen likes und messages

#### XML Import

```bash
cd results/scripts
npm run xml
```

- Liest `Lets_Meet_Hobbies.xml`
- Fügt Hobby-Fähigkeiten zu existierenden Usern hinzu
- Speichert in `user_interests`

#### Alle Scripts nacheinander

```bash
cd results/scripts
npm run all
```

## 6. Tests

Nach dem Import der Daten sollten Tests ausgeführt werden, um die Integrität und Vollständigkeit der importierten Daten zu überprüfen.

### Test-Ausführung

```bash
cd results/scripts
npm run test
```

### Was wird getestet?

- **Anzahl importierter User**: Überprüft, ob alle Benutzer aus den Quelldaten erfolgreich importiert wurden
- **Anzahl verschiedener Hobbys**: Validiert die Hobby-Kategorien aus allen Datenquellen
- **Hobby-Präferenzen**: Zählt die aus Excel importierten Benutzer-Hobby-Präferenzen
- **User-Hobby-Verknüpfungen**: Überprüft die aus XML importierten Hobby-Fähigkeiten
- **Likes**: Validiert die aus MongoDB importierten Like-Beziehungen
- **Nachrichten**: Überprüft die aus MongoDB importierten Nachrichten

#### Datenintegrität-Prüfung

- **Foreign Key Constraints**: Überprüft, ob alle Referenzen zwischen Tabellen gültig sind
- **Ungültige User-Präferenzen**: Erkennt Hobby-Präferenzen ohne gültigen Benutzer-Bezug
- **Ungültige Likes**: Identifiziert Like-Einträge mit ungültigen Benutzer-IDs

### Erwartete Test-Ausgabe

```
1576 User importiert
246 verschiedene Hobbys gefunden
4828 Hobby-Präferenzen importiert
300 User-Hobby-Verknüpfungen importiert
500 Likes importiert
300 Nachrichten importiert
0 ungültige User-Präferenzen
0 ungültige Likes

Alle Tests abgeschlossen!
```
