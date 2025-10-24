import express from "express";
import * as notificationsController from "../controllers/notifications.js";

const router = express.Router();

// GET /api/notifications - Get all notifications for user
router.get("/", notificationsController.getNotifications);

// GET /api/notifications/unread-count - Get unread notification count
router.get("/unread-count", notificationsController.getUnreadCount);

// PUT /api/notifications/:id/read - Mark notification as read
router.put("/:id/read", notificationsController.markAsRead);

// PUT /api/notifications/mark-all-read - Mark all notifications as read
router.put("/mark-all-read", notificationsController.markAllAsRead);

// POST /api/notifications - Create a new notification
router.post("/", notificationsController.createNotification);

// POST /api/notifications/generate - Generate stock notifications
router.post("/generate", notificationsController.generateStockNotifications);

// DELETE /api/notifications/:id - Delete a notification
router.delete("/:id", notificationsController.deleteNotification);

export default router;
