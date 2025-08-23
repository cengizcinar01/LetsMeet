# Phase 1: Konzeptionelles & Logisches Datenmodell

## 1. Einleitung und Zielsetzung

Dieses Dokument bildet den ersten Schritt der Datenbankmigration für die Let's Meet GmbH. Grundlage dafür ist eine Analyse der bestehenden Datenquellen (Excel, MongoDB, XML) sowie eine Betrachtung der zukünftigen Anwendungsfälle.

Als Ergebnis liegt ein logisches Datenmodell in Form eines Entity-Relationship-Diagramms (ERD) vor. Dieses Modell dient als Grundlage für die anschließende Umsetzung in einer PostgreSQL-Datenbank. Ziel ist es, mit einer normalisierten und robusten Struktur spätere Probleme bei Datenoperationen (Ändern, Löschen, Einfügen) von vornherein zu vermeiden.

## 2. Das Datenmodell (ERD)

Das folgende Diagramm zeigt die Tabellen mit ihren Spalten, Datentypen sowie die Beziehungen zwischen den Entitäten:

![Kozeptuelles Datenmodell für Let's Meet](assets/konzeptuelles_modell.png)
![Logisches Datenmodell für Let's Meet](assets/logisches_modell.png)

## 3. Entwurfsentscheidungen im Detail

Das Modell orientiert sich an den Grundsätzen der Datenbanknormalisierung, insbesondere der 3. Normalform. Dadurch werden Redundanzen vermieden und die Datenintegrität gewährleistet.

- **Zentrale Entität `users`**:  
  Die `users`-Tabelle bildet den Kern des Modells und enthält alle Benutzerdaten.

- **Atomare Speicherung von Daten**:  
  Werte wie Name (`first_name`, `last_name`) und Adresse (`street`, `postal_code`, `city`) wurden in Einzelfelder zerlegt. So werden Filterungen und Sortierungen deutlich erleichtert.

- **Auslagerung von Hobbys**:  
  Die Tabelle `hobbies` sorgt für eine eindeutige Verwaltung von Hobby-Bezeichnungen.  
  Die Verknüpfungstabelle `user_hobbies` löst die n:m-Beziehung auf und ermöglicht gleichzeitig die Speicherung individueller Präferenzen oder Priorisierungen.

- **Beziehungsmodellierung**:  
  n:m-Beziehungen wie `likes` oder `friendships` werden über eigene Verknüpfungstabellen abgebildet. Dadurch lassen sich Zusatzinformationen wie der aktuelle `status` einer Freundschaftsanfrage flexibel speichern.
