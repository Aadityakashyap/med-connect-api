const express = require("express");
const { registry } = require("../metrics");

const router = express.Router();

router.get("/metrics", async (req, res) => {
  res.set("Content-Type", registry.contentType);
  res.send(await registry.metrics());
});

module.exports = router;
