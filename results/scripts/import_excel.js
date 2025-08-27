const xlsx = require('xlsx');
const {Client} = require('pg');

const client = new Client({
  host: 'localhost',
  database: 'lf8_lets_meet_db',
  user: 'user',
  password: 'secret',
});

async function importExcelData() {
  await client.connect();

  // Excel Datei lesen
  const workbook = xlsx.readFile('../../Lets Meet DB Dump.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet, {header: 1});

  // Erste Zeile überspringen (Header)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    // Daten aus Excel extrahieren
    const name = row[0].split(', ');
    const vorname = name[1];
    const nachname = name[0];

    // Adresse aufteilen: "Straße Nr, PLZ, Ort"
    const adresse = row[1].split(', ');
    const strasse = adresse[0]; // Komplette Straße mit Hausnummer
    const plz = adresse[1];
    const ort = adresse[2];

    const telefon = row[2];
    const email = row[4];
    const geschlecht = row[5];
    const interessiert = row[6];

    // Geburtsdatum umwandeln
    const geburt = row[7].split('.');
    const geburtsdatum = `${geburt[2]}-${geburt[1]}-${geburt[0]}`;

    // Benutzer erstellen
    try {
      const userResult = await client.query(
        `
                INSERT INTO users (first_name, last_name, email, birth_date, gender, 
                                 interested_in_gender, street, postal_code, city, phone_number)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id
            `,
        [
          vorname,
          nachname,
          email,
          geburtsdatum,
          geschlecht,
          interessiert,
          strasse,
          plz,
          ort,
          telefon,
        ]
      );

      const userId = userResult.rows[0].id;

      // Hobby-Präferenzen verarbeiten
      const hobbys = row[3].split(';');
      for (const hobby of hobbys) {
        if (hobby.trim()) {
          const hobbyTeile = hobby.split('%');
          const hobbyName = hobbyTeile[0].trim();
          const suchPrioritaet = parseInt(hobbyTeile[1]); // Wie wichtig ist dem User dieses Hobby bei anderen

          // Hobby in Master-Liste erstellen
          await client.query(
            'INSERT INTO hobbies (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
            [hobbyName]
          );
          const hobbyResult = await client.query(
            'SELECT id FROM hobbies WHERE name = $1',
            [hobbyName]
          );
          const hobbyId = hobbyResult.rows[0].id;

          // In user_hobby_preferences speichern
          await client.query(
            'INSERT INTO user_hobby_preferences (user_id, hobby_id, user_priority) VALUES ($1, $2, $3)',
            [userId, hobbyId, suchPrioritaet]
          );
        }
      }

      console.log(`${vorname} ${nachname} + Hobby-Präferenzen importiert`);
    } catch (error) {
      if (error.code === '23505') {
        console.log(`${vorname} ${nachname} bereits vorhanden (${email})`);
      } else {
        console.error(`Fehler bei ${vorname} ${nachname}:`, error.message);
      }
    }
  }

  await client.end();
  console.log('Excel-Import abgeschlossen!');
}

importExcelData();
