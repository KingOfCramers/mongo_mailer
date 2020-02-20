const moment = require('moment');
const logger = require('./logger')(module);
const {asyncForEach} = require('./util');
const connect = require('./mongodb/connect');
const {findWithSchema} = require('./mongodb/methods');
const {setupUsers} = require('./config');
const mailer = require('./mailer');

// Import Schemas...
const Schemas = Object.values(require('./mongodb/schemas'));

(async () => {
  let db = await connect();
  let upcomingHearings = [];

  const getData = async Schema => {
    let items = await findWithSchema(Schema);
    let sorted = items
      .filter(x => moment().valueOf() < moment(x.date).valueOf()) // Values in the future
      .sort((x, y) => moment(y.date).valueOf() - moment(x.date).valueOf()); // Sort by date
    if (sorted.length > 0) {
      upcomingHearings = [...upcomingHearings, ...sorted];
    }
  };

  await asyncForEach(Schemas, async Schema => {
    await getData(Schema);
  });

  let data = upcomingHearings.map(x => {
    delete x.type;
    delete x.__v;
    delete x._id;
    if (x.witnesses.length == 0) {
      delete x.witnesses;
    }
    return x;
  });

  let overview = `There are ${data.length} hearings next week.`; 
  logger.info(overview);

  let users = setupUsers(data);

  await mailer({ users });
  
  logger.info(`Emails sent.`);

  db.disconnect();
})();
