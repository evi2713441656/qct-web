package com.qct.server.service;

import com.qct.server.auth.AuthContext;
import com.qct.server.common.BizException;
import com.qct.server.common.Ids;
import com.qct.server.common.Json;
import com.qct.server.common.R;
import com.qct.server.common.Times;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.qct.server.service.AuthService.str;
import static com.qct.server.service.AuthService.toInt;
import static com.qct.server.service.AuthService.toLong;
import static com.qct.server.service.AuthService.toStringList;

/**
 * 报名申请业务（对应 uniCloud 云函数 application）。
 */
@Service
public class ApplicationService {

    private static final List<String> VALID_STATUSES = List.of(
            "waiting_first", "first_passed", "first_failed", "first_reject",
            "waiting_second", "second_failed", "department_selection", "accepted", "rejected");

    private final JdbcTemplate jdbc;
    private final AuthService authService;

    public ApplicationService(JdbcTemplate jdbc, AuthService authService) {
        this.jdbc = jdbc;
        this.authService = authService;
    }

    public Map<String, Object> dispatch(Map<String, Object> event) {
        String type = str(event.get("type"));
        try {
            switch (type == null ? "" : type) {
                case "submit":
                    return submitApplication(event.get("data"), event);
                case "update":
                    return updateApplication(event.get("data"), event);
                case "get":
                    return getApplication(event);
                case "delete":
                    return deleteApplication(event);
                case "list":
                    return listApplications(event);
                case "update_status":
                    return updateApplicationStatus(event);
                case "update_interview_result":
                    return updateInterviewResult(event);
                case "select_department":
                    return selectFinalDepartment(event);
                case "reject_department":
                    return rejectDepartment(event);
                case "check_in":
                    return checkIn(event);
                case "update_application_info":
                    return updateApplicationInfo(event);
                case "update_interview_status":
                    return updateInterviewStatus(event);
                case "my_notifications":
                    return myNotifications(event);
                default:
                    return R.fail("未知的操作类型");
            }
        } catch (BizException e) {
            return R.fail(e.getMessage());
        } catch (Exception e) {
            return R.fail("服务器内部错误: " + e.getMessage());
        }
    }

    // ---------------------------------------------------------------- 通知

