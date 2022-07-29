import "@babel/polyfill";
import dotenv from "dotenv";
import "isomorphic-fetch";
import createShopifyAuth, { verifyRequest } from "@shopify/koa-shopify-auth";
import Shopify, { ApiVersion } from "@shopify/shopify-api";
import Koa from "koa";
import next from "next";
import Router from "koa-router";
import cors from "@koa/cors";
import koaBody from "koa-body";

let send    = require('koa-send'),
    serve   = require('koa-static');

dotenv.config();
const port = parseInt(process.env.PORT, 10) || 8081;
const dev = process.env.NODE_ENV !== "production";
const app = next({
  dev,
});
const handle = app.getRequestHandler();

const Pool = require('pg').Pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '216Digital1!',
  port: 5432,
})

let key;

Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: process.env.SCOPES.split(","),
  HOST_NAME: process.env.HOST.replace(/https:\/\//, ""),
  API_VERSION: ApiVersion.October20,
  IS_EMBEDDED_APP: true,
  // This should be replaced with your preferred storage strategy
  SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),
});

//FUNCTIONS

// Turns a price grid into a JSON object with a multidimensional array
function parseTable (body) {
  let num = "";
      let parse = true;
      let cells = [];
      let cellRow = [];
      let rows = [];
      let cols = [];
      let rowLoop = 0;
      let firstNum = false;

      let newLineIndex = body.indexOf("\n");

      for (let i = 0; i < body.length; i++) {
          if (i == newLineIndex) {
            firstNum = true;
            rowLoop++;
            if (rowLoop > 1) {
              cellRow.push(num);
              cells.push(cellRow);
              cellRow = [];
            } else {
              cols.push(num);
            }
            let newIndex = body.indexOf("\n", (newLineIndex + 3));
            newLineIndex = body.indexOf("\n", newIndex);
            parse = false;
            num = "";
          } else if (body[i] == "	") {
            parse = false;
            if (num !== "") {
              if (firstNum == true) {
                rows.push(num);
                firstNum = false;
              } else if (rowLoop == 0) {
                cols.push(num);
              } else {
                cellRow.push(num);
              }
              num = "";
            }
          } else if (parse == true && num !== (" ")) {
            num += body[i];
          } else {
            parse = true;
            num += body[i];
          }
      }
      cellRow.push(num);
      cells.push(cellRow);

      let cellString = "";
      for (let i = 0; i < cells.length; i++) {
        cellString += "["
        for (let x = 0; x < cells[i].length; x++) {
          if (x == cells[i].length - 1) {
            cellString += cells[i][x];
          } else {
            cellString += cells[i][x] + ", ";
          }
        }
        if (i == cells.length - 1) {
          cellString += "]"
        } else {
          cellString += "],"
        }
        
      }

      let jsonData = JSON.parse('{ "cols": [' + cols + '], "rows": [' + rows + '], "cells": [' + cellString + ']}');

      return jsonData;
}

