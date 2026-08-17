package com.qct.server.service;

import com.qct.server.common.Ids;
import com.qct.server.common.Json;
import com.qct.server.common.Times;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 通知服务：创建通知记录并分发到用户通知。
 */
@Service
public class NotificationService {

    private final JdbcTemplate jdbc;

    public NotificationService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * 判断是否存在 5 分钟内的相同通知（去重）
     */
    public boolean hasDuplicate(String title, String content, String type) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM notifications WHERE title = ? AND content = ? AND type = ? AND created_at >= ?",
                Integer.class, title, content, type, Times.now() - 5 * 60 * 1000L);
        return count != null && count > 0;
    }

    /**
     * 创建通知记录（返回通知 ID）
     */
    public String createNotification(String title, String content, String type, List<String> targetIds, List<String> selectedUsers) {
        long now = Times.now();
        String notificationId = Ids.newId();
        jdbc.update("INSERT INTO notifications (id, title, content, type, target_ids, selected_users, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
                notificationId, title, content, type,
                targetIds == null ? Json.write(new ArrayList<>()) : Json.write(targetIds),
                selectedUsers == null ? Json.write(new ArrayList<>()) : Json.write(selectedUsers),
                "sent", now, now);
        return notificationId;
    }

    /**
     * 为指定用户创建个人通知记录
     */
    public void createUserNotifications(String notificationId, String title, String content, List<String> userIds) {
        long now = Times.now();
        for (String userId : userIds) {
            jdbc.update("INSERT INTO user_notifications (id, user_id, notification_id, title, content, type, is_read, created_at) VALUES (?,?,?,?,?,?,?,?)",
                    Ids.newId(), userId, notificationId, title, content, "admin", 0, now);
        }
    }

    /**
     * 根据目标类型获取用户 ID 列表。
     * 支持：all / applicants / registered / 各申请状态 / selected（使用 selectedUsers）
     */
    public List<String> resolveTargetUserIds(String target, List<String> selectedUsers) {
        if (target == null) {
            return List.of();
        }
        switch (target) {
            case "all":
                return List.of("all");
            case "selected":
                return selectedUsers == null ? List.of() : selectedUsers;
            case "applicants":
            case "registered":
                return queryUserIds("1=1");
            case "waiting_first":
                return queryUserIds("status = 'waiting_first'");
            case "first_passed":
                return queryUserIds("status = 'first_passed'");
            case "waiting_second":
                return queryUserIds("status = 'waiting_second'");
            case "first_failed":
                return queryUserIds("status = 'first_failed'");
            case "second_failed":
                return queryUserIds("status = 'second_failed'");
            case "department_selection":
                return queryUserIds("status IN ('department_selection', 'accepted')");
            case "accepted":
                return queryUserIds("status = 'accepted'");
            case "first_interview":
            case "second_interview":
                return queryUserIds("1=1");
            default:
                return List.of();
        }
    }

    private List<String> queryUserIds(String where) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT DISTINCT user_id FROM applications WHERE " + where + " AND user_id IS NOT NULL AND user_id <> ''");
        List<String> ids = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            String id = String.valueOf(row.get("user_id"));
            if (!id.isBlank()) {
                ids.add(id);
            }
        }
        return ids;
    }

    /** 通知记录 → 前端对象 */
    public Map<String, Object> toClient(Map<String, Object> row) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("_id", row.get("id"));
        result.put("title", row.get("title"));
        result.put("content", row.get("content"));
        result.put("type", row.get("type"));
        result.put("targetIds", row.get("target_ids") == null ? new ArrayList<>() : Json.parseArray(String.valueOf(row.get("target_ids"))));
        result.put("selectedUsers", row.get("selected_users") == null ? new ArrayList<>() : Json.parseArray(String.valueOf(row.get("selected_users"))));
        result.put("status", row.get("status"));
        result.put("createdAt", Times.iso(toLong(row.get("created_at"))));
        result.put("updatedAt", Times.iso(toLong(row.get("updated_at"))));
        return result;
    }

    private static Long toLong(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