    /** 当前用户的通知（user_notifications） */
    private Map<String, Object> myNotifications(Map<String, Object> event) {
        String userId = resolveUserId(event);
        if (userId == null) {
            throw new BizException("请先登录");
        }
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT * FROM user_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100", userId);
        List<Object> list = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("_id", row.get("id"));
            item.put("notification_id", row.get("notification_id"));
            item.put("title", row.get("title"));
            item.put("content", row.get("content"));
            item.put("type", row.get("type"));
            item.put("is_read", row.get("is_read"));
            item.put("createdAt", Times.iso(toLong(row.get("created_at"))));
            list.add(item);
        }
        return R.ok(list);
    }

    // ---------------------------------------------------------------- 提交

    private Map<String, Object> submitApplication(Object dataObj, Map<String, Object> event) {
        AuthContext.Context ctx = AuthContext.get();
        String userId = resolveUserId(event);
        if (userId == null) {
            throw new BizException("请先登录");
        }

        Map<String, Object> data = asMap(dataObj);
        String name = str(data.get("name"));
        Object departmentsObj = data.get("departments");
        String introduction = str(data.get("introduction"));

        if (name == null || name.isBlank() || departmentsObj == null || introduction == null) {
            throw new BizException("缺少必要信息：请填写昵称、选择部门和自我介绍");
        }
        List<String> departments = toStringList(departmentsObj);
        if (departments.isEmpty()) {
            throw new BizException("请至少选择一个部门");
        }
        if (introduction.trim().isEmpty()) {
            throw new BizException("请填写自我介绍");
        }

        Integer existing = jdbc.queryForObject(
                "SELECT COUNT(*) FROM applications WHERE user_id = ?", Integer.class, userId);
        if (existing != null && existing > 0) {
            throw new BizException("您已经提交过报名申请");
        }

        String studentId = str(data.get("studentId"));
        if (studentId != null && !studentId.trim().isEmpty()) {
            Integer dup = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM applications WHERE student_id = ?", Integer.class, studentId.trim());
            if (dup != null && dup > 0) {
                throw new BizException("该学号已被使用");
            }
        }

        long now = Times.now();
        Map<String, Object> application = new LinkedHashMap<>();
        application.put("user_id", userId);
        application.put("name", name);
        application.put("student_id", studentId);
        application.put("phone", str(data.get("phone")));
        application.put("email", str(data.get("email")) == null ? "" : str(data.get("email")));
        application.put("college", str(data.get("college")) == null ? "" : str(data.get("college")));
        application.put("major", str(data.get("major")));
        application.put("grade", str(data.get("grade")) == null ? "" : str(data.get("grade")));
        application.put("gender", str(data.get("gender")) == null ? "" : str(data.get("gender")));
        application.put("dormitory", str(data.get("dormitory")) == null ? "" : str(data.get("dormitory")));
        application.put("departments", departments);
        application.put("introduction", introduction);
        application.put("experience", str(data.get("experience")) == null ? "" : str(data.get("experience")));
        application.put("motivation", str(data.get("motivation")) == null ? "" : str(data.get("motivation")));
        application.put("status", "waiting_first");

        String id = Ids.newId();
        jdbc.update("INSERT INTO applications (id, user_id, name, student_id, phone, email, college, major, grade, gender, dormitory, departments, introduction, experience, motivation, status, apply_time, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                id, userId, name, studentId, str(data.get("phone")),
                str(data.get("email")) == null ? "" : str(data.get("email")),
                str(data.get("college")) == null ? "" : str(data.get("college")),
                str(data.get("major")),
                str(data.get("grade")) == null ? "" : str(data.get("grade")),
                str(data.get("gender")) == null ? "" : str(data.get("gender")),
                str(data.get("dormitory")) == null ? "" : str(data.get("dormitory")),
                Json.write(departments), introduction,
                str(data.get("experience")) == null ? "" : str(data.get("experience")),
                str(data.get("motivation")) == null ? "" : str(data.get("motivation")),
                "waiting_first", now, now, now);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", id);
        result.putAll(application);
        result.put("_id", id);
        return R.ok(result, "报名申请提交成功");
    }

    // ---------------------------------------------------------------- 更新

    private Map<String, Object> updateApplication(Object dataObj, Map<String, Object> event) {
        String userId = resolveUserId(event);
        if (userId == null) {
            throw new BizException("请先登录");
        }
        String applicationId = str(event.get("applicationId"));
        if (applicationId == null || applicationId.isBlank()) {
            throw new BizException("缺少必要参数");
        }
        Map<String, Object> app = findById(applicationId);
        if (app == null) {
            throw new BizException("申请不存在");
        }
        if (!userId.equals(str(app.get("user_id")))) {
            throw new BizException("无权修改此申请");
        }

        Map<String, Object> data = asMap(dataObj);
        String studentId = str(data.get("studentId"));
        if (studentId != null && !studentId.equals(str(app.get("student_id")))) {
            Integer dup = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM applications WHERE student_id = ? AND id <> ?", Integer.class,
                    studentId, applicationId);
            if (dup != null && dup > 0) {
                throw new BizException("该学号已被使用");
            }
        }

        List<String> departments = toStringList(data.get("departments"));
        long now = Times.now();
        jdbc.update("UPDATE applications SET name = ?, student_id = ?, phone = ?, email = ?, college = ?, major = ?, grade = ?, gender = ?, dormitory = ?, departments = ?, introduction = ?, experience = ?, motivation = ?, updated_at = ? WHERE id = ?",
                str(data.get("name")), studentId, str(data.get("phone")),
                str(data.get("email")) == null ? "" : str(data.get("email")),
                str(data.get("college")) == null ? "" : str(data.get("college")),
                str(data.get("major")),
                str(data.get("grade")) == null ? "" : str(data.get("grade")),
                str(data.get("gender")) == null ? "" : str(data.get("gender")),
                str(data.get("dormitory")) == null ? "" : str(data.get("dormitory")),
                Json.write(departments), str(data.get("introduction")),
                str(data.get("experience")) == null ? "" : str(data.get("experience")),
                str(data.get("motivation")) == null ? "" : str(data.get("motivation")),
                now, applicationId);

        return R.okMsg("申请信息更新成功");
    }

    // ---------------------------------------------------------------- 查询

    private Map<String, Object> getApplication(Map<String, Object> event) {
        String applicationId = str(event.get("applicationId"));
        String userId = resolveUserId(event);
        AuthContext.Context ctx = AuthContext.get();

        if (applicationId != null && !applicationId.isBlank()) {
            Map<String, Object> app = findById(applicationId);
            if (app == null) {
                throw new BizException("申请不存在");
            }
            boolean owner = userId != null && userId.equals(str(app.get("user_id")));
            if (!owner && !ctx.hasAdmin()) {
                throw new BizException("无权查看此申请");
            }
            return R.ok(toClient(app));
        }

        if (userId == null) {
            throw new BizException("缺少用户ID");
        }
        List<Map<String, Object>> list = jdbc.queryForList(
                "SELECT * FROM applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1", userId);
        return R.ok(list.isEmpty() ? null : toClient(list.get(0)));
    }

    private Map<String, Object> deleteApplication(Map<String, Object> event) {
        String userId = resolveUserId(event);
        if (userId == null) {
            throw new BizException("请先登录");
        }
        String applicationId = str(event.get("applicationId"));
        if (applicationId == null || applicationId.isBlank()) {
            throw new BizException("缺少必要参数");
        }
        Map<String, Object> app = findById(applicationId);
        if (app == null) {
            throw new BizException("申请不存在");
        }
        if (!userId.equals(str(app.get("user_id")))) {
            throw new BizException("无权删除此申请");
        }
        if (!"waiting_first".equals(str(app.get("status")))) {
            throw new BizException("当前状态不允许撤销申请");
        }

        jdbc.update("DELETE FROM applications WHERE id = ?", applicationId);

        Map<String, Object> first = interview(app, "first");
        Object numObj = first.get("checkInNumber");
        if (numObj != null) {
            reorderQueue("first", toInt(numObj));
        }
        return R.okMsg("申请删除成功");
    }

    // ---------------------------------------------------------------- 列表（管理员）

    private Map<String, Object> listApplications(Map<String, Object> event) {
        AuthContext.Context ctx = AuthContext.get();
        if (!ctx.hasAdmin()) {
            throw new BizException("无权操作");
        }
        int page = toInt(event.get("page")) == null ? 1 : toInt(event.get("page"));
        int pageSize = toInt(event.get("pageSize")) == null ? 20 : toInt(event.get("pageSize"));
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 500) pageSize = 500;

        String status = str(event.get("status"));
        String department = str(event.get("department"));

        StringBuilder where = new StringBuilder(" WHERE 1=1 ");
        List<Object> args = new ArrayList<>();
        if (status != null && !status.isBlank() && !"all".equals(status)) {
            where.append(" AND status = ? ");
            args.add(status);
        }
        if (department != null && !department.isBlank() && !"all".equals(department)) {
            where.append(" AND JSON_CONTAINS(departments, JSON_QUOTE(?)) ");
            args.add(department);
        }

        Integer total = jdbc.queryForObject("SELECT COUNT(*) FROM applications" + where, Integer.class, args.toArray());
        int totalInt = total == null ? 0 : total;

        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT * FROM applications" + where + " ORDER BY created_at DESC LIMIT ? OFFSET ?",
                appendArgs(args, pageSize, (page - 1) * pageSize));

        List<Object> list = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            list.add(toClient(row));
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("list", list);
        data.put("total", totalInt);
        data.put("page", page);
        data.put("pageSize", pageSize);
        data.put("totalPages", (int) Math.ceil(totalInt * 1.0 / pageSize));
        return R.ok(data);
    }

    // ---------------------------------------------------------------- 状态流转（管理员）

    private Map<String, Object> updateApplicationStatus(Map<String, Object> event) {
        AuthContext.Context ctx = AuthContext.get();
        if (!ctx.hasAdmin()) {
            throw new BizException("无权操作");
        }
        String applicationId = str(event.get("applicationId"));
        String status = str(event.get("status"));
        if (applicationId == null || applicationId.isBlank() || status == null || status.isBlank()) {
            throw new BizException("缺少必要参数");
        }
        if (!VALID_STATUSES.contains(status)) {
            throw new BizException("无效的状态值");
        }

        Map<String, Object> app = findById(applicationId);
        if (app == null) {
            throw new BizException("申请不存在");
        }
        String currentStatus = str(app.get("status"));

        Map<String, Object> update = new LinkedHashMap<>();
        update.put("status", status);
        long now = Times.now();
        update.put("updatedAt", now);

        Map<String, Object> extra = new LinkedHashMap<>();
        extra.put("departments", event.get("departments"));
        extra.put("feedback", event.get("feedback"));
        extra.put("notes", event.get("notes"));
        extra.put("finalDepartment", event.get("finalDepartment"));

        List<String> departments = toStringList(extra.get("departments"));
        String feedback = str(extra.get("feedback")) == null ? "" : str(extra.get("feedback"));

        switch (status) {
            case "waiting_first": {
                boolean fromFirstStates = List.of("first_passed", "first_failed", "first_reject", "waiting_second")
                        .contains(currentStatus);
                Map<String, Object> first = interview(app, "first");
                if (fromFirstStates) {
                    first.put("status", "completed");
                    first.put("result", null);
                    first.put("feedback", "");
                    first.put("passedDepartments", new ArrayList<>());
                    first.put("completedAt", null);
                } else {
                    first.put("status", "pending");
                    first.put("result", null);
                    first.put("feedback", "");
                    first.put("passedDepartments", new ArrayList<>());
                    first.put("completedAt", null);
                }
                update.put("firstInterview", first);

                Map<String, Object> second = newInterview();
                update.put("secondInterview", second);
                update.put("finalDepartment", null);

                Map<String, Object> oldSecond = interview(app, "second");
                Object numObj = oldSecond.get("checkInNumber");
                if (numObj != null) {
                    reorderQueue("second", toInt(numObj));
                }
                break;
            }
            case "first_passed": {
                if ("first_reject".equals(currentStatus)) {
                    Map<String, Object> first = interview(app, "first");
                    List<Object> passed = (List<Object>) first.get("passedDepartments");
                    if (passed != null && !passed.isEmpty()) {
                        first.put("status", "completed");
                        first.put("result", "pass");
                        first.put("completedAt", now);
                        update.put("firstInterview", first);
                        update.put("secondInterview", newInterview());
                        update.put("finalDepartment", null);
                    } else {
                        throw new BizException("无法从first_reject状态撤销：缺少一面通过部门信息");
                    }
                } else if (departments.isEmpty()) {
                    throw new BizException("一面通过必须指定通过的部门");
                } else {
                    Map<String, Object> first = interview(app, "first");
                    first.put("status", "completed");
                    first.put("result", "pass");
                    first.put("feedback", feedback);
                    first.put("passedDepartments", departments);
                    first.put("completedAt", now);
                    update.put("firstInterview", first);
                    update.put("secondInterview", newInterview());
                    update.put("finalDepartment", null);
                }
                break;
            }
            case "waiting_second": {
                List<String> allowed = List.of("first_passed", "department_selection", "accepted", "second_failed", "rejected");
                if (!allowed.contains(currentStatus)) {
                    throw new BizException("当前状态不允许进入等待二面状态");
                }
                if (List.of("department_selection", "accepted", "second_failed", "rejected").contains(currentStatus)) {
                    Map<String, Object> second = interview(app, "second");
                    second.put("status", "completed");
                    second.put("result", null);
                    second.put("feedback", "");
                    second.put("passedDepartments", new ArrayList<>());
                    second.put("completedAt", null);
                    update.put("secondInterview", second);
                    update.put("finalDepartment", null);
                }
                break;
            }
            case "first_failed": {
                Map<String, Object> first = interview(app, "first");
                first.put("status", "completed");
                first.put("result", "fail");
                first.put("feedback", feedback);
                first.put("passedDepartments", new ArrayList<>());
                first.put("completedAt", now);
                update.put("firstInterview", first);
                break;
            }
            case "first_reject": {
                Map<String, Object> first = interview(app, "first");
                List<Object> keptPassed = (List<Object>) first.get("passedDepartments");
                first.put("status", "completed");
                first.put("result", "reject");
                first.put("feedback", feedback);
                first.put("passedDepartments", keptPassed == null ? new ArrayList<>() : keptPassed);
                first.put("completedAt", now);
                update.put("firstInterview", first);
                break;
            }
            case "department_selection": {
                if (departments.isEmpty()) {
                    throw new BizException("二面通过必须指定通过的部门");
                }
                Map<String, Object> second = interview(app, "second");
                second.put("status", "completed");
                second.put("result", "pass");
                second.put("feedback", feedback);
                second.put("passedDepartments", departments);
                second.put("completedAt", now);
                update.put("secondInterview", second);
                break;
            }
            case "second_failed": {
                Map<String, Object> second = interview(app, "second");
                second.put("status", "completed");
                second.put("result", "fail");
                second.put("feedback", feedback);
                second.put("passedDepartments", new ArrayList<>());
                second.put("completedAt", now);
                update.put("secondInterview", second);
                break;
            }
            case "accepted": {
                if (extra.get("finalDepartment") != null && str(extra.get("finalDepartment")) != null
                        && !str(extra.get("finalDepartment")).isBlank()) {
                    update.put("finalDepartment", str(extra.get("finalDepartment")));
                }
                break;
            }
            case "rejected": {
                update.put("rejectedAt", now);
                break;
            }
        }

        if (extra.get("notes") != null && str(extra.get("notes")) != null) {
            update.put("adminNotes", str(extra.get("notes")));
        }

        persistUpdate(app, update);
        return R.okMsg("申请状态更新成功");
    }

    // ---------------------------------------------------------------- 面试结果（管理员）

    private Map<String, Object> updateInterviewResult(Map<String, Object> event) {
        AuthContext.Context ctx = AuthContext.get();
        if (!ctx.hasAdmin()) {
            throw new BizException("无权操作");
        }
        String applicationId = str(event.get("applicationId"));
        Integer round = toInt(event.get("round"));
        String result = str(event.get("result"));
        String feedback = str(event.get("feedback")) == null ? "" : str(event.get("feedback"));
        List<String> passedDepartments = toStringList(event.get("passedDepartments"));

        if (applicationId == null || applicationId.isBlank() || round == null || result == null) {
            throw new BizException("缺少必要参数");
        }
        Map<String, Object> app = findById(applicationId);
        if (app == null) {
            throw new BizException("申请不存在");
        }
        String currentStatus = str(app.get("status"));
        long now = Times.now();

        Map<String, Object> update = new LinkedHashMap<>();
        update.put("updatedAt", now);

        if (round == 1) {
            if (!"waiting_first".equals(currentStatus)) {
                throw new BizException("当前状态不允许更新一面结果");
            }
            Map<String, Object> first = interview(app, "first");
            first.put("status", "completed");
            first.put("result", result);
            first.put("feedback", feedback);
            first.put("passedDepartments", passedDepartments);
            first.put("completedAt", now);
            update.put("firstInterview", first);

            if ("pass".equals(result) && !passedDepartments.isEmpty()) {
                update.put("status", "waiting_second");
                update.put("secondInterview", newInterview());
            } else {
                update.put("status", "first_failed");
            }
        } else if (round == 2) {
            if (!"waiting_second".equals(currentStatus)) {
                throw new BizException("当前状态不允许更新二面结果");
            }
            Map<String, Object> second = interview(app, "second");
            second.put("status", "completed");
            second.put("result", result);
            second.put("feedback", feedback);
            second.put("passedDepartments", passedDepartments);
            second.put("completedAt", now);
            update.put("secondInterview", second);

            if ("pass".equals(result) && !passedDepartments.isEmpty()) {
                update.put("status", "department_selection");
                sendDepartmentSelectionReminder(str(app.get("user_id")), str(app.get("name")));
            } else {
                update.put("status", "second_failed");
            }
        } else {
            throw new BizException("无效的面试轮次");
        }

        persistUpdate(app, update);
        return R.okMsg("面试结果更新成功");
    }

    // ---------------------------------------------------------------- 部门选择（用户）

    private Map<String, Object> selectFinalDepartment(Map<String, Object> event) {
        String applicationId = str(event.get("applicationId"));
        String department = str(event.get("department"));
        String userId = resolveUserId(event);
        if (applicationId == null || applicationId.isBlank() || department == null || department.isBlank()) {
            throw new BizException("缺少必要参数");
        }
        Map<String, Object> app = findById(applicationId);
        if (app == null) {
            throw new BizException("申请不存在");
        }
        if (userId != null && !userId.equals(str(app.get("user_id")))) {
            throw new BizException("无权操作此申请");
        }
        if (!"department_selection".equals(str(app.get("status")))) {
            throw new BizException("当前状态不允许选择部门");
        }
        Map<String, Object> second = interview(app, "second");
        List<Object> passed = (List<Object>) second.get("passedDepartments");
        if (passed == null || !passed.contains(department)) {
            throw new BizException("选择的部门不在通过列表中");
        }

        Map<String, Object> update = new LinkedHashMap<>();
        update.put("finalDepartment", department);
        update.put("status", "accepted");
        update.put("updatedAt", Times.now());
        persistUpdate(app, update);
        return R.okMsg("部门选择成功，恭喜您成功加入我们！");
    }

    private Map<String, Object> rejectDepartment(Map<String, Object> event) {
        String applicationId = str(event.get("applicationId"));
        String userId = resolveUserId(event);
        if (applicationId == null || applicationId.isBlank()) {
            throw new BizException("缺少必要参数");
        }
        Map<String, Object> app = findById(applicationId);
        if (app == null) {
            throw new BizException("申请不存在");
        }
        if (userId != null && !userId.equals(str(app.get("user_id")))) {
            throw new BizException("无权操作此申请");
        }
        if (!"department_selection".equals(str(app.get("status")))) {
            throw new BizException("当前状态不允许拒绝录取");
        }

        Map<String, Object> update = new LinkedHashMap<>();
        update.put("status", "rejected");
        update.put("rejectedAt", Times.now());
        update.put("updatedAt", Times.now());
        persistUpdate(app, update);
        return R.okMsg("已拒绝录取");
    }

    // ---------------------------------------------------------------- 签到（用户）

    private Map<String, Object> checkIn(Map<String, Object> event) {
        String interviewType = str(event.get("interviewType"));
        String userId = resolveUserId(event);
        if (userId == null) {
            throw new BizException("请先登录");
        }
        if (interviewType == null || !List.of("first", "second").contains(interviewType)) {
            throw new BizException("无效的面试类型");
        }
        List<Map<String, Object>> list = jdbc.queryForList(
                "SELECT * FROM applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1", userId);
        if (list.isEmpty()) {
            throw new BizException("未找到报名申请");
        }
        Map<String, Object> app = list.get(0);
        String expectedStatus = "first".equals(interviewType) ? "waiting_first" : "waiting_second";
        if (!expectedStatus.equals(str(app.get("status")))) {
            throw new BizException("当前状态不允许签到");
        }

        Map<String, Object> interview = asMap(app.get(interviewType + "Interview"));
        if (interview.get("checkInNumber") != null) {
            throw new BizException("您已经签到过了");
        }

        Map<String, Object> config = getConfigFirst();
        Object interviewConfigObj = config == null ? null : config.get("interview_config");
        Map<String, Object> interviewConfig = asMap(interviewConfigObj);
        Map<String, Object> interviewInfo = asMap(interviewConfig.get(interviewType + "Interview"));

        if (interviewInfo.isEmpty() || !Boolean.TRUE.equals(interviewInfo.get("isSet"))) {
            throw new BizException("面试时间和地点尚未设置，无法开启签到");
        }
        if (interviewInfo.get("date") == null || interviewInfo.get("time") == null || interviewInfo.get("location") == null
                || str(interviewInfo.get("date")).isBlank() || str(interviewInfo.get("time")).isBlank()
                || str(interviewInfo.get("location")).isBlank()) {
            throw new BizException("面试时间或地点信息不完整，无法开启签到");
        }
        if (!Boolean.TRUE.equals(interviewInfo.get("checkInEnabled"))) {
            throw new BizException("签到功能未开启");
        }

        int nextNumber = 1;
        List<Map<String, Object>> maxRows = jdbc.queryForList(
                "SELECT id, first_interview, second_interview FROM applications WHERE " + interviewType + "_interview IS NOT NULL AND JSON_EXTRACT(" + interviewType + "_interview, '$.checkInNumber') IS NOT NULL ORDER BY JSON_EXTRACT(" + interviewType + "_interview, '$.checkInNumber') DESC LIMIT 1");
        if (!maxRows.isEmpty()) {
            Map<String, Object> row = maxRows.get(0);
            Map<String, Object> iv = asMap(row.get(interviewType + "_interview"));
            Object num = iv.get("checkInNumber");
            if (num instanceof Number) {
                nextNumber = ((Number) num).intValue() + 1;
            }
        }

        interview.put("checkInNumber", nextNumber);
        interview.put("checkInTime", Times.now());

        Map<String, Object> update = new LinkedHashMap<>();
        update.put(interviewType + "Interview", interview);
        update.put("updatedAt", Times.now());
        persistUpdate(app, update);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("checkInNumber", nextNumber);
        data.put("checkInTime", Times.iso(Times.now()));
        return R.ok(data, "签到成功！您的面试序号是：" + nextNumber);
    }

    // ---------------------------------------------------------------- 管理员修改报名信息

    private Map<String, Object> updateApplicationInfo(Map<String, Object> event) {
        AuthContext.Context ctx = AuthContext.get();
        if (!ctx.hasAdmin()) {
            throw new BizException("无权操作");
        }
        String applicationId = str(event.get("applicationId"));
        Map<String, Object> updateData = asMap(event.get("updateData"));
        if (applicationId == null || applicationId.isBlank() || updateData.isEmpty()) {
            throw new BizException("缺少必要参数");
        }
        Map<String, Object> app = findById(applicationId);
        if (app == null) {
            throw new BizException("申请不存在");
        }

        String studentId = str(updateData.get("studentId"));
        if (studentId != null && !studentId.isBlank() && !studentId.equals(str(app.get("student_id")))) {
            Integer dup = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM applications WHERE student_id = ? AND id <> ?", Integer.class,
                    studentId, applicationId);
            if (dup != null && dup > 0) {
                throw new BizException("该学号已被使用");
            }
        }

        StringBuilder sql = new StringBuilder("UPDATE applications SET updated_at = ? ");
        List<Object> args = new ArrayList<>();
        args.add(Times.now());

        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("name", updateData.get("name"));
        fields.put("student_id", updateData.get("studentId") == null ? null : str(updateData.get("studentId")));
        fields.put("phone", updateData.get("phone"));
        fields.put("gender", updateData.get("gender"));
        fields.put("major", updateData.get("major"));
        fields.put("dormitory", updateData.get("dormitory"));
        fields.put("introduction", updateData.get("introduction"));
        if (updateData.get("departments") != null) {
            fields.put("departments", Json.write(toStringList(updateData.get("departments"))));
        }

        List<String> keys = new ArrayList<>(fields.keySet());
        for (String key : keys) {
            Object value = fields.get(key);
            if (value == null || (value instanceof String s && s.isEmpty())) {
                fields.remove(key);
            }
        }
        for (Map.Entry<String, Object> entry : fields.entrySet()) {
            sql.append(", ").append(entry.getKey()).append(" = ? ");
            args.add(entry.getValue());
        }
        sql.append(" WHERE id = ? ");
        args.add(applicationId);
        jdbc.update(sql.toString(), args.toArray());

        return R.okMsg("报名信息修改成功");
    }

    // ---------------------------------------------------------------- 面试状态（管理员）

    private Map<String, Object> updateInterviewStatus(Map<String, Object> event) {
        AuthContext.Context ctx = AuthContext.get();
        if (!ctx.hasAdmin()) {
            throw new BizException("无权操作");
        }
        String applicationId = str(event.get("applicationId"));
        String interviewType = str(event.get("interviewType"));
        String status = event.get("status") == null ? null : String.valueOf(event.get("status"));

        if (applicationId == null || applicationId.isBlank() || interviewType == null || status == null) {
            throw new BizException("缺少必要参数");
        }
        if (!List.of("first", "second").contains(interviewType)) {
            throw new BizException("无效的面试类型");
        }
        if (!List.of("pending", "completed").contains(status)) {
            throw new BizException("无效的状态值");
        }
        Map<String, Object> app = findById(applicationId);
        if (app == null) {
            throw new BizException("申请不存在");
        }
        String expectedStatus = "first".equals(interviewType) ? "waiting_first" : "waiting_second";
        if (!expectedStatus.equals(str(app.get("status")))) {
            throw new BizException("当前申请状态不允许更新面试状态");
        }

        Map<String, Object> interview = asMap(app.get(interviewType + "Interview"));
        if (status == null) {
            interview.put("status", null);
            interview.put("completedAt", null);
        } else {
            interview.put("status", status);
            if ("completed".equals(status)) {
                interview.put("completedAt", Times.now());
            } else {
                interview.put("completedAt", null);
            }
        }

        Map<String, Object> update = new LinkedHashMap<>();
        update.put(interviewType + "Interview", interview);
        update.put("updatedAt", Times.now());
        persistUpdate(app, update);
        return R.okMsg("面试状态更新成功");
    }

    // ---------------------------------------------------------------- 内部工具

    /** 解析当前用户：优先校验 body.userId 与 token 一致，无 token 时使用 body.userId */
    private String resolveUserId(Map<String, Object> event) {
        AuthContext.Context ctx = AuthContext.get();
        String bodyUserId = str(event.get("userId"));
        if (ctx.hasUser()) {
            if (bodyUserId != null && !bodyUserId.isBlank() && !bodyUserId.equals(ctx.userId)) {
                return null;
            }
            return ctx.userId;
        }
        return (bodyUserId != null && !bodyUserId.isBlank()) ? bodyUserId : null;
    }

    private Map<String, Object> findById(String id) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM applications WHERE id = ?", id);
        return rows.isEmpty() ? null : rows.get(0);
    }

    /** 读取面试 JSON 列（数据库列名为 first_interview / second_interview） */
    private static Map<String, Object> interview(Map<String, Object> app, String which) {
        Object raw = app.get(which + "_interview");
        if (raw == null) {
            return newInterview();
        }
        Map<String, Object> parsed = Json.parseObject(str(raw));
        return parsed == null ? new LinkedHashMap<>() : parsed;
    }

    private static Map<String, Object> newInterview() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("status", "pending");
        map.put("result", null);
        map.put("feedback", "");
        map.put("passedDepartments", new ArrayList<>());
        map.put("completedAt", null);
        map.put("checkInTime", null);
        map.put("checkInNumber", null);
        return map;
    }

    /** 将数据库行转换为前端可用的对象（字段名与 uniCloud 对齐，时间转 ISO） */
    public Map<String, Object> toClient(Map<String, Object> row) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("_id", row.get("id"));
        result.put("user_id", row.get("user_id"));
        result.put("name", row.get("name"));
        result.put("student_id", row.get("student_id"));
        result.put("phone", row.get("phone"));
        result.put("email", row.get("email"));
        result.put("college", row.get("college"));
        result.put("major", row.get("major"));
        result.put("grade", row.get("grade"));
        result.put("gender", row.get("gender"));
        result.put("dormitory", row.get("dormitory"));
        result.put("departments", row.get("departments") == null ? new ArrayList<>() : Json.parseArray(str(row.get("departments"))));
        result.put("introduction", row.get("introduction"));
        result.put("experience", row.get("experience"));
        result.put("motivation", row.get("motivation"));
        result.put("status", row.get("status"));
        result.put("firstInterview", row.get("first_interview") == null ? newInterview() : Json.parseObject(str(row.get("first_interview"))));
        result.put("secondInterview", row.get("second_interview") == null ? newInterview() : Json.parseObject(str(row.get("second_interview"))));
        result.put("finalDepartment", row.get("final_department"));
        result.put("adminNotes", row.get("admin_notes"));
        result.put("applyTime", Times.iso(toLong(row.get("apply_time"))));
        result.put("rejectedAt", Times.iso(toLong(row.get("rejected_at"))));
        result.put("createdAt", Times.iso(toLong(row.get("created_at"))));
        result.put("updatedAt", Times.iso(toLong(row.get("updated_at"))));
        return result;
    }

    /** 持久化局部更新（JSON 列整体替换） */
    private void persistUpdate(Map<String, Object> app, Map<String, Object> update) {
        String id = str(app.get("id"));
        StringBuilder sql = new StringBuilder("UPDATE applications SET ");
        List<Object> args = new ArrayList<>();

        String[] mapping = {
                "name", "name", "student_id", "student_id", "phone", "phone", "email", "email",
                "college", "college", "major", "major", "grade", "grade", "gender", "gender",
                "dormitory", "dormitory", "introduction", "introduction", "experience", "experience",
                "motivation", "motivation", "status", "status", "finalDepartment", "final_department",
                "adminNotes", "admin_notes", "applyTime", "apply_time", "rejectedAt", "rejected_at",
                "createdAt", "created_at", "updatedAt", "updated_at"
        };
        for (int i = 0; i < mapping.length; i += 2) {
            if (update.containsKey(mapping[i])) {
                Object value = update.get(mapping[i]);
                if ("firstInterview".equals(mapping[i]) || "secondInterview".equals(mapping[i])) {
                    continue;
                }
                sql.append(mapping[i + 1]).append(" = ?, ");
                args.add(value);
            }
        }
        for (String field : List.of("firstInterview", "secondInterview")) {
            if (update.containsKey(field)) {
                Object value = update.get(field);
                String col = "firstInterview".equals(field) ? "first_interview" : "second_interview";
                if (value == null) {
                    sql.append(col).append(" = NULL, ");
                } else {
                    sql.append(col).append(" = ?, ");
                    args.add(Json.write(value));
                }
            }
        }
        sql.setLength(sql.length() - 2);
        sql.append(" WHERE id = ? ");
        args.add(id);
        jdbc.update(sql.toString(), args.toArray());
    }

    /** 整理面试签到队列：删除/撤销后序号大于 removedNumber 的记录减 1 */
    private void reorderQueue(String interviewType, Integer removedNumber) {
        if (removedNumber == null) {
            return;
        }
        String expectedStatus = "first".equals(interviewType) ? "waiting_first" : "waiting_second";
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id, " + interviewType + "_interview FROM applications WHERE status = ? AND JSON_EXTRACT(" + interviewType + "_interview, '$.checkInNumber') > ? ORDER BY JSON_EXTRACT(" + interviewType + "_interview, '$.checkInNumber') ASC",
                expectedStatus, removedNumber);
        for (int i = 0; i < rows.size(); i++) {
            Map<String, Object> row = rows.get(i);
            Map<String, Object> iv = Json.parseObject(str(row.get(interviewType + "_interview")));
            int newNumber = removedNumber + i;
            iv.put("checkInNumber", newNumber);
            jdbc.update("UPDATE applications SET " + interviewType + "_interview = ?, updated_at = ? WHERE id = ?",
                    Json.write(iv), Times.now(), str(row.get("id")));
        }
    }

    /** 二面通过后发送部门选择提醒 */
    private void sendDepartmentSelectionReminder(String userId, String userName) {
        try {
            if (userId == null) {
                return;
            }
            long now = Times.now();
            String notificationId = Ids.newId();
            jdbc.update("INSERT INTO notifications (id, title, content, type, target_ids, selected_users, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
                    notificationId, "部门选择提醒",
                    "恭喜您通过面试！请尽快登录系统选择您希望加入的部门。",
                    "selected",
                    Json.write(List.of(userId)),
                    Json.write(List.of(userId)),
                    "sent", now, now);
            jdbc.update("INSERT INTO user_notifications (id, user_id, notification_id, title, content, type, is_read, created_at) VALUES (?,?,?,?,?,?,?,?)",
                    Ids.newId(), userId, notificationId, "部门选择提醒",
                    "恭喜您通过面试！请尽快登录系统选择您希望加入的部门。",
                    "admin", 0, now);
        } catch (Exception e) {
            // 不影响主流程
        }
    }

    public Map<String, Object> getConfigFirst() {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM system_config ORDER BY created_at ASC LIMIT 1");
        return rows.isEmpty() ? null : rows.get(0);
    }

    public static Map<String, Object> asMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            Map<String, Object> result = new LinkedHashMap<>();
            map.forEach((k, v) -> result.put(String.valueOf(k), v));
            return result;
        }
        return new LinkedHashMap<>();
    }

    public static Object[] appendArgs(List<Object> args, Object... more) {
        List<Object> all = new ArrayList<>(args);
        all.addAll(List.of(more));
        return all.toArray();
    }
}