function createProductObject(subtypes, priceGroups, swatches, priceGrids, gridSurcharges, lineSurcharges, surchargeGroups) {
  let lineCats = []
  let prodObj = {
    subtypes: []
  };
  for (let i = 0; i < subtypes.length; i++) {
    let obj = {
      name: subtypes[i].name,
      id: subtypes[i].id,
      priceGroups: []
    }
    for (let x = 0; x < priceGroups.length; x++) {
      if (priceGroups[x].parent_id == subtypes[i].id) {
        let pgObj = {
          name: priceGroups[x].name,
          id: priceGroups[x].id,
          priceLevel: priceGroups[x].price_sort,
          swatches: [],
          pricegrids: [],
          surchargeGroups: [],
          surcharge: priceGroups[x].surcharge
        }
        for (let t = 0; t < priceGrids.length; t++) {
          if(priceGrids[t].parent_id == priceGroups[x].id) {
            let gridObj = {
              grid: priceGrids[t].grid,
              id: priceGrids[t].id,
              msrp: priceGrids[t].msrp
            }
            pgObj.pricegrids.push(gridObj);
          }
        }
        for (let t = 0; t < surchargeGroups.length; t++) {
          if(surchargeGroups[t].parent_id == priceGroups[x].id) {
            let sgObj = {
              name: surchargeGroups[t].name,
              allowMultiple: surchargeGroups[t].allow_multiple,
              id: surchargeGroups[t].id,
              lineSurcharges: [],
              gridSurcharges: []
            }

            for (let n = 0; n < gridSurcharges.length; n++) {
              if(gridSurcharges[n].parent_id == surchargeGroups[t].id) {
                let gridObj = {
                  grid: gridSurcharges[n].datatable,
                  id: gridSurcharges[n].id,
                  name: gridSurcharges[n].name
                }
                sgObj.gridSurcharges.push(gridObj);
              }
            }

            for (let n = 0; n < lineSurcharges.length; n++) {
              if(lineSurcharges[n].parent_id == surchargeGroups[t].id) {
                let lineObj = {
                  value: lineSurcharges[n].value,
                  id: lineSurcharges[n].id,
                  name: lineSurcharges[n].name,
                  type: lineSurcharges[n].type,
                  quantity: lineSurcharges[n].allow_quantity,
                  min_w: lineSurcharges[n].min_w,
                  max_w: lineSurcharges[n].max_w,
                  min_h: lineSurcharges[n].min_h,
                  max_h: lineSurcharges[n].max_h,
                  dual_swatch: lineSurcharges[n].dual_swatch
                }

                sgObj.lineSurcharges.push(lineObj);
              }
            }
            pgObj.surchargeGroups.push(sgObj);
          }
        }

        for (let n = 0; n < swatches.length; n++) {
          if(swatches[n].parent_id == priceGroups[x].id) {
            let swObj = {
              name: swatches[n].name,
              id: swatches[n].id,
              dup_id: swatches[n].dup_id
            }
            pgObj.swatches.push(swObj);
          }
        }
        obj.priceGroups.push(pgObj);
      }
    }

    prodObj.subtypes.push(obj);
  }
  return prodObj;
}

// Storing the currently active shops in memory will force them to re-login when your server restarts. You should
// persist this object in your app.
const ACTIVE_SHOPIFY_SHOPS = {};

