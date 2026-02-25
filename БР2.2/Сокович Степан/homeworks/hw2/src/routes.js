const express = require("express");

const router = express.Router();

router.post("/auth/register", (req, res) => {
  res.status(201).json({ ok: true, note: "Заглушка для ДЗ2 по проектированию API" });
});

router.post("/auth/login", (req, res) => {
  res.status(200).json({ ok: true, note: "Заглушка для ДЗ2 по проектированию API" });
});

router.get("/users", (req, res) => {
  res.status(200).json({ ok: true, data: [] });
});

router.post("/users", (req, res) => {
  res.status(201).json({ ok: true, note: "Пользователь создан (заглушка)" });
});

router.get("/users/:id", (req, res) => {
  res.status(200).json({ ok: true, id: req.params.id });
});

router.put("/users/:id", (req, res) => {
  res.status(200).json({ ok: true, id: req.params.id, replaced: true });
});

router.patch("/users/:id", (req, res) => {
  res.status(200).json({ ok: true, id: req.params.id, patched: true });
});

router.get("/properties", (req, res) => {
  res.status(200).json({ ok: true, data: [] });
});

router.post("/properties", (req, res) => {
  res.status(201).json({ ok: true, note: "Объект создан (заглушка)" });
});

router.get("/properties/:id", (req, res) => {
  res.status(200).json({ ok: true, id: req.params.id });
});

router.post("/properties/:id/photos", (req, res) => {
  res.status(201).json({ ok: true, propertyId: req.params.id, photoAddr: req.body.photoAddr });
});

router.get("/deals", (req, res) => {
  res.status(200).json({ ok: true, data: [] });
});

router.post("/deals", (req, res) => {
  res.status(201).json({ ok: true, note: "Сделка создана (заглушка)" });
});

router.patch("/deals/:id/status", (req, res) => {
  res.status(200).json({ ok: true, id: req.params.id, status: req.body.status });
});

router.get("/chats", (req, res) => {
  res.status(200).json({ ok: true, data: [] });
});

router.post("/chats", (req, res) => {
  res.status(201).json({ ok: true, note: "Чат создан (заглушка)" });
});

router.get("/chats/:id/messages", (req, res) => {
  res.status(200).json({ ok: true, chatId: req.params.id, data: [] });
});

router.post("/chats/:id/messages", (req, res) => {
  res.status(201).json({ ok: true, chatId: req.params.id, note: "Сообщение создано (заглушка)" });
});

router.patch("/messages/:id", (req, res) => {
  res.status(200).json({ ok: true, id: req.params.id, text: req.body.text, edited: true });
});

router.post("/reviews", (req, res) => {
  res.status(201).json({ ok: true, note: "Отзыв создан (заглушка)" });
});

router.get("/users/:id/reviews", (req, res) => {
  res.status(200).json({ ok: true, userId: req.params.id, data: [] });
});

module.exports = { router };

