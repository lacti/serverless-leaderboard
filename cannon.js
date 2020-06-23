/* eslint-disable @typescript-eslint/no-var-requires */
const fetch = require("node-fetch");
const pLimit = require("p-limit");

const limit = pLimit(32);
const userCount = 1024 * 1024;
const testCount = 1024 * 100;

const rand = (maxValue) => Math.floor(Math.random() * maxValue);

const prefix =
  (process.env.API_URL ?? `http://localhost:3000/dev`) + `/__tests__/period`;
const get = (userId) => {
  const targetUrl = prefix;
  return fetch(targetUrl, {
    headers: {
      "x-user": userId,
    },
  })
    .then((r) => r.text())
    .then(console.log)
    .catch(console.error);
};

const put = (userId) => {
  const targetUrl = prefix;
  return fetch(targetUrl, {
    method: "PUT",
    headers: {
      "x-user": userId,
    },
    body: rand(1024 * 1024 * 1024).toString(),
  })
    .then((r) => r.text())
    .then(console.log)
    .catch(console.error);
};

const request = async () => {
  const userId = `test${rand(userCount)}`;
  if (Math.random() < 0.4) {
    const putStartTime = Date.now();
    await put(userId);
    console.log("put", Date.now() - putStartTime);
  }
  const getStartTime = Date.now();
  await get(userId);
  console.log("get", Date.now() - getStartTime);
};

(async () => {
  const promises = Array(testCount)
    .fill(0)
    .map((_) => limit(() => request()));
  await Promise.all(promises);
})();
