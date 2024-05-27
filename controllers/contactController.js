const ConcatDb = require('../datbase/contactDb');

class Controller {
  async identifyContact(req, res) {
    const { email, phoneNumber } = req.body;

    try {
      const concatDb = new ConcatDb();

      const existingContacts = await concatDb.findByEmailOrPhoneNumber(
        email,
        phoneNumber
      );

      if (existingContacts.length === 0) {
        // create new contact if not exist
        const primaryContact = await concatDb.createContact(
          email,
          phoneNumber,
          'primary'
        );

        const response = getResponse(primaryContact);
        res.status(200).json(response);
      }

      const contactWithEmail = existingContacts.find(
        (contact) => contact.email === email
      );
      const contactWithPhoneNumber = existingContacts.find(
        (contact) => contact.phonenumber === phoneNumber
      );

      if (
        contactWithEmail &&
        contactWithPhoneNumber &&
        contactWithEmail !== contactWithPhoneNumber
      ) {
        //update new contact to secondary
        const oldestContact = getOldestContact(
          contactWithEmail,
          contactWithPhoneNumber
        );
        const newestContact = getNewestContact(
          contactWithEmail,
          contactWithPhoneNumber
        );
        await concatDb.updateContactLinking(newestContact.id, oldestContact.id);
        const response = getResponse([newestContact, oldestContact]);
        res.status(200).json(response);
      }

      if (
        (contactWithPhoneNumber && !contactWithEmail) ||
        (!contactWithPhoneNumber && contactWithEmail)
      ) {
        // to create secondary contact
        if (phoneNumber && email) {
          const primaryContact = contactWithEmail || contactWithPhoneNumber;
          await concatDb.createContact(
            email,
            phoneNumber,
            primaryContact.id,
            'secondary'
          );
        }
        const updatedContacts = await concatDb.findByEmailOrPhoneNumber(
          email,
          phoneNumber
        );
        const response = getResponse(updatedContacts);
        res.status(200).json(response);
      }

      if (hasMatchingContact(existingContacts, email, phoneNumber)) {
        // this will be true if contact matches with existing contacts
        const response = getResponse(existingContacts);
        res.status(200).json(response);
      }
    } catch (error) {
      console.error(error);
    }
  }
}

// helper functions
function getOldestContact(contactWithEmail, contactWithPhoneNumber) {
  return contactWithEmail.createdat < contactWithPhoneNumber.createdat
    ? contactWithEmail
    : contactWithPhoneNumber;
}

function getNewestContact(contactWithEmail, contactWithPhoneNumber) {
  return contactWithEmail.createdat > contactWithPhoneNumber.createdat
    ? contactWithEmail
    : contactWithPhoneNumber;
}

function hasMatchingContact(existingContacts, email, phoneNumber) {
  return existingContacts.some(
    (contact) => contact.email === email || contact.phonenumber === phoneNumber
  );
}

function getResponse(contacts) {
  const primaryContactId = contacts
    .filter((contact) => contact.linkprecedence === 'primary')
    .map((contact) => contact.id);

  const secondaryContactIds = contacts
    .filter((contact) => contact.linkprecedence === 'secondary')
    .map((contact) => contact.id);

  const emails = contacts.map((contact) => contact.email);
  const phoneNumbers = contacts.map((contact) => contact.phonenumber);

  const response = {
    contact: {
      primaryContactId: primaryContactId[0],
      emails,
      phoneNumbers,
      secondaryContactIds,
    },
  };
  return response;
}

module.exports = Controller;
