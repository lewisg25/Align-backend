const cron = require('node-cron');
const moment = require('moment-timezone'); // Requires installing moment-timezone
const User = require('../models/User');
const CheckIn = require('../models/CheckIn');

const startReminderCron = () => {
  // Evaluates every 15 minutes to guarantee catching 16:15 (4:15 PM) local ticks
  cron.schedule('*/15 * * * *', async () => {
    try {
      const users = await User.find({ partnerId: { $ne: null } });
      const todayStr = moment().format('YYYY-MM-DD');

      for (let user of users) {
        const userLocalTime = moment().tz(user.timezone);

        // Check if the current time matches 4:15 PM locally
        if (userLocalTime.hour() === 16 && userLocalTime.minute() === 15) {
          
          // Verify if user already submitted a check-in record today
          const checkInRecorded = await CheckIn.findOne({
            user: user._id,
            createdAt: { 
              $gte: moment.tz(user.timezone).startOf('day').toDate(),
              $lte: moment.tz(user.timezone).endOf('day').toDate() 
            }
          });

          if (!checkInRecorded) {
            // Placeholder: Integrate your Twilio, SendGrid, or Firebase push payload here
            console.log(`[ALERT] Notifying ${user.firstName} at 4:15 PM: Time to check-in with Align!`);
          }
        }
      }
    } catch (error) {
      console.error('Error handling background reminder cron worker:', error);
    }
  });
};

module.exports = startReminderCron;