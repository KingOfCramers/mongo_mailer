require('dotenv').config();
const cron = require("node-cron");
const moment = require("moment");

const { asyncForEach } = require("./util");
const connect = require("./mongodb/connect");
const { find } = require("./mongodb/methods");
const mailer = require("./mailer");

// Import Schemas...
const Schemas = Object.values(require("./mongodb/schemas"));

let upcomingHearings = [];
const getData = async (Schema) => {
    let items = await find(Schema);
    let sorted = items
        .filter(x => moment().valueOf() < moment(x.date).valueOf()) // Only get values in the future
        .sort((x,y) => moment(y.date).valueOf() - moment(x.date).valueOf()) // Sort them by date
    if(sorted.length > 0){
        upcomingHearings = [ ...upcomingHearings, ...sorted ];
    }
};

const isProduction = process.env.NODE_ENV === 'production';

(async() => {
if(isProduction){
    cron.schedule('*/30 * * * *', async () => {
        let db = await connect();
        await asyncForEach(Schemas, (Schema) => {
            getData(Schema);
        });
        console.log(`There are ${upcomingHearings.length} hearings next week.`);
        db.disconnect();
    });
} else {
    let db = await connect();
    await asyncForEach(Schemas, async (Schema) => {
        await getData(Schema);
    });
    let data = upcomingHearings.map(x => { 
        delete x.type;
        delete x.__v;
        delete x._id;
        if(x.witnesses.length == 0){
            delete x.witnesses;
        };
        return x;
    });
    let overview = `There are ${data.length} hearings next week.`;
    await mailer({ emails: process.env.EMAILS.split(" "), data: upcomingHearings, overview, mailDuringDevelopment: true });
    db.disconnect();
};
})();