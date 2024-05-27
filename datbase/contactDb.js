const db = require('../config/connect2db');

class ContactDb {
  async findByEmailOrPhoneNumber(email, phoneNumber) {
    const query = 'SELECT * FROM Contact WHERE email = $1 OR phonenumber = $2';
    const values = [email, phoneNumber];

    try {
      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async createContact(email, phoneNumber, linkedid, linkprecedence) {
    const query =
      'INSERT INTO Contact (phonenumber, email, linkedid, linkprecedence, createdat, updatedat) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *';
    const values = [phoneNumber, email, linkedid, linkprecedence];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  async updateContactLinking(primaryContactId, secondaryContactId) {
    const query =
      'UPDATE Contact SET linkprecedence = $1, linkedid = $2, updatedat = CURRENT_TIMESTAMP WHERE id = $3';
    const values = ['secondary', primaryContactId, secondaryContactId];

    try {
      await db.query(query, values);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ContactDb;
