const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const port = 3000;

// PostgreSQL database connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'postgres',
  port: 5432, // or your database port
});

// Middleware
app.use(bodyParser.json());

app.post('/identify', (req, res) => {
  const { email, phoneNumber } = req.body;

  // Check if the email or phoneNumber already exists in the database
  pool.query(
    'SELECT * FROM Contact WHERE email = $1 OR phonenumber = $2',
    [email, phoneNumber],
    (error, results) => {
      if (error) {
        throw error;
      }

      if (results.rows.length === 0) {
        // If no existing contact found, create a new primary contact
        pool.query(
          'INSERT INTO Contact (phonenumber, email, linkedid, linkprecedence, createdat, updatedat) VALUES ($1, $2, NULL, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *',
          [phoneNumber, email, 'primary'],
          (error, results) => {
            if (error) {
              throw error;
            }

            const primaryContact = results.rows[0];
            const response = {
              contact: {
                primaryContactId: primaryContact.id,
                emails: [primaryContact.email],
                phoneNumbers: [primaryContact.phonenumber],
                secondaryContactIds: [],
              },
            };

            res.status(200).json(response);
          }
        );
      } else {
        const existingContacts = results.rows;

        if (
          existingContacts.some(
            (contact) =>
              contact.email === email && contact.phonenumber === phoneNumber
          )
        ) {
          // If incoming request matches an existing contact, return the existing contact
          const response = {
            contact: {
              primaryContactId: existingContacts[0].id,
              emails: existingContacts.map((contact) => contact.email),
              phoneNumbers: existingContacts.map(
                (contact) => contact.phonenumber
              ),
              secondaryContactIds: [],
            },
          };

          res.status(200).json(response);
        } else {
          const contactWithEmail = existingContacts.find(
            (contact) => contact.email === email
          );
          const contactWithPhoneNumber = existingContacts.find(
            (contact) => contact.phonenumber === phoneNumber
          );
          console.log(
            'contactWithEmail,contactWithPhoneNumber=====',
            contactWithEmail,
            contactWithPhoneNumber
          );
          if (contactWithEmail || contactWithPhoneNumber) {
            // If input contains email from one contact and phoneNumber from another contact
            console.log(
              'contactWithEmail,contactWithPhoneNumber=',
              contactWithEmail,
              contactWithPhoneNumber
            );
            const oldestContact =
              contactWithEmail.createdat < contactWithPhoneNumber.createdat
                ? contactWithEmail
                : contactWithPhoneNumber;

            const newestContact =
              oldestContact === contactWithEmail
                ? contactWithPhoneNumber
                : contactWithEmail;

            pool.query(
              'UPDATE Contact SET linkprecedence = $1,linkedid= $2 ,updatedat = CURRENT_TIMESTAMP WHERE id = $3',
              ['secondary', oldestContact.id, newestContact.id],
              (error) => {
                if (error) {
                  throw error;
                }
                const secondaryContact = results.rows[0];
                const response = {
                  contact: {
                    primaryContactId: newestContact.id,
                    emails: [newestContact.email, secondaryContact.email],
                    phoneNumbers: [
                      newestContact.phonenumber,
                      secondaryContact.phonenumber,
                    ],
                    secondaryContactIds: [secondaryContact.id],
                  },
                };

                res.status(200).json(response);
              }
            );
          } else {
            // If all primary contacts have linkedId or no matching contacts found, create a new primary contact
            pool.query(
              'INSERT INTO Contact (phonenumber, email, linkedid, linkprecedence, createdat, updatedat) VALUES ($1, $2, NULL, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *',
              [phoneNumber, email, 'primary'],
              (error, results) => {
                if (error) {
                  throw error;
                }

                const primaryContact = results.rows[0];
                const response = {
                  contact: {
                    primaryContactId: primaryContact.id,
                    emails: [primaryContact.email],
                    phoneNumbers: [primaryContact.phonenumber],
                    secondaryContactIds: [],
                  },
                };

                res.status(200).json(response);
              }
            );
          }
        }
      }
    }
  );
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}.`);
});