app.prepare().then(async () => {
  const server = new Koa();
  server.use(cors());
  const router = new Router();
  server.keys = [Shopify.Context.API_SECRET_KEY];
  server.use(
    createShopifyAuth({
      async afterAuth(ctx) {
        // Access token and shop available in ctx.state.shopify
        const { shop, accessToken, scope } = ctx.state.shopify;
        key = accessToken;
        const host = ctx.query.host;
        ACTIVE_SHOPIFY_SHOPS[shop] = scope;

        const response = await Shopify.Webhooks.Registry.register({
          shop,
          accessToken,
          path: "/webhooks",
          topic: "APP_UNINSTALLED",
          webhookHandler: async (topic, shop, body) =>
            delete ACTIVE_SHOPIFY_SHOPS[shop],
        });

        if (!response.success) {
          console.log(
            `Failed to register APP_UNINSTALLED webhook: ${response.result}`
          );
        }

        // Redirect to app with shop parameter upon auth
        ctx.redirect(`/?shop=${shop}&host=${host}`);
      },
    })
  );


  // Boilerplate stuff
  const handleRequest = async (ctx) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  };

  router.post("/webhooks", async (ctx) => {
    try {
      await Shopify.Webhooks.Registry.process(ctx.req, ctx.res);
      console.log(`Webhook processed, returned status code 200`);
    } catch (error) {
      console.log(`Failed to process webhook: ${error}`);
    }
  });

  router.post(
    "/graphql",
    verifyRequest({ returnHeader: true }),
    async (ctx, next) => {
      await Shopify.Utils.graphqlProxy(ctx.req, ctx.res);
    }
  );

  // Shopify POSTs to this endpoint, and we create the variant here, then send back the Variant ID
  router.post(
    "/cart",
    koaBody(),
    async (ctx, next) => {

      let data = {
        "variant": {
          "option1": ctx.request.body.items[0].opts,
          "price": ctx.request.body.items[0].price,
          "inventory_policy": "continue",
          "properties": ctx.request.body.items[0].properties
        }
      }

      console.log(data)

      let genVariant = async function () {
        const response = await fetch('https://the-window-blind-store.myshopify.com/admin/api/2021-07/products/' + ctx.request.body.items[0].id + '/variants.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': key
          },
          body: JSON.stringify(data)
        })
        .catch((error) => {
          console.error('Error:', error);
        });
        return await response.json();
      }

      let getVarId = async function () {
        let generated = await genVariant().then((value) => {
          console.log(value);
          let payload = {
            'items': [{
              'id': value.variant.id,
              'quantity': ctx.request.body.items[0].quantity,
              'properties': ctx.request.body.items[0].properties
            }]
          }
          setTimeout(() => {
            deleteVar(ctx.request.body.items[0].id, value.variant.id);
          }, 14400000)
          return payload
        });
        return await generated
      }

      let deleteVar = async function (prodId, varId) {
        const response = await fetch('https://the-window-blind-store.myshopify.com/admin/api/2021-07/products/' + prodId + '/variants/' + varId + '.json', {
          method: 'DELETE',
          headers: {
            'X-Shopify-Access-Token': key
          }
        })
        .catch((error) => {
          console.error('Error:', error);
        })
      }

      ctx.response.body = await getVarId();
    }
  );

  // Add a price grid to a product ID
  // TODO: Set up Subtypes and Price Groups
  router.post(
    "/product/:id/subtype/:sid/pricegroup/:pid/pricegrid/:msrp",
    koaBody(),
    async (ctx, next) => {
      let body = ctx.request.body;
      let id = ctx.params.pid;

      let table = parseTable(body);

      pool.query('INSERT INTO price_grid (parent_id, grid, msrp) VALUES ($1, $2, $3)', [id, table, ctx.params.msrp], (error, results) => {
        if (error) {
          console.log(error);
        } else {
          ctx.response.status = 200;
        }
      })
    }
  )

  // Retrieve a price grid
  router.get(
    "/product/:id/subtype/:sid/pricegroup/:pid/pricegrid",
    async (ctx, next) => {
      let res = await pool.query('SELECT * FROM price_grid WHERE parent_id = $1', [ctx.params.pid]);
      ctx.body = res.rows;
    }
  )

  router.get(
    "/product/:id",
    async (ctx, next) => {
      let subtypes = await pool.query('SELECT * FROM subtypes WHERE parent_id = $1', [ctx.params.id]);
      let subIds = [];
      let priceIds = [];
      for (let i = 0; i < subtypes.rows.length; i++) {
        subIds.push(parseInt(subtypes.rows[i].id));
      }
      let priceGroups = await pool.query('SELECT * FROM price_groups WHERE parent_id = ANY ($1)', [subIds]);
      for (let i = 0; i < priceGroups.rows.length; i++) {
        priceIds.push(parseInt(priceGroups.rows[i].id));
      }
      let swatches = await pool.query('SELECT * FROM swatches WHERE parent_id = ANY ($1)', [priceIds]);
      let priceGrids = await pool.query('SELECT * FROM price_grid WHERE parent_id = ANY ($1)', [priceIds]);
      let gridSurcharges = await pool.query('SELECT * FROM grid_surcharges');
      let lineSurcharges = await pool.query('SELECT * FROM line_surcharges');
      let surchargeGroups = await pool.query('SELECT * FROM surcharge_group WHERE parent_id = ANY ($1)', [priceIds]);
      let prodObj = createProductObject(subtypes.rows, priceGroups.rows, swatches.rows, priceGrids.rows, gridSurcharges.rows, lineSurcharges.rows, surchargeGroups.rows);
      ctx.body = prodObj;
      ctx.response.status = 200;
    }
  )

  router.post(
    "/product/:id/subtype",
    koaBody(),
    async (ctx, next) => {
      let body = ctx.request.body;
      let res = await pool.query('INSERT INTO subtypes (parent_id, name) VALUES ($1, $2)', [ctx.params.id, body.substring(1, body.length - 1)]);
      ctx.body = res.rows;
    }
  )

  router.post(
    "/product/:id/subtype/:sid/pricegroup",
    koaBody(),
    async (ctx, next) => {
      let body = ctx.request.body;
      console.log(body);
      let res = await pool.query('INSERT INTO price_groups (parent_id, name, price_sort, surcharge) VALUES ($1, $2, $3, $4)', [ctx.params.sid, body.name, body.priceLevel, body.surcharge]);
      ctx.body = res.rows;
    }
  )

  router.post(
    "/product/:id/subtype/:sid/pricegroup/:pid/dup",
    koaBody(),
    async (ctx, next) => {
      let body = ctx.request.body;
      let priceGrids = await pool.query('SELECT * FROM price_grid WHERE parent_id = $1', [ctx.params.pid]);
      let swatches = await pool.query('SELECT * FROM swatches WHERE parent_id = $1', [ctx.params.pid]);
      let surchargeGroups = await pool.query('SELECT * FROM surcharge_group WHERE parent_id = $1', [ctx.params.pid]);

      let res = await pool.query('INSERT INTO price_groups (parent_id, name, price_sort, surcharge) VALUES ($1, $2, $3, $4) RETURNING *', [ctx.params.sid, body.name, body.priceLevel, body.surcharge]);
      let pid = res.rows[0].id;
      let swIds = [];
      console.log(res.rows)
      surchargeGroups.rows.map((x) => {
        asyncAddSg(x, pid)
        .catch(error => {
          console.log(error)
        })
      })
      priceGrids.rows.map((x) => {
        asyncAddPg(x, pid)
        .catch(error => {
          console.log(error)
        })
      })
      // swatches.rows.map((x) => {
      //   if (x.dup_id) {
      //     asyncAddSw(x, pid, true)
      //     .catch(error => {
      //       console.log(error)
      //     })
      //   } else {
      //     asyncAddSw(x, pid, false)
      //     .catch(error => {
      //       console.log(error)
      //     })
      //   }
      // })
    }
  )

  let asyncAddSw = async (x, pid, isDup) => {
    if (isDup) {
      let res = await pool.query('INSERT INTO swatches (parent_id, name, dup_id) VALUES ($1, $2, $3) RETURNING *', [pid, x.name, x.dup_id]);
    } else {
      let res = await pool.query('INSERT INTO swatches (parent_id, name, dup_id) VALUES ($1, $2, $3) RETURNING *', [pid, x.name, x.id]);
    }
  }

  let asyncAddSg = async (x, pid) => {
    let res = await pool.query('INSERT INTO surcharge_group (parent_id, name, allow_multiple) VALUES ($1, $2, $3) RETURNING *', [pid, x.name, x.allow_multiple]);
    res.rows.map((y) => {
      asyncGetGs(x.id, y.id)
      .catch(error => {
        console.log(error)
      })
      asyncGetLs(x.id, y.id)
      .catch(error => {
        console.log(error)
      })
    })
  }

  let asyncGetGs = async (x, y) => {
    let gridSurcharges = await pool.query('SELECT * FROM grid_surcharges WHERE parent_id = $1', [x]);
    gridSurcharges.rows.map((z) => {
      asyncAddGs(y, z)
      .catch(error => {
        console.log(error)
      })
    })
  }

  let asyncGetLs = async (x, y) => {
    console.log(x)
    let lineSurcharges = await pool.query('SELECT * FROM line_surcharges WHERE parent_id = $1', [x]);
    console.log(lineSurcharges.rows)
    lineSurcharges.rows.map((z) => {
      asyncAddLs(y, z)
      .catch(error => {
        console.log(error)
      })
    })
  }

  let asyncAddGs = async (y, z) => {
    let res = await pool.query('INSERT INTO price_grid (parent_id, name, datatable) VALUES ($1, $2, $3)', [y, z.name, z.datatable]);
  }

  let asyncAddLs = async (y, z) => {
    console.log(y, z);
    let res = await pool.query('INSERT INTO line_surcharges (parent_id, name, type, value, allow_quantity, min_w, max_w, min_h, max_h, dual_swatch) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [y, z.name, z.type, z.value, z.allow_quantity, z.min_w, z.max_w, z.min_h, z.max_h, z.dual_swatch]);
  }

  let asyncAddPg = async (x, pid) => {
    let res = await pool.query('INSERT INTO price_grid (parent_id, grid, msrp) VALUES ($1, $2, $3)', [pid, x.grid, x.msrp]);
  }

  router.post(
    "/product/:id/subtype/:sid/pricegroup/:pid/surcharge-group/:gid/grid-surcharge",
    koaBody(),
    async (ctx, next) => {
      let body = ctx.request.body;
      let table = parseTable(body.datatable);
      let res = await pool.query('INSERT INTO grid_surcharges (parent_id, name, datatable) VALUES ($1, $2, $3)', [ctx.params.gid, body.name, table]);
      ctx.body = res.rows;
    }
  )

  router.post(
    "/product/:id/subtype/:sid/pricegroup/:pid/surcharge-group/:gid/line-surcharge",
    koaBody(),
    async (ctx, next) => {
      let body = ctx.request.body;
      let res = await pool.query('INSERT INTO line_surcharges (parent_id, name, type, value, allow_quantity, min_w, max_w, min_h, max_h, dual_swatch) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [ctx.params.gid, body.name, body.type, body.value, body.quantity, body.min_w, body.max_w, body.min_h, body.max_h, body.dual_swatch]);
      ctx.body = res.rows;
    }
  )

  router.post(
    "/product/:id/subtype/:sid/pricegroup/:pid/surcharge-group",
    koaBody(),
    async (ctx, next) => {
      let body = ctx.request.body;
      let res = await pool.query('INSERT INTO surcharge_group (parent_id, name, allow_multiple) VALUES ($1, $2, $3)', [ctx.params.pid, body.name, body.allowMultiple]);
      ctx.body = res.rows;
    }
  )

  router.post(
    "/product/:id/subtype/:sid/pricegroup/:pid/swatch/",
    koaBody({ textLimit: 1000000000, jsonLimit: 100000000 }),
    async (ctx, next) => {
      let body = ctx.request.body;
      let valString = "";
      body.files.map((x, i) => {
        // valString += `('${x.name}', '${x.file}')`;
        // if (i < body.files.length - 1) {
        //   valString += ", ";
        // } else {
        //   valString += ";"
        // }
        asyncFile(x, ctx)
      })

      // var base64Data = body.replace(/^data:image\/jpeg;base64,/, "");

      // require("fs").writeFile("./server/public/sw_" + res.rows[0].id + ".jpg", base64Data, 'base64', function(err) {
      //   console.log(err);
      // });

      // ctx.body = res.rows;
    }
  )

  let asyncFile = async (x, ctx) => {
    let res = await pool.query('INSERT INTO swatches (parent_id, name) VALUES ($1, $2) RETURNING *', [ctx.params.pid, x.name]);
    var base64Data = x.file.replace(/^data:image\/jpeg;base64,/, "");
    require("fs").writeFile("./server/public/sw_" + res.rows[0].id + ".jpg", base64Data, 'base64', function(err) {
      console.log(err);
    });
  }

  router.delete(
    "/line-surcharge/:lid",
    koaBody(),
    async (ctx, next) => {
      let body = ctx.request.body;
      let res = await pool.query('DELETE FROM line_surcharges WHERE id = $1', [ctx.params.lid]);
      ctx.body = res.rows;
    }
  )

  router.delete(
    "/grid-surcharge/:lid",
    koaBody(),
    async (ctx, next) => {
      let body = ctx.request.body;
      let res = await pool.query('DELETE FROM grid_surcharges WHERE id = $1', [ctx.params.lid]);
      ctx.body = res.rows;
    }
  )

  router.delete(
    "/surcharge-group/:lid",
    koaBody(),
    async (ctx, next) => {
      let body = ctx.request.body;
      let res = await pool.query('DELETE FROM surcharge_group WHERE id = $1', [ctx.params.lid]);
      ctx.body = res.rows;
    }
  )

  router.delete(
    "/subtype/:lid",
    koaBody(),
    async (ctx, next) => {
      let body = ctx.request.body;
      let res = await pool.query('DELETE FROM subtypes WHERE id = $1', [ctx.params.lid]);
      ctx.body = res.rows;
    }
  )

  router.delete(
    "/pricegroup/:lid",
    koaBody(),
    async (ctx, next) => {
      let body = ctx.request.body;
      let res = await pool.query('DELETE FROM price_groups WHERE id = $1', [ctx.params.lid]);
      ctx.body = res.rows;
    }
  )

  router.delete(
    "/swatch/:lid",
    koaBody(),
    async (ctx, next) => {
      let body = ctx.request.body;
      let res = await pool.query('DELETE FROM swatches WHERE id = $1', [ctx.params.lid]);
      ctx.body = res.rows;
    }
  )

  router.get("/public/:file", 
    async (ctx, next) => {
      console.log(ctx.params.file)
      await send(ctx, ctx.params.file, { root: __dirname + '/public' })
    }
  )

  router.get("(/_next/static/.*)", handleRequest); // Static content is clear
  router.get("/_next/webpack-hmr", handleRequest); // Webpack content is clear
  router.get("(.*)", async (ctx) => {
    const shop = ctx.query.shop;

    // This shop hasn't been seen yet, go through OAuth to create a session
    if (ACTIVE_SHOPIFY_SHOPS[shop] === undefined) {
      ctx.redirect(`/auth?shop=${shop}`);
    } else {
      await handleRequest(ctx);
    }
  });

  server.use(router.allowedMethods());
  server.use(router.routes());
  server.use(function* index() {
    yield send(this, __dirname + '/sw_68.jpg');
  });
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
