import { initBotId } from 'botid/client/core';

// The registration forms post to a server action on their own page, so the protected path is the
// page. `submitForm` asks `checkBotId()` about every request, and one without the BotID headers is
// treated as a bot on Vercel.
initBotId({ protect: [{ method: 'POST', path: '/anmeldung/*' }] });
