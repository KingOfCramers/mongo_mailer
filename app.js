require('dotenv').config();
const isProduction = process.env.NODE_ENV === 'production';

const cron = require("node-cron");
const moment = require("moment");

const logger = require("./logger");
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

(async() => {
if(isProduction){
    cron.schedule('0 15 * * FRI', async () => {
        try {            
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
            logger.info(`Sending data on ${data.length} hearings to ${JSON.stringify(process.env.EMAILS.split(" "))} on ${moment().format("llll")}`);
            await mailer({ emails: process.env.EMAILS.split(" "), data: upcomingHearings, overview, mailDuringDevelopment: true });
            db.disconnect();
        } catch (err) {
            logger.error("There was a problem: ", err);
        }
   });
} else {
    try {
        let db = await connect();
        await asyncForEach(Schemas, async (Schema) => {
            await getData(Schema);
        });
        let data = upcomingHearings.map(x => { 
            delete x.type;
            delete x.__v;
            delete x._id
            if(x.witnesses.length == 0){
                delete x.witnesses;
            };
            return x;
        });
        let overview = `There are ${data.length} hearings next week.`;
        logger.info(`Sending data on ${data.length} hearings to ${JSON.stringify(process.env.EMAILS.split(" "))} on ${moment().format("llll")}`);
        await mailer({ emails: process.env.EMAILS.split(" "), data: upcomingHearings, overview, mailDuringDevelopment: true });
        db.disconnect();
    } catch (err) {
        logger.error("There was a problem: ", err);
    }
};
})();