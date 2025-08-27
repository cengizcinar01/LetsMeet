const xlsx = require('xlsx');
const {Client} = require('pg');

const client = new Client({
  host: 'localhost',
  database: 'lf8_lets_meet_db',
  user: 'user',
  password: 'secret',
});

async function importData() {
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

    // Daten aus Excel holen
    const name = row[0].split(', ');
    const vorname = name[1];
    const nachname = name[0];

    const adresse = row[1].split(', ');
    const strasse = adresse[0];
    const plz = adresse[1];
    const ort = adresse[2];

    const telefon = row[2];
    const email = row[4];
    const geschlecht = row[5];
    const interessiert = row[6];

    // Geburtsdatum umwandeln
    const geburt = row[7].split('.');
    const geburtsdatum = `${geburt[2]}-${geburt[1]}-${geburt[0]}`;

    // User in Datenbank speichern (überspringen falls E-Mail bereits existiert)
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

      // Hobbys verarbeiten
      const hobbys = row[3].split(';');
      for (const hobby of hobbys) {
        if (hobby.trim()) {
          const hobbyTeile = hobby.split('%');
          const hobbyName = hobbyTeile[0].trim();
          const prioritaet = parseInt(hobbyTeile[1]);

          // Hobby erstellen falls nicht vorhanden
          await client.query(
            'INSERT INTO hobbies (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
            [hobbyName]
          );
          const hobbyResult = await client.query(
            'SELECT id FROM hobbies WHERE name = $1',
            [hobbyName]
          );
          const hobbyId = hobbyResult.rows[0].id;

          // User-Hobby Verbindung
          await client.query(
            'INSERT INTO user_hobbies (user_id, hobby_id, user_priority) VALUES ($1, $2, $3)',
            [userId, hobbyId, prioritaet]
          );
        }
      }

      console.log(`${vorname} ${nachname} importiert`);
    } catch (error) {
      if (error.code === '23505') {
        console.log(`${vorname} ${nachname} bereits vorhanden (${email})`);
      } else {
        console.error(`Fehler bei ${vorname} ${nachname}:`, error.message);
      }
    }
  }

  await client.end();
  console.log('Fertig!');
}

importData();
