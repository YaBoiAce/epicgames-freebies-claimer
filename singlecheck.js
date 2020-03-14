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

console.log("Running check for free games...");
const accounts = JSON.parse(process.env.ACCOUNTS);
const promises = accounts.map((account) => check(account));

Promise.all(promises).then(() => {
  console.log("Done checking for free games...");
}).catch((error) => {
  console.log("Error checking for free games... " + error);
});