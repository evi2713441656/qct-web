package com.qct.server.service;

import com.qct.server.auth.AuthContext;
import com.qct.server.auth.TokenUtil;
import com.qct.server.common.BizException;
import com.qct.server.common.Json;
import com.qct.server.common.R;
import com.qct.server.common.Times;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.qct.server.service.AuthService.str;
import static com.qct.server.service.AuthService.toLong;
import static com.qct.server.service.AuthService.toStringList;

/**
 * 管理员业务（对应 uniCloud 云函数 admin）。
 */
@Service
public class AdminService {

    private final JdbcTemplate jdbc;
    private final ApplicationService applicationService;
    private final NotificationService notificationService;
    private final String jwtSecret;
    private final long tokenExpireHours;

    public AdminService(JdbcTemplate jdbc,
                        ApplicationService applicationService,
                        NotificationService notificationService,
                        @Value("${qct.jwt-secret}") String jwtSecret,
                        @Value("${qct.token-expire-hours:168}") long tokenExpireHours) {
        this.jdbc = jdbc;
        this.applicationService = applicationService;
        this.notificationService = notificationService;
        this.jwtSecret = jwtSecret;
        this.tokenExpireHours = tokenExpireHours;
    }

    public Map<String, Object> dispatch(Map<String, Object> event) {
        String type = str(event.get("type"));
        try {
            switch (type == null ? "" : type) {
                case "login":
                    return adminLogin(event);
                case "interview":
                    return manageInterview(event);
                case "getInterviews":
                    return getInterviews(event);
                case "notification":
                case "send_notification":
                    return sendNotification(event);
                case "statistics":
                    return getStatistics();
                case "getSystemConfig":
                    return getSystemConfig(false);
                case "getSystemConfigAdmin":
                    requireAdmin();
                    return getSystemConfig(true);
                case "updateSystemConfig":
                    requireAdmin();
                    return updateSystemConfig(event.get("configData"));
                case "exportData":
                    return exportData(event.get("data"));
                case "exportCSV":
                    return exportCSV(event);
                case "getNotificationHistory":
                case "get_notifications":
                    return getNotificationHistory();
                case "updateNotification":
                case "update_notification":
                    return updateNotification(event);
                case "deleteNotification":
                case "delete_notification":
                    return deleteNotification(event);
                default:
                    return R.fail("未知的操作类型");
            }
        } catch (BizException e) {
            return R.fail(e.getMessage());
        } catch (Exception e) {
            return R.fail("服务器内部错误: " + e.getMessage());
        }
    }

    private void requireAdmin() {
        if (!AuthContext.get().hasAdmin()) {
            throw new BizException("无权操作");
        }
    }

    // ---------------------------------------------------------------- 登录

    private Map<String, Object> adminLogin(Map<String, Object> event) {
        String username = str(event.get("username"));
        String password = str(event.get("password"));
        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            throw new BizException("用户名和密码不能为空");
        }

        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT * FROM admins WHERE username = ? AND status = 'active'", username);
        if (rows.isEmpty()) {
            throw new BizException("用户名或密码错误");
        }
        Map<String, Object> admin = rows.get(0);
        if (!sha256(password).equalsIgnoreCase(str(admin.get("password")))) {
            throw new BizException("用户名或密码错误");
        }

        jdbc.update("UPDATE admins SET last_login_time = ?, updated_at = ? WHERE id = ?",
                Times.now(), Times.now(), str(admin.get("id")));

        String token = TokenUtil.create(str(admin.get("id")), "admin",
                System.currentTimeMillis() + tokenExpireHours * 3600_000L, jwtSecret);

