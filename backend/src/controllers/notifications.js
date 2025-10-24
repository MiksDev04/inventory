import db from "../db.js";

// Get all notifications for a user
export const getNotifications = async (req, res) => {
  try {
    const userId = req.query.userId || 1; // Default to admin user
    const [notifications] = await db.execute(
      `SELECT n.*, i.name as item_name, i.sku as item_sku
       FROM notifications n
       LEFT JOIN items i ON n.item_id = i.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [userId]
    );
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// Get unread notification count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.query.userId || 1; // Default to admin user
    const [result] = await db.execute(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE`,
      [userId]
    );
    res.json({ count: result[0].count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute(
      `UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ?`,
      [id]
    );
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.query.userId || 1; // Default to admin user
    await db.execute(
      `UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = ? AND is_read = FALSE`,
      [userId]
    );
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
};

// Create a new notification (for system use)
export const createNotification = async (req, res) => {
  try {
    const { userId, type, title, message, itemId } = req.body;
    const [result] = await db.execute(
      `INSERT INTO notifications (user_id, type, title, message, item_id) VALUES (?, ?, ?, ?, ?)`,
      [userId || 1, type, title, message, itemId || null]
    );
    res.status(201).json({ id: result.insertId, message: "Notification created" });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: "Failed to create notification" });
  }
};

// Delete a notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute(`DELETE FROM notifications WHERE id = ?`, [id]);
    res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
};

// Generate notifications for low stock and out of stock items
export const generateStockNotifications = async (req, res) => {
  try {
    const userId = req.query.userId || 1; // Default to admin user
    
    // Get items that need notifications
    const [items] = await db.execute(
      `SELECT id, sku, name, quantity, min_quantity 
       FROM items 
       WHERE quantity = 0 OR quantity < min_quantity`
    );

    let created = 0;
    for (const item of items) {
      // Check if notification already exists for this item (to avoid duplicates)
      const [existing] = await db.execute(
        `SELECT id FROM notifications 
         WHERE item_id = ? AND is_read = FALSE 
         AND type IN ('low_stock', 'out_of_stock')
         ORDER BY created_at DESC LIMIT 1`,
        [item.id]
      );

      if (existing.length === 0) {
        const type = item.quantity === 0 ? 'out_of_stock' : 'low_stock';
        const title = item.quantity === 0 
          ? `${item.name} is out of stock` 
          : `${item.name} is running low`;
        const message = item.quantity === 0
          ? `Item "${item.name}" (SKU: ${item.sku}) is currently out of stock. Please reorder immediately.`
          : `Item "${item.name}" (SKU: ${item.sku}) has only ${item.quantity} units left (minimum: ${item.min_quantity}). Consider restocking soon.`;

        await db.execute(
          `INSERT INTO notifications (user_id, type, title, message, item_id) VALUES (?, ?, ?, ?, ?)`,
          [userId, type, title, message, item.id]
        );
        created++;
      }
    }

    res.json({ message: `Generated ${created} new notifications`, created });
  } catch (error) {
    console.error("Error generating stock notifications:", error);
    res.status(500).json({ error: "Failed to generate stock notifications" });
  }
};
