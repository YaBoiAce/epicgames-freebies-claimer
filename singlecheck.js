const { Launcher: EpicGames } = require(`epicgames-client`);
 
async function check(account) {
  console.log(`Running check for free games for ${account.email}`);
  const client = new EpicGames({
    email: account.email,
    password: account.password
  });

  if (!await client.init() || !await client.login()) {
    throw new Error(`Error while initializing or logging in as ${client.config.email}`);
  }
    
  console.log(`Logged in as ${client.account.name} (${client.account.id})`);
  let getAllOffers = async (namespace, pagesize=100) => {
    let i = 0;
    let results = [];
    while ((i * pagesize) - results.length === 0) {
        let { elements } = await client.getOffersForNamespace(namespace, pagesize, pagesize * i++);
        results = results.concat(elements);
    }
    return results;
  };

  let all = await getAllOffers(`epic`);
  let freegames = all
    .filter(game => game.categories.find(cat => cat.path === `freegames`) &&
        game.customAttributes[`com.epicgames.app.offerNs`].value)
    .map(game => game.customAttributes[`com.epicgames.app.offerNs`].value);

  for (let namespace of freegames) {
    let offers = await getAllOffers(namespace);
    let freeoffers = offers.filter(game => game.currentPrice === 0 && game.discountPercentage === 0);

    for (let offer of freeoffers) {
      let purchased = await client.purchase(offer, 1);

      if (purchased) {
          console.log(`Successfully claimed ${offer.title} (${purchased})`);
      } else {
          console.log(`${offer.title} was already claimed for this account`);
      }
    }
  }
  await client.logout();
  console.log(`Logged out of Epic Games`);
}

let accounts = [];
if (process.env.ACCOUNTS !== undefined) {
  console.log("Running check for free games...");
  accounts = JSON.parse(process.env.ACCOUNTS);
}
else {
  if (process.argv.length === 4) {
    let email = process.argv[2];
    let password = process.argv[3];

    accounts = [{ email: email, password: password}];
  }
  else {
    console.log("Invalid parameters. Usage:");
    console.log("node singlecheck.js <email> <password>");
    process.exit(1);
  }
}

let p = Promise.resolve();

accounts.forEach((account) => {
  p = p.then(() => {
    return new Promise((resolve, reject) => {
      check(account).then(() => {
        console.log("Done checking for free games... "  + account.email);
        setTimeout(resolve, 5 * 60000);
      }).catch((error) => {
        console.log("Error checking for free games for " + account.email + " " + error);
        setTimeout(resolve, 5 * 60000);
      });
    });
  });
});

p.then(() => {
  console.log("Done checking for free games...");
  process.exit(0);
}).catch((error) => {
  console.log("Error checking for free games... " + error);
  process.exit(1);
});