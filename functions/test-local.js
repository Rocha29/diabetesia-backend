const http = require("http");
const app = require("./src/app");

const server = app.listen(3005, runTests);

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      { hostname: "localhost", port: 3005, path, method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => resolve({ status: res.statusCode, body: JSON.parse(raw) }));
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: "localhost", port: 3005, path }, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => resolve({ status: res.statusCode, body: JSON.parse(raw) }));
    }).on("error", reject);
  });
}

async function runTests() {
  let pass = 0, fail = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  PASS  ${name}`);
      pass++;
    } catch (e) {
      console.error(`  FAIL  ${name}: ${e.message}`);
      fail++;
    }
  }

  function assert(cond, msg) { if (!cond) throw new Error(msg); }

  console.log("\n DiabetesIA - Local endpoint tests\n");

  await test("GET /health returns ok", async () => {
    const r = await get("/health");
    assert(r.status === 200, `status ${r.status}`);
    assert(r.body.status === "ok", `body: ${JSON.stringify(r.body)}`);
  });

  await test("POST /analyze with text", async () => {
    const r = await post("/analyze", { text: "Glicose 180 mg/dL" });
    assert(r.status === 200, `status ${r.status}`);
    assert(r.body.success === true, "success must be true");
    assert(r.body.data?.summary, "data.summary must exist");
  });

  await test("POST /analyze with imageBase64", async () => {
    const r = await post("/analyze", { imageBase64: "base64mock==" });
    assert(r.status === 200, `status ${r.status}`);
    assert(r.body.success === true, "success must be true");
    assert(r.body.data?.input?.hasImage === true, "hasImage must be true");
  });

  await test("POST /analyze with text + image", async () => {
    const r = await post("/analyze", { text: "glicose alta", imageBase64: "base64==" });
    assert(r.status === 200, `status ${r.status}`);
    assert(r.body.data?.input?.text === "glicose alta", "text must match");
    assert(r.body.data?.input?.hasImage === true, "hasImage must be true");
  });

  await test("POST /analyze with empty body returns 400", async () => {
    const r = await post("/analyze", {});
    assert(r.status === 400, `expected 400, got ${r.status}`);
    assert(r.body.success === false, "success must be false");
  });

  await test("Unknown route returns 404", async () => {
    const r = await get("/unknown");
    assert(r.status === 404, `expected 404, got ${r.status}`);
  });

  console.log(`\n  Results: ${pass} passed, ${fail} failed\n`);
  server.close(() => process.exit(fail > 0 ? 1 : 0));
}
