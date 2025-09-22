const xlsx = require('xlsx');
const {Client} = require('pg');

const PG_CONFIG = {
  host: 'localhost',
  port: 5433,
  database: 'lf8_lets_meet_db',
  user: 'user',
  password: 'secret',
};
const EXCEL_FILE_PATH = '../../Lets Meet DB Dump.xlsx';

async function main() {
  console.log('Starte Excel-Import...');
  const pgClient = new Client(PG_CONFIG);
  await pgClient.connect();

  let importedCount = 0;
  let skippedCount = 0;

  try {
    // Excel-Datei einlesen und in ein JSON-Format umwandeln
    const workbook = xlsx.readFile(EXCEL_FILE_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, {header: 1});

    // Durch jede Zeile iterieren (erste Zeile ist die Überschrift, wird übersprungen)
    for (const row of data.slice(1)) {
      try {
        // Benutzerdaten aus den Zeilen extrahieren und formatieren
        const [nachname, vorname] = row[0].split(', ');
        const [strasse, plz, ort] = row[1].split(', ');
        const geburtsdatum = row[7].split('.').reverse().join('-'); // Wandelt TT.MM.JJJJ in JJJJ-MM-TT um

        // Benutzer in die Datenbank einfügen und die neue ID zurückbekommen
        const userRes = await pgClient.query(
          `INSERT INTO users (first_name, last_name, email, birth_date, gender, interested_in_gender, street, postal_code, city, phone_number)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
          [
            vorname,
            nachname,
            row[4],
            geburtsdatum,
            row[5],
            row[6],
            strasse,
            plz,
            ort,
            row[2],
          ]
        );
        const userId = userRes.rows[0].id;

        // Hobbys verarbeiten
        const hobbies = row[3].split(';').filter((h) => h.trim());
        for (const hobbyStr of hobbies) {
          const [hobbyName, prio] = hobbyStr.split('%');

          // Hobby anlegen (falls nicht vorhanden) und ID abfragen in einem Schritt
          const hobbyRes = await pgClient.query(
            `WITH ins AS (
              INSERT INTO hobbies (name) VALUES ($1) ON CONFLICT(name) DO NOTHING RETURNING id
            )
            SELECT id FROM ins UNION ALL SELECT id FROM hobbies WHERE name = $1 LIMIT 1`,
            [hobbyName.trim()]
          );
          const hobbyId = hobbyRes.rows[0].id;

          // Benutzer und Hobby in der Zwischentabelle verknüpfen
          await pgClient.query(
            'INSERT INTO user_hobby_preferences (user_id, hobby_id, user_priority) VALUES ($1, $2, $3)',
            [userId, hobbyId, prio]
          );
        }
        importedCount++;
      } catch (error) {
        if (error.code === '23505') {
          skippedCount++;
        } else {
          throw error;
        }
      }
    }
    console.log(
      `Excel-Import: ${importedCount} Benutzer importiert (${skippedCount} übersprungen).`
    );
  } catch (error) {
    console.error(`Import fehlgeschlagen: ${error.message}`);
  } finally {
    await pgClient.end();
  }
}

main();
