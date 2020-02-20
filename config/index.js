const moment = require('moment');

let users = [
  {
    email: process.env.USER1,
    watching: ['hhscs', 'hvacs', 'svacs'],
    quiet: false,
    checkTime: [[0,0],[23,59]], // Hour and minute
    checkDate: [0,1,2,3,4,5,6],
    newHearings: []
  },
];

const setupUsers = (data) => {
  let hour = moment().hours();
  let minute = moment().minutes();
  let time = (hour * 60) + minute;
  let day = moment().day();

  data.forEach(x => {
    let committee = x.committee;
    users = users.map((user) => {
      if(user.watching.includes(committee)){
        user.newHearings.push(x);
      }
      return user;
    });
  });

  let activeUsers = users.filter((x) => {
    if (x.quiet)
      return false;
    
    let earliestTime = ((x.checkTime[0][0] * 60) + x.checkTime[0][1]);
    let latestTime = ((x.checkTime[1][0] * 60) + x.checkTime[1][1]);

    if(time < earliestTime || time > latestTime)
      return false;

    if(!x.checkDate.includes(day))
      return false;

    return true;

  });
  
  return activeUsers;
};

module.exports = {
  users,
  setupUsers,
};

