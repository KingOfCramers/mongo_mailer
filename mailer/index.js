const nodemailer = require('nodemailer');
const _ = require("lodash");

var transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  auth: {
    type: process.env.NODEMAILER_TYPE,
    user: process.env.NODEMAILER_USER,
    clientId: process.env.NODEMAILER_CLIENT_ID,
    clientSecret: process.env.NODEMAILER_CLIENT_SECRET,
    refreshToken: process.env.NODEMAILER_REFRESH_TOKEN,
  },
});

module.exports = async ({users }) => {

  const promises = users.map(user => {
    let data = user.newHearings;
    let email = user.email;
    let isQuiet = user.isQuiet;

    data = data.map(item => {
      for (var key in item) {
        var upper = _.startCase(_.toLower(key));
        // check if it already wasn't uppercase
        if (upper !== key) {
          item[upper] = item[key];
          delete item[key];
        }
      }
      return item;
    });

    let summary = `You have ${user.newHearings.length} hearings coming up.`;
    let text = JSON.stringify(data, null, 2).replace(/[\[,\],\{,\}\"]/g, '');

    let HelperOptions = {
      from: process.env.FROM,
      to: email,
      subject: 'Upcoming Hearings',
      text: `${summary}\n\n${text}`,
    };

    if (!isQuiet) return transporter.sendMail(HelperOptions);
    if (isQuiet) return Promise.resolve();
  });

  return Promise.all(promises);
};