        Map<String, Object> adminInfo = new LinkedHashMap<>();
        adminInfo.put("_id", admin.get("id"));
        adminInfo.put("username", admin.get("username"));
        adminInfo.put("name", admin.get("name"));
        adminInfo.put("role", admin.get("role"));
        adminInfo.put("permissions", admin.get("permissions") == null ? new ArrayList<>()
                : Json.parseArray(String.valueOf(admin.get("permissions"))));

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("adminInfo", adminInfo);
        data.put("token", token);
        return R.ok(data);
    }

    // ---------------------------------------------------------------- 面试管理

    private Map<String, Object> manageInterview(Map<String, Object> event) {
        requireAdmin();
        Map<String, Object> data = ApplicationService.asMap(event.get("data"));
        String action = str(data.get("action"));
        String applicationId = str(data.get("applicationId"));
        if (action == null || applicationId == null || applicationId.isBlank()) {
            throw new BizException("缺少必要参数");
        }
        Map<String, Object> app = findApplicationById(applicationId);
        if (app == null) {
            throw new BizException("申请不存在");
        }
        Map<String, Object> interviewData = ApplicationService.asMap(data.get("interviewData"));

        switch (action) {
            case "schedule_first":
            case "schedule_second": {
                String field = "schedule_first".equals(action) ? "firstInterview" : "secondInterview";
                Map<String, Object> iv = new LinkedHashMap<>();
                iv.put("time", interviewData.get("time"));
                iv.put("location", interviewData.get("location"));
                iv.put("notes", interviewData.get("notes") == null ? "" : str(interviewData.get("notes")));
                iv.put("status", "scheduled");
                Map<String, Object> update = new LinkedHashMap<>();
                update.put(field, iv);
                update.put("updatedAt", Times.now());
                persistApplication(app, update);
                return R.okMsg("面试信息更新成功");
            }
            case "result_first":
            case "result_second": {
                String field = "result_first".equals(action) ? "firstInterview" : "secondInterview";
                Map<String, Object> iv = ApplicationService.asMap(app.get(field));
                iv.put("result", interviewData.get("result"));
                iv.put("feedback", interviewData.get("feedback") == null ? "" : str(interviewData.get("feedback")));
                iv.put("status", "completed");
                Map<String, Object> update = new LinkedHashMap<>();
                update.put(field, iv);
                if ("result_second".equals(action)) {
                    update.put("status", "pass".equals(str(interviewData.get("result"))) ? "accepted" : "rejected");
                }
                update.put("updatedAt", Times.now());
                persistApplication(app, update);
                return R.okMsg("面试信息更新成功");
            }
            default:
                throw new BizException("未知的面试操作");
        }
    }

    private Map<String, Object> getInterviews(Map<String, Object> event) {
        requireAdmin();
        Integer round = toIntOrNull(event.get("round"));
        if (round == null || (round != 1 && round != 2)) {
            throw new BizException("面试轮次参数错误");
        }
        // 原云函数查询的调度状态在本系统中不存在，返回空列表
        List<Object> list = new ArrayList<>();
        return R.ok(list);
    }

    // ---------------------------------------------------------------- 通知

    private Map<String, Object> sendNotification(Map<String, Object> event) {
        requireAdmin();
        Map<String, Object> data = ApplicationService.asMap(event.get("data"));
        if (data.isEmpty()) {
            data = event;
        }
        String type = str(data.get("type"));
        String title = str(data.get("title"));
        String content = str(data.get("content"));
        List<String> targetIds = toStringList(data.get("targetIds"));
        List<String> selectedUsers = toStringList(data.get("selectedUsers"));

        if (type == null || title == null || content == null) {
            throw new BizException("缺少必要参数");
        }
        if (notificationService.hasDuplicate(title, content, type)) {
            return R.okMsg("通知已存在，跳过重复发送");
        }

        List<String> resolved = notificationService.resolveTargetUserIds(type, selectedUsers);
        if (resolved.isEmpty() && !List.of("all").contains(type)) {
            resolved = targetIds;
        }
        String notificationId = notificationService.createNotification(title, content, type, resolved, selectedUsers);

        if (!resolved.isEmpty() && !resolved.contains("all")) {
            notificationService.createUserNotifications(notificationId, title, content, resolved);
        }
        return R.okMsg("通知发送成功");
    }

    // ---------------------------------------------------------------- 统计

    private Map<String, Object> getStatistics() {
        requireAdmin();
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM applications");

        int total = rows.size();
        int firstPassed = 0;
        int enteredSecond = 0;
        int secondPassed = 0;
        int joinedUs = 0;
        int todayCount = 0;

        long todayStart = Times.now() - (System.currentTimeMillis() % 86400000L);
        long todayEnd = todayStart + 86400000L - 1;

        Map<String, Integer> statusCount = new LinkedHashMap<>();
        Map<String, Integer> departmentCount = new LinkedHashMap<>();

        for (Map<String, Object> row : rows) {
            String status = str(row.get("status"));
            if (status == null) {
                status = "pending";
            }
            statusCount.merge(status, 1, Integer::sum);

            if (List.of("first_passed", "first_reject", "waiting_second", "second_failed",
                    "department_selection", "accepted", "rejected").contains(status)) {
                firstPassed++;
            }
            if ("waiting_second".equals(status)) {
                enteredSecond++;
            }
            if (List.of("department_selection", "accepted", "rejected").contains(status)) {
                secondPassed++;
            }
            if ("accepted".equals(status)) {
                joinedUs++;
            }
            Long applyTime = toLong(row.get("apply_time"));
            if (applyTime != null && applyTime >= todayStart && applyTime <= todayEnd) {
                todayCount++;
            }

            if (row.get("departments") != null) {
                for (Object dept : Json.parseArray(String.valueOf(row.get("departments")))) {
                    departmentCount.merge(String.valueOf(dept), 1, Integer::sum);
                }
            }
        }

        List<Object> byStatus = new ArrayList<>();
        statusCount.forEach((status, count) -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("_id", status);
            item.put("count", count);
            byStatus.add(item);
        });
        List<Object> byDepartment = new ArrayList<>();
        departmentCount.forEach((dept, count) -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("_id", dept);
            item.put("count", count);
            byDepartment.add(item);
        });

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("total", total);
        data.put("today", todayCount);
        data.put("first_passed", firstPassed);
        data.put("entered_second", enteredSecond);
        data.put("second_passed", secondPassed);
        data.put("joined_us", joinedUs);
        data.put("byStatus", byStatus);
        data.put("byDepartment", byDepartment);
        return R.ok(data);
    }

    // ---------------------------------------------------------------- 系统配置

    public Map<String, Object> getSystemConfig(boolean adminMode) {
        Map<String, Object> config = applicationService.getConfigFirst();

        if (config == null) {
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("applicationStartTime", "2025-08-01T00:00:00");
            data.put("applicationEndTime", "2025-10-15T23:59:59");
            data.put("editDeadline", "2025-10-15T23:59:59");
            return R.ok(data);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("_id", config.get("id"));
        result.put("createdAt", Times.iso(toLong(config.get("created_at"))));
        result.put("updatedAt", Times.iso(toLong(config.get("updated_at"))));

        Map<String, Object> recruitmentTime = config.get("recruitment_time") == null
                ? new LinkedHashMap<>() : Json.parseObject(String.valueOf(config.get("recruitment_time")));

        String startDate = str(recruitmentTime.get("startDate"));
        String endDate = str(recruitmentTime.get("endDate"));

        result.put("applicationStartTime", normalizeStart(startDate));
        result.put("applicationEndTime", normalizeEnd(endDate));
        result.put("editDeadline", normalizeEnd(endDate));

        result.put("recruitmentTime", recruitmentTime);
        result.put("departmentDetails", config.get("department_details") == null
                ? new LinkedHashMap<>() : Json.parseObject(String.valueOf(config.get("department_details"))));
        result.put("interviewConfig", config.get("interview_config") == null
                ? null : Json.parseObject(String.valueOf(config.get("interview_config"))));
        result.put("systemSettings", config.get("system_settings") == null
                ? null : Json.parseObject(String.valueOf(config.get("system_settings"))));
        return R.ok(result);
    }

    private Map<String, Object> updateSystemConfig(Object configDataObj) {
        requireAdmin();
        Map<String, Object> configData = ApplicationService.asMap(configDataObj);
        if (configData.isEmpty()) {
            throw new BizException("配置数据为空");
        }
        Map<String, Object> recruitmentTime = ApplicationService.asMap(configData.get("recruitmentTime"));
        String startDate = str(recruitmentTime.get("startDate"));
        String endDate = str(recruitmentTime.get("endDate"));
        if (startDate == null || startDate.isBlank()) {
            throw new BizException("缺少开始时间");
        }
        if (endDate == null || endDate.isBlank()) {
            throw new BizException("缺少结束时间");
        }
        String start = normalizeStart(startDate);
        String end = normalizeEnd(endDate);
        if (start == null || end == null) {
            throw new BizException("时间格式验证失败");
        }
        if (start.compareTo(end) >= 0) {
            throw new BizException("开始时间不能晚于或等于结束时间");
        }

        Map<String, Object> config = applicationService.getConfigFirst();
        if (config == null) {
            throw new BizException("系统配置不存在，请联系管理员初始化");
        }
        String id = str(config.get("id"));

        Map<String, Object> newRecruitment = new LinkedHashMap<>();
        newRecruitment.put("startDate", startDate);
        newRecruitment.put("endDate", endDate);
        newRecruitment.put("endTime", recruitmentTime.get("endTime") == null ? "23:59" : str(recruitmentTime.get("endTime")));

        StringBuilder sql = new StringBuilder("UPDATE system_config SET recruitment_time = ?, application_start_time = ?, application_end_time = ?, edit_deadline = ?, updated_at = ? ");
        List<Object> args = new ArrayList<>();
        args.add(Json.write(newRecruitment));
        args.add(start);
        args.add(end);
        args.add(end);
        args.add(Times.now());

        if (configData.get("interviewConfig") != null) {
            sql.append(", interview_config = ? ");
            args.add(Json.write(configData.get("interviewConfig")));
        }
        if (configData.get("departmentDetails") != null) {
            sql.append(", department_details = ? ");
            args.add(Json.write(configData.get("departmentDetails")));
        }
        sql.append(" WHERE id = ? ");
        args.add(id);
        jdbc.update(sql.toString(), args.toArray());

        return R.okMsg("配置更新成功");
    }

    // ---------------------------------------------------------------- 导出

    private Map<String, Object> exportData(Object dataObj) {
        requireAdmin();
        Map<String, Object> data = ApplicationService.asMap(dataObj);
        Map<String, Object> filters = ApplicationService.asMap(data.get("filters"));
        List<String> statuses = toStringList(filters.get("status"));
        List<String> departments = toStringList(filters.get("departments"));

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
                "SELECT * FROM applications" + where + " ORDER BY apply_time DESC", args.toArray());
        List<Object> list = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            list.add(applicationService.toClient(row));
        }
        return R.ok(list);
    }

    private Map<String, Object> exportCSV(Map<String, Object> event) {
        requireAdmin();
        String csvData = str(event.get("csvData"));
        String filename = str(event.get("filename"));
        if (csvData == null || filename == null) {
            throw new BizException("缺少必要参数");
        }
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("downloadUrl", "data:text/csv;charset=utf-8," + java.net.URLEncoder.encode(csvData, StandardCharsets.UTF_8));
        return R.ok(data, "导出成功");
    }

    // ---------------------------------------------------------------- 通知历史

    private Map<String, Object> getNotificationHistory() {
        requireAdmin();
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT * FROM notifications ORDER BY created_at DESC");
        List<Object> list = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            list.add(notificationService.toClient(row));
        }
        return R.ok(list);
    }

    private Map<String, Object> updateNotification(Map<String, Object> event) {
        requireAdmin();
        String id = str(event.get("id"));
        if (id == null) {
            id = str(event.get("notificationId"));
        }
        if (id == null || id.isBlank()) {
            throw new BizException("通知ID不能为空");
        }
        StringBuilder sql = new StringBuilder("UPDATE notifications SET updated_at = ? ");
        List<Object> args = new ArrayList<>();
        args.add(Times.now());
        if (event.get("title") != null) {
            sql.append(", title = ? ");
            args.add(event.get("title"));
        }
        if (event.get("content") != null) {
            sql.append(", content = ? ");
            args.add(event.get("content"));
        }
        if (event.get("type") != null) {
            sql.append(", type = ? ");
            args.add(event.get("type"));
        }
        if (event.get("targetIds") != null) {
            sql.append(", target_ids = ? ");
            args.add(Json.write(event.get("targetIds")));
        }
        sql.append(" WHERE id = ? ");
        args.add(id);
        jdbc.update(sql.toString(), args.toArray());
        return R.okMsg("通知更新成功");
    }

    private Map<String, Object> deleteNotification(Map<String, Object> event) {
        requireAdmin();
        String id = str(event.get("id"));
        if (id == null) {
            id = str(event.get("notificationId"));
        }
        if (id == null || id.isBlank()) {
            throw new BizException("通知ID不能为空");
        }
        jdbc.update("DELETE FROM notifications WHERE id = ?", id);
        return R.okMsg("通知删除成功");
    }

    // ---------------------------------------------------------------- 内部工具

    private Map<String, Object> findApplicationById(String id) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM applications WHERE id = ?", id);
        return rows.isEmpty() ? null : rows.get(0);
    }

    private void persistApplication(Map<String, Object> app, Map<String, Object> update) {
        StringBuilder sql = new StringBuilder("UPDATE applications SET ");
        List<Object> args = new ArrayList<>();
        for (Map.Entry<String, Object> entry : update.entrySet()) {
            String key = entry.getKey();
            String col;
            switch (key) {
                case "firstInterview" -> col = "first_interview";
                case "secondInterview" -> col = "second_interview";
                case "updatedAt" -> col = "updated_at";
                default -> col = key;
            }
            Object value = entry.getValue();
            if ("firstInterview".equals(key) || "secondInterview".equals(key)) {
                sql.append(col).append(" = ?, ");
                args.add(Json.write(value));
            } else {
                sql.append(col).append(" = ?, ");
                args.add(value);
            }
        }
        sql.setLength(sql.length() - 2);
        sql.append(" WHERE id = ? ");
        args.add(str(app.get("id")));
        jdbc.update(sql.toString(), args.toArray());
    }

    public static String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 计算失败", e);
        }
    }

    private static Integer toIntOrNull(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /** 日期字符串转 ISO：yyyy-MM-dd -> yyyy-MM-ddT00:00:00；含空格 -> T 替换 */
    private static String normalizeStart(String date) {
        if (date == null || date.isBlank()) {
            return null;
        }
        String s = date.trim();
        if (!s.contains("T") && !s.contains(" ")) {
            return s + "T00:00:00";
        }
        if (s.contains(" ")) {
            String[] parts = s.split(" ");
            return parts[0] + "T" + (parts[1].length() == 5 ? parts[1] + ":00" : parts[1]);
        }
        return s;
    }

    private static String normalizeEnd(String date) {
        if (date == null || date.isBlank()) {
            return null;
        }
        String s = date.trim();
        if (!s.contains("T") && !s.contains(" ")) {
            return s + "T23:59:59";
        }
        if (s.contains(" ")) {
            String[] parts = s.split(" ");
            return parts[0] + "T" + (parts[1].length() == 5 ? parts[1] + ":59" : parts[1]);
        }
        return s;
    }
}
