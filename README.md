# Portfolio

Five clickable product demos. Each one runs in the browser and is live on Cloudflare.

| Demo | What it shows | Language | Live |
|---|---|---|---|
| [AllAddIn1](alladdin1/) | Premium group travel: organizers, travelers and advisors, with cruises and packages (65 screens) | English | [Open](https://alladdin1-demo.andrija-6af.workers.dev/) |
| [GoalToCart](goaltocart/) | Football transfers: buying and selling clubs, agent, player and finance, from offer to payout (49 screens) | English | [Open](https://goaltocart-demo.andrija-6af.workers.dev/) |
| [Nasetu](nasetu/) | Marketplace for renting filming locations: owners, production crews and admin | Serbian | [Open](https://crimson-field-2634.andrija-6af.workers.dev/) |
| [SWAPIT](swapit/) | Marketplace for swapping goods, with individuals, companies and courier (84 screens) | Serbian | [Open](https://swapit-demo.andrija-6af.workers.dev/) |
| [TerraVista](terravista/) | TV channel platform, with TV-remote navigation and phone views (53 screens) | Serbian | [Open](https://terravista-demo.andrija-6af.workers.dev/) |

## What these are

- These are demos and prototypes, not production products. There is no backend, and nothing is stored or sent.
- All people, companies, prices and contact details are fictional. Payments and signatures are simulated.
- Built with AI assistance. Code comments are mostly in Serbian.

## Stack

React, TypeScript, Vite, Tailwind CSS and Vitest. Each demo is a static site with its own automated tests.

## Run a demo locally

Requires Node.js 22.12 or newer.

```
cd swapit
npm ci
npm run dev
npm test
```

## Notes

- TerraVista uses real channel names for illustration only. Those channels are not partners. The live demo also shows five channel logos, which are left out of this repository.
- Photos belong to their authors. Sources and licenses are listed in each demo's `docs` folder.
