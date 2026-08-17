package com.qct.server.service;

import com.qct.server.auth.AuthContext;
import com.qct.server.common.BizException;
import com.qct.server.common.R;
import com.qct.server.common.Times;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.qct.server.service.AuthService.str;
import static com.qct.server.service.AuthService.toStringList;

/**
 * 管理员 API 业务（对应 uniCloud 云函数 admin-api）。
 * 兼容前端 action / type 两种调用方式。
 */
@Service
public class AdminApiService {

    private final JdbcTemplate jdbc;
    private final ApplicationService applicationService;
    private final NotificationService notificationService;

    public AdminApiService(JdbcTemplate jdbc,
                           ApplicationService applicationService,
                           NotificationService notificationService) {
        this.jdbc = jdbc;
        this.applicationService = applicationService;
        this.notificationService = notificationService;
    }

    public Map<String, Object> dispatch(Map<String, Object> event) {
        String action = str(event.get("action"));
        if (action == null) {
            action = str(event.get("type"));
        }
        try {
            switch (action == null ? "" : action) {
                case "getApplicationUsers":
                    return getApplicationUsers();
                case "sendNotification":
                    return sendNotification(event);
                case "exportData":
                    return exportData(event);
                case "getNotificationHistory":
                case "getNotifications":
                    return getNotificationHistory();
                case "updateNotification":
                    return updateNotification(event);
                case "deleteNotification":
                    return deleteNotification(event);
                case "getAdmissions":
                    return getAdmissions();
                case "remindDepartmentSelection":
                    return remindDepartmentSelection(event);
                default:
                    return R.fail("未知操作");
            }
        } catch (BizException e) {
            return R.fail(e.getMessage());
        } catch (Exception e) {
            return R.fail("服务器错误: " + e.getMessage());
        }
    }

    private void requireAdmin() {
        if (!AuthContext.get().hasAdmin()) {
            throw new BizException("无权操作");
        }
    }

    private Map<String, Object> getApplicationUsers() {
        requireAdmin();
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT user_id, name, student_id FROM applications ORDER BY created_at DESC");
        List<Object> list = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("user_id", row.get("user_id"));
            item.put("name", row.get("name"));
            item.put("student_id", row.get("student_id"));
            list.add(item);
        }
        return R.ok(list);
    }

    private Map<String, Object> sendNotification(Map<String, Object> event) {
        requireAdmin();
        Map<String, Object> notification = ApplicationService.asMap(event.get("notification"));
        if (notification.isEmpty()) {
            notification = event;
        }
        String title = str(notification.get("title"));
        String content = str(notification.get("content"));
        String target = str(notification.get("target"));
        List<String> selectedUsers = toStringList(notification.get("selectedUsers"));

        if (title == null || content == null || target == null) {
            throw new BizException("缺少必要参数");
        }
        if (notificationService.hasDuplicate(title, content, target)) {
            return R.okMsg("通知已存在，跳过重复发送");
        }

        List<String> resolved = notificationService.resolveTargetUserIds(target, selectedUsers);
        String notificationId = notificationService.createNotification(title, content, target, resolved, selectedUsers);

        if (!resolved.isEmpty() && !resolved.contains("all")) {
            notificationService.createUserNotifications(notificationId, title, content, resolved);
        }
        return R.okMsg("通知发送成功");
    }

    private Map<String, Object> exportData(Map<String, Object> event) {
        requireAdmin();
        Map<String, Object> options = ApplicationService.asMap(event.get("exportOptions"));
        if (options.isEmpty()) {
            options = event;
        }
        List<String> statuses = toStringList(options.get("status"));
        List<String> departments = toStringList(options.get("departments"));

        StringBuilder where = new StringBuilder(" WHERE 1=1 ");
        List<Object> args = new ArrayList<>();
        if (!statuses.isEmpty()) {
            where.append(" AND status IN (");
            for (int i = 0; i < statuses.size(); i++) {
                where.append(i == 0 ? "?" : ",?");
                args.add(statuses.get(i));
            }
            where.append(") ");
        }
        if (!departments.isEmpty()) {
            where.append(" AND (");
            for (int i = 0; i < departments.size(); i++) {
                where.append(i == 0 ? "JSON_CONTAINS(departments, JSON_QUOTE(?))" : " OR JSON_CONTAINS(departments, JSON_QUOTE(?))");
                args.add(departments.get(i));
            }
            where.append(") ");
        }

        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT * FROM applications" + where + " ORDER BY created_at DESC", args.toArray());
        List<Object> list = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            list.add(applicationService.toClient(row));
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("data", list);
        data.put("filename", "applications_export_" + new java.text.SimpleDateFormat("yyyy-MM-dd").format(new java.util.Date()) + ".csv");
        return R.ok(data);
    }

    private Map<String, Object> getNotificationHistory() {
        requireAdmin();
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50");
        List<Object> list = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            list.add(notificationService.toClient(row));
        }
        return R.ok(list);
    }

    private Map<String, Object> updateNotification(Map<String, Object> event) {
        requireAdmin();
        String notificationId = str(event.get("notificationId"));
        if (notificationId == null) {
            notificationId = str(event.get("id"));
        }
        if (notificationId == null || notificationId.isBlank()) {
            throw new BizException("通知ID不能为空");
        }
        Map<String, Object> updateData = ApplicationService.asMap(event.get("updateData"));
        StringBuilder sql = new StringBuilder("UPDATE notifications SET updated_at = ? ");
        List<Object> args = new ArrayList<>();
        args.add(Times.now());
        for (Map.Entry<String, Object> entry : updateData.entrySet()) {
            sql.append(", ").append(entry.getKey()).append(" = ? ");
            args.add(entry.getValue());
        }
        sql.append(" WHERE id = ? ");
        args.add(notificationId);
        jdbc.update(sql.toString(), args.toArray());
        return R.okMsg("通知更新成功");
    }

    private Map<String, Object> deleteNotification(Map<String, Object> event) {
        requireAdmin();
        String notificationId = str(event.get("notificationId"));
        if (notificationId == null) {
            notificationId = str(event.get("id"));
        }
        if (notificationId == null || notificationId.isBlank()) {
            throw new BizException("通知ID不能为空");
        }
        jdbc.update("DELETE FROM notifications WHERE id = ?", notificationId);
        return R.okMsg("通知删除成功");
    }

    private Map<String, Object> getAdmissions() {
        requireAdmin();
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT * FROM applications WHERE status IN ('department_selection', 'accepted') ORDER BY created_at DESC");
        List<Object> list = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            list.add(applicationService.toClient(row));
        }
        return R.ok(list);
    }

    private Map<String, Object> remindDepartmentSelection(Map<String, Object> event) {
        requireAdmin();
        String userId = str(event.get("userId"));
        String userName = str(event.get("userName"));
        if (userId == null || userId.isBlank()) {
            throw new BizException("缺少用户ID");
        }
        String title = "部门选择提醒";
        String content = "恭喜您通过面试！请尽快登录系统选择您希望加入的部门。";
        String notificationId = notificationService.createNotification(title, content, "selected",
                List.of(userId), List.of(userId));
        notificationService.createUserNotifications(notificationId, title, content, List.of(userId));
        return R.okMsg("提醒发送成功");
    }
}
